import { useCallback, useEffect, useRef, useState } from "react";
import {
  pickMockAffirmation,
  REVEAL_TIMING,
} from "@/features/affirmation/constants/reveal";
import { mockStreamAffirmation } from "@/features/affirmation/services/mockStream";
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
  const cancelledRef = useRef(false);
  const lastHapticRef = useRef(0);

  const setStatus = useGenerationStore((s) => s.setStatus);
  const setPartialText = useGenerationStore((s) => s.setPartialText);
  const setCategory = useGenerationStore((s) => s.setCategory);
  const partialText = useGenerationStore((s) => s.partialText);
  const reset = useGenerationStore((s) => s.reset);

  const runFlow = useCallback(async () => {
    cancelledRef.current = false;
    const fullText = pickMockAffirmation(options.category, mood);
    setCategory(options.category ?? "General");
    setPartialText("");
    setStatus("connecting");
    setPhase("anticipation");

    await sleep(REVEAL_TIMING.anticipationMs);
    if (cancelledRef.current) return;

    setPhase("thinking");
    await sleep(REVEAL_TIMING.thinkingMs);
    if (cancelledRef.current) return;

    setPhase("revealing");
    setStatus("streaming");

    for await (const chunk of mockStreamAffirmation(fullText)) {
      if (cancelledRef.current) return;
      setPartialText(chunk);

      if (chunk.length - lastHapticRef.current >= 14) {
        lastHapticRef.current = chunk.length;
        void hapticLight();
      }
    }

    if (cancelledRef.current) return;

    setStatus("complete");
    setPhase("reflection");
    void hapticSuccess();

    await sleep(REVEAL_TIMING.reflectionMs);
    if (cancelledRef.current) return;

    setPhase("actions");
    await sleep(REVEAL_TIMING.streakDelayMs);
    if (cancelledRef.current) return;

    setPhase("streak");
  }, [mood, options.category, setCategory, setPartialText, setStatus]);

  useEffect(() => {
    runFlow();
    return () => {
      cancelledRef.current = true;
    };
  }, [runFlow]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
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
