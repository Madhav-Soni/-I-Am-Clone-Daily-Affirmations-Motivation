const sessionOrchestrator = require("../services/sessionOrchestrator");
const { asyncHandler } = require("../utils/appError");

/**
 * GET /api/v1/session/today
 * Returns pre-aggregated hydration payload for the today home experience.
 */
exports.getTodaySession = asyncHandler(async (req, res, next) => {
  const localHour = req.query.localHour 
    ? parseInt(req.query.localHour, 10) 
    : new Date().getHours();

  const sessionState = await sessionOrchestrator.getTodaySessionState(req.user, localHour);

  res.status(200).json({
    status: "success",
    data: sessionState,
  });
});
