"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getInitialOnboardingData } from "@/utils/onboarding";

export type Screen = "name" | "content" | "pain" | "loading" | "summary";

interface OnboardingState {
  // Form data
  name: string;
  contentTypes: string[];
  painPoints: string;
  tiktokUrl: string;

  // Navigation
  currentScreen: Screen;
  isComplete: boolean;

  // UI state
  othersExpanded: boolean;
  othersText: string;

  // Actions - form data
  setName: (name: string) => void;
  addContentType: (type: string) => void;
  removeContentType: (type: string) => void;
  setContentTypes: (types: string[]) => void;
  setPainPoints: (points: string) => void;
  setTiktokUrl: (url: string) => void;

  // Actions - navigation
  advance: () => void;
  retreat: () => void;
  setScreen: (screen: Screen) => void;
  markComplete: () => void;

  // Actions - UI
  setOthersExpanded: (expanded: boolean) => void;
  setOthersText: (text: string) => void;
}

const SCREEN_ORDER: Screen[] = [
  "name",
  "content",
  "pain",
  "loading",
  "summary",
];

// Selector functions for derived state.
// Note: getter properties in zustand state don't survive Object.assign merges in `set`,
// so derived values must live outside the store as selectors.
export const selectCanAdvance = (state: OnboardingState): boolean => {
  switch (state.currentScreen) {
    case "name":
      return state.name.trim().length > 0;
    case "content":
      return state.contentTypes.length > 0;
    case "pain":
      return state.painPoints.trim().length > 0;
    case "loading":
      return false;
    case "summary":
      return true;
    default:
      return false;
  }
};

export const selectCanRetreat = (state: OnboardingState): boolean =>
  state.currentScreen !== "name" && state.currentScreen !== "loading";

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => {
      const initialData = getInitialOnboardingData();

      return {
        // Initial state
        name: initialData.name,
        contentTypes: initialData.dataLane,
        painPoints: initialData.challenge,
        tiktokUrl: initialData.tiktokUrl ?? "",
        currentScreen: "name",
        isComplete: false,
        othersExpanded: false,
        othersText: "",

        // Form data actions
        setName: (name) => set({ name }),
        addContentType: (type) =>
          set((state) => ({ contentTypes: [...state.contentTypes, type] })),
        removeContentType: (type) =>
          set((state) => ({
            contentTypes: state.contentTypes.filter((t) => t !== type),
          })),
        setContentTypes: (types) => set({ contentTypes: types }),
        setPainPoints: (points) => set({ painPoints: points }),
        setTiktokUrl: (url) => set({ tiktokUrl: url }),

        // Navigation actions
        advance: () => {
          const { currentScreen } = get();
          const idx = SCREEN_ORDER.indexOf(currentScreen);
          if (idx < SCREEN_ORDER.length - 1) {
            set({ currentScreen: SCREEN_ORDER[idx + 1] });
          }
        },

        retreat: () => {
          const { currentScreen } = get();
          const idx = SCREEN_ORDER.indexOf(currentScreen);
          if (idx > 0) {
            set({ currentScreen: SCREEN_ORDER[idx - 1] });
          }
        },

        setScreen: (screen) => set({ currentScreen: screen }),
        markComplete: () => set({ isComplete: true }),

        // UI actions
        setOthersExpanded: (expanded) => set({ othersExpanded: expanded }),
        setOthersText: (text) => set({ othersText: text }),
      };
    },
    {
      name: "bistro-onboarding-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        name: state.name,
        contentTypes: state.contentTypes,
        painPoints: state.painPoints,
        tiktokUrl: state.tiktokUrl,
        isComplete: state.isComplete,
      }),
    },
  ),
);
