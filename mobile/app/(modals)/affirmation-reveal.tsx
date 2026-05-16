import { useLocalSearchParams } from "expo-router";
import { AffirmationRevealExperience } from "@/features/affirmation/components/AffirmationRevealExperience";

export default function AffirmationRevealModal() {
  const { category } = useLocalSearchParams<{ category?: string }>();

  return <AffirmationRevealExperience category={category ?? null} />;
}
