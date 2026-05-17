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
    activePromptRegister: {
      type: String,
      default: "self-compassion",
    },
    activeMetaphorDomain: {
      type: String,
      default: "breath",
    },
    promptRegisterCycle: {
      type: [String],
      default: () => [
        "self-compassion", "gratitude", "identity", "resilience", "permission", 
        "somatic", "momentum", "values-alignment", "narrative-healing", "expansion", 
        "emotional-witnessing", "spiritual", "practical-grounding", "recovery", "future-self"
      ],
    },
    metaphorDomainCycle: {
      type: [String],
      default: () => [
        "nature", "breath", "seasons", "architecture", "ocean", 
        "movement", "light", "craftsmanship", "music", "grounding"
      ],
    },
    registerRotationAt: {
      type: Date,
      default: () => new Date(),
    },
    semanticMemory: {
      recentRegisters: { type: [String], default: [] },
      recentMetaphorDomains: { type: [String], default: [] },
      recentCadences: { type: [String], default: [] },
      recentEmotionalArcs: { type: [String], default: [] },
    },
    emotionalPhase: {
      type: String,
      enum: ["crisis", "stabilization", "recovery", "emergence", "growth", "plateau", "regression-risk", "resilience-building"],
      default: "resilience-building",
    },
    previousPhase: {
      type: String,
      enum: ["crisis", "stabilization", "recovery", "emergence", "growth", "plateau", "regression-risk", "resilience-building"],
      default: "resilience-building",
    },
    phaseTransitionFlag: {
      type: Boolean,
      default: false,
    },
    phaseTransitionAt: {
      type: Date,
      default: () => new Date(),
    },
    phaseConfidence: {
      type: Number,
      default: 1.0,
    },
    // ── C-3 Layered Temporal Memory Windows ────────────────────────────────
    recentEmotionalTheme: {
      type: String,
      default: 'resilience',
    },
    dominantEmotionalTheme: {
      type: String,
      default: 'resilience',
    },
    recentReflectionSummary: {
      type: String,
      default: '',
    },
    midTermReflectionSummary: {
      type: String,
      default: '',
    },
    identityMemory: {
      values: { type: [String], default: [] },
      enduringPreferences: { type: [String], default: [] },
      metaphorAffinities: { type: [String], default: [] },
    },
    archivedPhases: {
      type: [String],
      default: [],
    },
    lastThemeShiftAt: {
      type: Date,
    },
    // ── C-4 Distress Intervention Layer ───────────────────────────────────
    distressRiskLevel: {
      type: String,
      enum: ['normal', 'vulnerable', 'elevated-distress', 'acute-distress'],
      default: 'normal',
    },
    distressSignals: {
      type: [String],
      default: [],
    },
    supportMode: {
      type: String,
      enum: ['standard', 'compassionate-hold'],
      default: 'standard',
    },
    lastDistressInterventionAt: {
      type: Date,
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

/**
 * Rotates the active emotional framing register and metaphor domain based on 
 * longitudinal trajectories, reflection depth, active streak states, or scheduled cycle times.
 */
userSchema.methods.rotatePromptEntropy = async function (recentMoodLogs, currentMood, moodNote) {
  const now = new Date();
  
  const positiveMoods = ["Happy", "Excited", "Calm", "Hopeful", "Grateful"];
  const negativeMoods = ["Sad", "Anxious", "Tired", "Frustrated", "Overwhelmed"];
  
  const scores = (recentMoodLogs || []).map(log => {
    if (positiveMoods.includes(log.mood)) return 1;
    if (negativeMoods.includes(log.mood)) return -1;
    return 0;
  });
  
  const anxietyLogsCount = (recentMoodLogs || []).filter(log => ["Anxious", "Overwhelmed"].includes(log.mood)).length;
  
  let trend = "stable";
  if (anxietyLogsCount >= 3) {
    trend = "persistently anxious";
  } else if (scores.length >= 2) {
    const reversedScores = [...scores].reverse();
    let isImproving = true;
    let isDeclining = true;
    for (let i = 1; i < reversedScores.length; i++) {
      if (reversedScores[i] < reversedScores[i - 1]) isImproving = false;
      if (reversedScores[i] > reversedScores[i - 1]) isDeclining = false;
    }
    if (isImproving && reversedScores[reversedScores.length - 1] > reversedScores[0]) trend = "improving";
    else if (isDeclining && reversedScores[reversedScores.length - 1] < reversedScores[0]) trend = "declining";
  }

  let selectedRegister = this.activePromptRegister || "self-compassion";
  let selectedMetaphor = this.activeMetaphorDomain || "breath";
  let reason = "cycle";

  // 1. High Journaling Depth Rule (note length >= 100 characters)
  if (moodNote && moodNote.trim().length >= 100) {
    selectedRegister = "identity";
    selectedMetaphor = "craftsmanship";
    reason = "journaling_rule";
  }
  // 2. High Consistency Streak Rule (streak count >= 5)
  else if ((this.streakCount || 0) >= 5) {
    selectedRegister = "expansion";
    selectedMetaphor = "movement";
    reason = "streak_rule";
  }
  // 3. Burnout / Persistent Anxiety Rule
  else if (trend === "persistently anxious" || ["ANXIOUS", "OVERWHELMED"].includes((currentMood || "").toUpperCase())) {
    selectedRegister = "permission";
    selectedMetaphor = "breath";
    reason = "burnout_rule";
  }
  // 4. Difficult Emotional Period Rule (Declining trajectory or Sad/Tired mood)
  else if (trend === "declining" || ["SAD", "TIRED"].includes((currentMood || "").toUpperCase())) {
    selectedRegister = "recovery";
    selectedMetaphor = "ocean";
    reason = "recovery_rule";
  }
  // 5. Standard Cycle Rotation (weekly calendar rotation or unit cycles)
  else {
    const timeDiff = now.getTime() - (this.registerRotationAt || new Date(0)).getTime();
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    if (daysDiff >= 7 || !this.activePromptRegister) {
      const registersPool = (this.promptRegisterCycle || []).filter(
        reg => !(this.semanticMemory?.recentRegisters || []).includes(reg)
      );
      
      const metaphorsPool = (this.metaphorDomainCycle || []).filter(
        met => !(this.semanticMemory?.recentMetaphorDomains || []).includes(met)
      );

      if (registersPool.length > 0) {
        const idx = Math.floor(Math.random() * registersPool.length);
        selectedRegister = registersPool[idx];
      } else {
        const idx = Math.floor(Math.random() * (this.promptRegisterCycle || []).length);
        selectedRegister = this.promptRegisterCycle[idx];
      }

      if (metaphorsPool.length > 0) {
        const idx = Math.floor(Math.random() * metaphorsPool.length);
        selectedMetaphor = metaphorsPool[idx];
      } else {
        const idx = Math.floor(Math.random() * (this.metaphorDomainCycle || []).length);
        selectedMetaphor = this.metaphorDomainCycle[idx];
      }
      
      this.registerRotationAt = now;
      reason = "scheduled_rotation";
    }
  }

  // Update memory state
  this.activePromptRegister = selectedRegister;
  this.activeMetaphorDomain = selectedMetaphor;

  if (!this.semanticMemory) {
    this.semanticMemory = { recentRegisters: [], recentMetaphorDomains: [], recentCadences: [], recentEmotionalArcs: [] };
  }
  
  let recRegs = [...(this.semanticMemory.recentRegisters || [])];
  if (!recRegs.includes(selectedRegister)) {
    recRegs.unshift(selectedRegister);
    if (recRegs.length > 5) recRegs.pop();
    this.semanticMemory.recentRegisters = recRegs;
  }

  let recMets = [...(this.semanticMemory.recentMetaphorDomains || [])];
  if (!recMets.includes(selectedMetaphor)) {
    recMets.unshift(selectedMetaphor);
    if (recMets.length > 5) recMets.pop();
    this.semanticMemory.recentMetaphorDomains = recMets;
  }

  // Persist directly to DB to keep clean alignment
  await this.constructor.updateOne(
    { _id: this._id },
    {
      $set: {
        activePromptRegister: this.activePromptRegister,
        activeMetaphorDomain: this.activeMetaphorDomain,
        registerRotationAt: this.registerRotationAt || now,
        semanticMemory: this.semanticMemory,
      }
    }
  );

  return { register: selectedRegister, metaphor: selectedMetaphor, reason };
};

/**
 * Deterministically classifies the user's emotional phase based on mood histories, note length, and streaks.
 */
userSchema.methods.classifyAndUpdateEmotionalPhase = async function (recentMoodLogs, currentMood, currentIntensity, currentNote) {
  const now = new Date();
  
  // 1. Fetch recent mood logs if not provided
  let logs = recentMoodLogs;
  if (!logs || logs.length === 0) {
    logs = await this.model("MoodLog").find({ userId: this._id })
      .sort({ createdAt: -1 })
      .limit(15)
      .lean();
  }

  // 2. Parse active variables
  const activeMood = currentMood || (logs[0] ? logs[0].mood : null);
  const activeIntensity = currentIntensity !== undefined ? currentIntensity : (logs[0] ? logs[0].intensity : 5);
  const activeNote = currentNote !== undefined ? currentNote : (logs[0] ? logs[0].note : "");

  // 3. Establish categorized groupings
  const positiveMoods = ["Happy", "Excited", "Calm", "Hopeful", "Grateful"];
  const negativeMoods = ["Sad", "Anxious", "Tired", "Frustrated", "Overwhelmed"];
  const crisisMoods = ["Anxious", "Overwhelmed", "Sad", "Frustrated"];

  const n = logs.length;
  let computedPhase = null;
  let confidence = 1.0;

  // Perform classification over rich history
  if (n >= 3) {
    // A. Regression Risk Classification (Sustained positive/neutral baseline followed by sudden negative crash)
    if (
      ["growth", "stabilization", "emergence", "resilience-building", "plateau"].includes(this.emotionalPhase || "resilience-building") &&
      activeMood && negativeMoods.includes(activeMood) && activeIntensity >= 7 &&
      n >= 4
    ) {
      // Look at preceding 3 logs before the current check-in
      const precedingLogs = logs.slice(1, 4);
      const precedingPositiveOrNeutral = precedingLogs.filter(l => positiveMoods.includes(l.mood) || l.mood === "Tired").length;
      if (precedingPositiveOrNeutral >= 2) {
        computedPhase = "regression-risk";
        confidence = 0.85;
      }
    }

    // B. Crisis Classification (Sustained crisis or high intensity single-event crisis if not regression risk)
    if (!computedPhase) {
      const recent5 = logs.slice(0, 5);
      const crisisCount = recent5.filter(l => crisisMoods.includes(l.mood)).length;
      const avgIntensity = recent5.reduce((sum, l) => sum + (l.intensity || 5), 0) / (recent5.length || 1);

      const activeMoodIsCrisis = activeMood && crisisMoods.includes(activeMood);
      
      if ((activeMoodIsCrisis && activeIntensity >= 7) || (crisisCount >= 4 && avgIntensity >= 6.5)) {
        computedPhase = "crisis";
        confidence = 0.90;
      }
    }
    // C. Emergence Classification (Sustained negative baseline followed by pivot to consecutive positive logs)
    if (!computedPhase && n >= 5) {
      // Newest 3 logs must be positive
      const newest3 = logs.slice(0, 3);
      const allNewest3Positive = newest3.length >= 3 && newest3.every(l => positiveMoods.includes(l.mood));
      
      // Older baseline (preceding logs) must contain significant difficulty (at least 2 negative/crisis logs)
      const olderLogs = logs.slice(3, 8);
      const olderNegCount = olderLogs.filter(l => negativeMoods.includes(l.mood)).length;

      if (allNewest3Positive && olderNegCount >= 2) {
        computedPhase = "emergence";
        confidence = 0.95;
      }
    }

    // D. Growth, Stabilization, Plateau, Recovery Classification (evaluated when no candidate active phase matches)
    if (!computedPhase) {
      // F. Plateau Classification (Prolonged flatlining, repetitive neutral logs with short journal text)
      const recent7 = logs.slice(0, 7);
      const repetitiveCalmOrTired = recent7.every(l => ["Calm", "Tired"].includes(l.mood) && (l.intensity || 5) <= 5);
      
      const noteLengths = recent7.map(l => (l.note || "").trim().length);
      const avgNoteLength = noteLengths.reduce((sum, len) => sum + len, 0) / (noteLengths.length || 1);

      if (repetitiveCalmOrTired && avgNoteLength <= 15 && recent7.length >= 5) {
        computedPhase = "plateau";
        confidence = 0.75;
      }
      // E. Stabilization Classification (Crisis logs in history transitioning to Calm/low-intensity Tired baseline)
      else {
        const olderLogsForStabilization = logs.slice(3, 8);
        const olderCrisisCount = olderLogsForStabilization.filter(l => crisisMoods.includes(l.mood)).length;
        
        const newest3ForStabilization = logs.slice(0, 3);
        const newestAllCalmOrTired = newest3ForStabilization.every(l => ["Calm", "Tired", "Hopeful"].includes(l.mood) && (l.intensity || 5) <= 5);

        if (olderCrisisCount >= 2 && newestAllCalmOrTired) {
          computedPhase = "stabilization";
          confidence = 0.80;
        }
        // D. Growth Classification
        else {
          const recent8 = logs.slice(0, 8);
          const posCount = recent8.filter(l => positiveMoods.includes(l.mood)).length;
          
          if (posCount >= 6 && activeMood && positiveMoods.includes(activeMood) && (this.streakCount || 0) >= 4) {
            computedPhase = "growth";
            confidence = 0.90;
          }
          // G. Recovery Classification (Post-burnout/crisis recovery with focus on gentle self-care)
          else {
            const olderCrisisLogs = logs.slice(4, 9);
            const olderCrisisCountForRecovery = olderCrisisLogs.filter(l => crisisMoods.includes(l.mood)).length;
            const newest3ForRecovery = logs.slice(0, 3);
            const containsTiredOrCalm = newest3ForRecovery.some(l => ["Tired", "Calm"].includes(l.mood));
            
            if (olderCrisisCountForRecovery >= 2 && containsTiredOrCalm) {
              computedPhase = "recovery";
              confidence = 0.80;
            }
          }
        }
      }
    }
  }

  // Fallback to existing phase or default to resilience-building
  if (!computedPhase) {
    computedPhase = this.emotionalPhase || "resilience-building";
  }

  // 4. Update the state machine transition flags
  let isTransitioned = false;
  if (computedPhase !== this.emotionalPhase) {
    this.previousPhase = this.emotionalPhase || "resilience-building";
    this.emotionalPhase = computedPhase;
    this.phaseTransitionFlag = true;
    this.phaseTransitionAt = now;
    this.phaseConfidence = confidence;
    isTransitioned = true;
  } else {
    this.phaseTransitionFlag = false;
    this.phaseConfidence = confidence;
  }

  // 5. Commit atomically to DB to prevent dirty-write conflicts
  await this.constructor.updateOne(
    { _id: this._id },
    {
      $set: {
        emotionalPhase: this.emotionalPhase,
        previousPhase: this.previousPhase,
        phaseTransitionFlag: this.phaseTransitionFlag,
        phaseTransitionAt: this.phaseTransitionAt || now,
        phaseConfidence: this.phaseConfidence,
      }
    }
  );

  return {
    emotionalPhase: this.emotionalPhase,
    previousPhase: this.previousPhase,
    phaseTransitionFlag: this.phaseTransitionFlag,
    phaseConfidence: this.phaseConfidence,
    isTransitioned,
  };
};

/**
 * Process temporal reflection memory windows, decay weightings, and safety distress gating.
 */
userSchema.methods.processTemporalMemoryAndSafety = async function (logs, currentNote) {
  const now = new Date();
  const noteText = (currentNote || '').trim();

  // 1. Distress Gating & Safety Detection
  const DISTRESS_KEYWORDS = [
    'suicidal', 'hopeless', 'worthless', 'crisis', 'desperate',
    'want to die', 'self harm', 'self-harm', 'end my life',
    'give up', "can't go on", 'end this pain', 'completely useless'
  ];

  const hasDespairKeyword = DISTRESS_KEYWORDS.some(kw => 
    noteText.toLowerCase().includes(kw)
  );

  // Check repeated severe log states (3 consecutive sadness/anxiety check-ins with intensity >= 9)
  const last3 = logs.slice(0, 3);
  const isRepeatedSevere = last3.length >= 3 && last3.every(l => 
    ['Sad', 'Anxious'].includes(l.mood) && (l.intensity || 5) >= 9
  );

  if (hasDespairKeyword || isRepeatedSevere) {
    this.distressRiskLevel = 'acute-distress';
    this.supportMode = 'compassionate-hold';
    this.lastDistressInterventionAt = now;
    if (hasDespairKeyword) {
      this.distressSignals = [...new Set([...(this.distressSignals || []), 'despair-language'])];
    }
    if (isRepeatedSevere) {
      this.distressSignals = [...new Set([...(this.distressSignals || []), 'repeated-severe-intensity'])];
    }
  } else {
    // Check for mild/ordinary sad/anxious logs for conservative safety thresholding
    const latestMood = logs[0];
    if (latestMood && ['Sad', 'Anxious'].includes(latestMood.mood)) {
      const intensity = latestMood.intensity || 5;
      if (intensity >= 8) {
        this.distressRiskLevel = 'elevated-distress';
        this.supportMode = 'standard';
      } else if (intensity >= 6) {
        this.distressRiskLevel = 'vulnerable';
        this.supportMode = 'standard';
      } else {
        this.distressRiskLevel = 'normal';
        this.supportMode = 'standard';
      }
    } else {
      this.distressRiskLevel = 'normal';
      this.supportMode = 'standard';
    }
  }

  // 2. Temporal Emotional Memory Layer & Decay Weighting
  if (noteText) {
    // Cycle and decay recentReflectionSummary -> midTermReflectionSummary
    if (this.recentReflectionSummary) {
      this.midTermReflectionSummary = this.recentReflectionSummary;
    }
    this.recentReflectionSummary = noteText;
    this.lastThemeShiftAt = now;

    // Detect positivity shift / emergence turnaround
    const isEmergentPositive = /hope|emerg|confident|gratitude|joy|peace|happy|grow/i.test(noteText);
    if (isEmergentPositive) {
      if (this.recentEmotionalTheme && this.recentEmotionalTheme !== 'emergent-confidence') {
        this.archivedPhases = [...new Set([...(this.archivedPhases || []), this.recentEmotionalTheme])];
      }
      this.recentEmotionalTheme = 'emergent-confidence';
      this.dominantEmotionalTheme = 'emergent-confidence';
    } else {
      this.recentEmotionalTheme = 'emotional-processing';
    }

    // Extract motifs for long-term values/preferences memory
    const valueKeywords = {
      family: 'family closeness',
      work: 'professional integrity',
      integrity: 'personal honesty',
      health: 'bodily care',
      nature: 'connection with earth',
      honesty: 'authenticity'
    };
    for (const [kw, val] of Object.entries(valueKeywords)) {
      if (noteText.toLowerCase().includes(kw)) {
        this.identityMemory.values = [...new Set([...(this.identityMemory.values || []), val])];
      }
    }

    const metaphorKeywords = {
      breath: 'breathe cycles',
      ocean: 'tides',
      art: 'painting/craft',
      music: 'resonance',
      nature: 'seasons'
    };
    for (const [kw, met] of Object.entries(metaphorKeywords)) {
      if (noteText.toLowerCase().includes(kw)) {
        this.identityMemory.metaphorAffinities = [...new Set([...(this.identityMemory.metaphorAffinities || []), met])];
      }
    }
  }
};

// ─── Indexes ─────────────────────────────────────────────────────────────────

userSchema.index({ email: 1 });
userSchema.index({ authProvider: 1, authProviderId: 1 });

module.exports = mongoose.model("User", userSchema);
