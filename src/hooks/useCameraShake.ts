import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useAudioStore } from '@/stores/audioStore';
import { useAccessibilityStore } from '@/stores/accessibilityStore';

const SHAKE_DECAY = 8;
const MAX_OFFSET = 0.15;

const targetOffset = new Vector3();
const diff = new Vector3();

/**
 * 低音(Bass)に連動してカメラを小さく揺らすフック。
 * アクセシビリティ設定でオン/オフおよび強度を制御可能。
 * prefers-reduced-motion が有効の場合は自動的に無効化される。
 */
export function useCameraShake() {
  const currentOffsetRef = useRef(new Vector3());
  const prevOffsetRef = useRef(new Vector3());
  const { camera } = useThree();

  useFrame((_state, delta) => {
    const { shakeEnabled, shakeIntensity, reducedMotion } = useAccessibilityStore.getState();
    const { smoothedAudioData } = useAudioStore.getState();

    if (!shakeEnabled || reducedMotion) {
      currentOffsetRef.current.lerp(targetOffset.set(0, 0, 0), 1 - Math.exp(-SHAKE_DECAY * delta));
    } else {
      const bass = smoothedAudioData.bass;
      const strength = bass * shakeIntensity * MAX_OFFSET;

      targetOffset.set(
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength,
        (Math.random() - 0.5) * 2 * strength * 0.3,
      );

      currentOffsetRef.current.lerp(targetOffset, 1 - Math.exp(-SHAKE_DECAY * delta));
    }

    // 前フレームのオフセットを打ち消してから今フレームのオフセットを加算
    diff.subVectors(currentOffsetRef.current, prevOffsetRef.current);
    camera.position.add(diff);
    prevOffsetRef.current.copy(currentOffsetRef.current);
  });
}
