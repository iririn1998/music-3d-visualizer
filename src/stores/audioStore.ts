import { create } from 'zustand';
import {
  type AudioData,
  type PlaybackState,
  type VisualizerMode,
  DEFAULT_AUDIO_DATA,
} from '@/types/audio';

interface AudioStore {
  audioData: AudioData;
  smoothedAudioData: AudioData;
  playbackState: PlaybackState;
  mode: VisualizerMode;
  sensitivity: number;
  fileName: string | null;
  isLoading: boolean;

  setAudioData: (data: AudioData) => void;
  setSmoothedAudioData: (data: AudioData) => void;
  setPlaybackState: (state: PlaybackState) => void;
  setMode: (mode: VisualizerMode) => void;
  setSensitivity: (sensitivity: number) => void;
  setFileLoaded: (fileName: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  /** ファイル読み込み完了時に isLoading・fileName・playbackState を一括更新する */
  setFileLoadComplete: (fileName: string) => void;
}

export const useAudioStore = create<AudioStore>((set) => ({
  audioData: { ...DEFAULT_AUDIO_DATA },
  smoothedAudioData: { ...DEFAULT_AUDIO_DATA },
  playbackState: 'idle',
  mode: 'core',
  sensitivity: 1.0,
  fileName: null,
  isLoading: false,

  setAudioData: (data) => set({ audioData: data }),
  setSmoothedAudioData: (data) => set({ smoothedAudioData: data }),
  setPlaybackState: (state) => set({ playbackState: state }),
  setMode: (mode) => set({ mode }),
  setSensitivity: (sensitivity) => set({ sensitivity }),
  setFileLoaded: (fileName) => set({ fileName }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setFileLoadComplete: (fileName) => set({ isLoading: false, fileName, playbackState: 'idle' }),
}));
