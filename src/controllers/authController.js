const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/appError");
const { generateTokens } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sends a standardised auth response with tokens and sanitized user data.
 */
const sendAuthResponse = async (user, statusCode, res, deviceId) => {
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Manage the refreshSessions array for multiple parallel device support
  if (deviceId) {
    if (!user.refreshSessions) {
      user.refreshSessions = [];
    }
    // Filter out old refresh session for this device
    user.refreshSessions = user.refreshSessions.filter(s => s.deviceId !== deviceId);
    // Add the new session
    user.refreshSessions.push({ token: refreshToken, deviceId });
  }

  // Also set the legacy fallback refreshToken for backward compatibility
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const userData = {
    id: user._id,
    email: user.email,
    name: user.name,
    onboarded: user.onboarded,
    tier: user.tier,
    streakCount: user.streakCount,
    preferences: user.preferences,
    timezone: user.timezone,
  };

  res.status(statusCode).json({
    status: "success",
    data: { user: userData, accessToken, refreshToken },
  });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 */
exports.register = asyncHandler(async (req, res, next) => {
  const { email, password, name, timezone } = req.body;
  const clientTimezone = req.headers["x-timezone"] || timezone || "UTC";
  const deviceId = req.headers["x-device-id"];

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError("An account with this email already exists.", 409));
  }

  const user = await User.create({ email, password, name, timezone: clientTimezone, authProvider: "local" });
  logger.info(`New user registered: ${user._id}`);

  await sendAuthResponse(user, 201, res, deviceId);
});

/**
 * POST /api/v1/auth/login
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password, timezone } = req.body;
  const deviceId = req.headers["x-device-id"];

  // Select password and refreshSessions to initialize login state properly
  const user = await User.findOne({ email, authProvider: "local" }).select("+password +refreshSessions");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  const clientTimezone = req.headers["x-timezone"] || timezone;
  if (clientTimezone && user.timezone !== clientTimezone) {
    user.timezone = clientTimezone;
    await user.save({ validateBeforeSave: false });
  }

  logger.info(`User logged in: ${user._id}`);
  await sendAuthResponse(user, 200, res, deviceId);
});

/**
 * POST /api/v1/auth/refresh
 * Accepts a refresh token and issues a new access token.
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  const deviceId = req.headers["x-device-id"];

  if (!refreshToken) {
    return next(new AppError("Refresh token is required.", 400));
  }

  if (!deviceId) {
    return next(new AppError("Device ID header is required.", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError("Invalid or expired refresh token.", 401));
  }

  // Load both user refreshSessions and legacy refreshToken fields
  const user = await User.findById(decoded.id).select("+refreshToken +refreshSessions");
  if (!user) {
    return next(new AppError("User not found.", 401));
  }

  // Validate the device-bound session strictly
  const session = user.refreshSessions ? user.refreshSessions.find(s => s.deviceId === deviceId) : null;
  if (!session || session.token !== refreshToken) {
    // If a session mismatch or stale token replay is detected, reject access
    logger.warn(`Stale token replay or mismatch detected for device ${deviceId} | user: ${user._id}`);
    return next(new AppError("Refresh token mismatch or unauthorized device.", 401));
  }

  // Generate new rotated token set
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

  // Update/rotate the refresh session inside the array
  user.refreshSessions = user.refreshSessions.filter(s => s.deviceId !== deviceId);
  user.refreshSessions.push({ token: newRefreshToken, deviceId });

  // Update the legacy fallback field as well
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

/**
 * POST /api/v1/auth/logout
 * Revokes the current device's refresh token session, or all sessions if global logout is requested.
 */
exports.logout = asyncHandler(async (req, res) => {
  const deviceId = req.headers["x-device-id"];
  const globalLogout = req.body.global === true || req.query.global === "true";

  const user = await User.findById(req.user._id).select("+refreshSessions");
  if (user) {
    if (globalLogout) {
      // Global Logout: revoke ALL active device sessions
      user.refreshSessions = [];
    } else if (deviceId && user.refreshSessions) {
      // Local Logout: revoke ONLY current device session
      user.refreshSessions = user.refreshSessions.filter(s => s.deviceId !== deviceId);
    }
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ status: "success", message: "Logged out successfully." });
});

/**
 * POST /api/v1/auth/onboarding
 * Saves user preferences after the onboarding wizard and marks user as onboarded.
 */
exports.completeOnboarding = asyncHandler(async (req, res) => {
  const { preferences, timezone } = req.body;
  const clientTimezone = req.headers["x-timezone"] || timezone;

  const updateData = { preferences, onboarded: true };
  if (clientTimezone) {
    updateData.timezone = clientTimezone;
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    status: "success",
    message: "Onboarding complete.",
    data: { user },
  });
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
exports.getMe = asyncHandler(async (req, res) => {
  const clientTimezone = req.headers["x-timezone"];
  const user = await User.findById(req.user._id);

  if (clientTimezone && user.timezone !== clientTimezone) {
    user.timezone = clientTimezone;
    await user.save({ validateBeforeSave: false });
  }

  res.status(200).json({ status: "success", data: { user } });
});
