import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { FullscreenScreen } from "@/shared/components/primitives/FullscreenScreen";
import { Text } from "@/shared/components/primitives/Text";
import { Button } from "@/shared/components/primitives/Button";
import { ShareableAffirmationCard } from "@/shared/components/visual/ShareableAffirmationCard";
import { AmbientBlobBackground } from "@/shared/components/visual/AmbientBlobBackground";
import { hapticLight, hapticSuccess } from "@/shared/lib/haptics";
import { useAffirmationExport } from "@/features/affirmation/hooks/useAffirmationExport";
import { SHARE_THEMES, type ShareTheme } from "@/features/affirmation/types/sharing";
import { REVEAL_BLOBS } from "@/features/affirmation/constants/reveal";
import Animated, { 
  FadeIn, 
  SlideInBottom, 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ShareAffirmationModal() {
  const params = useLocalSearchParams<{
    content: string;
    mood?: string;
    category?: string;
    note?: string;
    timestamp?: string;
  }>();

  const cardRef = useRef<View>(null);
  const [selectedTheme, setSelectedTheme] = useState<ShareTheme>("void");
  const { status, share, saveToLibrary } = useAffirmationExport();
  
  const shimmerOpacity = useSharedValue(0);

  const runShimmer = useCallback(() => {
    shimmerOpacity.value = withSequence(
      withTiming(0.4, { duration: 200 }),
      withTiming(0, { duration: 400 })
    );
  }, [shimmerOpacity]);

  const handleShare = async () => {
    runShimmer();
    await share(cardRef);
  };

  const handleSave = async () => {
    runShimmer();
    await saveToLibrary(cardRef);
  };

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  const isProcessing = status === "capturing" || status === "sharing" || status === "saving";

  return (
    <FullscreenScreen gradient="void" padded={false}>
      <AmbientBlobBackground blobConfigs={REVEAL_BLOBS} />
      
      <Animated.View entering={FadeIn.duration(600)} className="flex-1">
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View className="px-8 pt-16 mb-10">
            <Text variant="display" align="center" className="text-3xl mb-3 font-serif">
              Share your light
            </Text>
            <Text variant="body" color="muted" align="center" className="px-6">
              Export this affirmation as a cinematic memory to inspire others.
            </Text>
          </View>

          <View style={styles.previewContainer}>
            <Animated.View 
              entering={SlideInBottom.delay(200).duration(800).springify().damping(15)}
              style={styles.cardWrapper}
            >
              <ShareableAffirmationCard
                ref={cardRef}
                theme={selectedTheme}
                content={params.content ? String(params.content) : ""}
                mood={params.mood ? String(params.mood) : undefined}
                category={params.category ? String(params.category) : undefined}
                note={params.note ? String(params.note) : undefined}
                timestamp={params.timestamp ? String(params.timestamp) : undefined}
              />
              
              {/* Shimmer Effect Overlay */}
              <Animated.View 
                style={[StyleSheet.absoluteFill, styles.shimmer, shimmerStyle]} 
              />
            </Animated.View>
          </View>

          <View className="mt-12 px-8">
            <Text variant="caption" color="muted" className="uppercase tracking-[3px] mb-6 text-center">
              Choose your theme
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.themePicker}
            >
              {SHARE_THEMES.map((theme, index) => (
                <ThemeOption
                  key={theme.id}
                  theme={theme}
                  isSelected={selectedTheme === theme.id}
                  onSelect={() => {
                    void hapticLight();
                    setSelectedTheme(theme.id);
                  }}
                  index={index}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>

        <Animated.View 
          entering={SlideInBottom.delay(600).duration(600)}
          className="p-8 pb-12 bg-black/40 backdrop-blur-3xl border-t border-white/5"
        >
          <View className="flex-row gap-4 mb-4">
            <View className="flex-1">
              <Button
                onPress={handleSave}
                variant="secondary"
                size="lg"
                disabled={isProcessing}
              >
                {status === "saving" ? "Saving..." : "Save Image"}
              </Button>
            </View>
            <View className="flex-1">
              <Button
                onPress={handleShare}
                variant="primary"
                size="lg"
                disabled={isProcessing}
              >
                {status === "sharing" ? "Sharing..." : "Share"}
              </Button>
            </View>
          </View>
          <Button
            onPress={() => router.back()}
            variant="ghost"
            disabled={isProcessing}
            fullWidth
          >
            Dismiss
          </Button>
        </Animated.View>
      </Animated.View>
    </FullscreenScreen>
  );
}

function ThemeOption({ 
  theme, 
  isSelected, 
  onSelect,
  index
}: { 
  theme: { id: ShareTheme; name: string }; 
  isSelected: boolean; 
  onSelect: () => void;
  index: number;
}) {
  return (
    <Animated.View 
      entering={FadeIn.delay(400 + index * 100).duration(500)}
    >
      <Pressable
        onPress={onSelect}
        style={[
          styles.themeOption,
          isSelected && styles.themeOptionActive
        ]}
      >
        <Text 
          className={`text-xs font-medium tracking-wider ${isSelected ? "text-white" : "text-white/40"}`}
        >
          {theme.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 160,
  },
  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardWrapper: {
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.6,
    shadowRadius: 50,
    elevation: 20,
    transform: [{ scale: 0.8 }],
    backgroundColor: "#000",
  },
  shimmer: {
    backgroundColor: "#fff",
    zIndex: 10,
  },
  themePicker: {
    paddingHorizontal: 0,
    gap: 12,
    justifyContent: "center",
    width: "100%",
  },
  themeOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  themeOptionActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.2)",
  },
});
