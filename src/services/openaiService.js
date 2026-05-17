const OpenAI = require("openai");
const { sanitizePII } = require("../utils/piiSanitizer");
const logger = require("../utils/logger");
const Affirmation = require("../models/Affirmation");
const MoodLog = require("../models/MoodLog");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: 15000, // Enforce a 15-second request timeout globally
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ─── Emotional Momentum & Directive Map ──────────────────────────────────────

/**
 * Calculates emotional trend over the last 5 mood logs to detect loops and trends.
 */
const calculateEmotionalTrend = (moodLogs) => {
  if (!moodLogs || moodLogs.length < 2) return "stable";

  const positiveMoods = ["Happy", "Excited", "Calm", "Hopeful", "Grateful"];
  const negativeMoods = ["Sad", "Anxious", "Tired", "Frustrated", "Overwhelmed"];

  // Map moods to raw score: positive = 1, tired/calm/neutral = 0, negative = -1
  const scores = moodLogs.map(log => {
    if (positiveMoods.includes(log.mood)) return 1;
    if (negativeMoods.includes(log.mood)) return -1;
    return 0;
  });

  // Check for consistent anxiety (doom-loop avoidance helper)
  const anxietyLogsCount = moodLogs.filter(log => ["Anxious", "Overwhelmed"].includes(log.mood)).length;
  if (anxietyLogsCount >= 3) {
    return "persistently anxious";
  }

  // Reverse so we trace oldest to newest
  scores.reverse();

  let isImproving = true;
  let isDeclining = true;

  for (let i = 1; i < scores.length; i++) {
    if (scores[i] < scores[i - 1]) isImproving = false;
    if (scores[i] > scores[i - 1]) isDeclining = false;
  }

  if (isImproving && scores[scores.length - 1] > scores[0]) return "improving";
  if (isDeclining && scores[scores.length - 1] < scores[0]) return "declining";

  // Check for volatility
  let changes = 0;
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] !== scores[i - 1]) changes++;
  }
  if (changes >= 3) return "volatile";

  return "stable";
};

/**
 * Maps mood states and trends directly to structural, pacing, and metaphorical constraints.
 */
const getMoodDirectives = (mood, trend) => {
  const directives = {
    Anxious: {
      energy: "deep containment, grounding safety, and breathing room",
      style: "Use long, flowing, highly rhythmic sentences that mimic deep, slow breathing. Start with soft grounding. Focus on safe boundaries and absolute security.",
      metaphor: "anchors, solid ground, calm waters, steady roots, warm embrace",
      encouragement: "gentle, stabilizing presence"
    },
    Overwhelmed: {
      energy: "simplicity, space, releasing burdens, and spacious allowance",
      style: "Use extremely simple, spacious phrasing. Keep it short. Focus on one small step at a time. Do not make demands on their energy.",
      metaphor: "clear sky, open window, shedding weight, slow steps",
      encouragement: "relieving, spacious ease"
    },
    Tired: {
      energy: "restoration, gentle acceptance, deep rest, and self-compassion",
      style: "Use soft, slow, deeply restorative and comforting terms. Ensure zero performance pressure or expectations.",
      metaphor: "soft blankets, evening twilight, gentle stream, quiet sanctuary",
      encouragement: "restful, self-loving comfort"
    },
    Sad: {
      energy: "warm validation, absolute emotional safety, and comforting presence",
      style: "Use highly empathetic, validating, and soft terms that honor their pain with gentle presence. Absolutely avoid toxic positivity, cheerleading, or fake smiles.",
      metaphor: "shelter from the rain, steady lantern, tender heartbeat, soft dawn",
      encouragement: "deep, validating warmth"
    },
    Frustrated: {
      energy: "stabilization, patience, clear boundaries, and calm focus",
      style: "Use clear, structured, steadying sentences that reinforce focus and control. Diffuse high energy into centered clarity.",
      metaphor: "sturdy rock, cool breeze, quiet center, iron focus",
      encouragement: "stabilizing, boundary-reinforcing clarity"
    },
    Excited: {
      energy: "momentum, joyful amplification, and high-vibe expansion",
      style: "Use active, expansive, highly punchy, and positive declarations. Match their high frequency and momentum.",
      metaphor: "soaring wings, radiant sun, rising tide, boundless horizon",
      encouragement: "uplifting, momentum-charging force"
    },
    Happy: {
      energy: "expansion, appreciation, and radiant alignment",
      style: "Use bright, sunny, grateful, and expansive wording. Reinforce internal joy.",
      metaphor: "blooming gardens, warm sunshine, open fields, clear skies",
      encouragement: "celebratory, joyful resonance"
    },
    Calm: {
      energy: "peaceful alignment, serene clarity, and quiet grounding",
      style: "Use tranquil, balanced, and rhythmic phrasing. Focus on simple contentment.",
      metaphor: "still lake, whispering pines, gentle breeze, peaceful silence",
      encouragement: "serene, balanced alignment"
    },
    Hopeful: {
      energy: "warm anticipation, forward momentum, and steady trust",
      style: "Use inspiring, forward-looking, and warm expressions. Reinforce inner trust.",
      metaphor: "first morning light, opening path, planting seeds, rising dawn",
      encouragement: "inspirational, trust-fueling light"
    },
    Grateful: {
      energy: "deep appreciation, abundance, and heartfelt fulfillment",
      style: "Use rich, warm, appreciative, and deeply grounded terms. Focus on connection and abundance.",
      metaphor: "full cup, harvest sun, warm hearth, rich soil",
      encouragement: "abundance-magnifying appreciation"
    }
  };

  const base = directives[mood] || directives.Calm;

  // Adapt based on trend!
  if (trend === "persistently anxious") {
    return {
      ...base,
      energy: "exceptional containment, absolute survival grounding, and anti-doom loop safety",
      style: "CRITICAL: The user has logged anxiety multiple times consecutively. Absolutely AVOID any mentions of future worries, action tasks, or performance pressure. Keep the sentences slow, rhythmic, and incredibly grounding. Focus entirely on the immediate present moment, breathing, and physical safety.",
      metaphor: "granite foundations, safe harbor, warm fire, slow exhale"
    };
  }

  if (trend === "declining") {
    return {
      ...base,
      energy: `gentle restoration and comforting containment for a declining emotional space`,
      encouragement: `${base.encouragement} with exceptionally tender care, recognizing their current vulnerability`
    };
  }

  if (trend === "improving") {
    return {
      ...base,
      energy: `${base.energy} with positive momentum amplification`,
      style: `${base.style} Subtly celebrate their improving emotional trajectory.`
    };
  }

  return base;
};

