import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { useFloat } from "@/animations/hooks";
import {
  checkInMoodEnter,
  checkInPromptEnter,
} from "@/features/mood/animations/checkInEntrance";
import { AffirmationHint } from "@/features/mood/components/AffirmationHint";
import { CHECK_IN_BLOBS, CHECK_IN_COPY } from "@/features/mood/constants/checkIn";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { routes } from "@/constants/routes";
import { FloatingContinueBar } from "@/shared/components/layout/FloatingContinueBar";
import { useAuthStore } from "@/store";
import {
  FullscreenScreen,
  MoodPillGroup,
  Text,
} from "@/shared/components/primitives";
import { hapticMedium } from "@/shared/lib/haptics";

export function MoodCheckInExperience() {
  const [hasMounted, setHasMounted] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  // State Hydration checks
  const user = useAuthStore((s) => s.user);
  const mood = useCheckInDraftStore((s) => s.mood);
  const setMood = useCheckInDraftStore((s) => s.setMood);
  const promptFloat = useFloat({ amplitude: 6, durationMs: 6000 });

  // 1. Mount Logging & Session Validation
  useEffect(() => {
    console.log("[CHECK-IN MOUNT] Screen mounted successfully.");
    console.log("[CHECK-IN STATE] Current User:", user ? `${user.name} (${user.email})` : "None");
    console.log("[CHECK-IN STATE] Current Mood Draft:", mood || "None");
    setHasMounted(true);

    return () => {
      console.log("[CHECK-IN UNMOUNT] Screen unmounted.");
    };
  }, [user, mood]);

  const handleContinue = () => {
    try {
      if (!mood) {
        console.warn("[CHECK-IN WARN] Attempted to continue without selecting mood.");
        return;
      }
      void hapticMedium();
      setContinuing(true);
      console.log("[CHECK-IN ACTION] Continuing to notes with mood:", mood);
      setTimeout(() => {
        setContinuing(false);
        router.push(routes.app.checkInNote);
      }, 600);
    } catch (err: any) {
      console.error("[CHECK-IN ERROR] Failed during continue action:", err);
      setContinuing(false);
      setRenderError(err?.message || "Failed to continue check-in.");
    }
  };

  // 2. Defensive check for rendering issues
  if (renderError) {
    return (
      <FullscreenScreen gradient="ocean" padded={true} contentClassName="justify-center items-center">
        <Text variant="headline" color="primary" align="center" style={{ marginBottom: 12, color: "#ef4444" }}>
          Something went wrong
        </Text>
        <Text variant="body" color="muted" align="center" style={{ marginBottom: 24 }}>
          {renderError}
        </Text>
        <FloatingContinueBar
          label="Reset & Go Home"
          onPress={() => {
            setRenderError(null);
            router.replace(routes.app.home);
          }}
          visible
        />
      </FullscreenScreen>
    );
  }

  // 3. Explicit Loading State (until mounted to prevent hydration mismatches)
  if (!hasMounted) {
    console.log("[CHECK-IN RENDER] Rendered placeholder loading state.");
    return (
      <FullscreenScreen gradient="ocean" padded={false} contentClassName="justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" style={{ opacity: 0.6 }} />
        <Text variant="caption" color="muted" style={{ marginTop: 12 }}>
          Loading sanctuary...
        </Text>
      </FullscreenScreen>
    );
  }

  console.log("[CHECK-IN RENDER] Rendered full check-in experience tree.");

  return (
    <FullscreenScreen
      gradient="ocean"
      blobConfigs={CHECK_IN_BLOBS}
      padded={false}
      contentClassName="flex-1"
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Main Prompt header Block */}
        <Animated.View 
          entering={checkInPromptEnter} 
          style={[styles.promptBlock, { opacity: 1 }]} // Explicit opacity fallback override
        >
          <Animated.View style={promptFloat}>
            <Text variant="display" color="primary" style={styles.prompt}>
              {CHECK_IN_COPY.prompt}
            </Text>
          </Animated.View>
          <Text variant="body" color="muted" align="center" style={styles.promptSub}>
            {CHECK_IN_COPY.promptSub}
          </Text>
        </Animated.View>

        {/* Interactive Mood Pills Group */}
        <Animated.View 
          entering={checkInMoodEnter} 
          style={[styles.moodBlock, { opacity: 1 }]} // Explicit opacity fallback override
        >
          <MoodPillGroup value={mood} onValueChange={setMood} />
        </Animated.View>

        {/* Dynamic Contextual Hint */}
        <View style={styles.hintBlock}>
          <AffirmationHint mood={mood} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Call to Action */}
      <FloatingContinueBar
        label={CHECK_IN_COPY.continue}
        onPress={handleContinue}
        visible={!!mood}
        disabled={!mood || continuing}
        loading={continuing}
      />
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  promptBlock: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 32,
    gap: 12,
  },
  prompt: {
    textAlign: "center",
    lineHeight: 42,
  },
  promptSub: {
    maxWidth: 280,
    lineHeight: 24,
  },
  moodBlock: {
    paddingBottom: 24,
  },
  hintBlock: {
    minHeight: 100,
  },
  bottomSpacer: {
    height: 120,
  },
});
