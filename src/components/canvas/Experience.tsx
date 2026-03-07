import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { type Group } from 'three';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../stores/themeStore';

/**
 * R3F シーン内の基本構成要素（照明・カメラ制御・プレースホルダー）。
 * Phase 3 でビジュアライザーモードごとの 3D オブジェクトに差し替える。
 */
export function Experience() {
  const groupRef = useRef<Group>(null);

  useTheme();

  const currentColors = useThemeStore((s) => s.currentColors);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const primaryHex = `#${currentColors.primary.getHexString()}`;
  const secondaryHex = `#${currentColors.secondary.getHexString()}`;

  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[5, 5, 5]} intensity={1.5} color={primaryHex} />
      <pointLight position={[-5, -3, 3]} intensity={0.8} color={secondaryHex} />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        maxDistance={20}
        minDistance={2}
      />

      <group ref={groupRef}>
        <mesh>
          <icosahedronGeometry args={[1.5, 3]} />
          <meshStandardMaterial
            color={primaryHex}
            wireframe
            emissive={primaryHex}
            emissiveIntensity={0.4}
          />
        </mesh>
      </group>
    </>
  );
}
