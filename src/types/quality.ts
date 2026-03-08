export type QualityLevel = 'low' | 'medium' | 'high';

export interface QualitySettings {
  level: QualityLevel;
  particleCount: number;
  geometryDetail: number;
  dpr: number;
  bloomEnabled: boolean;
}

export const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  low: {
    level: 'low',
    particleCount: 1000,
    geometryDetail: 1,
    dpr: 1,
    bloomEnabled: false,
  },
  medium: {
    level: 'medium',
    particleCount: 3000,
    geometryDetail: 2,
    dpr: 1.5,
    bloomEnabled: true,
  },
  high: {
    level: 'high',
    particleCount: 10000,
    geometryDetail: 3,
    dpr: 2,
    bloomEnabled: true,
  },
};
