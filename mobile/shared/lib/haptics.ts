import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const isSupported = Platform.OS === "ios" || Platform.OS === "android";

export async function hapticLight() {
  if (!isSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function hapticMedium() {
  if (!isSupported) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export async function hapticSelection() {
  if (!isSupported) return;
  await Haptics.selectionAsync();
}

export async function hapticSuccess() {
  if (!isSupported) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
