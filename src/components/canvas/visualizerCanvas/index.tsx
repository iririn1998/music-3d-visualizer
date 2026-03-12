import type { FC } from 'react';
import { Canvas } from '@react-three/fiber';
import { useQualityStore } from '../../../stores/qualityStore';
import { Experience } from '../experience';
import { PostProcessing } from '../postProcessing';

/**
 * Three.js 3D キャンバスのルートコンポーネント。
 * R3F の Canvas を初期化し、Experience と PostProcessing をマウントする。
 */
const VisualizerCanvas: FC = () => {
  const dpr = useQualityStore((s) => s.settings.dpr);

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#050505' }}
      dpr={[1, dpr]}
    >
      <Experience />
      <PostProcessing />
    </Canvas>
  );
};

export { VisualizerCanvas };