// ─── Prompt Templates ─────────────────────────────────────────────────────────

/**
 * Builds the system prompt that defines the AI's persona and constraints.
 */
const buildSystemPrompt = (voice) => {
  const voiceStyles = {
    gentle: {
      description: "warm, nurturing, compassionate, and deeply comforting — like a caring friend",
      rules: "- Speak with soft, understanding, and validating words.\n- Focus on self-compassion, acceptance, healing, and gentle presence.\n- Avoid aggressive action verbs, demanding directives, or hustle culture terms."
    },
    motivational: {
      description: "energetic, powerful, high-conviction, and action-oriented — like a life coach",
      rules: "- Speak with bold, empowering, and high-energy expressions.\n- Focus on growth, resilience, courage, taking action, and tapping into strength.\n- Use active, driving verbs like 'conquer', 'rise', 'achieve', and 'build'."
    },
    spiritual: {
      description: "mindful, reflective, calm, and deeply grounded — like a meditation guide",
      rules: "- Speak with spacious, meditative, and natural or poetic imagery.\n- Focus on breathing, the present moment, flow, inner alignment, and connection.\n- Use words like 'breath', 'presence', 'flow', 'groundedness', and 'inner light'."
    },
    direct: {
      description: "clear, concise, pragmatic, and highly grounded — like a confident mentor",
      rules: "- Speak with plain, honest, and direct words. Keep it simple and sharp.\n- Focus on clarity, personal responsibility, boundaries, and hard facts.\n- Avoid flowery metaphors, emotional over-dramatizations, or soft hand-waving."
    }
  };

  const style = voiceStyles[voice] || voiceStyles.gentle;

  return `You are an elite, highly empathetic wellness affirmation coach. Your core communication style is ${style.description}.

You must strictly adhere to the following stylistic guidelines:
${style.rules}

General Constraints:
- Output ONLY the single affirmation text inside first-person ("I am", "I have", "I can").
- Absolutely NO preamble, explanation, quotes, or introduction. Just start with the first word of the affirmation.
- Length: 1 to 3 concise, deeply resonant sentences.
- Make the affirmation feel organic and alive. Do not use generic internet cliches. Every word must hit home.`;
};

/**
 * Builds the user-facing prompt from sanitized context data.
 */
