import { create } from 'zustand';
import { type QualityLevel, type QualitySettings, QUALITY_PRESETS } from '@/types/quality';

interface QualityStore {
  settings: QualitySettings;
  autoMode: boolean;

  setQuality: (level: QualityLevel) => void;
  setAutoMode: (auto: boolean) => void;
}

export const useQualityStore = create<QualityStore>((set) => ({
  settings: { ...QUALITY_PRESETS.high },
  autoMode: true,

  setQuality: (level) => set({ settings: { ...QUALITY_PRESETS[level] } }),
  setAutoMode: (autoMode) => set({ autoMode }),
}));
