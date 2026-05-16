const { body, param, query, validationResult } = require("express-validator");
const { AppError } = require("../utils/appError");

/**
 * Runs after validation chains and returns a 422 if any errors exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => e.msg).join(". ");
    return next(new AppError(messages, 422));
  }
  next();
};

// ─── Auth Validators ──────────────────────────────────────────────────────────

const registerValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and a number"),
  body("name").optional().trim().isLength({ max: 100 }).withMessage("Name too long"),
  validate,
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];

const onboardingValidator = [
  body("preferences.topics")
    .optional()
    .isArray()
    .withMessage("Topics must be an array"),
  body("preferences.affirmationVoice")
    .optional()
    .isIn(["gentle", "motivational", "spiritual", "direct"])
    .withMessage("Invalid voice"),
  body("preferences.dailyFrequency")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Daily frequency must be 1–5"),
  validate,
];

// ─── Affirmation Validators ───────────────────────────────────────────────────

const generateAffirmationValidator = [
  body("category")
    .optional()
    .isIn(["Career", "Health", "Confidence", "Relationships", "Mindfulness", "Gratitude", "Productivity", "General"])
    .withMessage("Invalid category"),
  validate,
];

const affirmationIdValidator = [
  param("id").isMongoId().withMessage("Invalid affirmation ID"),
  validate,
];

// ─── Mood Validators ──────────────────────────────────────────────────────────

const moodLogValidator = [
  body("mood")
    .isIn(["Anxious", "Happy", "Tired", "Sad", "Excited", "Calm", "Frustrated", "Hopeful", "Overwhelmed", "Grateful"])
    .withMessage("Invalid mood value"),
  body("intensity")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Intensity must be between 1 and 10"),
  body("note")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Note cannot exceed 500 characters"),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  onboardingValidator,
  generateAffirmationValidator,
  affirmationIdValidator,
  moodLogValidator,
};
