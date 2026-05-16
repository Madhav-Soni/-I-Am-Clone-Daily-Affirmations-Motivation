import React from "react";
import { View } from "react-native";
import { Text } from "@/shared/components/primitives/Text";
import { Button } from "@/shared/components/primitives/Button";
import { router } from "expo-router";

export function EmptyLibrary() {
  return (
    <View className="flex-1 justify-center items-center px-10 py-20">
      <View className="w-20 h-20 bg-brand-500/10 rounded-full items-center justify-center mb-6">
        {/* Placeholder for an icon */}
        <View className="w-10 h-10 border-2 border-brand-500/40 rounded-lg transform rotate-45" />
      </View>
      <Text variant="h2" align="center" className="mb-3">
        Your library is empty
      </Text>
      <Text variant="body" color="muted" align="center" className="mb-10">
        Start your first ritual to begin saving affirmations that resonate with you.
      </Text>
      <Button
        label="Start Today's Ritual"
        onPress={() => router.push("/(app)/(home)")}
        variant="primary"
        size="lg"
      />
    </View>
  );
}
