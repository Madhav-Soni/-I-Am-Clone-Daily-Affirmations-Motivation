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

// ─── Prompt Entropy Configuration Maps ────────────────────────────────────────

const REGISTERS_CONFIG = {
  "self-compassion": {
    name: "Self-Compassion & Warm Validation",
    framing: "Validate current limitations, soften internal self-criticism, and speak with absolute validation of the user's worthiness in their present struggle.",
    cadence: "Use soft, rhythmic, reassuring cadences that mimic a comforting sigh. Start sentences with quiet validation.",
    perspective: "Relational perspective: An internal, highly gentle voice of self-forgiveness and kind patience."
  },
  "gratitude": {
    name: "Gratitude & Present Abundance",
    framing: "Focus on identifying present-moment simple gifts, appreciating the air, gravity, and the immediate luxury of being alive.",
    cadence: "Warm, full, steady sentence flow. Build a rhythm of receiving and acknowledging small structural details.",
    perspective: "Relational perspective: Receptive appreciation, acknowledging the quiet abundance surrounding you."
  },
  "identity": {
    name: "Identity Reconstruction",
    framing: "Deconstruct outdated self-limiting labels and step into a structural definition of capability, growth, and emerging truth.",
    cadence: "Declarative, firm, rhythmic, and architecturally solid. Avoid weak qualifiers.",
    perspective: "Relational perspective: Stepping with conviction into a newly claimed, deeply centered version of oneself."
  },
  "resilience": {
    name: "Inner Grit & Steady Resilience",
    framing: "Locate the sturdy, unshakeable center within. Acknowledge external storms but ground completely in the internal capacity to weather them.",
    cadence: "Punchy, rhythmic, steady, and rising. Sentences build momentum and stand tall.",
    perspective: "Relational perspective: A quiet, powerful core of internal strength that refuses to bend."
  },
  "permission": {
    name: "Permission-Giving & Release",
    framing: "Formulate absolute permission to step away from output demands, drop performance anxieties, and allow space to simply exist.",
    cadence: "Spacious, simple, and unhurried sentences. Minimal demands, wide breathing pauses.",
    perspective: "Relational perspective: A deeply sighing voice of spacious allowance, laying down all expectations."
  },
  "somatic": {
    name: "Somatic Grounding & Visceral Presence",
    framing: "Direct focus entirely to physical sensations, the rise and fall of the chest, steady weight, and returning to the boundary of the skin.",
    cadence: "Visceral, slow, anchoring. Sentences act as physical landmarks, connecting breath to heavy stability.",
    perspective: "Relational perspective: Visceral self-alignment, returning completely to the immediate sanctuary of the body."
  },
  "momentum": {
    name: "Momentum & Growth Expansion",
    framing: "Acknowledge progress, harness active momentum, and expand the user's perception of what they can comfortably step into next.",
    cadence: "Active, punchy, soaring, and forward-driving. Dynamic verbs emphasize movement and rising strength.",
    perspective: "Relational perspective: Forward-leaning courage, stepping active and energized into emerging possibility."
  },
  "values-alignment": {
    name: "Core Values Alignment",
    framing: "Bridge present actions directly to the user's core values, reinforcing simple daily truth, integrity, and authenticity.",
    cadence: "Clear, authentic, centered, and plain. Stripped of pretense, deeply honest.",
    perspective: "Relational perspective: Absolute alignment with one's quiet, deep inner compass and principles."
  },
  "narrative-healing": {
    name: "Narrative Authorship",
    framing: "Refocus the lens of experience: view hurdles not as flaws but as raw wisdom, declaring oneself the conscious author of their life timeline.",
    cadence: "Reflective, steady, historical, and deeply wise. Metaphorical but historically solid.",
    perspective: "Relational perspective: The wise, high-agency author of one's own unfolding story and destiny."
  },
  "expansion": {
    name: "Expansive Horizon",
    framing: "Encourage a sweeping, bold opening of the spirit. Welcome wide horizons, wide steps, and raw courage to be seen.",
    cadence: "Sweeping, open, inspired, and highly lyrical. Long, beautiful, evocative phrasing.",
    perspective: "Relational perspective: A dynamic, unconstrained opening of one's full power and presence."
  },
  "emotional-witnessing": {
    name: "Empathy & Witnessing Presence",
    framing: "Act as a clear mirror: name, validate, and sit directly beside the present emotion without any rush to fix or alter it.",
    cadence: "Empathic, clear, direct, and slow. Zero toxic cheerleading; deep steady validation.",
    perspective: "Relational perspective: Sitting shoulder-to-shoulder with yourself in full compassionate presence."
  },
  "spiritual": {
    name: "Spiritual Flow",
    framing: "Connect personal actions to the wider natural cycles of growth, decay, starlight, and the quiet flowing universe.",
    cadence: "Meditative, soft, transcendent, and flowing. Evocative poetic structures.",
    perspective: "Relational perspective: Harmonizing with the quiet, vast cycles of nature and life."
  },
  "practical-grounding": {
    name: "Practical Foundation",
    framing: "Focus on simple concrete facts, immediate actions, practical boundaries, and clear, realistic self-reliance.",
    cadence: "Direct, plain, clear, and steady. Highly concrete, low flowery descriptors.",
    perspective: "Relational perspective: Confident, steady, pragmatic mentor grounding you in immediate reality."
  },
  "recovery": {
    name: "Restorative Sanctuary",
    framing: "Nurture depleted energetic states: rebuild quiet energy reserves and secure a safe, boundary-walled sanctuary of recovery.",
    cadence: "Slow, quiet, deeply restorative. Flowing like calm water, cradling and gentle.",
    perspective: "Relational perspective: Enveloping quiet safety, offering deep restoration for a tired soul."
  },
  "future-self": {
    name: "Wisdom from the Future Self",
    framing: "Project perspective forward: call upon the calm, integrated wisdom of the user's future self to speak reassurance to their present struggle.",
    cadence: "Visionary, encouraging, resonant, and calling. Phrasing spans across time with steady certainty.",
    perspective: "Relational perspective: Deep, loving reassurance sent from your wiser, integrated self in tomorrow."
  }
};

