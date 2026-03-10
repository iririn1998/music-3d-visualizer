import { create } from 'zustand';

interface AccessibilityStore {
  shakeEnabled: boolean;
  shakeIntensity: number;
  reducedMotion: boolean;

  setShakeEnabled: (enabled: boolean) => void;
  setShakeIntensity: (intensity: number) => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useAccessibilityStore = create<AccessibilityStore>((set) => ({
  shakeEnabled: true,
  shakeIntensity: 0.5,
  reducedMotion: false,

  setShakeEnabled: (shakeEnabled) => set({ shakeEnabled }),
  setShakeIntensity: (shakeIntensity) => set({ shakeIntensity }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
