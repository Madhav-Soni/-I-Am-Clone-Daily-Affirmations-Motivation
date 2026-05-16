const express = require("express");
const router = express.Router();

const moodController = require("../../controllers/moodController");
const statsController = require("../../controllers/statsController");
const { protect } = require("../../middleware/auth");
const { moodLogValidator } = require("../validators/moodValidators");

router.use(protect);

// Mood logging
router.post("/mood", moodLogValidator, moodController.logMood);
router.get("/mood", moodController.getMoodHistory);
router.get("/mood/latest", moodController.getLatestMood);

// User analytics
router.get("/user/stats", statsController.getUserStats);

module.exports = router;
