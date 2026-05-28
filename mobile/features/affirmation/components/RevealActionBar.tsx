import { useState } from "react";
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
  onSave: () => Promise<void> | void;
  onShare: () => void;
  onDone: () => void;
  onRegenerate: () => void;
  saved?: boolean;
};

export function RevealActionBar({
  onSave,
  onShare,
  onDone,
  onRegenerate,
  saved = false,
}: RevealActionBarProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    void hapticSuccess();
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
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
          <PrimaryButton fullWidth onPress={handleSave} disabled={saved} loading={saving}>
            {saved ? "Saved" : REVEAL_COPY.save}
          </PrimaryButton>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <SecondaryButton fullWidth onPress={onRegenerate}>
            🔄 Regenerate
          </SecondaryButton>
        </View>
        <View style={styles.half}>
          <GhostButton fullWidth onPress={onDone}>
            {REVEAL_COPY.done}
          </GhostButton>
        </View>
      </View>
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
