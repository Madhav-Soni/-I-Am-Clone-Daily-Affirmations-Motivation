import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useNavigation } from "expo-router";
import { REVEAL_TIMING } from "@/features/affirmation/constants/reveal";
import { affirmationsApi } from "@/services/api/modules/affirmations";
import { getFallbackAffirmation } from "@/features/affirmation/constants/fallbacks";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { useGenerationStore, GenerationStatus } from "@/store";
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
  | "streak"
  | "cooldown";

type UseRevealFlowOptions = {
  category?: string | null;
};

export function useRevealFlow(options: UseRevealFlowOptions = {}) {
  const [phase, setPhase] = useState<RevealPhase>("anticipation");
  const mood = useCheckInDraftStore((s) => s.mood);
  const note = useCheckInDraftStore((s) => s.note);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastHapticRef = useRef(0);
  const runIdRef = useRef(0);
  const isMountedRef = useRef(true);

  const setStatus = useGenerationStore((s) => s.setStatus);
  const setPartialText = useGenerationStore((s) => s.setPartialText);
  const setCategory = useGenerationStore((s) => s.setCategory);
  const partialText = useGenerationStore((s) => s.partialText);
  const reset = useGenerationStore((s) => s.reset);

  const { data: affirmationsData } = useAffirmations();
  const { data: userStats, refetch: refetchStats } = useUserStats();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const cancel = useCallback(() => {
    runIdRef.current++;
    abortControllerRef.current?.abort();
    if (isMountedRef.current) {
      setStatus("cancelled");
      reset();
    }
  }, [reset, setStatus]);

  const runFlow = useCallback(async () => {
    const runId = ++runIdRef.current;
    
    // Abort any existing request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const signal = abortControllerRef.current.signal;

    const isCurrent = () => isMountedRef.current && runId === runIdRef.current && !signal.aborted;

    const safeSetPhase = (p: RevealPhase) => {
      if (isCurrent()) setPhase(p);
    };
    const safeSetStatus = (s: GenerationStatus) => {
      if (isCurrent()) setStatus(s);
    };
    const safeSetPartialText = (t: string) => {
      if (isCurrent()) setPartialText(t);
    };

    safeSetStatus("connecting");
    if (isCurrent()) {
      setCategory(options.category ?? "General");
      setPartialText("");
    }
    safeSetPhase("anticipation");

    try {
      await sleep(REVEAL_TIMING.anticipationMs, signal);
      if (!isCurrent()) return;

      safeSetPhase("thinking");
      await sleep(REVEAL_TIMING.thinkingMs, signal);
      if (!isCurrent()) return;

      safeSetPhase("revealing");
      safeSetStatus("streaming");

      // Normalize mood: ensure it is always a string and fallback to "Calm"
      const normalizedMood = typeof mood === "string"
        ? mood
        : (mood as any)?.label || "Calm";

      // Synthesize emotional context using normalizedMood string
      const history = affirmationsData?.affirmations || [];
      const context = contextComposer.compose(
        normalizedMood,
        note || "",
        1, // Default streak for now
        [], // Mood history
        history
      );

      let fullText = "";
      try {
        if (!isCurrent()) return;
        const response = await affirmationsApi.generateAffirmation(
          {
            category: options.category ?? "General",
            mood: normalizedMood,
            note: note || "",
          },
          { signal }
        );

        if (response?.data?.affirmation?.content) {
          fullText = response.data.affirmation.content;
        } else {
          throw new Error("Invalid response schema");
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("[useRevealFlow API generation failed]", err);

        // Check if this error is specifically due to a 429 rate/daily limit
        const isDailyLimit = err?.response?.status === 429 || err?.status === 429 || (err?.message && err.message.includes("429"));
        if (isDailyLimit) {
          safeSetStatus("complete");
          safeSetPhase("cooldown");
          return;
        }

        fullText = getFallbackAffirmation(options.category, mood);
      }

      if (!isCurrent()) return;

      // Run the local organic typewriter animation
      let partial = "";
      lastHapticRef.current = 0;

      for (let i = 0; i < fullText.length; i++) {
        if (!isCurrent()) return;

        const char = fullText[i];
        partial += char;
        safeSetPartialText(partial);

        // Haptic feedback pulse
        if (partial.length - lastHapticRef.current >= 14) {
          lastHapticRef.current = partial.length;
          if (isCurrent()) {
            void hapticLight();
          }
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

      if (!isCurrent()) return;

      safeSetStatus("complete");
      safeSetPhase("reflection");
      if (isCurrent()) {
        void hapticSuccess();
      }

      // Refetch user stats to get the updated streak and lifetime count
      if (isCurrent()) {
        await queryClient.invalidateQueries({ queryKey: ["user", "stats"] });
        await refetchStats();
      }

      await sleep(REVEAL_TIMING.reflectionMs, signal);
      if (!isCurrent()) return;

      safeSetPhase("actions");
      await sleep(REVEAL_TIMING.streakDelayMs, signal);
      if (!isCurrent()) return;

      safeSetPhase("streak");
    } catch (error: any) {
      if (error.name === "AbortError") return;
      if (!isCurrent()) return;
      console.error("[useRevealFlow] Unhandled fatal error:", error);
      
      safeSetStatus("complete");
      safeSetPhase("reflection");
      if (isCurrent()) {
        void hapticSuccess();
      }
      
      try {
        await sleep(REVEAL_TIMING.reflectionMs, signal);
        if (!isCurrent()) return;
        safeSetPhase("actions");
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

  // Listen for navigation blur event (user navigates away)
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener("blur", () => {
      cancel();
    });
    return unsubscribeBlur;
  }, [navigation, cancel]);

  // Listen for app going into the background state
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        cancel();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [cancel]);

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
      const error = new Error("Aborted");
      error.name = "AbortError";
      return reject(error);
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      const error = new Error("Aborted");
      error.name = "AbortError";
      reject(error);
    }

    signal?.addEventListener("abort", onAbort);
  });
}