const METAPHOR_DOMAINS_CONFIG = {
  "nature": {
    name: "Nature & Earth",
    keywords: ["roots", "seeds", "soil", "oak", "forest", "rain", "grow", "stone"],
    directives: "Leverage elements of dense soil, deep roots, expanding trees, seeds waiting in winter, or rain nourishing dry ground."
  },
  "breath": {
    name: "Breath & Air",
    keywords: ["inhale", "exhale", "sigh", "space", "wind", "oxygen", "release", "flow"],
    directives: "Focus on the physical breathing mechanism: the space in the chest, the exhale releasing weight, or the clean wind clearing dust."
  },
  "seasons": {
    name: "Seasons & Cycles",
    keywords: ["winter", "bloom", "autumn", "summer", "shedding", "frost", "harvest", "sun"],
    directives: "Utilize cycles of time: shedding dry autumn leaves, sleeping in quiet winter frost, or slowly warming in spring sun."
  },
  "architecture": {
    name: "Architecture & Pillars",
    keywords: ["foundation", "pillar", "stones", "arches", "walls", "steady", "frame", "shelter"],
    directives: "Build spatial and structured metaphors: heavy granite foundations, steady support pillars, and thick, safe sanctuary walls."
  },
  "ocean": {
    name: "Ocean & Deep Waters",
    keywords: ["tides", "currents", "waves", "depth", "shoreline", "anchor", "buoy", "surface"],
    directives: "Employ elements of deep, steady ocean currents, floating buoyantly on waves, or dropping a heavy anchor in a storm."
  },
  "movement": {
    name: "Movement & Paths",
    keywords: ["footsteps", "wings", "soaring", "walking", "pace", "horizon", "gates", "bridge"],
    directives: "Leverage metaphors of movement: slow intentional footsteps, opening heavy gates, crossing bridges, or unfolding soaring wings."
  },
  "light": {
    name: "Light & Shadows",
    keywords: ["dawn", "lantern", "glow", "starlight", "dusk", "radiant", "shadows", "beacon"],
    directives: "Use variations of lighting: the first sliver of dawn, a steady lantern guide, glowing embers, or soft, quiet shadows."
  },
  "craftsmanship": {
    name: "Craftsmanship & Art",
    keywords: ["clay", "loom", "weaving", "carving", "shaping", "sculpt", "threads", "wheel"],
    directives: "Focus on processes of hand-making: smoothing raw clay on a wheel, carving heavy marble, or weaving strong threads together."
  },
  "music": {
    name: "Music & Resonance",
    keywords: ["silence", "notes", "rhythm", "tempo", "harmony", "chord", "echo", "instrument"],
    directives: "Utilize sensory sound metaphors: a long steady rest note, a gentle rhythmic heartbeat, or a quiet harmony resolving."
  },
  "grounding": {
    name: "Grounding Foundations",
    keywords: ["anchor", "granite", "roots", "bedrock", "iron", "horizon", "steady", "weight"],
    directives: "Focus on absolute density: bedrock beneath the city, roots wrapped around ancient stone, and heavy iron anchors."
  }
};

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

  // 2. Prompt Entropy Framing (Mandatory Register & Metaphors)
  if (context.entropy) {
    parts.push(`\n--- MANDATED PROMPT ENTROPY STRUCTURAL FRAMING ---`);
    parts.push(`Active Emotional Register: ${context.entropy.register.name}`);
    parts.push(`- Framing Perspective: ${context.entropy.register.framing}`);
    parts.push(`- Cadence & Sentence Structure constraint: ${context.entropy.register.cadence}`);
    parts.push(`- Psychological Stance: ${context.entropy.register.perspective}`);

    parts.push(`\nActive Metaphor Domain: ${context.entropy.metaphor.name}`);
    parts.push(`- Metaphors to employ: ${context.entropy.metaphor.directives}`);
    parts.push(`- Specific mandatory keywords to seed: ${context.entropy.metaphor.keywords.join(", ")}`);
  }

  // 3. Emotional Context & Trajectory
  parts.push(`\n--- EMOTIONAL CONTEXT & TRAJECTORY ---`);
  if (context.currentMood) {
    parts.push(`The user checked in feeling: "${context.currentMood}".`);
    parts.push(`Recent emotional momentum/trend: ${context.emotionalTrend}.`);
    
    // Inject custom emotional directives
    const dirs = context.moodDirectives;
    parts.push(`Target Emotional Energy: ${dirs.energy}.`);
    parts.push(`Stylistic Directives for this state: ${dirs.style}`);
    if (!context.entropy) {
      parts.push(`Encouraged Metaphors: ${dirs.metaphor}.`);
    }
    parts.push(`Encouragement Intensity: ${dirs.encouragement}.`);

    if (context.moodNote) {
      parts.push(`Their journal reflection: "${context.moodNote}". Address this reflection with deep emotional continuity, matching their exact space.`);
    }
  } else {
    parts.push(`The user is checking in ambiently. Support their current continuity with a balanced, calm tone.`);
  }

  // 3b. Emotional Phase Transition State
  if (context.emotionalPhase) {
    parts.push(`\n--- EMOTIONAL PHASE TRANSITION STATE (CRITICAL) ---`);
    parts.push(`Current Classified Emotional Phase: "${context.emotionalPhase.toUpperCase()}"`);
    parts.push(`Previous Emotional Phase: "${context.previousPhase || "none"}"`);
    parts.push(`Phase Transition Detected: ${context.phaseTransitionFlag ? "YES" : "NO"}`);
    parts.push(`Classification Confidence: ${context.phaseConfidence}`);

    const phaseDirectives = {
      crisis: "CRITICAL SAFETY & CONTAINMENT DIRECTIVE: The user is in an acute crisis or highly volatile anxious phase. You must speak with absolute, soothing safety, containing their space. Enforce zero performance expectations, action tasks, or pressure to change. Use short, slow, spacious grounding language.",
      stabilization: "STABILIZATION DIRECTIVE: The user is stabilizing and cooling off after crisis. Praise their quiet centering, slow pacing, and emotional rest. Keep cadences peaceful, spacious, and supportive of slow integration.",
      recovery: "RECOVERY DIRECTIVE: Focus on healing, deep acceptance, restoration, and somatic comfort. Emphasize that taking time to breathe and rest is an act of high courage.",
      emergence: "EMERGENCE DIRECTIVE (CRITICAL PIVOT): The user is transitioning upwards from a difficult state and beginning to rise. REDUCE over-soothing or protective language. INCREASE possibility, momentum, emerging agency, and self-belief. Use lighter, expansive sentences that honor their new movement forward.",
      growth: "GROWTH & EXPANSION DIRECTIVE: The user is in a sustained growth phase. Do NOT over-protect or treat them as wounded. Speak with bold declaration, active agency, strength, and high momentum. Spark active possibilities and courage.",
      plateau: "PLATEAU CHALLENGE DIRECTIVE: The user is in a flat, repetitive neutral phase. Introduce subtle positive challenge, intellectual curiosity, self-reflection depth, and expansion framing to break emotional stagnancy gently.",
      "regression-risk": "REGRESSION RISK DIRECTIVE: The user has experienced a sudden drop after stability. Speak with warm, non-judgmental presence, reinforcing continuity and self-compassion. Absolutely AVOID any shame framing. Reinforce the steady path of their return.",
      "resilience-building": "RESILIENCE DIRECTIVE: Focus on self-anchoring, everyday confidence, and steady internal power. Ground their daily progress in quiet inner strength."
    };

    const dir = phaseDirectives[context.emotionalPhase] || phaseDirectives["resilience-building"];
    parts.push(`Active Phase Instruction: ${dir}`);
  }

  // 4. Situational Continuity
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

  // 5. Streak / Resiliency State
  const isCompassionRecovery = context.streakCount === 1 && context.lifetimeRitualCount > 1;
  if (isCompassionRecovery) {
    parts.push(`Compassion Recovery Active: The user missed a previous day but has chosen to return to their practice today. Celebrate their return with exceptional warmth and self-compassion. Do not scold them for missing a day.`);
  } else if (context.streakCount > 1) {
    parts.push(`Streak State: They are on a beautiful ${context.streakCount}-day streak. Subtly acknowledge their dedication and momentum.`);
  }

  // 6. Longitudinal Semantic Memory Avoidance
  if (context.semanticMemory) {
    parts.push(`\n--- LONGITUDINAL SEMANTIC DIVERSITY MEMORY (CRITICAL REPETITION PREVENTION) ---`);
    if (context.semanticMemory.recentRegisters?.length) {
      parts.push(`Avoid the framing, emotional structure, and psychological angles of these recently active registers:`);
      context.semanticMemory.recentRegisters.forEach(r => parts.push(`- ${r}`));
    }
    if (context.semanticMemory.recentMetaphorDomains?.length) {
      parts.push(`Avoid using metaphorical concepts, visuals, and vocabulary from these recently active metaphor domains:`);
      context.semanticMemory.recentMetaphorDomains.forEach(m => parts.push(`- ${m}`));
    }
  }

  // 7. Repetition Avoidance (Strict constraint)
  if (context.avoidRepetition?.length) {
    parts.push(`\n--- LEXICAL REPETITION AVOIDANCE (CRITICAL) ---`);
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

  // Query last 15 mood logs to construct a rich, deep emotional trajectory and phase classification
  const recentMoodLogs = await MoodLog.find({ userId: user._id })
    .sort({ createdAt: -1 })
    .limit(15)
    .lean();

  // Safely extract mood, intensity, and note from the context
  const currentMood = latestMood?.mood || latestMood?.currentMood || null;
  const rawIntensity = latestMood?.intensity || latestMood?.currentIntensity;
  const activeIntensity = rawIntensity !== undefined ? Number(rawIntensity) : (currentMood ? 5 : undefined);
  const rawNote = latestMood?.note || latestMood?.moodNote || null;
  const sanitizedNote = rawNote ? sanitizePII(rawNote) : null;

  // Run dynamic emotional phase classification
  await user.classifyAndUpdateEmotionalPhase(recentMoodLogs, currentMood, activeIntensity, sanitizedNote);

  // Compute trend using the newest 5 logs
  const emotionalTrend = calculateEmotionalTrend(recentMoodLogs.slice(0, 5));

  const timeOfDay = latestMood?.timeOfDay || "day";

  // Statefully evaluate and rotate prompt register and metaphor domains inside the User model
  const entropyResult = await user.rotatePromptEntropy(recentMoodLogs.slice(0, 5), currentMood, sanitizedNote);
  const activeReg = REGISTERS_CONFIG[entropyResult.register] || REGISTERS_CONFIG["self-compassion"];
  const activeMet = METAPHOR_DOMAINS_CONFIG[entropyResult.metaphor] || METAPHOR_DOMAINS_CONFIG["breath"];

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
    entropy: {
      register: activeReg,
      metaphor: activeMet,
    },
    semanticMemory: user.semanticMemory,
    emotionalPhase: user.emotionalPhase || "resilience-building",
    previousPhase: user.previousPhase || "resilience-building",
    phaseTransitionFlag: user.phaseTransitionFlag || false,
    phaseConfidence: user.phaseConfidence || 1.0,
  };

  const systemPrompt = buildSystemPrompt(user.preferences?.affirmationVoice || "gentle");
  const userPrompt = buildUserPrompt(category, context);

  logger.debug(`openaiService prompt build complete. System prompt voice: ${user.preferences?.affirmationVoice || "gentle"} | Mood: ${currentMood} | Trajectory: ${emotionalTrend} | Phase: ${user.emotionalPhase} | Active Register: ${entropyResult.register} | Metaphor: ${entropyResult.metaphor}`);

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
      activePromptRegister: entropyResult.register,
      activeMetaphorDomain: entropyResult.metaphor,
      emotionalPhase: user.emotionalPhase || "resilience-building",
    },
  };
};

module.exports = { generateAffirmation };
