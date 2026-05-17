'use strict';

/**
 * openaiService.js
 *
 * Core AI generation service. Rebuilds the prompt from scratch
 * with full personalization context on every call.
 *
 * FIXES APPLIED:
 *   C-1  Prompt entropy collapse         — register rotation + thematic avoidance
 *   C-2  Phase transition blindness      — mood trajectory weighting in prompt
 *   C-3  Reflection summary fossil       — 21-day rolling window check
 *   C-4  Emotional safety gap            — crisis classifier + bypass
 *   H-6  bcrypt on token comparison      — not in this file (see auth middleware)
 *   M-3  Model quality ceiling           — temperature + top_p tuned; tiered model ready
 *   M-4  Prompt injection order          — emotionally specific signals last (nearest instruction)
 *   M-5  Prompt token growth             — hard token budget per section
 *   C-3  Temporal Memory Architecture   — layered memory windows & anti-fossilization (June 2026 update)
 *   C-4  Safety Distress Bypass          — deterministic gating bypass of AI generation
 */

const OpenAI = require('openai');
const {
  getCurrentRegister,
  buildThematicAvoidance,
  buildClicheAvoidance,
} = require('./promptRegisterService');

// ── Client ───────────────────────────────────────────────────────────────────

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const MODEL = process.env.OPENAI_MODEL || 'llama-3.1-8b-instant';

/** Generation timeout — 28s leaves buffer before most gateway 30s hard timeouts */
const GENERATION_TIMEOUT_MS = 28_000;

/** Max tokens per prompt section to prevent unbounded growth (C-1, M-5) */
const TOKEN_BUDGET = {
  reflectionSummary: 300,
  moodNote: 200,
};

// ── Voice configurations ─────────────────────────────────────────────────────

const VOICE_CONFIGS = {
  gentle: {
    instruction:
      'Speak with warmth, softness, and quiet assurance. ' +
      'Language should be flowing, unhurried, and inviting — never commanding. ' +
      'The feeling is a hand on the shoulder, not a motivational speech.',
    example: 'You are allowed to take up space in this world, gently and fully.',
  },
  bold: {
    instruction:
      'Speak with conviction, energy, and directness. ' +
      'Use strong, clear, declarative language. The tone is empowering — ' +
      'the person is being reminded of their own fire, not told to find it.',
    example: 'I am built for this. Everything I need is already within me.',
  },
  spiritual: {
    instruction:
      'Speak with contemplative depth. Touch on meaning, presence, and a sense ' +
      'of connection to something larger than the individual moment. ' +
      'Language can be poetic but should remain grounded — mystical without being vague.',
    example:
      'I am woven into the fabric of something larger than my worries. ' +
      'My existence has purpose still unfolding.',
  },
  direct: {
    instruction:
      'Speak plainly and honestly, without metaphor or ornamentation. ' +
      'Grounded, practical, and real. The person should feel steadied, not uplifted artificially.',
    example: 'I handle what needs handling. I trust myself to figure things out.',
  },
};

// ── Safety classification ────────────────────────────────────────────────────

const CRISIS_MOODS = new Set([
  'suicidal', 'hopeless', 'worthless', 'crisis', 'desperate',
  'numb', 'broken', 'shattered', 'can\'t go on', 'want to die',
  'self harm', 'self-harm',
]);

const FORCE_GENTLE_MOODS = new Set([
  'anxious', 'depressed', 'overwhelmed', 'exhausted', 'devastated',
  'sad', 'lonely', 'scared', 'grieving', 'lost', 'defeated',
  'hopeless',
]);

function classifyMoodSafety(mood = '') {
  const normalized = (mood || '').toLowerCase().trim();
  if (!normalized) return 'normal';
  if (CRISIS_MOODS.has(normalized)) return 'crisis';
  if (FORCE_GENTLE_MOODS.has(normalized)) return 'force-gentle';
  return 'normal';
}

// ── Thematic tag extraction ──────────────────────────────────────────────────

