'use strict';

/**
 * affirmationController.js
 *
 * Handles affirmation generation and CRUD routes.
 *
 * Generation flow:
 *   1. Fetch full user personalization and safety context
 *   2. Distress Intervention Layer - suppress AI generation if user is in acute-distress
 *   3. Atomic daily limit check (timezone-aware)
 *   4. Fetch latest mood for context injection
 *   5. Stream via SSE or return via REST JSON based on Accept headers
 *   6. Persist affirmation + update user thematic buffer + register + streak
 */

const Affirmation = require('../models/Affirmation');
const MoodLog = require('../models/MoodLog');
const User = require('../models/User');
const { generateAffirmation, generateAffirmationStream } = require('../services/openaiService');
const { sanitizePII } = require('../utils/piiSanitizer');
const { AppError, asyncHandler } = require('../utils/appError');
const { invalidateStats } = require('../utils/statsCache');
const logger = require('../utils/logger');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function performPostGenerationUpdates({
  userId,
  category,
  content,
  thematicTag,
  aiMetadata,
  registerAdvanced,
  newRegisterId,
  mood,
  note,
}) {
  try {
    const affirmation = await Affirmation.create({
      content,
      category: category || 'General',
      generatedBy: 'AI',
      userId,
      mood,
      note,
      aiMetadata,
    });

    // Companion: mood-matched favorite older than 60 days
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    const companionAffirmation = mood
      ? await Affirmation.findOne({
          userId,
          mood,
          isFavorite: true,
          createdAt: { $lt: sixtyDaysAgo },
        })
        .sort({ createdAt: -1 })
        .lean()
      : null;

    const userPatch = {
      $push: {
        recentThematicTags: {
          $each: [thematicTag],
          $slice: 10,
          $position: 0,
        },
      },
    };

    if (registerAdvanced && newRegisterId) {
      userPatch.$set = {
        promptRegister: newRegisterId,
        promptRegisterAdvancedAt: new Date(),
      };
    }

    await User.findByIdAndUpdate(userId, userPatch, { runValidators: false });
    invalidateStats(userId);

    const userForStreak = await User.findById(userId);
    if (userForStreak) {
      userForStreak.updateStreak(userForStreak.preferences?.timezone || 'UTC');
      await userForStreak.save();
    }

    return { affirmation, companionAffirmation };
  } catch (dbErr) {
    console.error("DB_ERROR_DETAILS:", dbErr);
    logger.error('Post-generation DB update failed', {
      userId: userId.toString(),
      error: dbErr.message,
    });
    return {};
  }
}

// ── Generation ───────────────────────────────────────────────────────────────

