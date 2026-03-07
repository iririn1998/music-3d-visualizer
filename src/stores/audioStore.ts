import { create } from 'zustand';
import { type AudioData, type PlaybackState, type VisualizerMode, DEFAULT_AUDIO_DATA } from '../types/audio';

interface AudioStore {
  audioData: AudioData;
  smoothedAudioData: AudioData;
  playbackState: PlaybackState;
  mode: VisualizerMode;
  sensitivity: number;

  setAudioData: (data: AudioData) => void;
  setSmoothedAudioData: (data: AudioData) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setMode: (mode: VisualizerMode) => void;
  setSensitivity: (sensitivity: number) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  audioData: DEFAULT_AUDIO_DATA,
  smoothedAudioData: DEFAULT_AUDIO_DATA,
  playbackState: 'idle',
  mode: 'core',
  sensitivity: 1.0,

  setAudioData: (data) => set({ audioData: data }),
  setSmoothedAudioData: (data) => set({ smoothedAudioData: data }),
  setPlaybackState: (state) => set({ playbackState: state }),
  setMode: (mode) => set({ mode }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
}));
