import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { dampAudioData } from '@/utils/smoothing';
import { AudioAnalyzer } from '@/audio/AudioAnalyzer';

const SMOOTHING_LAMBDA = 5;

/**
 * ローカル音声ファイルの読み込み・再生・解析を担うフック。
 * rAF ループで AudioAnalyzer.update() を呼び出し、
 * 平滑化済みデータを useAudioStore へ書き込む。
 */
export const useLocalAudio = () => {
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(performance.now());
  const loadTokenRef = useRef<number>(0);

  const sensitivity = useAudioStore((s) => s.sensitivity);
  const setAudioData = useAudioStore((s) => s.setAudioData);
  const setSmoothedAudioData = useAudioStore((s) => s.setSmoothedAudioData);
  const setPlaybackState = useAudioStore((s) => s.setPlaybackState);
  const setFileLoaded = useAudioStore((s) => s.setFileLoaded);
  const setIsLoading = useAudioStore((s) => s.setIsLoading);

  const smoothedRef = useRef(useAudioStore.getState().smoothedAudioData);

  const getAnalyzer = useCallback(() => {
    if (!analyzerRef.current) {
      analyzerRef.current = new AudioAnalyzer();
    }
    return analyzerRef.current;
  }, []);

  const startLoop = useCallback(() => {
    prevTimeRef.current = performance.now();
    const loop = (now: number) => {
      const delta = Math.min((now - prevTimeRef.current) / 1000, 0.1);
      prevTimeRef.current = now;

      const analyzer = analyzerRef.current;
      if (analyzer) {
        const raw = analyzer.update();
        setAudioData(raw);

        const smoothed = dampAudioData(smoothedRef.current, raw, SMOOTHING_LAMBDA, delta);
        smoothedRef.current = smoothed;
        setSmoothedAudioData(smoothed);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [setAudioData, setSmoothedAudioData]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /** ローカルファイルを読み込んでバッファにキャッシュする（再生は開始しない） */
  const loadFile = useCallback(
    async (file: File) => {
      const token = ++loadTokenRef.current;
      const analyzer = getAnalyzer();

      stopLoop();
      setFileLoaded(null);
      setIsLoading(true);

      try {
        await analyzer.loadFile(file, sensitivity);
      } finally {
        if (token === loadTokenRef.current) {
          setIsLoading(false);
        }
      }

      if (token !== loadTokenRef.current) return;

      setFileLoaded(file.name);
      setPlaybackState('idle');
    },
    [sensitivity, setPlaybackState, setFileLoaded, setIsLoading, stopLoop, getAnalyzer],
  );

  /** キャッシュ済みバッファを再生する */
  const play = useCallback(() => {
    const { isLoading } = useAudioStore.getState();
    const analyzer = getAnalyzer();
    if (isLoading || !analyzer.hasBuffer) return;

    analyzer.setOnEnded(() => {
      stopLoop();
      setPlaybackState('ended');
    });

    analyzer.play(sensitivity);
    setPlaybackState('playing');
    startLoop();
  }, [sensitivity, setPlaybackState, startLoop, stopLoop, getAnalyzer]);

  /** 再生を停止し、再生位置をリセットする */
  const stop = useCallback(() => {
    ++loadTokenRef.current;
    stopLoop();
    analyzerRef.current?.stop();
    setPlaybackState('idle');
  }, [setPlaybackState, stopLoop]);

  /** 感度変更をリアルタイムで反映する */
  useEffect(() => {
    analyzerRef.current?.setSensitivity(sensitivity);
  }, [sensitivity]);

  /** アンマウント時にリソースを解放する */
  useEffect(() => {
    const loadToken = loadTokenRef;
    const analyzer = analyzerRef;
    return () => {
      ++loadToken.current;
      stopLoop();
      void analyzer.current?.dispose().catch((error) => {
        console.error('Failed to dispose AudioAnalyzer in useLocalAudio cleanup:', error);
      });
    };
  }, [stopLoop]);

  return { loadFile, play, stop };
};
