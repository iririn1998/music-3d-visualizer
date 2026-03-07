import { create } from 'zustand';
import { type ColorPreset, type ColorPalette, COLOR_PRESETS } from '../types/theme';

interface ThemeStore {
  preset: ColorPreset;
  currentColors: ColorPalette;
  bloomIntensity: number;
  bloomThreshold: number;

  setPreset: (preset: ColorPreset) => void;
  setCurrentColors: (colors: ColorPalette) => void;
  setBloomIntensity: (intensity: number) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  preset: 'neonPink',
  currentColors: {
    primary: COLOR_PRESETS.neonPink.primary.clone(),
    secondary: COLOR_PRESETS.neonPink.secondary.clone(),
    accent: COLOR_PRESETS.neonPink.accent.clone(),
  },
  bloomIntensity: 1.0,
  bloomThreshold: 0.2,

  setPreset: (preset) =>
    set({
      preset,
      currentColors: {
        primary: COLOR_PRESETS[preset].primary.clone(),
        secondary: COLOR_PRESETS[preset].secondary.clone(),
        accent: COLOR_PRESETS[preset].accent.clone(),
      },
    }),
  setCurrentColors: (colors) => set({ currentColors: colors }),
  setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),
}));
