'use strict';

/**
 * promptRegisterService.js
 *
 * Manages the "prompt register" — a framing dimension that rotates every
 * REGISTER_ADVANCE_DAYS days to prevent prompt entropy collapse.
 *
 * Without this, a user who is consistently "calm" + "Career" + "gentle voice"
 * will receive semantically identical affirmations after ~30 days, because
 * all three stable inputs converge to a single generative attractor.
 *
 * The 7 registers provide genuinely different structural framings
 * (not just different words) so that the *form* of the affirmation varies
 * independently of the user's emotional state or category.
 *
 * FIX: C-1 Prompt Entropy Collapse
 */

// ── Register definitions ─────────────────────────────────────────────────────
// Each register has:
//   id         — stored on the User document
//   instruction — injected into the system prompt as the framing directive
//   example     — a tone reference (model is instructed NOT to copy it)
//   cliches     — extra words to avoid that are specific to this register's traps

const REGISTERS = [
  {
    id: 'identity',
    label: 'Core Identity',
    instruction:
      'Write from the perspective of the user\'s truest, most grounded self. ' +
      'The affirmation should feel like a statement of fundamental being — ' +
      'who they ARE, not what they do or achieve or become. ' +
      'Root it in the present, the unchangeable, the already-true.',
    example:
      'I am a person of depth and quiet conviction. My worth does not fluctuate with outcomes.',
    cliches: ['worthy', 'enough', 'valid', 'seen'],
  },
  {
    id: 'growth',
    label: 'Active Becoming',
    instruction:
      'Write from the perspective of who this person is actively becoming. ' +
      'The affirmation should acknowledge motion — the arc between who they were ' +
      'and who they are growing into. It should honor the process, not just the destination. ' +
      'Use present-continuous framing where possible.',
    example:
      'I am growing into the kind of person I have always wanted to be. The evidence is already here.',
    cliches: ['journey', 'path', 'unfolding', 'blossoming'],
  },
  {
    id: 'gratitude',
    label: 'Self-Appreciation',
    instruction:
      'Write an affirmation that surfaces genuine appreciation for something ' +
      'specific about this person — a quality, a capacity, a way they show up, ' +
      'a way they have survived. ' +
      'This is self-directed gratitude, not generic positivity.',
    example:
      'I am grateful for my ability to notice beauty in ordinary moments. That is not nothing — it is rare.',
    cliches: ['amazing', 'incredible', 'beautiful', 'blessed'],
  },
  {
    id: 'values',
    label: 'Values & Integrity',
    instruction:
      'Write an affirmation grounded in what this person stands for — ' +
      'their commitments, principles, and the values that quietly define their choices. ' +
      'The tone should feel like remembering something true about oneself, not aspiring to it.',
    example:
      'I live in alignment with what matters most to me. Even small choices carry my values in them.',
    cliches: ['authentic', 'genuine', 'true self', 'universe'],
  },
  {
    id: 'somatic',
    label: 'Embodied Presence',
    instruction:
      'Write an affirmation rooted in the body, breath, and present-moment physical existence. ' +
      'This register brings awareness to sensation, presence, and the intelligence of the nervous system. ' +
      'The language should feel grounded, immediate, and physical rather than abstract.',
    example:
      'Right now, in this breath, something in me knows how to be still. I trust that knowing.',
    cliches: ['flow', 'vibration', 'energy', 'chakra', 'manifest'],
  },
  {
    id: 'future-self',
    label: 'Future-Self Wisdom',
    instruction:
      'Write from the perspective of the user\'s wisest, most evolved future self ' +
      'speaking back through time to who they are now — with love, perspective, and ' +
      'the reassurance that only comes from having already moved through what feels difficult. ' +
      'The tone is tender and knowing, not instructional.',
    example:
      'The version of me who has already moved through this wants me to know: ' +
      'you are going to find your footing. You always do.',
    cliches: ['believe in yourself', 'you got this', 'keep going'],
  },
  {
    id: 'permission',
    label: 'Permission & Allowance',
    instruction:
      'Write an affirmation that explicitly grants the user permission — ' +
      'to rest, to feel, to want something different, to change their mind, ' +
      'to be imperfect, to take up time. ' +
      'This register meets self-resistance with gentle allowance. ' +
      'Use the structure of explicit permission rather than aspiration.',
    example:
      'I give myself permission to move at my own pace. ' +
      'Not every day needs to be a step forward. Sometimes steadiness is enough.',
    cliches: ['deserve', 'deserve to be happy', 'you deserve'],
  },
];

/** How many days before the register advances to the next one */
const REGISTER_ADVANCE_DAYS = 3;

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Determine the current register for a user and whether it should advance.
 *
 * @param {object} user - Mongoose user document (must have promptRegister, promptRegisterAdvancedAt)
 * @returns {{ register: object, advanced: boolean, newRegisterId: string }}
 */
function getCurrentRegister(user) {
  const now = new Date();
  const lastAdvanced = user.promptRegisterAdvancedAt
    ? new Date(user.promptRegisterAdvancedAt)
    : new Date(0);

  const daysSinceAdvance = (now - lastAdvanced) / (1000 * 60 * 60 * 24);

  let currentIndex = REGISTERS.findIndex((r) => r.id === user.promptRegister);
  if (currentIndex < 0) currentIndex = 0; // fallback to first if unknown

  const shouldAdvance = daysSinceAdvance >= REGISTER_ADVANCE_DAYS;

  const nextIndex = shouldAdvance
    ? (currentIndex + 1) % REGISTERS.length
    : currentIndex;

  const register = REGISTERS[nextIndex];

  return {
    register,
    advanced: shouldAdvance,
    newRegisterId: register.id,
  };
}

/**
 * Build a thematic avoidance instruction from the user's recent tags.
 * This is appended to the prompt to prevent semantic repetition even when
 * lexical strings differ.
 *
 * @param {string[]} recentTags - Array of thematic tag strings (last N generated)
 * @returns {string}
 */
function buildThematicAvoidance(recentTags = []) {
  if (!recentTags || recentTags.length === 0) return '';

  // Deduplicate and take the 8 most recent
  const unique = [...new Set(recentTags.slice(0, 8))];
  if (unique.length === 0) return '';

  return (
    `\n\nTHEMATIC AVOIDANCE: The following themes have appeared in this user's recent affirmations. ` +
    `Do NOT center the new affirmation on any of these: ${unique.join(', ')}. ` +
    `Explore genuinely different emotional territory.`
  );
}

/**
 * Collect all cliché words to avoid from the active register plus universal list.
 *
 * @param {object} register
 * @returns {string}
 */
function buildClicheAvoidance(register) {
  const universal = [
    'warrior', 'rockstar', 'badass', 'superstar',
    'manifest', 'abundance', 'vibration', 'universe has a plan',
    'everything happens for a reason', 'blessed and grateful',
    'live laugh love', 'shine bright',
  ];
  const registerSpecific = register.cliches || [];
  const all = [...new Set([...universal, ...registerSpecific])];
  return `\n\nWORDS & PHRASES TO AVOID: ${all.join(', ')}.`;
}

module.exports = {
  REGISTERS,
  REGISTER_ADVANCE_DAYS,
  getCurrentRegister,
  buildThematicAvoidance,
  buildClicheAvoidance,
};
