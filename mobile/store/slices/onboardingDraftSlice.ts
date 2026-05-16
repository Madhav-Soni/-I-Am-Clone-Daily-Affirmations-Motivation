import { create } from "zustand";

export type OnboardingDraft = {
  topics: string[];
  affirmationVoice: string | null;
  dailyFrequency: number | null;
};

type OnboardingDraftState = {
  draft: OnboardingDraft;
  setDraft: (partial: Partial<OnboardingDraft>) => void;
  reset: () => void;
};

const emptyDraft: OnboardingDraft = {
  topics: [],
  affirmationVoice: null,
  dailyFrequency: null,
};

export const useOnboardingDraftStore = create<OnboardingDraftState>((set) => ({
  draft: emptyDraft,
  setDraft: (partial) =>
    set((state) => ({
      draft: { ...state.draft, ...partial },
    })),
  reset: () => set({ draft: emptyDraft }),
}));
