const express = require("express");
const router = express.Router();

const affirmationController = require("../../controllers/affirmationController");
const { protect } = require("../../middleware/auth");
const {
  generateAffirmationValidator,
  affirmationIdValidator,
} = require("../validators/affirmationValidators");

// All routes require authentication
router.use(protect);

// AI generation (streaming)
router.post("/ai/generate", generateAffirmationValidator, affirmationController.generateAffirmation);

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
