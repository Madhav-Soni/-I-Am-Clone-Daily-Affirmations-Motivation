import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator
} from "react-native";
import { router } from "expo-router";
import Animated from "react-native-reanimated";
import { checkInReflectionEnter } from "@/features/mood/animations/checkInEntrance";
import { AffirmationHint } from "@/features/mood/components/AffirmationHint";
import { ReflectionInput } from "@/features/mood/components/ReflectionInput";
import { CHECK_IN_BLOBS, CHECK_IN_COPY } from "@/features/mood/constants/checkIn";
import { useCheckInDraftStore } from "@/features/mood/store/checkInDraftStore";
import { routes } from "@/constants/routes";
import { FloatingContinueBar } from "@/shared/components/layout/FloatingContinueBar";
import { FullscreenScreen, GhostButton, Text } from "@/shared/components/primitives";
import { hapticSuccess } from "@/shared/lib/haptics";

export function MoodReflectionExperience() {
  const [hasMounted, setHasMounted] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const mood = useCheckInDraftStore((s) => s.mood);
  const note = useCheckInDraftStore((s) => s.note);
  const setNote = useCheckInDraftStore((s) => s.setNote);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // 1. Mount Logging & Session Validation
  useEffect(() => {
    console.log("[REFLECTION MOUNT] Screen mounted successfully.");
    console.log("[REFLECTION STATE] Loaded Mood from Draft:", mood || "None");
    console.log("[REFLECTION STATE] Loaded Note from Draft:", note ? `"${note}"` : "None");
    setHasMounted(true);

    if (!mood) {
      console.warn("[REFLECTION WARN] No mood selected in draft! Redirecting back to check-in screen.");
      router.replace(routes.app.checkIn);
    }

    return () => {
      console.log("[REFLECTION UNMOUNT] Screen unmounted.");
    };
  }, [mood]);

  // 2. Keyboard listeners
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOffset(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleComplete = () => {
    try {
      void hapticSuccess();
      setCompleting(true);
      console.log("[REFLECTION ACTION] Save check-in triggered. Target Mood:", mood, "Journal Note:", note);
      setTimeout(() => {
        setCompleting(false);
        router.push({
          pathname: routes.modals.affirmationReveal,
          params: { category: mood ?? "General" },
        });
      }, 700);
    } catch (err: any) {
      console.error("[REFLECTION ERROR] Failed during complete action:", err);
      setCompleting(false);
      setRenderError(err?.message || "Failed to complete check-in.");
    }
  };

  const handleSkip = () => {
    console.log("[REFLECTION ACTION] Skip notes check-in triggered.");
    setNote("");
    handleComplete();
  };

  // 3. Defensive check for rendering issues
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

  // 4. Explicit Loading & Gated States
  if (!hasMounted || !mood) {
    console.log("[REFLECTION RENDER] Rendered placeholder loading state.");
    return (
      <FullscreenScreen gradient="ocean" padded={false} contentClassName="justify-center items-center">
        <ActivityIndicator size="large" color="#ffffff" style={{ opacity: 0.6 }} />
        <Text variant="caption" color="muted" style={{ marginTop: 12 }}>
          Loading sanctuary reflection...
        </Text>
      </FullscreenScreen>
    );
  }

  console.log("[REFLECTION RENDER] Rendered full reflection experience tree.");

  return (
    <FullscreenScreen
      gradient="ocean"
      blobConfigs={CHECK_IN_BLOBS}
      padded={false}
      contentClassName="flex-1"
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Header block */}
          <Animated.View 
            entering={checkInReflectionEnter} 
            style={[styles.promptBlock, { opacity: 1 }]} // Explicit opacity fallback override
          >
            <Text variant="headline" color="primary" style={styles.prompt}>
              {CHECK_IN_COPY.reflectionPrompt}
            </Text>
            <Text variant="body" color="muted" align="center">
              {CHECK_IN_COPY.reflectionSub}
            </Text>
          </Animated.View>

          {/* Interactive Journal Input */}
          <ReflectionInput value={note} onChangeText={setNote} />

          {/* Affirmation Hint card */}
          <View style={styles.hintBlock}>
            <AffirmationHint mood={mood} />
          </View>

          {/* Skip buttons */}
          <View style={styles.skipWrap}>
            <GhostButton onPress={handleSkip} disabled={completing}>{CHECK_IN_COPY.skipNote}</GhostButton>
          </View>

          <View style={[styles.bottomSpacer, { height: 140 + keyboardOffset * 0.2 }]} />
        </ScrollView>

        {/* Dynamic continue bar */}
        <FloatingContinueBar
          label={CHECK_IN_COPY.complete}
          onPress={handleComplete}
          visible
          loading={completing}
          disabled={completing}
          bottomInset={keyboardOffset > 0 ? keyboardOffset - 24 : 0}
        />
      </KeyboardAvoidingView>
    </FullscreenScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  promptBlock: {
    alignItems: "center",
    gap: 10,
    paddingBottom: 28,
  },
  prompt: {
    textAlign: "center",
    lineHeight: 34,
  },
  hintBlock: {
    marginTop: 24,
  },
  skipWrap: {
    alignItems: "center",
    marginTop: 20,
  },
  bottomSpacer: {
    height: 140,
  },
});
