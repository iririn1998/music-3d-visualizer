import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { type PointLight } from 'three';
import { useTheme, currentColorsRef } from '../../hooks/useTheme';
import { useQualityManager } from '../../hooks/useQualityManager';
import { Stage } from './Stage';

/**
 * R3F シーン内の基本構成要素（照明・カメラ制御・ビジュアライザー）。
 * Stage 経由でモードごとの 3D オブジェクトを描画する。
 *
 * ライト色は useFrame 内で currentColorsRef から直接書き込み、
 * Zustand 経由の React 再レンダーを発生させない。
 */
export function Experience() {
  const primaryLightRef = useRef<PointLight>(null);
  const secondaryLightRef = useRef<PointLight>(null);

  useTheme();
  useQualityManager();

  useFrame(() => {
    if (primaryLightRef.current) {
      primaryLightRef.current.color.copy(currentColorsRef.primary);
    }
    if (secondaryLightRef.current) {
      secondaryLightRef.current.color.copy(currentColorsRef.secondary);
    }
  });

  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight ref={primaryLightRef} position={[5, 5, 5]} intensity={2.0} />
      <pointLight ref={secondaryLightRef} position={[-5, -3, 3]} intensity={1.0} />

      <OrbitControls enableDamping dampingFactor={0.05} maxDistance={20} minDistance={2} />

      <Stage />
    </>
  );
}
