import { type AudioData, DEFAULT_AUDIO_DATA } from '../types/audio';

const FFT_SIZE = 2048;

/** bass / mid / treble の周波数帯域境界 (Hz) */
const BASS_MAX_HZ = 250;
const MID_MAX_HZ = 4000;

/**
 * Web Audio API の AnalyserNode をラップし、
 * 周波数データを正規化済みの AudioData へ変換するクラス。
 */
export class AudioAnalyzer {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: AudioBufferSourceNode | MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;

  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(0);
  private _currentData: AudioData = { ...DEFAULT_AUDIO_DATA };

  get currentData(): AudioData {
    return this._currentData;
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }
    return this.context;
  }

  private setupAnalyser(ctx: AudioContext): AnalyserNode {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    this.analyser = analyser;
    this.frequencyData = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    return analyser;
  }

  /**
   * ローカルの File オブジェクトを読み込み、デコードして再生を開始する。
   * @param file MP3 / WAV 等の音声ファイル
   * @param sensitivity 感度係数（0.1〜2.0 程度）
   */
  async loadFile(file: File, sensitivity = 1.0): Promise<void> {
    this.stop();

    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const analyser = this.setupAnalyser(ctx);

    const gainNode = ctx.createGain();
    gainNode.gain.value = sensitivity;
    this.gainNode = gainNode;

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(ctx.destination);
    source.start(0);

    this.source = source;
  }

  /**
   * HTMLMediaElement（<audio> タグ等）を解析対象として接続する。
   * Spotify SDK など外部プレイヤーとの連携に使用。
   */
  connectMediaElement(element: HTMLMediaElement, sensitivity = 1.0): void {
    this.stop();

    const ctx = this.ensureContext();
    const analyser = this.setupAnalyser(ctx);

    const gainNode = ctx.createGain();
    gainNode.gain.value = sensitivity;
    this.gainNode = gainNode;

    const source = ctx.createMediaElementSource(element);
    source.connect(gainNode);
    gainNode.connect(analyser);
    analyser.connect(ctx.destination);

    this.source = source;
  }

  /** 感度（Gain）をリアルタイムで変更する */
  setSensitivity(value: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = value;
    }
  }

  /**
   * AnalyserNode から周波数データを取得し、AudioData に変換・正規化する。
   * アニメーションループ内で毎フレーム呼び出す。
   */
  update(): AudioData {
    if (!this.analyser) return this._currentData;

    this.analyser.getByteFrequencyData(this.frequencyData);
    this._currentData = this.extractAudioData(this.frequencyData, this.analyser.context.sampleRate);
    return this._currentData;
  }

  /**
   * 周波数バッファを bass / mid / treble / energy / rms に分解し、0〜1 に正規化する。
   */
  private extractAudioData(data: Uint8Array<ArrayBuffer>, sampleRate: number): AudioData {
    const binCount = data.length;
    const nyquist = sampleRate / 2;
    const hzPerBin = nyquist / binCount;

    const bassEnd = Math.floor(BASS_MAX_HZ / hzPerBin);
    const midEnd = Math.floor(MID_MAX_HZ / hzPerBin);

    const bass = this.averageRange(data, 0, bassEnd) / 255;
    const mid = this.averageRange(data, bassEnd, midEnd) / 255;
    const treble = this.averageRange(data, midEnd, binCount) / 255;

    const energy = this.averageRange(data, 0, binCount) / 255;

    let sumSq = 0;
    for (let i = 0; i < binCount; i++) {
      const normalized = data[i] / 255;
      sumSq += normalized * normalized;
    }
    const rms = Math.sqrt(sumSq / binCount);

    return { bass, mid, treble, energy, rms };
  }

  private averageRange(data: Uint8Array<ArrayBuffer>, start: number, end: number): number {
    if (start >= end) return 0;
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += data[i];
    }
    return sum / (end - start);
  }

  /** 再生を停止し、リソースを解放する */
  stop(): void {
    if (this.source && 'stop' in this.source) {
      try {
        (this.source as AudioBufferSourceNode).stop();
      } catch {
        // すでに停止済みの場合は無視
      }
    }
    this.source = null;
    this._currentData = { ...DEFAULT_AUDIO_DATA };
  }

  /** AudioContext を閉じ、すべてのリソースを解放する */
  async dispose(): Promise<void> {
    this.stop();
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.analyser = null;
      this.gainNode = null;
    }
  }
}
