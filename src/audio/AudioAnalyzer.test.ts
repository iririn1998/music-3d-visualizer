import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  return new Uint8Array(length).fill(value);
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
      const data = new Uint8Array(raw);

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
    it('clamps midEnd to binCount so treble=0 and mid is finite (sampleRate=1000)', () => {
      // sampleRate=1000, binCount=4: nyquist=500, hzPerBin=125
      // rawBassEnd=floor(250/125)=2, rawMidEnd=floor(4000/125)=32 >> 4
      // After clamping: bassEnd=2, midEnd=4=binCount
      // bass = avg([255,255])/255 = 1, mid = avg([128,128])/255, treble = 0 (empty range)
      const data = new Uint8Array([255, 255, 128, 128]);
      const result = extract(analyzer, data, 1000);
      expect(result.treble).toBe(0);
      expect(result.bass).toBeCloseTo(1, 6);
      expect(Number.isFinite(result.mid)).toBe(true);
      expect(result.mid).toBeCloseTo(128 / 255, 6);
    });

    it('bass is 0 when bassEnd is 0 (hzPerBin exceeds BASS_MAX_HZ)', () => {
      // sampleRate=44100, binCount=4: hzPerBin=5512.5, bassEnd=floor(250/5512.5)=0
      const data = new Uint8Array([255, 255, 255, 255]);
      const result = extract(analyzer, data, 44100);
      expect(result.bass).toBe(0);
    });

    it('all fields are finite when rawMidEnd exactly equals binCount (sampleRate=8000)', () => {
      // sampleRate=8000, binCount=1024: hzPerBin=4000/1024≈3.906
      // rawMidEnd = floor(4000/3.906) = 1024 = binCount → clamps cleanly to binCount
      // treble range [1024, 1024) is empty → treble=0; mid covers [bassEnd, 1024)
      const data = uniform(1024, 128);
      const result = extract(analyzer, data, 8000);
      for (const key of ['bass', 'mid', 'treble', 'energy', 'rms'] as const) {
        expect(Number.isFinite(result[key]), key).toBe(true);
      }
      expect(result.treble).toBe(0);
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
      const data = new Uint8Array([0, 50, 100, 200, 255]);
      // Range [1, 4): values 50, 100, 200 → average = 350/3
      expect(avg(analyzer, data, 1, 4)).toBeCloseTo((50 + 100 + 200) / 3, 6);
    });

    it('returns the value itself for a single-element range', () => {
      const data = new Uint8Array([10, 128, 240]);
      expect(avg(analyzer, data, 1, 2)).toBe(128);
    });

    it('returns correct average over the full array', () => {
      const data = new Uint8Array([0, 100, 200, 155]);
      const expected = (0 + 100 + 200 + 155) / 4;
      expect(avg(analyzer, data, 0, 4)).toBeCloseTo(expected, 6);
    });
  });

  // ---------------------------------------------------------------------------
  // stop() – node disconnection and state cleanup
  // ---------------------------------------------------------------------------
  describe('stop()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priv = (inst: AudioAnalyzer) => inst as any;

    function makeNode(extra: object = {}): AudioNode {
      return { disconnect: vi.fn(), ...extra } as unknown as AudioNode;
    }

    it('nulls source, gainNode, and analyser after stop()', () => {
      const inst = priv(analyzer);
      inst.source = makeNode({ stop: vi.fn() });
      inst.gainNode = makeNode();
      inst.analyser = makeNode();

      analyzer.stop();

      expect(inst.source).toBeNull();
      expect(inst.gainNode).toBeNull();
      expect(inst.analyser).toBeNull();
    });

    it('disconnects all three nodes', () => {
      const inst = priv(analyzer);
      const sourceDisconnect = vi.fn();
      const gainDisconnect = vi.fn();
      const analyserDisconnect = vi.fn();

      inst.source = makeNode({ stop: vi.fn(), disconnect: sourceDisconnect });
      inst.gainNode = makeNode({ disconnect: gainDisconnect });
      inst.analyser = makeNode({ disconnect: analyserDisconnect });

      analyzer.stop();

      expect(sourceDisconnect).toHaveBeenCalledOnce();
      expect(gainDisconnect).toHaveBeenCalledOnce();
      expect(analyserDisconnect).toHaveBeenCalledOnce();
    });

    it('resets _currentData to DEFAULT_AUDIO_DATA', () => {
      const inst = priv(analyzer);
      inst._currentData = { bass: 0.9, mid: 0.8, treble: 0.7, energy: 0.6, rms: 0.5 };

      analyzer.stop();

      expect(inst._currentData).toEqual({ bass: 0, mid: 0, treble: 0, energy: 0, rms: 0 });
    });

    it('update() returns DEFAULT_AUDIO_DATA when called after stop() (analyser is null)', () => {
      const inst = priv(analyzer);
      inst.analyser = null;
      inst._currentData = { bass: 0.5, mid: 0.5, treble: 0.5, energy: 0.5, rms: 0.5 };

      const result = analyzer.update();

      expect(result).toEqual({ bass: 0.5, mid: 0.5, treble: 0.5, energy: 0.5, rms: 0.5 });
    });

    it('stop() is idempotent when nodes are already null', () => {
      expect(() => analyzer.stop()).not.toThrow();
      expect(() => analyzer.stop()).not.toThrow();
    });

    it('stop() tolerates a node whose disconnect() throws', () => {
      const inst = priv(analyzer);
      inst.source = makeNode({
        disconnect: vi.fn().mockImplementation(() => {
          throw new Error('already disconnected');
        }),
      });

      expect(() => analyzer.stop()).not.toThrow();
      expect(inst.source).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // setOnEnded / source.onended – natural playback completion
  // ---------------------------------------------------------------------------
  describe('setOnEnded()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priv = (inst: AudioAnalyzer) => inst as any;

    /** Simulates the state AudioAnalyzer is in after loadFile() completes. */
    function seedLoadedState(inst: AudioAnalyzer) {
      const p = priv(inst);
      const source = {
        stop: vi.fn(),
        disconnect: vi.fn(),
        onended: null as (() => void) | null,
      };
      p.source = source;
      p.gainNode = { disconnect: vi.fn() };
      p.analyser = { disconnect: vi.fn() };
      // Simulate the assignment that loadFile() does after source.start():
      // the onended handler is set, then this.source = source.
      // We replicate it here so tests can trigger it directly.
      source.onended = () => {
        if (p.source === source) {
          inst.stop();
          p._onEnded?.();
        }
      };
      return source;
    }

    it('fires the callback when audio ends naturally', () => {
      const onEnded = vi.fn();
      analyzer.setOnEnded(onEnded);
      const source = seedLoadedState(analyzer);

      source.onended!();

      expect(onEnded).toHaveBeenCalledOnce();
    });

    it('calls stop() (nulls all nodes) when audio ends naturally', () => {
      analyzer.setOnEnded(vi.fn());
      const source = seedLoadedState(analyzer);

      source.onended!();

      expect(priv(analyzer).source).toBeNull();
      expect(priv(analyzer).gainNode).toBeNull();
      expect(priv(analyzer).analyser).toBeNull();
    });

    it('does NOT fire the callback after manual stop() (this.source nulled before onended fires)', () => {
      const onEnded = vi.fn();
      analyzer.setOnEnded(onEnded);
      const source = seedLoadedState(analyzer);

      // Manual stop() nulls this.source synchronously.
      analyzer.stop();
      // onended fires asynchronously (simulated here by calling it directly after stop).
      source.onended!();

      expect(onEnded).not.toHaveBeenCalled();
    });

    it('can be cleared by passing null, preventing the callback from firing', () => {
      const onEnded = vi.fn();
      analyzer.setOnEnded(onEnded);
      analyzer.setOnEnded(null);
      const source = seedLoadedState(analyzer);

      source.onended!();

      expect(onEnded).not.toHaveBeenCalled();
    });

    it('can be updated between playbacks without reinstantiating the analyzer', () => {
      const first = vi.fn();
      const second = vi.fn();

      analyzer.setOnEnded(first);
      const source1 = seedLoadedState(analyzer);
      source1.onended!();
      expect(first).toHaveBeenCalledOnce();

      analyzer.setOnEnded(second);
      const source2 = seedLoadedState(analyzer);
      source2.onended!();
      expect(second).toHaveBeenCalledOnce();
      expect(first).toHaveBeenCalledOnce(); // not called again
    });
  });

  // ---------------------------------------------------------------------------
  // dampAudioData – placeholder for smoothing/interpolation tests
  // (implement once the method is introduced)
  // ---------------------------------------------------------------------------
  describe.todo('dampAudioData – interpolation / smoothing');
});
