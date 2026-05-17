'use strict';

const Affirmation = require('../models/Affirmation');
const MoodLog = require('../models/MoodLog');
const { asyncHandler } = require('../utils/appError');
const { getStats, setStats } = require('../utils/statsCache');

/**
 * GET /api/v1/user/stats
 * Returns streak, generation usage, affirmation summaries, and mood summary.
 *
 * H-7 fix: results are cached in-memory for 5 minutes per user.
 * Cache is invalidated on generation and mood log events.
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userIdStr = String(userId);

  // ── Cache hit ────────────────────────────────────────────────────────────
  const cached = getStats(userIdStr);
  if (cached) {
    return res.status(200).json({
      status: 'success',
      cached: true,
      data: cached,
    });
  }

  // ── Cache miss — run aggregation ─────────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalAffirmations, favoriteCount, recentMoods, categoryBreakdown] =
    await Promise.all([
      Affirmation.countDocuments({ userId }),
      Affirmation.countDocuments({ userId, isFavorite: true }),
      MoodLog.find({ userId, createdAt: { $gte: thirtyDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean(),
      Affirmation.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

  const dailyLimit =
    req.user.tier === 'premium'
      ? parseInt(process.env.PREMIUM_TIER_DAILY_LIMIT, 10) || 50
      : parseInt(process.env.FREE_TIER_DAILY_LIMIT, 10) || 5;

  const data = {
    streak: {
      current: req.user.streakCount,
      lifetimeRituals: req.user.lifetimeRitualCount || 0,
      lastActiveAt: req.user.lastActiveAt,
    },
    affirmations: {
      total: totalAffirmations,
      favorites: favoriteCount,
      categoryBreakdown,
    },
    dailyUsage: {
      used: req.user.dailyGenerationCount,
      limit: dailyLimit,
      tier: req.user.tier,
      resetsAt: req.user.dailyGenerationResetAt,
    },
    moodSummary: {
      totalLogs: recentMoods.length,
      last30Days: recentMoods,
    },
  };

  // ── Store in cache ───────────────────────────────────────────────────────
  setStats(userIdStr, data);

  res.status(200).json({
    status: 'success',
    cached: false,
    data,
  });
});
