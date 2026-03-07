import { useEffect, useRef, useCallback } from 'react';
import { useAudioStore } from '../stores/audioStore';
import { dampAudioData } from '../utils/smoothing';
import { AudioAnalyzer } from './AudioAnalyzer';

const SMOOTHING_LAMBDA = 5;

/**
 * ローカル音声ファイルの読み込み・再生・解析を担うフック。
 * rAF ループで AudioAnalyzer.update() を呼び出し、
 * 平滑化済みデータを useAudioStore へ書き込む。
 */
export function useLocalAudio() {
  const analyzerRef = useRef<AudioAnalyzer | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(performance.now());

  const { sensitivity, setAudioData, setSmoothedAudioData, setPlaybackState, smoothedAudioData } =
    useAudioStore();

  const smoothedRef = useRef(smoothedAudioData);
  smoothedRef.current = smoothedAudioData;

  const startLoop = useCallback(() => {
    const loop = (now: number) => {
      const delta = Math.min((now - prevTimeRef.current) / 1000, 0.1);
      prevTimeRef.current = now;

      const analyzer = analyzerRef.current;
      if (analyzer) {
        const raw = analyzer.update();
        setAudioData(raw);

        const smoothed = dampAudioData(smoothedRef.current, raw, SMOOTHING_LAMBDA, delta);
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

  /** ローカルファイルを読み込んで再生を開始する */
  const loadFile = useCallback(
    async (file: File) => {
      if (!analyzerRef.current) {
        analyzerRef.current = new AudioAnalyzer();
        analyzerRef.current.setOnEnded(() => {
          stopLoop();
          setPlaybackState('idle');
        });
      }
      stopLoop();
      await analyzerRef.current.loadFile(file, sensitivity);
      setPlaybackState('playing');
      startLoop();
    },
    [sensitivity, setPlaybackState, startLoop, stopLoop],
  );

  /** 再生を停止する */
  const stop = useCallback(() => {
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
    return () => {
      stopLoop();
      analyzerRef.current?.dispose();
    };
  }, [stopLoop]);

  return { loadFile, stop };
}
