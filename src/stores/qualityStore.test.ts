import { describe, it, expect, beforeEach } from 'vitest';
import { useQualityStore } from './qualityStore';

describe('qualityStore', () => {
  beforeEach(() => {
    useQualityStore.setState({
      settings: {
        level: 'high',
        particleCount: 10000,
        geometryDetail: 3,
        dpr: 2,
        bloomEnabled: true,
      },
      autoMode: true,
    });
  });

  it('starts at high quality', () => {
    expect(useQualityStore.getState().settings.level).toBe('high');
  });

  it('can set quality to low', () => {
    useQualityStore.getState().setQuality('low');
    expect(useQualityStore.getState().settings.level).toBe('low');
    expect(useQualityStore.getState().settings.particleCount).toBe(1000);
  });

  it('can set quality to medium', () => {
    useQualityStore.getState().setQuality('medium');
    expect(useQualityStore.getState().settings.level).toBe('medium');
    expect(useQualityStore.getState().settings.particleCount).toBe(3000);
  });

  it('can toggle auto mode', () => {
    useQualityStore.getState().setAutoMode(false);
    expect(useQualityStore.getState().autoMode).toBe(false);
  });
});