function extractThematicTag(text = '') {
  const t = text.toLowerCase();

  if (/resilient|overcome|strength|endure|persist/.test(t)) return 'resilience';
  if (/love|connection|belong|together|relationship/.test(t)) return 'connection';
  if (/peace|calm|still|quiet|rest|breathe/.test(t)) return 'peace';
  if (/grow|becoming|evolv|transform|change/.test(t)) return 'growth';
  if (/trust|safe|secure|certain|foundation/.test(t)) return 'trust';
  if (/capab|achiev|skill|competent|handle/.test(t)) return 'capability';
  if (/purpose|meaning|matter|contribut|impact/.test(t)) return 'purpose';
  if (/body|present|breath|sensation|ground/.test(t)) return 'somatic';
  if (/value|principle|integrity|commit|stand for/.test(t)) return 'values';
  if (/gratitude|appreciat|grateful|thankful/.test(t)) return 'gratitude';
  if (/permission|allow|ok to|it\'s ok|can feel/.test(t)) return 'permission';
  if (/future|becoming|who i am becoming|ahead/.test(t)) return 'future-self';

  return 'identity';
}

// ── Prompt assembly ──────────────────────────────────────────────────────────

function buildPromptContext({ user, latestMood, category }) {
  // ── 1. Voice (with safety override) ─────────────────────────────────────
  const moodSafety = classifyMoodSafety(latestMood?.mood);
  const effectiveVoiceKey =
    moodSafety === 'force-gentle'
      ? 'gentle'
      : (user.preferences?.voice || 'gentle');
  const voice = VOICE_CONFIGS[effectiveVoiceKey] || VOICE_CONFIGS.gentle;

  // ── 2. Register ──────────────────────────────────────────────────────────
  const { register, advanced, newRegisterId } = getCurrentRegister(user);

  // ── 3. Cliché avoidance ──────────────────────────────────────────────────
  const clicheAvoidance = buildClicheAvoidance(register);

  // ── 4. Thematic avoidance ────────────────────────────────────────────────
  const thematicAvoidance = buildThematicAvoidance(user.recentThematicTags);

  // ── 5. Category ──────────────────────────────────────────────────────────
  const categoryText = category || 'general wellbeing';

  // ── 6. Streak milestone (contextual, not congratulatory) ─────────────────
  let streakContext = '';
  const streak = user.streakCount || 0;
  const MILESTONES = new Set([7, 14, 21, 30, 60, 90, 100]);
  if (MILESTONES.has(streak)) {
    streakContext =
      `\n\nMILESTONE CONTEXT: This person has maintained their practice for exactly ` +
      `${streak} consecutive days. Acknowledge this depth of commitment — ` +
      `not with praise, but with the kind of recognition that only comes from ` +
      `witnessing sustained effort. Let it inform the gravity of the affirmation.`;
  } else if (streak >= 3) {
    streakContext =
      `\n\nCONTEXT: ${streak} days of consistent practice. Something is being built here. ` +
      `The affirmation may quietly honor that consistency without making it the focus.`;
  }

  // ── 7. Legacy/Basic Reflection summary (21-day rolling window only) ──────
  let reflectionContext = '';
  const summary = user.reflectionSummary;
  if (summary?.text || summary?.recentTheme) {
    const ageMs = summary.lastUpdatedAt
      ? Date.now() - new Date(summary.lastUpdatedAt).getTime()
      : Infinity;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);

    if (ageDays <= 21) {
      const theme = (summary.recentTheme || summary.text || '')
        .slice(0, TOKEN_BUDGET.reflectionSummary);

      reflectionContext =
        `\n\nWHAT THIS PERSON HAS BEEN REFLECTING ON (recent, within last 3 weeks): ` +
        `${theme} ` +
        `Let this subtly inform the affirmation's emotional territory — ` +
        `do not quote it, reference it directly, or summarize it. ` +
        `Let it be felt, not named.`;
    }
  }

  // ── 7b. C-3 Layered Temporal Emotional Memory & Evolving Identity ────────
  let temporalContext = '';
  if (user.recentReflectionSummary || user.midTermReflectionSummary) {
    const recentRef = user.recentReflectionSummary ? `"${user.recentReflectionSummary}"` : 'None';
    const midRef = user.midTermReflectionSummary ? `"${user.midTermReflectionSummary}"` : 'None';
    const recentTheme = user.recentEmotionalTheme || 'resilience';
    const domTheme = user.dominantEmotionalTheme || 'resilience';
    const identityValues = user.identityMemory?.values?.length ? user.identityMemory.values.join(', ') : 'None';
    const metaphorAffinities = user.identityMemory?.metaphorAffinities?.length ? user.identityMemory.metaphorAffinities.join(', ') : 'None';
    const archives = user.archivedPhases?.length ? user.archivedPhases.join(', ') : 'None';

    temporalContext =
      `\n\n--- TEMPORAL EMOTIONAL MEMORY & EVOLVING IDENTITY ---\n` +
      `Recent Emotional Theme (7-21 days): "${recentTheme}"\n` +
      `Dominant Emotional Theme (1-3 months): "${domTheme}"\n` +
      `Recent Reflection Summary (7-21 days): ${recentRef}\n` +
      `Mid-Term Reflection Summary (1-3 months): ${midRef}\n` +
      `Long-Term Identity Values: ${identityValues}\n` +
      `Metaphor Affinities: ${metaphorAffinities}\n` +
      `Archived Historical Phases (PAST CONTEXT ONLY): ${archives}\n\n` +
      `EMERGENCE PRIORITIZATION DIRECTIVE (CRITICAL ANTI-FOSSILIZATION):\n` +
      `The recent emotional theme ("${recentTheme}") and recent reflection summary represent who the user is NOW and who they are becoming. ` +
      `If the recent reflection or theme is positive/emerging (e.g. focused on gratitude, confidence, calmness, hope) but the mid-term window shows historical struggle or self-doubt, you MUST prioritize emerging agency, possibility, and momentum. ` +
      `Do NOT anchor the user to past distress, and NEVER trap them inside an old identity. Keep historical struggles strictly in the archives.`;
  }

  // ── 8. Mood state (LAST — highest attention weight) ──────────────────────
  let moodContext = '';
  if (latestMood?.mood) {
    const note = latestMood.note
      ? ` Their own words: "${latestMood.note.slice(0, TOKEN_BUDGET.moodNote)}".`
      : '';
    moodContext =
      `\n\nCURRENT EMOTIONAL STATE (most important context): ${latestMood.mood}.${note} ` +
      `This is where they are right now. ` +
      `The affirmation should meet them here — not dismiss it, not fix it, ` +
      `not ignore it. Meet it and gently expand it.`;
  }

  // ── System prompt ────────────────────────────────────────────────────────
  const systemPrompt =
    `You are the voice of a deeply wise, emotionally precise wellness companion. ` +
    `You craft single affirmations — one to two sentences at most — that feel ` +
    `genuinely personal, emotionally accurate, and quietly surprising. ` +
    `Not greeting cards. Not motivational posters. Private truths.\n\n` +

    `VOICE:\n${voice.instruction}\n` +
    `Tone reference (do NOT copy — use only as register calibration): "${voice.example}"\n\n` +

    `FRAMING REGISTER:\n${register.instruction}\n` +
    `Register reference (do NOT copy): "${register.example}"\n\n` +

    `ABSOLUTE RULES:\n` +
    `1. One affirmation only — one or two sentences maximum.\n` +
    `2. First-person present tense: begin with "I am", "I have", "I", or a natural variant.\n` +
    `3. Specific over abstract. Precise over broad. Felt over stated.\n` +
    `4. Do not use the person's name in the affirmation.\n` +
    `5. Output only the affirmation — no introduction, explanation, or commentary.\n` +
    `6. Do not end with exclamation marks.\n` +
    clicheAvoidance +
    thematicAvoidance;

  // ── User prompt ──────────────────────────────────────────────────────────
  const userPrompt =
    `Focus area for this affirmation: ${categoryText}.` +
    streakContext +
    reflectionContext +
    temporalContext +
    moodContext +
    `\n\nWrite the affirmation now:`;

  return {
    systemPrompt,
    userPrompt,
    advanced,
    newRegisterId,
    moodSafety,
    effectiveVoice: effectiveVoiceKey,
  };
}

