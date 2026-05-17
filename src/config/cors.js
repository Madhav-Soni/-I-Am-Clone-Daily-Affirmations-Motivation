const logger = require("../utils/logger");

/**
 * Robust CORS origin parser utility.
 * Sanitizes, trims, and validates multiple allowed origins.
 * Provides environment-aware regex parsing for local development and Expo dev tunnels.
 */
const configureCors = () => {
  const isDev = process.env.NODE_ENV === "development";

  // Parse and clean allowed origins from environment
  const origins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  // Provide high-fidelity developer defaults if none are configured in development
  if (origins.length === 0 && isDev) {
    origins.push(
      "http://localhost:3000",
      "http://localhost:8081",
      "http://localhost:19006"
    );
  }

  return {
    origin: (origin, callback) => {
      // 1. Allow mobile native apps, Postman, and server-to-server requests (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Allow if origin is explicitly present in the configured allowlist
      if (origins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Dynamic match rules for local development and testing
      if (isDev) {
        const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
        const isExpoTunnel = /\.exp\.direct$/.test(origin);
        const isLocalIp = /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin);
        const isAndroidEmulatorIp = /^http:\/\/10\.0\.2\.2(:\d+)?$/.test(origin);

        if (isLocalhost || isExpoTunnel || isLocalIp || isAndroidEmulatorIp) {
          return callback(null, true);
        }
      }

      // 4. Reject unauthorized origin access
      logger.warn(`[CORS Blocked]: Request from unauthorized origin: ${origin}`);
      return callback(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
};

module.exports = configureCors;
