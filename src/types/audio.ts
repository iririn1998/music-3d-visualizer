export type VisualizerMode = 'core' | 'horizon' | 'vortex';

export interface AudioData {
  bass: number;
  mid: number;
  treble: number;
  energy: number;
  rms: number;
}

export const DEFAULT_AUDIO_DATA: AudioData = {
  bass: 0,
  mid: 0,
  treble: 0,
  energy: 0,
  rms: 0,
};

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'ended';
