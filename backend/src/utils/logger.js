const winston = require("winston");

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${stack || message}${metaStr}`;
});

const transports = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === "production"
      ? combine(timestamp(), json())
      : combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
  }),
];

// Enable file logging ONLY in development environments to protect container clouds from ephemeral disk faults
if (process.env.NODE_ENV !== "production") {
  transports.push(
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" })
  );
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true }),
    logFormat
  ),
  transports,
});

module.exports = logger;
