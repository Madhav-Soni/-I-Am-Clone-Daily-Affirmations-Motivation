const { body, validationResult } = require("express-validator");
const { AppError } = require("../../utils/appError");

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

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  onboardingValidator,
};
