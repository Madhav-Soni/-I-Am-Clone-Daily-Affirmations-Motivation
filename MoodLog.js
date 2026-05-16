const mongoose = require("mongoose");

const moodLogSchema = new mongoose.Schema(
  {
    mood: {
      type: String,
      required: [true, "Mood is required"],
      enum: ["Anxious", "Happy", "Tired", "Sad", "Excited", "Calm", "Frustrated", "Hopeful", "Overwhelmed", "Grateful"],
    },
    intensity: {
      type: Number,
      min: 1,
      max: 10,
      default: 5,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

moodLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("MoodLog", moodLogSchema);
