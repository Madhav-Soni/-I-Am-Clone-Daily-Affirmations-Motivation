const express = require("express");
const router = express.Router();

const authController = require("../../controllers/authController");
const { protect } = require("../../middleware/auth");
const {
  registerValidator,
  loginValidator,
  onboardingValidator,
} = require("../validators/authValidators");

// Public
router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);
router.post("/refresh", authController.refreshToken);

// Protected
router.use(protect);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);
router.post("/onboarding", onboardingValidator, authController.completeOnboarding);

module.exports = router;