const generateAffirmationHandler = asyncHandler(async (req, res, next) => {
  const { category } = req.body;
  const userId = req.user._id;

  const user = await User.findById(userId).select(
    'name isPremium preferences ' +
    'promptRegister promptRegisterAdvancedAt ' +
    'recentThematicTags reflectionSummary ' +
    'streakCount longestStreak lastActivityAt streakRecoveryUsedAt ' +
    'recentEmotionalTheme dominantEmotionalTheme recentReflectionSummary ' +
    'midTermReflectionSummary identityMemory archivedPhases lastThemeShiftAt ' +
    'distressRiskLevel distressSignals supportMode lastDistressInterventionAt'
  );

  if (!user) return next(new AppError('User not found', 404));

  // ── 2. Distress Intervention Layer ──────────────────────────────────────────
  const isAcuteDistress = user.distressRiskLevel === 'acute-distress' || user.supportMode === 'compassionate-hold';

  if (isAcuteDistress) {
    const holdAffirmation = {
      _id: 'hold-active-' + Date.now(),
      content: 'This sounds heavy. You do not have to carry it alone.',
      category: 'Grounding Support',
      generatedBy: 'HUMAN_COMPASSIONATE_HOLD',
      userId,
      isDistressSupport: true,
      supportResources: {
        message: 'Grounding Support & Compassionate Hold Activated.',
        groundingPractice: 'Take a deep, slow breath. Feel the ground beneath you. Breathe in for four seconds, hold for four, exhale for six.',
        crisisResources: [
          { name: 'National Suicide & Crisis Lifeline (US)', contact: '988' },
          { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
          { name: 'International Resources Directory', contact: 'https://findahelpline.com' }
        ],
        recommendations: "We've paused daily affirmations for now to give you a quiet, pressure-free space. Reach out to someone you trust. You are not alone."
      },
      aiMetadata: {
        emotionalPhase: 'crisis',
        activePromptRegister: 'recovery',
        activeMetaphorDomain: 'breath',
        emotionalTrend: 'acute-distress-hold'
      },
      createdAt: new Date(),
    };

    // Auto-persist hold state affirmation to history so user doesn't lose it
    try {
      await Affirmation.create({
        content: holdAffirmation.content,
        category: holdAffirmation.category,
        generatedBy: holdAffirmation.generatedBy,
        userId,
        isDistressSupport: true,
        supportResources: holdAffirmation.supportResources,
        moodAtGeneration: 'crisis'
      });
    } catch (err) {
      logger.error('Failed to auto-persist hold affirmation', { error: err.message });
    }

    if (req.headers.accept === 'text/event-stream') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ type: 'crisis', ...holdAffirmation })}\n\n`);
      res.end();
      return;
    }

    return res.status(200).json({
      status: 'success',
      data: {
        affirmation: holdAffirmation,
      },
    });
  }

  // ── 3. Atomic daily limit check (timezone-aware) ──────────────────────────
  let limitCheck;
  try {
    limitCheck = await req.user.checkAndIncrementDailyLimit();
    if (!limitCheck.allowed) {
      return next(
        new AppError(
          'You have reached your daily affirmation limit. Your practice continues tomorrow.',
          429
        )
      );
    }
  } catch (err) {
    logger.error(`Daily limit atomic check failed: ${err.message}`);
    return next(new AppError('Daily limit check failed. Please try again.', 500));
  }

  // ── 4. Fetch latest mood for personalization context ──────────────────────
  const rawMood = await MoodLog.findOne({ userId })
    .sort({ createdAt: -1 })
    .select('mood note createdAt')
    .lean();

  const latestMood = rawMood
    ? {
        ...rawMood,
        note: rawMood.note ? sanitizePII(rawMood.note) : undefined,
      }
    : null;

  // ── 5. Stream vs Non-Stream generation ───────────────────────────────────
  if (req.headers.accept === 'text/event-stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'ping' })}\n\n`);
      }
    }, 15_000);

    req.on('close', () => clearInterval(heartbeat));

    let result;
    try {
      result = await generateAffirmationStream({
        user: req.user,
        latestMood,
        category: category || 'general wellbeing',
        res,
      });
    } catch (err) {
      clearInterval(heartbeat);
      logger.error('Affirmation generation failed', {
        userId: userId.toString(),
        category,
        error: err.message,
      });
      return;
    }

    clearInterval(heartbeat);

    if (result.moodSafety === 'crisis') return;

    if (result.content) {
      await performPostGenerationUpdates({
        userId,
        category,
        content: result.content,
        thematicTag: result.thematicTag,
        aiMetadata: result.aiMetadata,
        registerAdvanced: result.registerAdvanced,
        newRegisterId: result.newRegisterId,
        mood: latestMood?.mood,
        note: latestMood?.note,
      });
    }
  } else {
    // REST API Generation
    let result;
    try {
      result = await generateAffirmation({
        user: req.user,
        latestMood,
        category: category || 'general wellbeing',
      });
    } catch (err) {
      logger.error('Affirmation generation failed', {
        userId: userId.toString(),
        category,
        error: err.message,
      });
      return next(new AppError('Failed to generate affirmation. Please try again.', 500));
    }

    if (result.moodSafety === 'crisis') {
      const holdAffirmation = {
        _id: 'hold-active-' + Date.now(),
        content: 'This sounds heavy. You do not have to carry it alone.',
        category: 'Grounding Support',
        generatedBy: 'HUMAN_COMPASSIONATE_HOLD',
        userId,
        isDistressSupport: true,
        supportResources: {
          message: 'Grounding Support & Compassionate Hold Activated.',
          groundingPractice: 'Take a deep, slow breath. Feel the ground beneath you. Breathe in for four seconds, hold for four, exhale for six.',
          crisisResources: [
            { name: 'National Suicide & Crisis Lifeline (US)', contact: '988' },
            { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
            { name: 'International Resources Directory', contact: 'https://findahelpline.com' }
          ],
          recommendations: "We've paused daily affirmations for now to give you a quiet, pressure-free space. Reach out to someone you trust. You are not alone."
        },
        aiMetadata: {
          emotionalPhase: 'crisis',
          activePromptRegister: 'recovery',
          activeMetaphorDomain: 'breath',
          emotionalTrend: 'acute-distress-hold'
        },
        createdAt: new Date(),
      };

      try {
        await Affirmation.create({
          content: holdAffirmation.content,
          category: holdAffirmation.category,
          generatedBy: holdAffirmation.generatedBy,
          userId,
          isDistressSupport: true,
          supportResources: holdAffirmation.supportResources,
          mood: 'crisis'
        });
      } catch (err) {
        logger.error('Failed to auto-persist hold affirmation REST', { error: err.message });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          affirmation: holdAffirmation,
        },
      });
    }

    let affirmation, companionAffirmation;
    if (result.content) {
      const updates = await performPostGenerationUpdates({
        userId,
        category,
        content: result.content,
        thematicTag: result.thematicTag,
        aiMetadata: result.aiMetadata,
        registerAdvanced: result.registerAdvanced,
        newRegisterId: result.newRegisterId,
        mood: latestMood?.mood,
        note: latestMood?.note,
      });
      affirmation = updates.affirmation;
      companionAffirmation = updates.companionAffirmation;
    }

    res.status(200).json({
      status: 'success',
      data: {
        affirmation,
        companionAffirmation: companionAffirmation || null,
      },
    });
  }
});

