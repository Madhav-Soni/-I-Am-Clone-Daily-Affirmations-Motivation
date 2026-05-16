const express = require("express");
const router = express.Router();

// Import versioned route modules
const authRoutes = require("./v1/authRoutes");
const affirmationRoutes = require("./v1/affirmationRoutes");
const moodRoutes = require("./v1/moodRoutes");

// Mount v1 routes
router.use("/v1/auth", authRoutes);
router.use("/v1", affirmationRoutes);
router.use("/v1", moodRoutes);

module.exports = router;
