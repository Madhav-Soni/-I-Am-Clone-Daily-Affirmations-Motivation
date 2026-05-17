const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { getLocalDateString, getStartOfLocalDay } = require("../utils/timezoneHelper");

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
    timezone: {
      type: String,
      default: "UTC",
    },
    refreshToken: {
      type: String,
      select: false,
    },
    refreshSessions: {
      type: [{
        token: { type: String, required: true },
        deviceId: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }],
      select: false,
      default: [],
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
 * Static method to check and increment daily limit atomically relative to user-local calendar midnight.
 */
userSchema.statics.checkAndIncrementDailyLimit = async function (userId, tier) {
  const now = new Date();

  const limit =
    tier === "premium"
      ? parseInt(process.env.PREMIUM_TIER_DAILY_LIMIT, 10) || 50
      : parseInt(process.env.FREE_TIER_DAILY_LIMIT, 10) || 5;

  // Retrieve user timezone and reset timestamp first to calculate the local day boundaries
  const userDoc = await this.findById(userId).select("timezone dailyGenerationResetAt").lean();
  const timezone = userDoc?.timezone || "UTC";

  // Calculate the local calendar day and start-of-day boundary
  const localTodayStr = getLocalDateString(now, timezone);
  const localTodayMidnight = getStartOfLocalDay(localTodayStr, timezone);

  // Step 1: Try to atomically reset the daily limit count to 1 (counting this request)
  // IF the reset timestamp is before today's local midnight boundary.
  let user = await this.findOneAndUpdate(
    {
      _id: userId,
      dailyGenerationResetAt: { $lt: localTodayMidnight },
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

  // Step 2: If we are in the same local calendar day, try to atomically increment by 1
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
 * Update streak: increment if active yesterday, reset if a day was missed relative to local calendar day.
 * Tracks lifetime ritual counts and returns whether a compassion recovery was triggered.
 */
userSchema.methods.updateStreak = async function () {
  const now = new Date();
  const timezone = this.timezone || "UTC";

  const todayStr = getLocalDateString(now, timezone);
  const lastActiveStr = getLocalDateString(this.lastActiveAt || new Date(0), timezone);

  let compassionRecovery = false;

  if (todayStr === lastActiveStr) {
    // Already did the ritual today in their timezone. Save the timestamp but do not alter streak values.
    this.lastActiveAt = now;
    await this.constructor.updateOne(
      { _id: this._id },
      { $set: { lastActiveAt: now } }
    );
    return {
      streakCount: this.streakCount,
      lifetimeRitualCount: this.lifetimeRitualCount,
      compassionRecovery,
    };
  }

  const todayMidnight = getStartOfLocalDay(todayStr, timezone);
  const lastActiveMidnight = getStartOfLocalDay(lastActiveStr, timezone);

  // Calculate strict calendar day differences
  const diffMs = todayMidnight.getTime() - lastActiveMidnight.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  // Increment cumulative lifetime ritual since it's a new calendar day
  this.lifetimeRitualCount += 1;

  if (diffDays === 1) {
    // Consecutive local day
    this.streakCount += 1;
  } else {
    // Missed a day: reset active streak to 1 and trigger gentle compassion recovery if they had past rituals
    this.streakCount = 1;
    if (this.lifetimeRitualCount > 1) {
      compassionRecovery = true;
    }
  }

  this.lastActiveAt = now;
  await this.constructor.updateOne(
    { _id: this._id },
    {
      $set: {
        streakCount: this.streakCount,
        lifetimeRitualCount: this.lifetimeRitualCount,
        lastActiveAt: now,
      }
    }
  );

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
