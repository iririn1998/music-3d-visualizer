import { describe, it, expect } from 'vitest';
import { dampAudioData, dampValue } from '@/utils/smoothing';
import { DEFAULT_AUDIO_DATA } from '@/types/audio';

describe('dampAudioData', () => {
  it('returns current values unchanged when delta is 0', () => {
    const current = { bass: 0.5, mid: 0.5, treble: 0.5, energy: 0.5, rms: 0.5 };
    const target = { bass: 1, mid: 1, treble: 1, energy: 1, rms: 1 };
    const result = dampAudioData(current, target, 5, 0);
    expect(result.bass).toBeCloseTo(0.5);
    expect(result.mid).toBeCloseTo(0.5);
    expect(result.treble).toBeCloseTo(0.5);
    expect(result.energy).toBeCloseTo(0.5);
    expect(result.rms).toBeCloseTo(0.5);
  });

  it('moves each field toward the target when delta > 0', () => {
    const current = DEFAULT_AUDIO_DATA;
    const target = { bass: 1, mid: 1, treble: 1, energy: 1, rms: 1 };
    const result = dampAudioData(current, target, 5, 0.1);
    expect(result.bass).toBeGreaterThan(0);
    expect(result.bass).toBeLessThan(1);
    expect(result.mid).toBeGreaterThan(0);
    expect(result.treble).toBeGreaterThan(0);
    expect(result.energy).toBeGreaterThan(0);
    expect(result.rms).toBeGreaterThan(0);
  });

  it('converges to target after sufficient time', () => {
    let state = DEFAULT_AUDIO_DATA;
    const target = { bass: 0.8, mid: 0.6, treble: 0.4, energy: 0.9, rms: 0.3 };
    for (let i = 0; i < 200; i++) {
      state = dampAudioData(state, target, 8, 0.016);
    }
    expect(state.bass).toBeCloseTo(target.bass, 3);
    expect(state.mid).toBeCloseTo(target.mid, 3);
    expect(state.treble).toBeCloseTo(target.treble, 3);
    expect(state.energy).toBeCloseTo(target.energy, 3);
    expect(state.rms).toBeCloseTo(target.rms, 3);
  });

  it('returns a new object and does not mutate current', () => {
    const current = { bass: 0.2, mid: 0.2, treble: 0.2, energy: 0.2, rms: 0.2 };
    const target = { bass: 1, mid: 1, treble: 1, energy: 1, rms: 1 };
    const result = dampAudioData(current, target, 5, 0.1);
    expect(result).not.toBe(current);
    expect(current.bass).toBeCloseTo(0.2);
  });

  it('clamps correctly when current equals target', () => {
    const value = { bass: 0.7, mid: 0.3, treble: 0.5, energy: 0.1, rms: 0.9 };
    const result = dampAudioData(value, value, 5, 0.016);
    expect(result.bass).toBeCloseTo(value.bass);
    expect(result.mid).toBeCloseTo(value.mid);
    expect(result.treble).toBeCloseTo(value.treble);
    expect(result.energy).toBeCloseTo(value.energy);
    expect(result.rms).toBeCloseTo(value.rms);
  });
});

describe('dampValue', () => {
  it('returns current unchanged when delta is 0', () => {
    expect(dampValue(0.3, 1, 5, 0)).toBeCloseTo(0.3);
  });

  it('moves toward target when delta > 0', () => {
    const result = dampValue(0, 1, 5, 0.1);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });

  it('converges to target after sufficient time', () => {
    let v = 0;
    for (let i = 0; i < 200; i++) {
      v = dampValue(v, 0.75, 8, 0.016);
    }
    expect(v).toBeCloseTo(0.75, 3);
  });
});
