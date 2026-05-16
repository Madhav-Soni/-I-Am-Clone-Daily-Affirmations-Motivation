import { useCallback, useState } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  type TextInputContentSizeChangeEventData,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { checkInInputEnter } from "@/features/mood/animations/checkInEntrance";
import { CHECK_IN_COPY } from "@/features/mood/constants/checkIn";
import { GlassCard } from "@/shared/components/primitives/GlassCard";
import { CaptionText } from "@/shared/components/primitives/Text";
import { colors } from "@/theme/tokens";
import { fontFamily } from "@/theme/typography";

const MIN_HEIGHT = 108;
const MAX_HEIGHT = 200;
const MAX_LENGTH = 500;

type ReflectionInputProps = {
  value: string;
  onChangeText: (text: string) => void;
};

export function ReflectionInput({ value, onChangeText }: ReflectionInputProps) {
  const [height, setHeight] = useState(MIN_HEIGHT);

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const next = Math.min(
        MAX_HEIGHT,
        Math.max(MIN_HEIGHT, e.nativeEvent.contentSize.height + 24)
      );
      setHeight(next);
    },
    []
  );

  return (
    <Animated.View entering={checkInInputEnter}>
      <GlassCard animated={false} padding="md" intensity={44}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={CHECK_IN_COPY.notePlaceholder}
          placeholderTextColor={colors.text.faint}
          multiline
          textAlignVertical="top"
          maxLength={MAX_LENGTH}
          onContentSizeChange={onContentSizeChange}
          style={[styles.input, { height }]}
          selectionColor={colors.luxury.accentSoft}
        />
        <View style={styles.footer}>
          <CaptionText color="faint">{value.length}/{MAX_LENGTH}</CaptionText>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text.primary,
    paddingTop: 4,
    paddingBottom: 4,
  },
  footer: {
    marginTop: 8,
    alignItems: "flex-end",
  },
});
