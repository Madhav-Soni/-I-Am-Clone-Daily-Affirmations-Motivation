import { View } from "react-native";
import Animated from "react-native-reanimated";
import { fadeInUp } from "@/animations/presets";
import {
  BodyText,
  CaptionText,
  DisplayText,
  FullscreenScreen,
  GlassCard,
  MoodPillGroup,
  PrimaryButton,
  SecondaryButton,
} from "@/shared/components/primitives";

type ScreenPlaceholderProps = {
  title: string;
  subtitle?: string;
  showMoodPreview?: boolean;
};

/** Route shell with live design-system preview */
export function ScreenPlaceholder({ title, subtitle, showMoodPreview = false }: ScreenPlaceholderProps) {
  return (
    <FullscreenScreen contentClassName="justify-between py-6">
      <Animated.View entering={fadeInUp} className="gap-3 pt-4">
        <DisplayText color="primary">{title}</DisplayText>
        {subtitle ? <CaptionText>{subtitle}</CaptionText> : null}
      </Animated.View>

      {showMoodPreview ? (
        <GlassCard padding="md">
          <CaptionText className="mb-3">Mood pills preview</CaptionText>
          <MoodPillGroup />
        </GlassCard>
      ) : (
        <GlassCard padding="lg">
          <BodyText color="secondary" align="center">
            Visual foundation active — cinematic gradient, glass, and motion primitives ready.
          </BodyText>
        </GlassCard>
      )}

      <View className="gap-3 pb-2">
        <PrimaryButton fullWidth>Continue</PrimaryButton>
        <SecondaryButton fullWidth>Learn more</SecondaryButton>
      </View>
    </FullscreenScreen>
  );
}
