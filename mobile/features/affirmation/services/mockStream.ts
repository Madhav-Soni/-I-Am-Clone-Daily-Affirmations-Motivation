import { REVEAL_TIMING } from "@/features/affirmation/constants/reveal";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Simulates SSE token deltas — swap for real stream parser in API phase.
 */
export async function* mockStreamAffirmation(
  fullText: string,
  options: { chunkSize?: number; baseDelayMs?: number } = {}
): AsyncGenerator<string, void, unknown> {
  const chunkSize = options.chunkSize ?? REVEAL_TIMING.chunkSize;
  const baseDelayMs = options.baseDelayMs ?? REVEAL_TIMING.chunkMs;

  for (let i = 0; i < fullText.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, fullText.length);
    yield fullText.slice(0, end);
    const jitter = Math.random() * 18;
    const pause = fullText[end - 1] === "." || fullText[end - 1] === "," ? 120 : 0;
    await delay(baseDelayMs + jitter + pause);
  }
}
