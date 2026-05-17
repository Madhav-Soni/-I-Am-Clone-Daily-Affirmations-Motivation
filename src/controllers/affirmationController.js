const Affirmation = require("../models/Affirmation");
const MoodLog = require("../models/MoodLog");
const { streamAffirmation } = require("../services/openaiService");
const { AppError, asyncHandler } = require("../utils/appError");
const logger = require("../utils/logger");

// ─── Generate ─────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/ai/generate
 * Generates a personalized affirmation via OpenAI and streams it to the client.
 * Enforces tier-based daily generation limits before hitting the AI.
 */
exports.generateAffirmation = asyncHandler(async (req, res, next) => {
  const { category = "General", mood, note, context } = req.body;

  // Enforce daily limit — resets each UTC day
  const limitCheck = await req.user.checkAndIncrementDailyLimit();
  if (!limitCheck.allowed) {
    return next(
      new AppError(
        `Daily generation limit reached (${limitCheck.limit}/day on ${req.user.tier} tier). Upgrade to Premium for more.`,
        429
      )
    );
  }

  // Use provided mood context or fetch the most recent mood log
  const moodContext = mood ? { mood, note, ...context } : await MoodLog.findOne({ userId: req.user._id }).sort({ createdAt: -1 });

  // Update streak
  await req.user.updateStreak();

  logger.info(`Generating affirmation | user: ${req.user._id} | category: ${category} | count: ${limitCheck.current}/${limitCheck.limit}`);

  try {
    // Stream to client — this function sets headers and writes SSE events
    const { content: finalContent, aiMetadata } = await streamAffirmation(req.user, category, moodContext, res);

    // Persist to DB after streaming completes (non-blocking from client perspective)
    await Affirmation.create({
      content: finalContent,
      category,
      mood: moodContext?.mood,
      note: moodContext?.note,
      generatedBy: "AI",
      userId: req.user._id,
      aiMetadata,
    });
  } catch (err) {
    // If headers already sent (streaming started), we can't send an error response
    if (!res.headersSent) {
      return next(new AppError("Failed to generate affirmation. Please try again.", 500));
    }
    logger.error(`Stream error after headers sent: ${err.message}`);
  }
});

// ─── List & Filters ───────────────────────────────────────────────────────────

/**
 * GET /api/v1/affirmations
 * Returns paginated affirmation history for the authenticated user.
 * Supports ?category, ?isFavorite, ?page, ?limit filters.
 */
exports.getAffirmations = asyncHandler(async (req, res) => {
  const { category, isFavorite, page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user._id };
  if (category) filter.category = category;
  if (isFavorite !== undefined) filter.isFavorite = isFavorite === "true";

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [affirmations, total] = await Promise.all([
    Affirmation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
    Affirmation.countDocuments(filter),
  ]);

  res.status(200).json({
    status: "success",
    data: {
      affirmations,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

/**
 * GET /api/v1/affirmations/:id
 */
exports.getAffirmation = asyncHandler(async (req, res, next) => {
  const affirmation = await Affirmation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!affirmation) {
    return next(new AppError("Affirmation not found.", 404));
  }

  res.status(200).json({ status: "success", data: { affirmation } });
});

// ─── Toggle Favorite ──────────────────────────────────────────────────────────

/**
 * PATCH /api/v1/affirmations/:id
 * Toggles the isFavorite flag on an affirmation.
 */
exports.toggleFavorite = asyncHandler(async (req, res, next) => {
  const affirmation = await Affirmation.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!affirmation) {
    return next(new AppError("Affirmation not found.", 404));
  }

  affirmation.isFavorite = !affirmation.isFavorite;
  await affirmation.save();

  res.status(200).json({
    status: "success",
    data: { affirmation },
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/v1/affirmations/:id
 */
exports.deleteAffirmation = asyncHandler(async (req, res, next) => {
  const affirmation = await Affirmation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!affirmation) {
    return next(new AppError("Affirmation not found.", 404));
  }

  res.status(204).json({ status: "success", data: null });
});
