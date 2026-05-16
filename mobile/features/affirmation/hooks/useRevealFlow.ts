import { useCallback, useEffect, useRef, useState } from "react";
import {
  REVEAL_TIMING,
} from "@/features/affirmation/constants/reveal";
import { streamAffirmation } from "@/services/sse/streamAffirmation";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { useGenerationStore } from "@/store";

export type RevealPhase =
  | "anticipation"
  | "thinking"
  | "revealing"
  | "reflection"
  | "actions"
  | "streak";

type UseRevealFlowOptions = {
  category?: string | null;
};

export function useRevealFlow(options: UseRevealFlowOptions = {}) {
  const [phase, setPhase] = useState<RevealPhase>("anticipation");
  const mood = useCheckInDraftStore((s) => s.mood);
  const note = useCheckInDraftStore((s) => s.note);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastHapticRef = useRef(0);

  const setStatus = useGenerationStore((s) => s.setStatus);
  const setPartialText = useGenerationStore((s) => s.setPartialText);
  const setCategory = useGenerationStore((s) => s.setCategory);
  const partialText = useGenerationStore((s) => s.partialText);
  const reset = useGenerationStore((s) => s.reset);

  const runFlow = useCallback(async () => {
    // Abort any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setCategory(options.category ?? "General");
    setPartialText("");
    setStatus("connecting");
    setPhase("anticipation");

    try {
      await sleep(REVEAL_TIMING.anticipationMs);
      if (abortControllerRef.current.signal.aborted) return;

      setPhase("thinking");
      await sleep(REVEAL_TIMING.thinkingMs);
      if (abortControllerRef.current.signal.aborted) return;

      setPhase("revealing");
      setStatus("streaming");

      const stream = streamAffirmation({
        category: options.category,
        mood,
        note,
        signal: abortControllerRef.current.signal,
      });

      for await (const chunk of stream) {
        setPartialText(chunk);

        if (chunk.length - lastHapticRef.current >= 14) {
          lastHapticRef.current = chunk.length;
          void hapticLight();
        }
      }

      setStatus("complete");
      setPhase("reflection");
      void hapticSuccess();

      await sleep(REVEAL_TIMING.reflectionMs);
      if (abortControllerRef.current.signal.aborted) return;

      setPhase("actions");
      await sleep(REVEAL_TIMING.streakDelayMs);
      if (abortControllerRef.current.signal.aborted) return;

      setPhase("streak");
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("Affirmation generation failed:", error);
      setStatus("error");
    }
  }, [mood, note, options.category, setCategory, setPartialText, setStatus]);

  useEffect(() => {
    runFlow();
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [runFlow]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setStatus("cancelled");
    reset();
  }, [reset, setStatus]);

  const isStreaming = phase === "revealing";
  const isComplete = phase === "reflection" || phase === "actions" || phase === "streak";

  return {
    phase,
    partialText,
    isStreaming,
    isComplete,
    cancel,
    reset,
  };
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
