import { useCallback, useEffect, useRef, useState } from "react";
import {
  REVEAL_TIMING,
} from "@/features/affirmation/constants/reveal";
import { streamAffirmation } from "@/services/sse/streamAffirmation";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { useGenerationStore } from "@/store";
import { contextComposer } from "@/services/ai/contextComposer";
import { useAffirmations } from "@/features/library/hooks/useAffirmations";
import { useAuthStore } from "@/store/slices/authSlice";
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

      // Synthesize emotional context
      const history = affirmationsData?.affirmations || [];
      const context = contextComposer.compose(
        mood || "Neutral",
        note || "",
        1, // Default streak for now
        [], // Mood history would come from a similar hook if available
        history
      );

      const stream = streamAffirmation({
        category: options.category,
        mood,
        note,
        context,
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

      // Refetch user stats to get the updated streak and lifetime count
      await queryClient.invalidateQueries({ queryKey: ["user", "stats"] });
      await refetchStats();

      await sleep(REVEAL_TIMING.reflectionMs);
      if (abortControllerRef.current.signal.aborted) return;

      setPhase("actions");
      await sleep(REVEAL_TIMING.streakDelayMs);
      if (abortControllerRef.current.signal.aborted) return;

      setPhase("streak");
    } catch (error: any) {
      if (error.name === "AbortError") return;
      console.error("[useRevealFlow] Unhandled fatal error:", error);
      
      // Never show error UI. If we somehow crashed entirely, 
      // just pretend it finished so the user can read whatever partial text exists
      // or see the fallback if it was instantly loaded.
      setStatus("complete");
      setPhase("reflection");
      void hapticSuccess();
      
      await sleep(REVEAL_TIMING.reflectionMs);
      if (abortControllerRef.current?.signal.aborted) return;
      setPhase("actions");
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

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