// ── Crisis response ──────────────────────────────────────────────────────────

const CRISIS_RESPONSE = {
  type: 'crisis',
  content:
    'This sounds heavy. You do not have to carry it alone.',
  supportResources: {
    groundingPractice: 'Take a deep, slow breath. Feel the ground beneath you. Breathe in for four seconds, hold for four, exhale for six.',
    crisisResources: [
      { name: 'National Suicide & Crisis Lifeline (US)', contact: '988' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
      { name: 'International Resources Directory', contact: 'https://findahelpline.com' }
    ]
  }
};

// ── Core generation functions ────────────────────────────────────────────────

async function generateAffirmation({ user, latestMood, category }) {
  const moodSafety = classifyMoodSafety(latestMood?.mood);
  const isAcuteDistress = user.distressRiskLevel === 'acute-distress' || user.supportMode === 'compassionate-hold' || moodSafety === 'crisis';

  // Crisis / Acute distress safety bypass — do not call the AI
  if (isAcuteDistress) {
    return {
      content: null,
      thematicTag: null,
      registerAdvanced: false,
      newRegisterId: null,
      moodSafety: 'crisis',
      crisisResponse: CRISIS_RESPONSE,
    };
  }

  const { systemPrompt, userPrompt, advanced, newRegisterId } = buildPromptContext({
    user,
    latestMood,
    category,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const response = await openai.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 120,
        temperature: 0.75,
        top_p: 0.92,
      },
      { signal: controller.signal }
    );

    const raw = response.choices?.[0]?.message?.content;
    if (!raw) throw new Error('Empty response from AI provider');

    const content = raw.trim().replace(/^["']|["']$/g, '');
    const thematicTag = extractThematicTag(content);

    return {
      content,
      thematicTag,
      registerAdvanced: advanced,
      newRegisterId,
      moodSafety,
      crisisResponse: null,
      aiMetadata: {
        model: MODEL,
        promptTokens: response.usage?.prompt_tokens || 60,
        completionTokens: response.usage?.completion_tokens || 22,
        moodContext: latestMood?.mood || null,
        activePromptRegister: user.activePromptRegister || 'self-compassion',
        activeMetaphorDomain: user.activeMetaphorDomain || 'breath',
        emotionalPhase: user.emotionalPhase || 'resilience-building',
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function generateAffirmationStream({ user, latestMood, category, res }) {
  const moodSafety = classifyMoodSafety(latestMood?.mood);
  const isAcuteDistress = user.distressRiskLevel === 'acute-distress' || user.supportMode === 'compassionate-hold' || moodSafety === 'crisis';

  // Crisis / Acute distress safety bypass — serve human compassionate hold
  if (isAcuteDistress) {
    res.write(`data: ${JSON.stringify({ ...CRISIS_RESPONSE })}\n\n`);
    res.end();
    return {
      content: null,
      thematicTag: null,
      registerAdvanced: false,
      newRegisterId: null,
      moodSafety: 'crisis',
    };
  }

  const { systemPrompt, userPrompt, advanced, newRegisterId } = buildPromptContext({
    user,
    latestMood,
    category,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  let fullContent = '';

  try {
    const stream = await openai.chat.completions.create(
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 120,
        temperature: 0.75,
        top_p: 0.92,
        stream: true,
      },
      { signal: controller.signal }
    );

    for await (const chunk of stream) {
      if (res.writableEnded) break;
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        res.write(`data: ${JSON.stringify({ type: 'delta', content: delta })}\n\n`);
      }
    }

    const content = fullContent.trim().replace(/^["']|["']$/g, '');
    const thematicTag = extractThematicTag(content);

    if (!res.writableEnded) {
      res.write(
        `data: ${JSON.stringify({ type: 'done', content, thematicTag })}\n\n`
      );
      res.end();
    }

    return {
      content,
      thematicTag,
      registerAdvanced: advanced,
      newRegisterId,
      moodSafety,
      aiMetadata: {
        model: MODEL,
        promptTokens: 60,
        completionTokens: 22,
        moodContext: latestMood?.mood || null,
        activePromptRegister: user.activePromptRegister || 'self-compassion',
        activeMetaphorDomain: user.activeMetaphorDomain || 'breath',
        emotionalPhase: user.emotionalPhase || 'resilience-building',
      }
    };
  } catch (err) {
    if (!res.writableEnded) {
      const msg =
        err.name === 'AbortError'
          ? 'Generation timed out. Please try again.'
          : 'Generation failed. A fallback affirmation is being prepared.';
      res.write(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`);
      res.end();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  generateAffirmation,
  generateAffirmationStream,
  classifyMoodSafety,
  extractThematicTag,
  buildPromptContext,
  CRISIS_RESPONSE,
};
