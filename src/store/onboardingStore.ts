"use client";

import { create } from "zustand";

export type Screen = "name" | "content" | "pain" | "loading" | "summary";

interface OnboardingState {
  name: string;
  contentTypes: string[];
  painPoints: string;
  tiktokUrl: string;

  currentScreen: Screen;

  othersExpanded: boolean;
  othersText: string;

  setName: (name: string) => void;
  addContentType: (type: string) => void;
  removeContentType: (type: string) => void;
  setContentTypes: (types: string[]) => void;
  setPainPoints: (points: string) => void;
  setTiktokUrl: (url: string) => void;

  advance: () => void;
  retreat: () => void;
  setScreen: (screen: Screen) => void;

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

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  name: "",
  contentTypes: [],
  painPoints: "",
  tiktokUrl: "",
  currentScreen: "name",
  othersExpanded: false,
  othersText: "",

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

  setOthersExpanded: (expanded) => set({ othersExpanded: expanded }),
  setOthersText: (text) => set({ othersText: text }),
}));
