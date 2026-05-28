const express = require("express");
const router = express.Router();
const Affirmation = require("../models/Affirmation");
const { protect } = require("../middleware/auth");

router.post("/generate", async (req, res) => {
  try {
    const { mood, tone } = req.body;

    const affirmations = {
      hopeful:
        "Your breath is proof that life still believes in your becoming.",
      anxious:
        "You are safe, grounded, and capable of moving through this moment.",
      calm:
        "Peace already exists within you. You are simply returning to it.",
    };

    const affirmation =
      affirmations[mood] ||
      "You are growing gently into the person you are meant to become.";

    res.json({
      success: true,
      affirmation,
      tone,
      mood,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate affirmation",
    });
  }
});

router.post("/save", protect, async (req, res) => {
  try {
    const { content, mood, tone } = req.body;
    const userId = req.user._id;

    const newAffirmation = await Affirmation.create({
      content,
      category: "General",
      mood,
      generatedBy: "AI",
      userId,
      isFavorite: true,
      aiMetadata: {
        moodContext: mood,
        activePromptRegister: tone,
      }
    });

    res.json({
      success: true,
      affirmation: newAffirmation,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save affirmation",
    });
  }
});

module.exports = router;
