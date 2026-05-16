import { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
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
  const mood = useCheckInDraftStore((s) => s.mood);
  const note = useCheckInDraftStore((s) => s.note);
  const setNote = useCheckInDraftStore((s) => s.setNote);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!mood) {
      router.replace(routes.app.checkIn);
    }
  }, [mood]);

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
    void hapticSuccess();
    router.push({
      pathname: routes.modals.affirmationReveal,
      params: { category: mood ?? "General" },
    });
  };

  const handleSkip = () => {
    setNote("");
    handleComplete();
  };

  if (!mood) {
    return null;
  }

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
          <Animated.View entering={checkInReflectionEnter} style={styles.promptBlock}>
            <Text variant="headline" color="primary" style={styles.prompt}>
              {CHECK_IN_COPY.reflectionPrompt}
            </Text>
            <Text variant="body" color="muted" align="center">
              {CHECK_IN_COPY.reflectionSub}
            </Text>
          </Animated.View>

          <ReflectionInput value={note} onChangeText={setNote} />

          <View style={styles.hintBlock}>
            <AffirmationHint mood={mood} />
          </View>

          <View style={styles.skipWrap}>
            <GhostButton onPress={handleSkip}>{CHECK_IN_COPY.skipNote}</GhostButton>
          </View>

          <View style={[styles.bottomSpacer, { height: 140 + keyboardOffset * 0.2 }]} />
        </ScrollView>

        <FloatingContinueBar
          label={CHECK_IN_COPY.complete}
          onPress={handleComplete}
          visible
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
