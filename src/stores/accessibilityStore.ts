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
  setShakeIntensity: (intensity) => set({ shakeIntensity: Math.max(0, Math.min(1, intensity)) }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
