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
  validate,
  moodLogValidator,
};
