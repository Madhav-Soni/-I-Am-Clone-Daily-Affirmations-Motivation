import { create } from "zustand";
import type { MoodKey } from "@/theme/moods";

type CheckInDraftState = {
  mood: MoodKey | null;
  note: string;
  setMood: (mood: MoodKey) => void;
  setNote: (note: string) => void;
  reset: () => void;
};

export const useCheckInDraftStore = create<CheckInDraftState>((set) => ({
  mood: null,
  note: "",
  setMood: (mood) => set({ mood }),
  setNote: (note) => set({ note }),
  reset: () => set({ mood: null, note: "" }),
}));
