import { create } from "zustand";

type UiState = {
  curtainDone: boolean; // true once IntroCurtain finishes
  cursorText: string; // label shown next to cursor
  setCurtainDone: () => void;
  setCursorText: (text: string) => void;
};

export const useUiStore = create<UiState>((set) => ({
  curtainDone: false,
  cursorText: "",
  setCurtainDone: () => set({ curtainDone: true }),
  setCursorText: (cursorText) => set({ cursorText }),
}));
