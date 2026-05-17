import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { secureStorage, storageKeys } from "@/services/storage/secureStorage";
import { EmotionalContext } from "@/services/ai/contextComposer";
import { getFallbackAffirmation, GRACEFUL_CLOSING } from "@/features/affirmation/constants/fallbacks";

export type StreamOptions = {
  category?: string | null;
  mood?: string | null;
  note?: string | null;
  context?: EmotionalContext;
  signal?: AbortSignal;
};

async function* yieldFallbackStream(category?: string | null, currentContent?: string): AsyncGenerator<string, void, unknown> {
  const fallback = getFallbackAffirmation(category);
  
  if (currentContent && currentContent.length > 0) {
    // If we failed mid-stream, gracefully transition to the closing thought
    const fullFallback = currentContent + GRACEFUL_CLOSING;
    let partial = currentContent;
    for (let i = 0; i < GRACEFUL_CLOSING.length; i++) {
      partial += GRACEFUL_CLOSING[i];
      yield partial;
      await new Promise(r => setTimeout(r, 40));
    }
  } else {
    // Yield full fallback character by character
    let partial = "";
    for (let i = 0; i < fallback.length; i++) {
      partial += fallback[i];
      yield partial;
      await new Promise(r => setTimeout(r, 40));
    }
  }
}

/**
 * Connects to the AI generation SSE endpoint and yields text deltas.
 * Automatically recovers from network failures with premium fallback affirmations.
 */
export async function* streamAffirmation(options: StreamOptions): AsyncGenerator<string, void, unknown> {
  const token = await secureStorage.getItem(storageKeys.accessToken);
  const url = `${API_BASE_URL}${endpoints.ai.generate}`;

  let fullContent = "";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second connection timeout

    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        controller.abort();
      });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        category: options.category || "General",
        mood: options.mood,
        note: options.note,
        context: options.context,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Stream failed with status ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("ReadableStream not supported in this environment");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        // Read watchdog: if a single read takes longer than 5 seconds, abort
        const readPromise = reader.read();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("Read watchdog timeout")), 5000)
        );

        const { done, value } = await Promise.race([readPromise, timeoutPromise]);
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") break;

          try {
            const data = JSON.parse(dataStr);
            if (data.type === "delta" && data.content) {
              fullContent += data.content;
              yield fullContent;
            } else if (data.type === "done") {
              yield data.content;
              return;
            }
          } catch (e) {
            // Ignore parse errors on partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error: any) {
    if (options.signal?.aborted) {
      // User explicitly cancelled, bubble up the abort
      throw error;
    }
    
    // Log the error internally
    console.error("[streamAffirmation fallback triggered]", error);
    
    // Yield the graceful fallback stream
    yield* yieldFallbackStream(options.category, fullContent);
  }
}
