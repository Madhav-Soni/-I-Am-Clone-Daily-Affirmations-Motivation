const mongoose = require("mongoose");

const affirmationSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Affirmation content is required"],
      trim: true,
      maxlength: [1000, "Affirmation content cannot exceed 1000 characters"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: ["Career", "Health", "Confidence", "Relationships", "Mindfulness", "Gratitude", "Productivity", "General"],
      default: "General",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    generatedBy: {
      type: String,
      enum: ["AI", "SYSTEM", "HUMAN_COMPASSIONATE_HOLD"],
      required: true,
    },
    isDistressSupport: {
      type: Boolean,
      default: false,
    },
    supportResources: {
      type: mongoose.Schema.Types.Mixed,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mood: {
      type: String,
    },
    note: {
      type: String,
    },
    // Metadata from the AI generation — useful for observability
    aiMetadata: {
      model: String,
      promptTokens: Number,
      completionTokens: Number,
      moodContext: String,
      activePromptRegister: String,
      activeMetaphorDomain: String,
      emotionalPhase: String,
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

affirmationSchema.index({ userId: 1, createdAt: -1 });
affirmationSchema.index({ userId: 1, isFavorite: 1 });
affirmationSchema.index({ userId: 1, category: 1 });
affirmationSchema.index({ userId: 1, mood: 1 });

module.exports = mongoose.model("Affirmation", affirmationSchema);
