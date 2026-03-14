import { create } from 'zustand';

interface AccessibilityStore {
  reducedMotion: boolean;

  setReducedMotion: (reduced: boolean) => void;
}

export const useAccessibilityStore = create<AccessibilityStore>((set) => ({
  reducedMotion: false,

  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
