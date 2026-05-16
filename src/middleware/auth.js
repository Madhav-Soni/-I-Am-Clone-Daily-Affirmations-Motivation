const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { AppError, asyncHandler } = require("../../utils/appError");

/**
 * Protects routes by verifying the JWT in the Authorization header.
 * Attaches the authenticated user to req.user on success.
 */
const protect = asyncHandler(async (req, res, next) => {
  // 1) Extract token
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Not authenticated. Please log in.", 401));
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Your session has expired. Please log in again.", 401));
    }
    return next(new AppError("Invalid token. Please log in again.", 401));
  }

  // 3) Check if user still exists
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }

  // 4) Attach user and proceed
  req.user = user;
  next();
});

/**
 * Restricts access to premium-tier users only.
 * Must be used after `protect`.
 */
const requirePremium = (req, res, next) => {
  if (req.user.tier !== "premium") {
    return next(new AppError("This feature requires a Premium subscription.", 403));
  }
  next();
};

/**
 * Generates a short-lived access token and a long-lived refresh token.
 */
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });

  return { accessToken, refreshToken };
};

module.exports = { protect, requirePremium, generateTokens };
