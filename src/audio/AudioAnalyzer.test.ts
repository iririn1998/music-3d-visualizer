import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioAnalyzer } from '@/audio/AudioAnalyzer';

// Frequency band boundaries, mirroring the constants in AudioAnalyzer.ts
const BASS_MAX_HZ = 250;
const MID_MAX_HZ = 4000;

// ---------------------------------------------------------------------------
// Web Audio API mock factory
// ---------------------------------------------------------------------------

/** Creates a minimal AudioBufferSourceNode mock. */
const makeSource = () => ({
  buffer: null as AudioBuffer | null,
  onended: null as ((e: Event) => void) | null,
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
});

/** Creates a minimal AnalyserNode mock. */
const makeAnalyser = (binCount = 1024) => ({
  fftSize: 2048,
  smoothingTimeConstant: 0,
  frequencyBinCount: binCount,
  connect: vi.fn(),
  disconnect: vi.fn(),
  getByteFrequencyData: vi.fn((arr: Uint8Array) => arr.fill(0)),
});

/** Creates a minimal GainNode mock. */
const makeGain = () => ({
  gain: { value: 1 },
  connect: vi.fn(),
  disconnect: vi.fn(),
});

type SourceMock = ReturnType<typeof makeSource>;
type AnalyserMock = ReturnType<typeof makeAnalyser>;
type GainMock = ReturnType<typeof makeGain>;

interface AudioContextMock {
  state: string;
  currentTime: number;
  resume: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  createAnalyser: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  createBufferSource: ReturnType<typeof vi.fn>;
  destination: object;
  _latestSource: SourceMock | null;
  _latestAnalyser: AnalyserMock | null;
  _latestGain: GainMock | null;
}

/**
 * Installs a global AudioContext mock and returns a handle to introspect the
 * most-recently created nodes after each `play()` call.
 */
const installAudioContextMock = (): AudioContextMock => {
  const ctx: AudioContextMock = {
    state: 'running',
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    destination: {},
    _latestSource: null,
    _latestAnalyser: null,
    _latestGain: null,
    createAnalyser: vi.fn(() => {
      const node = makeAnalyser();
      ctx._latestAnalyser = node;
      return node;
    }),
    createGain: vi.fn(() => {
      const node = makeGain();
      ctx._latestGain = node;
      return node;
    }),
    createBufferSource: vi.fn(() => {
      const node = makeSource();
      ctx._latestSource = node;
      return node;
    }),
  };

  vi.stubGlobal('AudioContext', function () {
    return ctx;
  });
  return ctx;
};

/** Builds a minimal AudioBuffer stub with a given duration (seconds). */
const makeAudioBuffer = (duration = 3): AudioBuffer =>
  ({ duration, length: duration * 44100, sampleRate: 44100 }) as unknown as AudioBuffer;

/**
 * Loads a fake file into an analyzer by stubbing File.arrayBuffer() and
 * AudioContext.decodeAudioData(), then calling loadFile().
 */
const loadFakeFile = async (
  analyzer: AudioAnalyzer,
  ctx: AudioContextMock,
  audioBuffer: AudioBuffer = makeAudioBuffer(),
): Promise<void> => {
  const fakeArrayBuffer = new ArrayBuffer(8);
  const fileMock = { arrayBuffer: vi.fn().mockResolvedValue(fakeArrayBuffer) } as unknown as File;
  (ctx as unknown as { decodeAudioData: ReturnType<typeof vi.fn> }).decodeAudioData = vi
    .fn()
    .mockResolvedValue(audioBuffer);
  await analyzer.loadFile(fileMock);
};

/** Returns the expected band boundary indices for a given sampleRate and binCount. */
const bandIndices = (binCount: number, sampleRate: number) => {
  const hzPerBin = sampleRate / 2 / binCount;
  return {
    bassEnd: Math.floor(BASS_MAX_HZ / hzPerBin),
    midEnd: Math.floor(MID_MAX_HZ / hzPerBin),
  };
};

