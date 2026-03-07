import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useQualityStore } from '../stores/qualityStore';
import { type QualityLevel } from '../types/quality';

const FPS_SAMPLE_INTERVAL = 1.0;

/** 降格は即座に行い、ヨーヨー現象を防ぐ */
const DOWNGRADE_THRESHOLD_FPS = 30;
/** 昇格にはこのFPSを安定して上回る必要がある */
const UPGRADE_THRESHOLD_FPS = 55;
/** 昇格判定に必要な連続安定秒数 */
const UPGRADE_WAIT_SECONDS = 8.0;

const QUALITY_ORDER: QualityLevel[] = ['low', 'medium', 'high'];

function getQualityIndex(level: QualityLevel): number {
  return QUALITY_ORDER.indexOf(level);
}

/**
 * FPS を監視し、品質設定を動的に変更するフック。
 * 仕様に従い、降格は即時・昇格は長い待機時間を設けてチラつきを防止する。
 */
export function useQualityManager() {
  const frameCountRef = useRef(0);
  const elapsedRef = useRef(0);
  const upgradeTimerRef = useRef(0);
  const lastFpsRef = useRef(60);

  useFrame((_state, delta) => {
    const { autoMode, settings, setQuality } = useQualityStore.getState();
    if (!autoMode) return;

    frameCountRef.current += 1;
    elapsedRef.current += delta;

    if (elapsedRef.current < FPS_SAMPLE_INTERVAL) return;

    const fps = frameCountRef.current / elapsedRef.current;
    lastFpsRef.current = fps;
    frameCountRef.current = 0;
    elapsedRef.current = 0;

    const currentIndex = getQualityIndex(settings.level);

    if (fps < DOWNGRADE_THRESHOLD_FPS && currentIndex > 0) {
      upgradeTimerRef.current = 0;
      setQuality(QUALITY_ORDER[currentIndex - 1]);
      return;
    }

    if (fps >= UPGRADE_THRESHOLD_FPS && currentIndex < QUALITY_ORDER.length - 1) {
      upgradeTimerRef.current += FPS_SAMPLE_INTERVAL;
      if (upgradeTimerRef.current >= UPGRADE_WAIT_SECONDS) {
        upgradeTimerRef.current = 0;
        setQuality(QUALITY_ORDER[currentIndex + 1]);
      }
    } else {
      upgradeTimerRef.current = 0;
    }
  });
}
