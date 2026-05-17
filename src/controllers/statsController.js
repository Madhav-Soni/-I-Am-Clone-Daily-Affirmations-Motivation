const Affirmation = require("../models/Affirmation");
const MoodLog = require("../models/MoodLog");
const { asyncHandler } = require("../utils/appError");

/**
 * GET /api/v1/user/stats
 * Returns daily streak count, generation usage, and affirmation/mood summaries.
 */
exports.getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all aggregation queries in parallel
  const [totalAffirmations, favoriteCount, recentMoods, categoryBreakdown] = await Promise.all([
    Affirmation.countDocuments({ userId }),
    Affirmation.countDocuments({ userId, isFavorite: true }),
    MoodLog.find({ userId, createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    Affirmation.aggregate([
      { $match: { userId } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  // Daily limit info
  const dailyLimit =
    req.user.tier === "premium"
      ? parseInt(process.env.PREMIUM_TIER_DAILY_LIMIT, 10) || 50
      : parseInt(process.env.FREE_TIER_DAILY_LIMIT, 10) || 5;

  res.status(200).json({
    status: "success",
    data: {
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
    },
  });
});
