const express = require("express");
const router = express.Router();

// Import versioned route modules
const authRoutes = require("./v1/authRoutes");
const affirmationRoutes = require("./v1/affirmationRoutes");
const moodRoutes = require("./v1/moodRoutes");
const sessionRoutes = require("./v1/sessionRoutes");

// Mount v1 routes
router.use("/v1/auth", authRoutes);
router.use("/v1", affirmationRoutes);
router.use("/v1", moodRoutes);
router.use("/v1/session", sessionRoutes);

module.exports = router;
