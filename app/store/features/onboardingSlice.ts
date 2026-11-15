import type { StateCreator } from "zustand";
import type { IStore } from "../store";

export interface IOnboardingDraft {
  userName: string;
  profilePictureId?: string;
  profilePictureUrl?: string;
}

/** Step 1 answers held until step 2 submits. Not persisted. */
export interface IOnboardingSlice {
  onboarding: IOnboardingDraft;
  setOnboarding: (draft: Partial<IOnboardingDraft>) => void;
  resetOnboarding: () => void;
}

const emptyDraft: IOnboardingDraft = { userName: "" };

export const createOnboardingSlice: StateCreator<IStore, [], [], IOnboardingSlice> = (set) => ({
  onboarding: emptyDraft,
  setOnboarding: (draft) => set((state) => ({ onboarding: { ...state.onboarding, ...draft } })),
  resetOnboarding: () => set({ onboarding: emptyDraft }),
});
