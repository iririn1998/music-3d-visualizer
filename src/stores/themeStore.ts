import { create } from 'zustand';
import { type ColorPreset } from '@/types/theme';

interface ThemeStore {
  preset: ColorPreset;
  bloomThreshold: number;

  setPreset: (preset: ColorPreset) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  preset: 'neonPink',
  bloomThreshold: 0.2,

  setPreset: (preset) => set({ preset }),
}));
