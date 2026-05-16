import { create } from "zustand";

export type GenerationStatus =
  | "idle"
  | "connecting"
  | "streaming"
  | "complete"
  | "error"
  | "cancelled";

type GenerationState = {
  status: GenerationStatus;
  partialText: string;
  category: string | null;
  reset: () => void;
  setStatus: (status: GenerationStatus) => void;
  setPartialText: (text: string) => void;
  setCategory: (category: string | null) => void;
};

const initialState = {
  status: "idle" as GenerationStatus,
  partialText: "",
  category: null as string | null,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,
  reset: () => set(initialState),
  setStatus: (status) => set({ status }),
  setPartialText: (partialText) => set({ partialText }),
  setCategory: (category) => set({ category }),
}));
