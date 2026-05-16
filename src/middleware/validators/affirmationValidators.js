const { body, param, validationResult } = require("express-validator");
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

module.exports = {
  validate,
  generateAffirmationValidator,
  affirmationIdValidator,
};
