import { API_BASE_URL } from "@/services/api/client";
import { endpoints } from "@/services/api/endpoints";
import { secureStorage, storageKeys } from "@/services/storage/secureStorage";

export type StreamOptions = {
  category?: string | null;
  mood?: string | null;
  note?: string | null;
  signal?: AbortSignal;
};

/**
 * Connects to the AI generation SSE endpoint and yields text deltas.
 * Supports cancellation via AbortSignal.
 */
export async function* streamAffirmation(options: StreamOptions): AsyncGenerator<string, void, unknown> {
  const token = await secureStorage.getItem(storageKeys.accessToken);
  const url = `${API_BASE_URL}${endpoints.ai.generate}`;

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
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Stream failed with status ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("ReadableStream not supported in this environment");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
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
            // Backend sends the final full content as well
            yield data.content;
            return;
          }
        } catch (e) {
          console.warn("Failed to parse SSE data chunk", e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
