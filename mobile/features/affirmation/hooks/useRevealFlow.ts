import { useCallback, useEffect, useRef, useState } from "react";
import { REVEAL_TIMING } from "@/features/affirmation/constants/reveal";
import { affirmationsApi } from "@/services/api/modules/affirmations";
import { getFallbackAffirmation } from "@/features/affirmation/constants/fallbacks";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { useGenerationStore } from "@/store";
import { contextComposer } from "@/services/ai/contextComposer";
import { useAffirmations } from "@/features/library/hooks/useAffirmations";
import { useUserStats } from "@/features/profile/hooks/useUserStats";
import { useQueryClient } from "@tanstack/react-query";

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

  const { data: affirmationsData } = useAffirmations();
  const { data: userStats, refetch: refetchStats } = useUserStats();
  const queryClient = useQueryClient();

  const runFlow = useCallback(async () => {
    // Abort any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const signal = abortControllerRef.current.signal;

    setCategory(options.category ?? "General");
    setPartialText("");
    setStatus("connecting");
    setPhase("anticipation");

    try {
      await sleep(REVEAL_TIMING.anticipationMs, signal);
      if (signal.aborted) return;

      setPhase("thinking");
      await sleep(REVEAL_TIMING.thinkingMs, signal);
      if (signal.aborted) return;

      setPhase("revealing");
      setStatus("streaming");

      // Synthesize emotional context
      const history = affirmationsData?.affirmations || [];
      const context = contextComposer.compose(
        mood || "Neutral",
        note || "",
        1, // Default streak for now
        [], // Mood history
        history
      );

      let fullText = "";
      try {
        const response = await affirmationsApi.generateAffirmation({
          category: options.category ?? "General",
          mood,
          note,
          context,
        });

        if (response?.data?.affirmation?.content) {
          fullText = response.data.affirmation.content;
        } else {
          throw new Error("Invalid response schema");
        }
      } catch (err) {
        console.error("[useRevealFlow API generation failed]", err);
        fullText = getFallbackAffirmation(options.category);
      }

      if (signal.aborted) return;

      // Run the local organic typewriter animation
      let partial = "";
      lastHapticRef.current = 0;

      for (let i = 0; i < fullText.length; i++) {
        if (signal.aborted) return;

        const char = fullText[i];
        partial += char;
        setPartialText(partial);

        // Haptic feedback pulse
        if (partial.length - lastHapticRef.current >= 14) {
          lastHapticRef.current = partial.length;
          void hapticLight();
        }

        // Punctuation pauses for rich organic feel
        let delay = 35; // base typing speed
        if (char === "." || char === "?" || char === "!") {
          delay = 250;
        } else if (char === "," || char === ";" || char === "-") {
          delay = 100;
        }

        await sleep(delay, signal);
      }

      setStatus("complete");
      setPhase("reflection");
      void hapticSuccess();

      // Refetch user stats to get the updated streak and lifetime count
      await queryClient.invalidateQueries({ queryKey: ["user", "stats"] });
      await refetchStats();

      await sleep(REVEAL_TIMING.reflectionMs, signal);
      if (signal.aborted) return;

      setPhase("actions");
      await sleep(REVEAL_TIMING.streakDelayMs, signal);
      if (signal.aborted) return;

      setPhase("streak");
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("[useRevealFlow] Unhandled fatal error:", error);
      
      setStatus("complete");
      setPhase("reflection");
      void hapticSuccess();
      
      try {
        await sleep(REVEAL_TIMING.reflectionMs, abortControllerRef.current?.signal);
        if (abortControllerRef.current?.signal.aborted) return;
        setPhase("actions");
      } catch (e: any) {
        // Silently catch inner aborts
      }
    }
  }, [mood, note, options.category, setCategory, setPartialText, setStatus, affirmationsData, queryClient, refetchStats]);

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

/**
 * High-fidelity sleep utility that supports dynamic timer aborting.
 * Clears the underlying setTimeout immediately if the AbortSignal triggers,
 * completely preventing resource leakage, hanging callbacks, or state update warnings.
 */
function sleep(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException("Aborted", "AbortError"));
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort);
  });
}
