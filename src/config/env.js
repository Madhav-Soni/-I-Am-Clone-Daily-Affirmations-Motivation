require("dotenv").config();
const configureCors = require("./cors");

/**
 * Centralized environment configuration with validation.
 * Fails fast if required environment variables are missing.
 */

const requiredEnvVars = [
  "MONGO_URI",
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "OPENAI_API_KEY",
];

const optionalEnvVars = {
  NODE_ENV: "development",
  PORT: "5000",
  JWT_EXPIRES_IN: "7d",
  JWT_REFRESH_EXPIRES_IN: "30d",
  OPENAI_MODEL: "gpt-4o-mini",
  FREE_TIER_DAILY_LIMIT: "5",
  PREMIUM_TIER_DAILY_LIMIT: "50",
  RATE_LIMIT_WINDOW_MS: "900000",
  RATE_LIMIT_MAX_REQUESTS: "100",
  ALLOWED_ORIGINS: "http://localhost:3000",
};

// Validate required environment variables
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`
  );
}

// Export configuration object
const config = {
  nodeEnv: process.env.NODE_ENV || optionalEnvVars.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || parseInt(optionalEnvVars.PORT, 10),
  
  database: {
    uri: process.env.MONGO_URI,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || optionalEnvVars.JWT_EXPIRES_IN,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || optionalEnvVars.JWT_REFRESH_EXPIRES_IN,
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || optionalEnvVars.OPENAI_MODEL,
  },
  
  limits: {
    freeTierDaily: parseInt(process.env.FREE_TIER_DAILY_LIMIT, 10) || parseInt(optionalEnvVars.FREE_TIER_DAILY_LIMIT, 10),
    premiumTierDaily: parseInt(process.env.PREMIUM_TIER_DAILY_LIMIT, 10) || parseInt(optionalEnvVars.PREMIUM_TIER_DAILY_LIMIT, 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || parseInt(optionalEnvVars.RATE_LIMIT_WINDOW_MS, 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || parseInt(optionalEnvVars.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  
  cors: configureCors(),
};

module.exports = config;