const uniform = (length: number, value: number): Uint8Array<ArrayBuffer> =>
  new Uint8Array(length).fill(value);

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

    const makeNode = (extra: object = {}): AudioNode =>
      ({ disconnect: vi.fn(), ...extra }) as unknown as AudioNode;

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

    it('update() returns existing _currentData when analyser is null', () => {
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
  // hasBuffer – buffer caching via loadFile()
  // ---------------------------------------------------------------------------
  describe('hasBuffer', () => {
    let ctx: AudioContextMock;

    beforeEach(() => {
      ctx = installAudioContextMock();
    });

    it('is false before any file is loaded', () => {
      expect(analyzer.hasBuffer).toBe(false);
    });

    it('is true after loadFile() resolves successfully', async () => {
      await loadFakeFile(analyzer, ctx);
      expect(analyzer.hasBuffer).toBe(true);
    });

    it('remains true after play() is called', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();
      expect(analyzer.hasBuffer).toBe(true);
    });

    it('remains true after stop() is called (buffer is retained)', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.stop();
      expect(analyzer.hasBuffer).toBe(true);
    });

    it('resets pauseOffset to 0 when a new file is loaded', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();
      // Simulate some playback progress
      ctx.currentTime = 2;
      analyzer.pause();
      // Load a new file – should reset pause offset
      await loadFakeFile(analyzer, ctx);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((analyzer as any)._pauseOffset).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // play() – node wiring and playback initiation
  // ---------------------------------------------------------------------------
  describe('play()', () => {
    let ctx: AudioContextMock;

    beforeEach(() => {
      ctx = installAudioContextMock();
    });

    it('does nothing and does not throw when no buffer is loaded', () => {
      expect(() => analyzer.play()).not.toThrow();
      expect(ctx.createBufferSource).not.toHaveBeenCalled();
    });

    it('creates and starts a BufferSourceNode after loadFile()', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();

      expect(ctx.createBufferSource).toHaveBeenCalledOnce();
      expect(ctx._latestSource!.start).toHaveBeenCalledOnce();
    });

    it('starts playback from the beginning (offset=0) on first play', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();

      expect(ctx._latestSource!.start).toHaveBeenCalledWith(0, 0);
    });

    it('assigns the decoded AudioBuffer to the source node', async () => {
      const audioBuffer = makeAudioBuffer(5);
      await loadFakeFile(analyzer, ctx, audioBuffer);
      analyzer.play();

      expect(ctx._latestSource!.buffer).toBe(audioBuffer);
    });

    it('applies the sensitivity value to the GainNode', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play(1.5);

      expect(ctx._latestGain!.gain.value).toBe(1.5);
    });

    it('fires onended callback when source.onended is triggered via play()', async () => {
      await loadFakeFile(analyzer, ctx);

      const onEnded = vi.fn();
      analyzer.setOnEnded(onEnded);
      analyzer.play();

      // Simulate natural audio completion
      ctx._latestSource!.onended!(new Event('ended'));

      expect(onEnded).toHaveBeenCalledOnce();
    });

    it('resets pauseOffset to 0 on natural completion', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();
      ctx.currentTime = 2;
      analyzer.pause();

      // Resume and let it end naturally
      analyzer.play();
      ctx._latestSource!.onended!(new Event('ended'));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((analyzer as any)._pauseOffset).toBe(0);
    });

    it('does NOT fire onended after manual stop() before onended event', async () => {
      await loadFakeFile(analyzer, ctx);

      const onEnded = vi.fn();
      analyzer.setOnEnded(onEnded);
      analyzer.play();
      const staleSource = ctx._latestSource!;

      analyzer.stop();
      staleSource.onended!(new Event('ended'));

      expect(onEnded).not.toHaveBeenCalled();
    });

    it('nulls all nodes after natural completion', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();
      ctx._latestSource!.onended!(new Event('ended'));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const priv = analyzer as any;
      expect(priv.source).toBeNull();
      expect(priv.gainNode).toBeNull();
      expect(priv.analyser).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // pause() and resume – offset preservation
  // ---------------------------------------------------------------------------
  describe('pause() and resume via play()', () => {
    let ctx: AudioContextMock;

    beforeEach(() => {
      ctx = installAudioContextMock();
    });

    it('stores the current playback position in pauseOffset', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();

      // AudioContext clock advances to 2 s
      // _startedAt was set to ctx.currentTime(0) - _pauseOffset(0) = 0
      ctx.currentTime = 2;
      analyzer.pause();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((analyzer as any)._pauseOffset).toBe(2);
    });

    it('resumes from the stored offset, not from the beginning', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();

      ctx.currentTime = 3;
      analyzer.pause();

      // Reset clock to simulate a new play() invocation
      ctx.currentTime = 5;
      analyzer.play();

      // start(0, offset) – second arg should be the stored 3-second offset
      expect(ctx._latestSource!.start).toHaveBeenCalledWith(0, 3);
    });

    it('resets pauseOffset to 0 after stop(), so next play() starts from beginning', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();

      ctx.currentTime = 4;
      analyzer.pause();
      analyzer.stop();

      analyzer.play();
      expect(ctx._latestSource!.start).toHaveBeenCalledWith(0, 0);
    });

    it('does nothing when pause() is called without an active source', () => {
      expect(() => analyzer.pause()).not.toThrow();
    });

    it('stops the previous source node when play() is called while already playing', async () => {
      await loadFakeFile(analyzer, ctx);
      analyzer.play();
      const firstSource = ctx._latestSource!;

      analyzer.play();

      expect(firstSource.stop).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // setOnEnded / source.onended – natural playback completion
  // ---------------------------------------------------------------------------
  describe('setOnEnded()', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const priv = (inst: AudioAnalyzer) => inst as any;

    /** Simulates the state AudioAnalyzer is in after loadFile() completes. */
    const seedLoadedState = (inst: AudioAnalyzer) => {
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
    };

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
});
