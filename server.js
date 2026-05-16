require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/database");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

// ─── Start Server ─────────────────────────────────────────────────────────────

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────

  const shutdown = (signal) => {
    logger.warn(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // Catch unhandled promise rejections (e.g., DB query failures)
  process.on("unhandledRejection", (reason) => {
    logger.error(`Unhandled Rejection: ${reason}`);
    shutdown("unhandledRejection");
  });

  // Catch uncaught exceptions (e.g., syntax errors, null dereferences)
  process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
    process.exit(1);
  });
};

start();
