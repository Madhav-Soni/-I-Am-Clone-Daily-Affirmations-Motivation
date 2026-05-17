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

/**
 * Returns a premium fallback affirmation, ensuring the user is never left without a beautiful message.
 */
export function getFallbackAffirmation(category?: string | null): string {
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
