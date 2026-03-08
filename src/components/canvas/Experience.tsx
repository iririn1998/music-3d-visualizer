import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { type Group, type PointLight, type MeshStandardMaterial } from 'three';
import { useTheme, currentColorsRef } from '../../hooks/useTheme';
import { useQualityManager } from '../../hooks/useQualityManager';

/**
 * R3F シーン内の基本構成要素（照明・カメラ制御・プレースホルダー）。
 * Phase 3 でビジュアライザーモードごとの 3D オブジェクトに差し替える。
 *
 * ライト色やマテリアル色は useFrame 内で currentColorsRef から直接書き込み、
 * Zustand 経由の React 再レンダーを発生させない。
 */
export function Experience() {
  const groupRef = useRef<Group>(null);
  const primaryLightRef = useRef<PointLight>(null);
  const secondaryLightRef = useRef<PointLight>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);

  useTheme();
  useQualityManager();

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }

    if (primaryLightRef.current) {
      primaryLightRef.current.color.copy(currentColorsRef.primary);
    }
    if (secondaryLightRef.current) {
      secondaryLightRef.current.color.copy(currentColorsRef.secondary);
    }
    if (materialRef.current) {
      materialRef.current.color.copy(currentColorsRef.primary);
      materialRef.current.emissive.copy(currentColorsRef.primary);
    }
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight ref={primaryLightRef} position={[5, 5, 5]} intensity={1.5} />
      <pointLight ref={secondaryLightRef} position={[-5, -3, 3]} intensity={0.8} />

      <OrbitControls enableDamping dampingFactor={0.05} maxDistance={20} minDistance={2} />

      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[1.5, 3]} />
          <meshStandardMaterial
            ref={materialRef}
            wireframe
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </>
  );
}
