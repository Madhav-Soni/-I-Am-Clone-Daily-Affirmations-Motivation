const User = require("../models/User");
const { AppError, asyncHandler } = require("../utils/appError");
const { generateTokens } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sends a standardised auth response with tokens and sanitized user data.
 */
const sendAuthResponse = (user, statusCode, res) => {
  const { accessToken, refreshToken } = generateTokens(user._id);

  // Persist hashed refresh token for rotation / revocation
  user.refreshToken = refreshToken;
  user.save({ validateBeforeSave: false });

  const userData = {
    id: user._id,
    email: user.email,
    name: user.name,
    onboarded: user.onboarded,
    tier: user.tier,
    streakCount: user.streakCount,
    preferences: user.preferences,
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
  const { email, password, name } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return next(new AppError("An account with this email already exists.", 409));
  }

  const user = await User.create({ email, password, name, authProvider: "local" });
  logger.info(`New user registered: ${user._id}`);

  sendAuthResponse(user, 201, res);
});

/**
 * POST /api/v1/auth/login
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, authProvider: "local" }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError("Invalid email or password.", 401));
  }

  logger.info(`User logged in: ${user._id}`);
  sendAuthResponse(user, 200, res);
});

/**
 * POST /api/v1/auth/refresh
 * Accepts a refresh token and issues a new access token.
 */
exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return next(new AppError("Refresh token is required.", 400));
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    return next(new AppError("Invalid or expired refresh token.", 401));
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== refreshToken) {
    return next(new AppError("Refresh token has been revoked.", 401));
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: { accessToken, refreshToken: newRefreshToken },
  });
});

/**
 * POST /api/v1/auth/logout
 * Revokes the stored refresh token.
 */
exports.logout = asyncHandler(async (req, res) => {
  req.user.refreshToken = undefined;
  await req.user.save({ validateBeforeSave: false });

  res.status(200).json({ status: "success", message: "Logged out successfully." });
});

/**
 * POST /api/v1/auth/onboarding
 * Saves user preferences after the onboarding wizard and marks user as onboarded.
 */
exports.completeOnboarding = asyncHandler(async (req, res) => {
  const { preferences } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { preferences, onboarded: true },
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
  const user = await User.findById(req.user._id);
  res.status(200).json({ status: "success", data: { user } });
});
