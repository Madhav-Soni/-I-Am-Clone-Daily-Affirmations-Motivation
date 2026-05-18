const crypto = require("crypto");
const logger = require("../utils/logger");

/**
 * Structured request monitoring and observability middleware.
 * Assigns a unique X-Request-ID and tracks API latencies/timing metrics.
 */
const requestObserver = (req, res, next) => {
  // Generate high-entropy request identifier
  req.id = crypto.randomUUID();
  res.setHeader("X-Request-ID", req.id);

  const startTime = process.hrtime();

  res.on("finish", () => {
    const diff = process.hrtime(startTime);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);

    // Write structured metadata to stdout logs
    logger.info(`[API Request] ${req.method} ${req.originalUrl} - ${res.statusCode} in ${durationMs}ms`, {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: parseFloat(durationMs),
      ip: req.ip || req.headers["x-forwarded-for"] || "unknown",
    });
  });

  next();
};

module.exports = requestObserver;
