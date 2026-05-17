const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never returned in queries by default
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    authProviderId: String,

    onboarded: {
      type: Boolean,
      default: false,
    },
    preferences: {
      topics: {
        type: [String],
        enum: ["Career", "Health", "Confidence", "Relationships", "Mindfulness", "Gratitude", "Productivity"],
        default: [],
      },
      affirmationVoice: {
        type: String,
        enum: ["gentle", "motivational", "spiritual", "direct"],
        default: "gentle",
      },
      dailyFrequency: {
        type: Number,
        min: 1,
        max: 5,
        default: 1,
      },
    },

    // Subscription tier — controls daily AI generation limits
    tier: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    // Daily generation tracking — reset each UTC day
    dailyGenerationCount: {
      type: Number,
      default: 0,
    },
    dailyGenerationResetAt: {
      type: Date,
      default: () => new Date(),
    },

    streakCount: {
      type: Number,
      default: 0,
    },
    lifetimeRitualCount: {
      type: Number,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      default: () => new Date(),
    },

    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtuals ───────────────────────────────────────────────────────────────

userSchema.virtual("affirmations", {
  ref: "Affirmation",
  localField: "_id",
  foreignField: "userId",
});

userSchema.virtual("moodLogs", {
  ref: "MoodLog",
  localField: "_id",
  foreignField: "userId",
});

// ─── Middleware ──────────────────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Static method to check and increment daily limit atomically.
 */
userSchema.statics.checkAndIncrementDailyLimit = async function (userId, tier) {
  const now = new Date();

  const limit =
    tier === "premium"
      ? parseInt(process.env.PREMIUM_TIER_DAILY_LIMIT, 10) || 50
      : parseInt(process.env.FREE_TIER_DAILY_LIMIT, 10) || 5;

  // Calculate the midnight boundary of the current UTC day
  const utcTodayMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  // Step 1: Try to atomically reset the daily limit count to 1 (counting this request)
  // IF the reset timestamp is before today's UTC midnight.
  let user = await this.findOneAndUpdate(
    {
      _id: userId,
      dailyGenerationResetAt: { $lt: utcTodayMidnight },
    },
    {
      $set: {
        dailyGenerationCount: 1,
        dailyGenerationResetAt: now,
        lastActiveAt: now,
      },
    },
    { new: true }
  );

  if (user) {
    return { allowed: true, limit, current: 1 };
  }

  // Step 2: If we are in the same day, try to atomically increment by 1
  // ONLY if the count is strictly less than the daily limit.
  user = await this.findOneAndUpdate(
    {
      _id: userId,
      dailyGenerationCount: { $lt: limit },
    },
    {
      $inc: { dailyGenerationCount: 1 },
      $set: { lastActiveAt: now },
    },
    { new: true }
  );

  if (user) {
    return { allowed: true, limit, current: user.dailyGenerationCount };
  }

  // Step 3: If both failed, the user is in the same day and has exceeded the limit.
  // Fetch the current count to return deterministic details.
  const currentUser = await this.findById(userId).select("dailyGenerationCount");
  return {
    allowed: false,
    limit,
    current: currentUser ? currentUser.dailyGenerationCount : limit,
  };
};

/**
 * Check if the user has exceeded their daily generation limit.
 * Delegates to the atomic static method to eliminate race conditions.
 */
userSchema.methods.checkAndIncrementDailyLimit = async function () {
  const result = await this.constructor.checkAndIncrementDailyLimit(this._id, this.tier);

  // Sync current document instance properties with the updated database values
  if (result.allowed) {
    this.dailyGenerationCount = result.current;
    if (result.current === 1) {
      this.dailyGenerationResetAt = new Date();
    }
  }

  return result;
};

/**
 * Update streak: increment if active yesterday, reset if a day was missed.
 * Tracks lifetime ritual counts and returns whether a compassion recovery was triggered.
 */
userSchema.methods.updateStreak = async function () {
  const now = new Date();
  const last = new Date(this.lastActiveAt);
  const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

  // Always increment lifetime count for a new session
  // If diffDays === 0, it means multiple sessions in same day. We don't increment streak,
  // but do we increment lifetime? Let's say lifetime is also once per day to align with streaks.
  if (diffDays > 0 || this.lifetimeRitualCount === 0) {
    this.lifetimeRitualCount += 1;
  }

  let compassionRecovery = false;

  if (diffDays === 1) {
    this.streakCount += 1;
  } else if (diffDays > 1) {
    this.streakCount = 1;
    compassionRecovery = true;
  }
  // diffDays === 0: same day, no change to streak

  this.lastActiveAt = now;
  await this.save();

  return {
    streakCount: this.streakCount,
    lifetimeRitualCount: this.lifetimeRitualCount,
    compassionRecovery,
  };
};

// ─── Indexes ─────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 });
userSchema.index({ authProvider: 1, authProviderId: 1 });

module.exports = mongoose.model("User", userSchema);
