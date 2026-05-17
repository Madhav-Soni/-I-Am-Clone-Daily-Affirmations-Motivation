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
  FadeInDown,
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Responsive dimensions that dynamically scale down for smaller Android viewports to ensure controls fit
const MAX_CARD_WIDTH = SCREEN_WIDTH * 0.72;
const MAX_CARD_HEIGHT = SCREEN_HEIGHT * 0.42;

// Maintain exactly 16:9 aspect ratio
let CARD_WIDTH = MAX_CARD_WIDTH;
let CARD_HEIGHT = CARD_WIDTH * 1.7777;

if (CARD_HEIGHT > MAX_CARD_HEIGHT) {
  CARD_HEIGHT = MAX_CARD_HEIGHT;
  CARD_WIDTH = CARD_HEIGHT / 1.7777;
}

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
      <AmbientBlobBackground blobs={REVEAL_BLOBS} />
      
      <Animated.View entering={FadeIn.duration(600)} className="flex-1">
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* Top Spacing tuned to sit beautifully below the SafeAreaView status bar in a compact height */}
          <View className="px-8 pt-8 mb-6">
            <Text variant="display" align="center" className="text-2xl mb-2 font-serif">
              Share your light
            </Text>
            <Text variant="body" color="muted" align="center" className="px-6 text-sm">
              Export this affirmation as a cinematic memory to inspire others.
            </Text>
          </View>

          <View style={styles.previewContainer}>
            <Animated.View 
              entering={FadeInDown.delay(200).duration(800).springify().damping(15)}
              style={[styles.cardWrapper, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
            >
              <ShareableAffirmationCard
                ref={cardRef}
                theme={selectedTheme}
                content={params.content ? String(params.content) : ""}
                mood={params.mood ? String(params.mood) : undefined}
                category={params.category ? String(params.category) : undefined}
                note={params.note ? String(params.note) : undefined}
                timestamp={params.timestamp ? String(params.timestamp) : undefined}
                width={CARD_WIDTH}
                height={CARD_HEIGHT}
              />
              
              {/* Shimmer Effect Overlay */}
              <Animated.View 
                style={[StyleSheet.absoluteFill, styles.shimmer, shimmerStyle]} 
              />
            </Animated.View>
          </View>

          <View className="mt-6 px-8 mb-8">
            <Text variant="caption" color="muted" className="uppercase tracking-[3px] mb-4 text-center text-xs">
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

        {/* Bottom actions container */}
        <Animated.View 
          entering={FadeInDown.delay(600).duration(600)}
          className="p-6 pb-8 bg-black/40 backdrop-blur-3xl border-t border-white/5"
        >
          <View className="flex-row gap-4 mb-3">
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
    paddingBottom: 24,
  },
  previewContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  cardWrapper: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 25,
    elevation: 15,
    backgroundColor: "#000",
  },
  shimmer: {
    backgroundColor: "#fff",
    zIndex: 10,
  },
  themePicker: {
    paddingHorizontal: 4,
    gap: 12,
  },
  themeOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  themeOptionActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.2)",
  },
});
