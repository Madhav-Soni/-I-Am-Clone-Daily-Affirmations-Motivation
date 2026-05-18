const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const affirmationController = require("../../controllers/affirmationController");
const { protect } = require("../../middleware/auth");
const {
  generateAffirmationValidator,
  affirmationIdValidator,
} = require("../../middleware/validators/affirmationValidators");

// Strict route-level burst limiter for AI generation to prevent network/API flooding
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: {
    status: "fail",
    message: "Too many affirmations generated recently. Please wait a minute.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test", // Skip rate limiting during automated test suites
});

// All routes require authentication
router.use(protect);

// AI generation (streaming) protected by burst rate limiter
router.post("/ai/generate", aiLimiter, generateAffirmationValidator, affirmationController.generateAffirmation);

// Affirmation CRUD
router
  .route("/affirmations")
  .get(affirmationController.getAffirmations);

router
  .route("/affirmations/:id")
  .get(affirmationIdValidator, affirmationController.getAffirmation)
  .patch(affirmationIdValidator, affirmationController.toggleFavorite)
  .delete(affirmationIdValidator, affirmationController.deleteAffirmation);

module.exports = router;
