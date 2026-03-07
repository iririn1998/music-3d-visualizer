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
  const loadTokenRef = useRef<number>(0);

  // セレクタで必要なアクション・値のみを個別に購読し、不要な再レンダリングを防ぐ
  const sensitivity = useAudioStore((s) => s.sensitivity);
  const setAudioData = useAudioStore((s) => s.setAudioData);
  const setSmoothedAudioData = useAudioStore((s) => s.setSmoothedAudioData);
  const setPlaybackState = useAudioStore((s) => s.setPlaybackState);

  // smoothedAudioData はストアから購読せず、ref で完結させる
  // （rAFループ内でのみ参照・更新するため、コンポーネントの再レンダリングは不要）
  const smoothedRef = useRef(useAudioStore.getState().smoothedAudioData);

  const startLoop = useCallback(() => {
    // Reset the timestamp so the first delta after a restart is near zero
    // rather than spanning the entire gap since the loop was last running.
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

  /** ローカルファイルを読み込んで再生を開始する */
  const loadFile = useCallback(
    async (file: File) => {
      const token = ++loadTokenRef.current;

      if (!analyzerRef.current) {
        analyzerRef.current = new AudioAnalyzer();
        analyzerRef.current.setOnEnded(() => {
          stopLoop();
          setPlaybackState('idle');
        });
      }
      stopLoop();
      await analyzerRef.current.loadFile(file, sensitivity);

      // 待機中に新しい loadFile が呼ばれていたら古い結果を破棄する
      if (token !== loadTokenRef.current) return;

      setPlaybackState('playing');
      startLoop();
    },
    [sensitivity, setPlaybackState, startLoop, stopLoop],
  );

  /** 再生を停止する */
  const stop = useCallback(() => {
    ++loadTokenRef.current; // invalidate any in-flight loadFile
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
      ++loadToken.current; // invalidate any in-flight loadFile
      stopLoop();
      void analyzer.current?.dispose().catch((error) => {
        console.error('Failed to dispose AudioAnalyzer in useLocalAudio cleanup:', error);
      });
    };
  }, [stopLoop]);

  return { loadFile, stop };
}
