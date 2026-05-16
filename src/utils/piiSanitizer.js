/**
 * Sanitizes text to remove PII before sending to external AI APIs.
 * Implements the "Privacy-First" requirement from the architecture doc.
 */

const PII_PATTERNS = [
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]" },
  // Phone numbers (various formats)
  { pattern: /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g, replacement: "[PHONE]" },
  // Social Security Numbers
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: "[SSN]" },
  // Credit card numbers
  { pattern: /\b(?:\d[ -]?){13,16}\b/g, replacement: "[CARD]" },
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: "[IP]" },
  // URLs with potential personal info
  { pattern: /https?:\/\/[^\s]+/g, replacement: "[URL]" },
  // Physical addresses (basic pattern)
  { pattern: /\d{1,5}\s\w+\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/gi, replacement: "[ADDRESS]" },
];

/**
 * Removes detected PII from a string.
 * @param {string} text - Raw text that may contain PII
 * @returns {string} - Sanitized text safe for external API use
 */
const sanitizePII = (text) => {
  if (!text || typeof text !== "string") return text;

  let sanitized = text;
  for (const { pattern, replacement } of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, replacement);
  }
  return sanitized;
};

/**
 * Builds a sanitized prompt context object from user data.
 * Never includes raw user identifiers in the prompt.
 */
const buildSafePromptContext = (user, moodLog = null) => {
  return {
    preferences: user.preferences || {},
    streakCount: user.streakCount || 0,
    currentMood: moodLog ? sanitizePII(moodLog.mood) : null,
    moodNote: moodLog ? sanitizePII(moodLog.note) : null,
    // Deliberately omit: email, name, _id, any raw PII
  };
};

module.exports = { sanitizePII, buildSafePromptContext };
