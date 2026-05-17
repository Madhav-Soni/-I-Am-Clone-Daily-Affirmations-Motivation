export const FALLBACK_AFFIRMATIONS: Record<string, string[]> = {
  General: [
    "I am exactly where I need to be in this moment.",
    "I release what I cannot control and embrace peace.",
    "My worth is inherent and unconditional.",
    "I am breathing deeply, trusting the rhythm of my life.",
  ],
  Health: [
    "I honor my body and treat it with deep compassion.",
    "I am cultivating strength and ease in my physical form.",
    "Every breath I take brings nourishment and healing.",
  ],
  Confidence: [
    "I step into my power with grace and certainty.",
    "I trust my inner voice and the wisdom it carries.",
    "I am capable, resilient, and deeply valuable.",
  ],
  Relationships: [
    "I am worthy of profound love and connection.",
    "I invite healthy, supportive relationships into my life.",
    "I radiate warmth and attract the same in return.",
  ],
  Mindfulness: [
    "I am present in this exact moment, letting go of the rest.",
    "I anchor myself in the quiet stillness of now.",
    "My mind is clear, and my heart is open.",
  ],
  Gratitude: [
    "I am deeply thankful for the abundance in my life.",
    "I find joy in the simple, quiet moments of today.",
    "Gratitude flows effortlessly through my perspective.",
  ],
  Productivity: [
    "I move through my day with calm, focused intention.",
    "My energy is a precious resource, and I invest it wisely.",
    "I accomplish what matters, and I rest without guilt.",
  ],
  Career: [
    "I am aligned with my purpose and trust my journey.",
    "My skills are valuable, and my path is unfolding perfectly.",
    "I embrace growth and step confidently toward my goals.",
  ],
};

export const MOOD_AWARE_FALLBACKS: Record<string, string[]> = {
  Anxious: [
    "I release my worries to the earth; in this moment, I am safe and held.",
    "My breath is steady, my mind is grounding, and I am anchored in the quiet present.",
    "I do not need to figure everything out right now. I am safe in this quiet space."
  ],
  Tired: [
    "I give myself permission to rest fully; I have done enough today.",
    "My worth is not tied to my productivity. I honor my body's need for gentle recovery.",
    "I soften, I release, and I embrace the quiet sanctuary of deep rest."
  ],
  Sad: [
    "It is okay to feel sad. I hold space for myself with exceptional tenderness.",
    "I honor my tears; they are a gentle washing away of the heavy clouds.",
    "Even in the dark, my inner light remains steady, warm, and secure."
  ],
  Frustrated: [
    "I breathe out the tension, step into my center, and reclaim my quiet focus.",
    "I cannot control external chaos, but I can protect my internal peace.",
    "I anchor myself in my boundaries, cool, composed, and clear."
  ],
  Excited: [
    "I amplify this positive energy and let it fuel my joyful alignment.",
    "My horizon is open, my tide is rising, and I step forward with radiant anticipation.",
    "I celebrate this beautiful spark of joy and let it expand throughout my day."
  ],
  Happy: [
    "I am in radiant alignment with my joy, and my heart is open to the sun.",
    "Abundance flows effortlessly, and I bask in the warmth of this gratitude.",
    "I cherish this light, carry it gently, and share its shine ambiently."
  ],
};

/**
 * Returns a premium fallback affirmation, ensuring the user is never left without a beautiful message.
 */
export function getFallbackAffirmation(category?: string | null, mood?: string | null): string {
  // 1. Try mood-aware fallback first if mood matches a defined profile
  if (mood && MOOD_AWARE_FALLBACKS[mood]) {
    const options = MOOD_AWARE_FALLBACKS[mood];
    const randomIndex = Math.floor(Math.random() * options.length);
    return options[randomIndex];
  }

  // 2. Fall back to category-aware selection
  const safeCategory = category && FALLBACK_AFFIRMATIONS[category] ? category : "General";
  const options = FALLBACK_AFFIRMATIONS[safeCategory] || FALLBACK_AFFIRMATIONS.General;
  
  // Random selection for variety
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

/**
 * If the stream fails mid-way, we append a graceful closing thought to avoid a jarring cut.
 */
export const GRACEFUL_CLOSING = "...and you are surrounded by quiet strength.";
