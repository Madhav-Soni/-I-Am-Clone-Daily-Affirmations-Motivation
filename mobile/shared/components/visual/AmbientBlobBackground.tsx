import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { breatheOpacity, breatheScale, driftOffset } from "@/animations/presets";
import { colors } from "@/theme/tokens";

export type BlobConfig = {
  color: string;
  size: number;
  top: `${number}%` | number;
  left: `${number}%` | number;
  drift: number;
  delay?: number;
};

const DEFAULT_BLOBS: BlobConfig[] = [
  { color: colors.luxury.accent, size: 220, top: "-8%", left: "-15%", drift: 18 },
  { color: colors.luxury.teal, size: 180, top: "35%", left: "70%", drift: 14 },
  { color: colors.luxury.gold, size: 145, top: "72%", left: "10%", drift: 12 },
  { color: colors.luxury.rose, size: 130, top: "55%", left: "-10%", drift: 16 },
];

type AmbientBlobProps = {
  config: BlobConfig;
  index: number;
};

function AmbientBlob({ config, index }: AmbientBlobProps) {
  const opacity = useSharedValue(0.2);
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    const delay = (config.delay ?? index) * 400;
    const start = () => {
      opacity.value = breatheOpacity(0.12, 0.32);
      scale.value = breatheScale(0.94, 1.06);
      translateY.value = driftOffset(config.drift);
      translateX.value = driftOffset(config.drift * 0.6);
    };
    const timer = setTimeout(start, delay);
    return () => clearTimeout(timer);
  }, [config.delay, config.drift, index, opacity, scale, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const positionStyle: ViewStyle = {
    position: "absolute",
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
    top: config.top,
    left: config.left,
    backgroundColor: config.color,
    shadowColor: config.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: config.size * 0.45,
    elevation: 0,
  };

  return (
    <Animated.View
      style={[positionStyle, animatedStyle]}
      pointerEvents="none"
    />
  );
}

type AmbientBlobBackgroundProps = {
  blobs?: BlobConfig[];
};

/**
 * Floating soft-glow orbs — adds cinematic depth behind content.
 */
export function AmbientBlobBackground({ blobs = DEFAULT_BLOBS }: AmbientBlobBackgroundProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.container]} pointerEvents="none">
      {blobs.map((blob, index) => (
        <AmbientBlob key={`${blob.color}-${index}`} config={blob} index={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    zIndex: -1,
  },
});