const buildUserPrompt = (category, context) => {
  const parts = [];

  // 1. Goal and Core Focus
  parts.push(`--- RITUAL GOAL ---`);
  parts.push(`Generate a custom affirmation for the primary focus area: "${category}".`);
  if (context.preferences?.topics?.length) {
    parts.push(`The user's broader growth topics are: ${context.preferences.topics.join(", ")}.`);
  }

  // 2. Emotional Context & Trajectory
  parts.push(`\n--- EMOTIONAL CONTEXT & TRAJECTORY ---`);
  if (context.currentMood) {
    parts.push(`The user checked in feeling: "${context.currentMood}".`);
    parts.push(`Recent emotional momentum/trend: ${context.emotionalTrend}.`);
    
    // Inject custom emotional directives
    const dirs = context.moodDirectives;
    parts.push(`Target Emotional Energy: ${dirs.energy}.`);
    parts.push(`Stylistic Directives for this state: ${dirs.style}`);
    parts.push(`Encouraged Metaphors: ${dirs.metaphor}.`);
    parts.push(`Encouragement Intensity: ${dirs.encouragement}.`);

    if (context.moodNote) {
      parts.push(`Their journal reflection: "${context.moodNote}". Address this reflection with deep emotional continuity, matching their exact space.`);
    }
  } else {
    parts.push(`The user is checking in ambiently. Support their current continuity with a balanced, calm tone.`);
  }

  // 3. Situational Continuity
  parts.push(`\n--- SITUATIONAL CONTINUITY ---`);
  if (context.timeOfDay) {
    const timeTones = {
      morning: "bright, awakening, inspiring, and full of intention for the day ahead",
      afternoon: "centering, steady, refueling, and supportive of focus or stamina",
      evening: "grounding, reflective, winding down, and appreciative of efforts",
      night: "restful, releasing, deeply peaceful, and supportive of sleep and letting go",
    };
    parts.push(`Time of day: ${context.timeOfDay}. Synthesize a tone that is ${timeTones[context.timeOfDay] || timeTones.morning}.`);
  }

  // 4. Streak / Resiliency State
  const isCompassionRecovery = context.streakCount === 1 && context.lifetimeRitualCount > 1;
  if (isCompassionRecovery) {
    parts.push(`Compassion Recovery Active: The user missed a previous day but has chosen to return to their practice today. Celebrate their return with exceptional warmth and self-compassion. Do not scold them for missing a day.`);
  } else if (context.streakCount > 1) {
    parts.push(`Streak State: They are on a beautiful ${context.streakCount}-day streak. Subtly acknowledge their dedication and momentum.`);
  }

  // 5. Repetition Avoidance (Strict constraint)
  if (context.avoidRepetition?.length) {
    parts.push(`\n--- REPETITION AVOIDANCE (CRITICAL) ---`);
    parts.push(`Do NOT repeat, mimic the structure of, or use major keywords from these recent affirmations:`);
    context.avoidRepetition.forEach((a) => {
      if (a) parts.push(`- "${a}"`);
    });
  }

  return parts.join("\n");
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Non-streaming generation — for internal use (e.g., scheduled jobs).
 */
const generateAffirmation = async (user, category, latestMood = null) => {
  // Query last 5 affirmations generated by this user to avoid repetition
  const recentAffirmations = await Affirmation.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("content category")
    .lean();

  const recentThemes = [...new Set(recentAffirmations.map(a => a.category).filter(Boolean))];
  const avoidRepetition = recentAffirmations.map(a => a.content);

  // Query last 5 mood logs to construct a rich, deep emotional trajectory
  const recentMoodLogs = await MoodLog.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const emotionalTrend = calculateEmotionalTrend(recentMoodLogs);

  // Safely extract mood and note from either raw mongoose doc or express request body context
  const currentMood = latestMood?.mood || latestMood?.currentMood || null;
  const rawNote = latestMood?.note || latestMood?.moodNote || null;
  const sanitizedNote = rawNote ? sanitizePII(rawNote) : null;

  const timeOfDay = latestMood?.timeOfDay || "day";

  // Compile base mood directives
  const moodDirectives = getMoodDirectives(currentMood || "Calm", emotionalTrend);

  // Compile rich context
  const context = {
    preferences: user.preferences || {},
    streakCount: user.streakCount || 0,
    lifetimeRitualCount: user.lifetimeRitualCount || 0,
    currentMood,
    moodNote: sanitizedNote,
    timeOfDay,
    emotionalTrend,
    moodDirectives,
    recentThemes,
    avoidRepetition,
  };

  const systemPrompt = buildSystemPrompt(user.preferences?.affirmationVoice || "gentle");
  const userPrompt = buildUserPrompt(category, context);

  logger.debug(`openaiService prompt build complete. System prompt voice: ${user.preferences?.affirmationVoice || "gentle"} | Mood: ${currentMood} | Trajectory: ${emotionalTrend}`);

  const response = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const content = response.choices[0]?.message?.content?.trim();
  const usage = response.usage;

  return {
    content,
    aiMetadata: {
      model: MODEL,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      moodContext: currentMood,
      emotionalTrend,
    },
  };
};

module.exports = { generateAffirmation };
