import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { revealActionsEnter } from "@/features/affirmation/animations/revealEntrance";
import { REVEAL_COPY } from "@/features/affirmation/constants/reveal";
import {
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/shared/components/primitives/Button";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";

type RevealActionBarProps = {
  onSave: () => void;
  onShare: () => void;
  onDone: () => void;
  saved?: boolean;
};

export function RevealActionBar({ onSave, onShare, onDone, saved = false }: RevealActionBarProps) {
  const handleSave = () => {
    void hapticSuccess();
    onSave();
  };

  const handleShare = () => {
    void hapticLight();
    onShare();
  };

  return (
    <Animated.View entering={revealActionsEnter} style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.half}>
          <SecondaryButton fullWidth onPress={handleShare}>
            {REVEAL_COPY.share}
          </SecondaryButton>
        </View>
        <View style={styles.half}>
          <PrimaryButton fullWidth onPress={handleSave} disabled={saved}>
            {saved ? "Saved" : REVEAL_COPY.save}
          </PrimaryButton>
        </View>
      </View>
      <GhostButton fullWidth onPress={onDone}>
        {REVEAL_COPY.done}
      </GhostButton>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    width: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  half: {
    flex: 1,
  },
});
