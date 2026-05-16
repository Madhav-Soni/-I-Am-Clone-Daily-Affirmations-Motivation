import { ScrollView, StyleSheet, View } from "react-native";
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
import {
  FullscreenScreen,
  MoodPillGroup,
  Text,
} from "@/shared/components/primitives";
import { hapticMedium } from "@/shared/lib/haptics";

export function MoodCheckInExperience() {
  const mood = useCheckInDraftStore((s) => s.mood);
  const setMood = useCheckInDraftStore((s) => s.setMood);
  const promptFloat = useFloat({ amplitude: 6, durationMs: 6000 });

  const handleContinue = () => {
    if (!mood) return;
    void hapticMedium();
    router.push(routes.app.checkInNote);
  };

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
        <Animated.View entering={checkInPromptEnter} style={styles.promptBlock}>
          <Animated.View style={promptFloat}>
            <Text variant="display" color="primary" style={styles.prompt}>
              {CHECK_IN_COPY.prompt}
            </Text>
          </Animated.View>
          <Text variant="body" color="muted" align="center" style={styles.promptSub}>
            {CHECK_IN_COPY.promptSub}
          </Text>
        </Animated.View>

        <Animated.View entering={checkInMoodEnter} style={styles.moodBlock}>
          <MoodPillGroup value={mood} onValueChange={setMood} />
        </Animated.View>

        <View style={styles.hintBlock}>
          <AffirmationHint mood={mood} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FloatingContinueBar
        label={CHECK_IN_COPY.continue}
        onPress={handleContinue}
        visible={!!mood}
        disabled={!mood}
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
