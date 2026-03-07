import { beforeEach, describe, expect, it } from 'vitest';
import { AudioAnalyzer } from './AudioAnalyzer';

// Frequency band boundaries, mirroring the constants in AudioAnalyzer.ts
const BASS_MAX_HZ = 250;
const MID_MAX_HZ = 4000;

/** Returns the expected band boundary indices for a given sampleRate and binCount. */
function bandIndices(binCount: number, sampleRate: number) {
  const hzPerBin = sampleRate / 2 / binCount;
  return {
    bassEnd: Math.floor(BASS_MAX_HZ / hzPerBin),
    midEnd: Math.floor(MID_MAX_HZ / hzPerBin),
  };
}

function uniform(length: number, value: number): Uint8Array<ArrayBuffer> {
  return new Uint8Array(length).fill(value) as Uint8Array<ArrayBuffer>;
}

describe('AudioAnalyzer', () => {
  let analyzer: AudioAnalyzer;

  // Private method accessors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extract = (inst: AudioAnalyzer, data: Uint8Array<ArrayBuffer>, sampleRate: number) =>
    (inst as any).extractAudioData(data, sampleRate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const avg = (inst: AudioAnalyzer, data: Uint8Array<ArrayBuffer>, start: number, end: number) =>
    (inst as any).averageRange(data, start, end);

  beforeEach(() => {
    analyzer = new AudioAnalyzer();
  });

  // ---------------------------------------------------------------------------
  // extractAudioData – normalization
  // ---------------------------------------------------------------------------
  describe('extractAudioData – normalization', () => {
    it('returns all-zero AudioData for a silent (all-zero) buffer', () => {
      const result = extract(analyzer, uniform(1024, 0), 44100);
      expect(result).toEqual({ bass: 0, mid: 0, treble: 0, energy: 0, rms: 0 });
    });

    it('returns all-one AudioData for a maximum (255) buffer', () => {
      const result = extract(analyzer, uniform(1024, 255), 44100);
      expect(result.bass).toBeCloseTo(1, 6);
      expect(result.mid).toBeCloseTo(1, 6);
      expect(result.treble).toBeCloseTo(1, 6);
      expect(result.energy).toBeCloseTo(1, 6);
      expect(result.rms).toBeCloseTo(1, 6);
    });

    it('keeps all fields in the [0, 1] range for a mid-range buffer', () => {
      const result = extract(analyzer, uniform(1024, 128), 44100);
      for (const key of ['bass', 'mid', 'treble', 'energy', 'rms'] as const) {
        expect(result[key], key).toBeGreaterThanOrEqual(0);
        expect(result[key], key).toBeLessThanOrEqual(1);
      }
    });

    it('returns an AudioData object with all five required fields', () => {
      const result = extract(analyzer, uniform(1024, 100), 44100);
      for (const key of ['bass', 'mid', 'treble', 'energy', 'rms']) {
        expect(result, key).toHaveProperty(key);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // extractAudioData – band splitting
  // ---------------------------------------------------------------------------
  describe('extractAudioData – band splitting at 44100 Hz', () => {
    const BIN_COUNT = 1024;
    const SAMPLE_RATE = 44100;

    it('reports bass=1 and mid=treble=0 when only bass bins are set', () => {
      const { bassEnd } = bandIndices(BIN_COUNT, SAMPLE_RATE);
      const data = uniform(BIN_COUNT, 0);
      data.fill(255, 0, bassEnd);

      const result = extract(analyzer, data, SAMPLE_RATE);
      expect(result.bass).toBeCloseTo(1, 6);
      expect(result.mid).toBe(0);
      expect(result.treble).toBe(0);
    });

    it('reports mid=1 and bass=treble=0 when only mid bins are set', () => {
      const { bassEnd, midEnd } = bandIndices(BIN_COUNT, SAMPLE_RATE);
      const data = uniform(BIN_COUNT, 0);
      data.fill(255, bassEnd, midEnd);

      const result = extract(analyzer, data, SAMPLE_RATE);
      expect(result.bass).toBe(0);
      expect(result.mid).toBeCloseTo(1, 6);
      expect(result.treble).toBe(0);
    });

    it('reports treble=1 and bass=mid=0 when only treble bins are set', () => {
      const { midEnd } = bandIndices(BIN_COUNT, SAMPLE_RATE);
      const data = uniform(BIN_COUNT, 0);
      data.fill(255, midEnd, BIN_COUNT);

      const result = extract(analyzer, data, SAMPLE_RATE);
      expect(result.bass).toBe(0);
      expect(result.mid).toBe(0);
      expect(result.treble).toBeCloseTo(1, 6);
    });
  });

  // ---------------------------------------------------------------------------
  // extractAudioData – energy and RMS formulas
  // ---------------------------------------------------------------------------
  describe('extractAudioData – energy and RMS', () => {
    it('energy equals the normalized mean of all bins', () => {
      const data = uniform(1024, 0);
      // First half = 100, second half = 200  →  mean = 150
      data.fill(100, 0, 512);
      data.fill(200, 512, 1024);

      const result = extract(analyzer, data, 44100);
      expect(result.energy).toBeCloseTo(150 / 255, 6);
    });

    it('rms matches the manual root-mean-square calculation', () => {
      const raw = [0, 85, 170, 255];
      const data = new Uint8Array(raw) as Uint8Array<ArrayBuffer>;

      const sumSq = raw.reduce((acc, v) => acc + (v / 255) ** 2, 0);
      const expectedRms = Math.sqrt(sumSq / raw.length);

      const result = extract(analyzer, data, 44100);
      expect(result.rms).toBeCloseTo(expectedRms, 6);
    });

    it('rms equals energy for a uniform buffer (all values identical)', () => {
      const data = uniform(1024, 180);
      const result = extract(analyzer, data, 44100);
      // For a uniform signal, RMS == mean
      expect(result.rms).toBeCloseTo(result.energy, 6);
    });
  });

  // ---------------------------------------------------------------------------
  // extractAudioData – edge cases: low sample rate / index clamping
  // ---------------------------------------------------------------------------
  describe('extractAudioData – low sample rate edge cases', () => {
    it('treble is 0 when midEnd >= binCount (MID_MAX_HZ covers entire spectrum)', () => {
      // sampleRate=1000, binCount=4: nyquist=500, hzPerBin=125
      // midEnd = floor(4000/125) = 32 >> 4, so treble range is empty
      const data = new Uint8Array([255, 255, 128, 128]) as Uint8Array<ArrayBuffer>;
      const result = extract(analyzer, data, 1000);
      expect(result.treble).toBe(0);
    });

    it('bass is 0 when bassEnd is 0 (hzPerBin exceeds BASS_MAX_HZ)', () => {
      // sampleRate=44100, binCount=4: hzPerBin=5512.5, bassEnd=floor(250/5512.5)=0
      const data = new Uint8Array([255, 255, 255, 255]) as Uint8Array<ArrayBuffer>;
      const result = extract(analyzer, data, 44100);
      expect(result.bass).toBe(0);
    });

    it('produces finite values for a typical low-rate scenario (sampleRate=8000)', () => {
      // binCount=1024, sampleRate=8000: hzPerBin≈3.9, midEnd≈1025 > 1024
      const data = uniform(1024, 128);
      const result = extract(analyzer, data, 8000);
      // bass and treble are finite and in range
      expect(Number.isFinite(result.bass)).toBe(true);
      expect(Number.isFinite(result.treble)).toBe(true);
      expect(result.treble).toBe(0); // midEnd clamps beyond binCount
      expect(result.energy).toBeCloseTo(128 / 255, 6);
      expect(result.rms).toBeCloseTo(128 / 255, 6);
    });
  });

  // ---------------------------------------------------------------------------
  // averageRange
  // ---------------------------------------------------------------------------
  describe('averageRange', () => {
    it('returns 0 when start equals end', () => {
      expect(avg(analyzer, uniform(8, 255), 4, 4)).toBe(0);
    });

    it('returns 0 when start is greater than end', () => {
      expect(avg(analyzer, uniform(8, 255), 6, 3)).toBe(0);
    });

    it('returns the correct average over a range', () => {
      const data = new Uint8Array([0, 50, 100, 200, 255]) as Uint8Array<ArrayBuffer>;
      // Range [1, 4): values 50, 100, 200 → average = 350/3
      expect(avg(analyzer, data, 1, 4)).toBeCloseTo((50 + 100 + 200) / 3, 6);
    });

    it('returns the value itself for a single-element range', () => {
      const data = new Uint8Array([10, 128, 240]) as Uint8Array<ArrayBuffer>;
      expect(avg(analyzer, data, 1, 2)).toBe(128);
    });

    it('returns correct average over the full array', () => {
      const data = new Uint8Array([0, 100, 200, 155]) as Uint8Array<ArrayBuffer>;
      const expected = (0 + 100 + 200 + 155) / 4;
      expect(avg(analyzer, data, 0, 4)).toBeCloseTo(expected, 6);
    });
  });

  // ---------------------------------------------------------------------------
  // dampAudioData – placeholder for smoothing/interpolation tests
  // (implement once the method is introduced)
  // ---------------------------------------------------------------------------
  describe.todo('dampAudioData – interpolation / smoothing');
});