// ── CRUD ─────────────────────────────────────────────────────────────────────

const getAffirmations = asyncHandler(async (req, res) => {
  const { category, isFavorite, page = 1, limit = 20 } = req.query;
  const userId = req.user._id;

  const filter = { userId };
  if (category) filter.category = category;
  if (isFavorite !== undefined) filter.isFavorite = isFavorite === 'true';

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [affirmations, total] = await Promise.all([
    Affirmation.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    Affirmation.countDocuments(filter),
  ]);

  res.json({
    status: 'success',
    data: {
      affirmations,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

const getAffirmation = asyncHandler(async (req, res, next) => {
  const affirmation = await Affirmation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  }).lean();

  if (!affirmation) return next(new AppError('Affirmation not found', 404));

  res.json({ status: 'success', data: { affirmation } });
});

const toggleFavorite = asyncHandler(async (req, res, next) => {
  const affirmation = await Affirmation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!affirmation) return next(new AppError('Affirmation not found', 404));

  affirmation.isFavorite = !affirmation.isFavorite;
  await affirmation.save();

  res.json({ status: 'success', data: { affirmation } });
});

const deleteAffirmation = asyncHandler(async (req, res, next) => {
  const result = await Affirmation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!result) return next(new AppError('Affirmation not found', 404));

  res.status(204).json({ status: 'success', data: null });
});

module.exports = {
  generateAffirmationHandler,
  generateAffirmation: generateAffirmationHandler, // Map both to support router imports cleanly
  getAffirmations,
  getAffirmation,
  toggleFavorite,
  deleteAffirmation,
};
