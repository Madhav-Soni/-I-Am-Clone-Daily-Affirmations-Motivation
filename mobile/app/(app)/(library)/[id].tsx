import { useLocalSearchParams } from "expo-router";
import { ScreenPlaceholder } from "@/shared/components/layout/ScreenPlaceholder";

export default function AffirmationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Affirmation"
      subtitle={id ? `Detail shell — id: ${id}` : "Detail shell"}
    />
  );
}
