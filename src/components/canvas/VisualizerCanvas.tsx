import { Canvas } from '@react-three/fiber';
import { Experience } from './Experience';

/**
 * Three.js 3D キャンバスのルートコンポーネント。
 * R3F の Canvas を初期化し、Experience をマウントする。
 */
export function VisualizerCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#050505' }}
      dpr={[1, 2]}
    >
      <Experience />
    </Canvas>
  );
}
