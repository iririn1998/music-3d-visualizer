import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import { useAudioStore } from '@/stores/audioStore';

const DEFAULT_CAMERA_POSITION = new Vector3(0, 0, 6);

/**
 * ビジュアライザーモードが変更された際に
 * カメラ位置をデフォルトにリセットするフック。
 */
export function useModeReset() {
  const { camera } = useThree();

  useEffect(() => {
    const unsubscribe = useAudioStore.subscribe(
      (state) => state.mode,
      () => {
        camera.position.copy(DEFAULT_CAMERA_POSITION);
        camera.lookAt(0, 0, 0);
      },
    );
    return unsubscribe;
  }, [camera]);
}
