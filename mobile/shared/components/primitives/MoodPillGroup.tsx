import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { MoodPill } from "@/shared/components/primitives/MoodPill";
import { hapticSelection } from "@/shared/lib/haptics";
import { moodKeys, type MoodKey } from "@/theme/moods";

type MoodPillGroupProps = {
  value?: MoodKey | null;
  defaultValue?: MoodKey;
  onValueChange?: (mood: MoodKey) => void;
};

export function MoodPillGroup({
  value,
  defaultValue,
  onValueChange,
}: MoodPillGroupProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<MoodKey | undefined>(defaultValue);
  const selected = isControlled ? value : internalValue;

  const handleSelect = useCallback(
    (mood: MoodKey) => {
      if (!isControlled) {
        setInternalValue(mood);
      }
      void hapticSelection();
      onValueChange?.(mood);
    },
    [isControlled, onValueChange]
  );

  return (
    <View style={styles.grid}>
      {moodKeys.map((mood, index) => (
        <View key={mood} style={styles.cell}>
          <MoodPill
            mood={mood}
            index={index}
            selected={selected === mood}
            onPress={() => handleSelect(mood)}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  cell: {
    flexGrow: 0,
  },
});
