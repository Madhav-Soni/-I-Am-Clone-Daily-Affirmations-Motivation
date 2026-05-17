const OpenAI = require("openai");
const { buildSafePromptContext } = require("../../utils/piiSanitizer");
const logger = require("../../utils/logger");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// ─── Prompt Templates ─────────────────────────────────────────────────────────

/**
 * Builds the system prompt that defines the AI's persona and constraints.
 */
const buildSystemPrompt = (voice) => {
  const voiceDescriptions = {
    gentle: "warm, nurturing, and compassionate — like a caring friend",
    motivational: "energetic, powerful, and action-oriented — like a life coach",
    spiritual: "mindful, reflective, and grounded — like a meditation guide",
    direct: "clear, concise, and pragmatic — like a confident mentor",
  };

  return `You are a wellness affirmation coach. Your tone is ${voiceDescriptions[voice] || voiceDescriptions.gentle}.

Your task: Generate a single, powerful, personalized affirmation for the user.

Rules:
- Output ONLY the affirmation text. No preamble, no explanation, no quotes.
- The affirmation must be written in the first person ("I am", "I have", "I can").
- Length: 1–3 sentences maximum.
- Make it specific to the user's context and category.
- Never use generic filler. Every word must feel intentional and personal.`;
};

/**
 * Builds the user-facing prompt from sanitized context data.
 */
const buildUserPrompt = (category, context) => {
  const parts = [`Generate an affirmation for the category: "${category}".`];

  if (context.timeOfDay) {
    parts.push(`Time of day: ${context.timeOfDay}. Adapt the tone accordingly (e.g., uplifting for morning, grounding for night).`);
  }

  if (context.currentMood) {
    parts.push(`The user currently feels: ${context.currentMood} (intensity: ${context.moodIntensity || "moderate"}).`);
    if (context.moodNote) {
      parts.push(`Their note: "${context.moodNote}"`);
    }
  }

  if (context.emotionalTrend && context.emotionalTrend !== "stable") {
    parts.push(`Recent emotional trend: ${context.emotionalTrend}.`);
  }

  if (context.preferences?.topics?.length) {
    parts.push(`Their core interests include: ${context.preferences.topics.join(", ")}.`);
  }

  if (context.recentThemes?.length) {
    parts.push(`Themes they have focused on recently: ${context.recentThemes.join(", ")}.`);
  }

  if (context.streakCount > 1) {
    parts.push(`They are on a ${context.streakCount}-day affirmation streak — acknowledge their consistency subtly.`);
  }

  if (context.avoidRepetition?.length) {
    parts.push(`DO NOT repeat or closely mimic these recent affirmations:`);
    context.avoidRepetition.forEach(a => parts.push(`- "${a}"`));
  }

  return parts.join("\n");
};

// ─── Service Functions ────────────────────────────────────────────────────────

/**
 * Generates an affirmation and streams the response back via SSE.
 * @param {object} user - Mongoose User document
 * @param {string} category - Affirmation category
 * @param {object|null} latestMood - Most recent MoodLog document
 * @param {object} res - Express response object for streaming
 * @returns {object} - Final affirmation text and usage metadata
 */
const streamAffirmation = async (user, category, latestMood, res) => {
  const context = buildSafePromptContext(user, latestMood);
  const systemPrompt = buildSystemPrompt(user.preferences?.affirmationVoice || "gentle");
  const userPrompt = buildUserPrompt(category, context);

  logger.debug(`Generating affirmation | user: ${user._id} | category: ${category}`);

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering

  const stream = openai.beta.chat.completions.stream({
    model: MODEL,
    max_tokens: 200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  let fullContent = "";

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || "";
    if (delta) {
      fullContent += delta;
      res.write(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`);
    }
  }

  const finalMessage = await stream.finalMessage();
  const usage = finalMessage.usage;

  // Signal completion to the client
  res.write(`data: ${JSON.stringify({ type: "done", content: fullContent })}\n\n`);
  res.end();

  return {
    content: fullContent,
    aiMetadata: {
      model: MODEL,
      promptTokens: usage?.prompt_tokens,
      completionTokens: usage?.completion_tokens,
      moodContext: latestMood?.mood || null,
    },
  };
};

/**
 * Non-streaming generation — for internal use (e.g., scheduled jobs).
 */
const generateAffirmation = async (user, category, latestMood = null) => {
  const context = buildSafePromptContext(user, latestMood);
  const systemPrompt = buildSystemPrompt(user.preferences?.affirmationVoice || "gentle");
  const userPrompt = buildUserPrompt(category, context);

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
      moodContext: latestMood?.mood || null,
    },
  };
};

module.exports = { streamAffirmation, generateAffirmation };
