const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const config = require("./config/env");
const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { AppError } = require("./utils/appError");
const logger = require("./utils/logger");
const requestObserver = require("./middleware/requestObserver");
const mongoose = require("mongoose");

const app = express();

app.use(requestObserver);

// ─── HTTPS Redirection & Proxy Trust ──────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  app.enable("trust proxy");
  app.use((req, res, next) => {
    if (req.secure || req.headers["x-forwarded-proto"] === "https") {
      return next();
    }
    res.redirect(`https://${req.headers.host}${req.url}`);
  });
}

// ─── Security Middleware ──────────────────────────────────────────────────────

app.use(helmet());

app.use(cors(config.cors));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: "fail", message: "Too many requests. Please try again later." },
});

// Stricter limit for auth endpoints to deter brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: "fail", message: "Too many auth attempts. Please wait 15 minutes." },
});

if (process.env.NODE_ENV !== "test") {
  app.use("/api", globalLimiter);
  app.use("/api/v1/auth", authLimiter);
}

// ─── Request Parsing ──────────────────────────────────────────────────────────

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────

if (process.env.NODE_ENV !== "test") {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.http(message.trim()) },
    })
  );
}

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/health", (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const dbStatus = isDbConnected ? "connected" : "disconnected";
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: isDbConnected ? "ok" : "fail",
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api", routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found.`, 404));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use(errorHandler);

module.exports = app;
