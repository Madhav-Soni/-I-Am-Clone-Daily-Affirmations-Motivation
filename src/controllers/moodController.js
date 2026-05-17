'use strict';

/**
 * moodController.js
 *
 * Handles logging and retrieving user mood check-ins.
 * Invokes the emotional phase transitions engine and the temporal memory / safety engine.
 */

const MoodLog = require('../models/MoodLog');
const { AppError, asyncHandler } = require('../utils/appError');
const { invalidateStats } = require('../utils/statsCache');

/**
 * POST /api/v1/mood
 * Logs the user's current mood. The AI service reads the most recent log
 * when generating affirmations to personalise the output.
 */
exports.logMood = asyncHandler(async (req, res) => {
  const { mood, intensity, note } = req.body;

  const moodLog = await MoodLog.create({
    mood,
    intensity,
    note,
    userId: req.user._id,
  });

  // Fetch recent mood logs history for the state machine engines
  const recentLogs = await MoodLog.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  // Run the state machines
  await req.user.classifyAndUpdateEmotionalPhase(recentLogs, mood, intensity, note);
  await req.user.processTemporalMemoryAndSafety(recentLogs, note);

  // Statefully persist the updated user document fields to MongoDB
  await req.user.save();
    invalidateStats(req.user._id);

  res.status(201).json({
    status: 'success',
    message: "Mood logged. Your next affirmation will reflect how you're feeling.",
    data: { moodLog },
  });
});

/**
 * GET /api/v1/mood
 * Returns the user's mood history with optional date range filtering.
 */
exports.getMoodHistory = asyncHandler(async (req, res) => {
  const { from, to, limit = 30 } = req.query;

  const filter = { userId: req.user._id };

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const moodLogs = await MoodLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .lean();

  const moodFrequency = moodLogs.reduce((acc, log) => {
    acc[log.mood] = (acc[log.mood] || 0) + 1;
    return acc;
  }, {});

  res.status(200).json({
    status: 'success',
    data: { moodLogs, moodFrequency },
  });
});

/**
 * GET /api/v1/mood/latest
 * Returns only the most recent mood log.
 */
exports.getLatestMood = asyncHandler(async (req, res) => {
  const moodLog = await MoodLog.findOne({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    status: 'success',
    data: { moodLog: moodLog || null },
  });
});
