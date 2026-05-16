import { useState } from "react";
import { View } from "react-native";
import * as Sharing from "expo-sharing";
import * as MediaLibrary from "expo-media-library";
import { captureRef } from "react-native-view-shot";
import { hapticSuccess, hapticLight } from "@/shared/lib/haptics";

export type ExportStatus = "idle" | "capturing" | "sharing" | "saving" | "success" | "error";

export function useAffirmationExport() {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const capture = async (ref: React.RefObject<View>) => {
    if (!ref.current) return null;
    try {
      setStatus("capturing");
      const uri = await captureRef(ref, {
        format: "png",
        quality: 1,
      });
      return uri;
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
      return null;
    }
  };

  const share = async (ref: React.RefObject<View>) => {
    const uri = await capture(ref);
    if (!uri) return;

    try {
      setStatus("sharing");
      void hapticLight();

      const available = await Sharing.isAvailableAsync();
      if (!available) throw new Error("Sharing is not available on this device");

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Share Affirmation",
        UTI: "public.png",
      });

      setStatus("success");
      void hapticSuccess();
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  const saveToLibrary = async (ref: React.RefObject<View>) => {
    const uri = await capture(ref);
    if (!uri) return;

    try {
      setStatus("saving");
      void hapticLight();

      const { status: permissionStatus } = await MediaLibrary.requestPermissionsAsync();
      if (permissionStatus !== "granted") {
        throw new Error("Permission to access gallery was denied");
      }

      await MediaLibrary.saveToLibraryAsync(uri);
      
      setStatus("success");
      void hapticSuccess();
    } catch (err: any) {
      setError(err.message);
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setError(null);
  };

  return {
    status,
    error,
    share,
    saveToLibrary,
    reset,
  };
}
