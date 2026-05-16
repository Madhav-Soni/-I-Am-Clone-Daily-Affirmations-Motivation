import { useLocalSearchParams } from "expo-router";
import { StreakCelebrationExperience } from "@/features/streak/components/StreakCelebrationExperience";

export default function StreakCelebrationModal() {
  const { days } = useLocalSearchParams<{ days?: string }>();
  const streakDays = days ? parseInt(days, 10) : undefined;

  return <StreakCelebrationExperience streakDays={Number.isNaN(streakDays) ? undefined : streakDays} />;
}
