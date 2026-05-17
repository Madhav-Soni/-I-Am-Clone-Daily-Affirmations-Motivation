import { useLocalSearchParams } from "expo-router";
import { StreakCelebrationExperience } from "@/features/streak/components/StreakCelebrationExperience";

export default function StreakCelebrationModal() {
  const { days, lifetime, compassionRecovery } = useLocalSearchParams<{ 
    days?: string; 
    lifetime?: string; 
    compassionRecovery?: string; 
  }>();
  
  const streakDays = days ? parseInt(days, 10) : undefined;
  const lifetimeRituals = lifetime ? parseInt(lifetime, 10) : undefined;
  const isRecovery = compassionRecovery === "true";

  return (
    <StreakCelebrationExperience 
      streakDays={Number.isNaN(streakDays) ? undefined : streakDays} 
      lifetimeRituals={Number.isNaN(lifetimeRituals) ? undefined : lifetimeRituals}
      compassionRecovery={isRecovery}
    />
  );
}
