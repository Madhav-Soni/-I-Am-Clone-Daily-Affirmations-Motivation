import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn } from "react-native-reanimated";
import { usePressAnimation } from "@/animations/hooks";
import { hapticLight } from "@/shared/lib/haptics";
import { colors } from "@/theme/tokens";

type RevealCloseButtonProps = {
  onPress: () => void;
};

export function RevealCloseButton({ onPress }: RevealCloseButtonProps) {
  const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

  const handlePress = () => {
    void hapticLight();
    onPress();
  };

  return (
    <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.wrap}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={handlePress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={12}
        >
          <Ionicons name="close" size={22} color={colors.text.secondary} />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "flex-end",
    zIndex: 10,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: colors.surface.glassBorder,
  },
});
