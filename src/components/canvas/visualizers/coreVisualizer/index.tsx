import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import { IcosahedronGeometry, type Mesh, ShaderMaterial } from 'three';
import { currentColorsRef } from '@/hooks/useTheme';
import coreFragmentShader from '@/shaders/coreFragment.glsl?raw';
import coreVertexShader from '@/shaders/coreVertex.glsl?raw';
import { useAudioStore } from '@/stores/audioStore';
import { useQualityStore } from '@/stores/qualityStore';

const GEOMETRY_DETAIL = {
  low: 2,
  medium: 3,
  high: 4,
} as const;

const ROTATION_SPEED_Y = 0.002;
const ROTATION_SPEED_X = 0.001;

/**
 * "The Pulsing Core" — 球体ビジュアライザー。
 *
 * IcosahedronGeometry にカスタムシェーダーを適用し、
 * 低音(bass)で球体がスケール膨張、高音(treble)で表面にスパイクが発生する。
 * Noise関数で有機的な変形を実現。
 */
const CoreVisualizer: FC = () => {
  const meshRef = useRef<Mesh>(null);
  const geometryDetail = useQualityStore((s) => s.settings.geometryDetail);

  const detail = useMemo(() => {
    switch (geometryDetail) {
      case 1:
        return GEOMETRY_DETAIL.low;
      case 2:
        return GEOMETRY_DETAIL.medium;
      case 3:
        return GEOMETRY_DETAIL.high;
      default:
        return GEOMETRY_DETAIL.medium;
    }
  }, [geometryDetail]);

  const geometry = useMemo(() => new IcosahedronGeometry(1.5, detail), [detail]);

  const shaderMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: coreVertexShader,
        fragmentShader: coreFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBass: { value: 0 },
          uTreble: { value: 0 },
          uEnergy: { value: 0 },
          uColor: { value: currentColorsRef.primary.clone() },
          uAccentColor: { value: currentColorsRef.accent.clone() },
        },
        wireframe: true,
        transparent: true,
      }),
    [],
  );

  useFrame((state) => {
    const { smoothedAudioData, sensitivity } = useAudioStore.getState();

    const uniforms = shaderMaterial.uniforms;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uBass.value = smoothedAudioData.bass * sensitivity;
    uniforms.uTreble.value = smoothedAudioData.treble * sensitivity;
    uniforms.uEnergy.value = smoothedAudioData.energy * sensitivity;
    uniforms.uColor.value.copy(currentColorsRef.primary);
    uniforms.uAccentColor.value.copy(currentColorsRef.accent);

    if (meshRef.current) {
      meshRef.current.rotation.y += ROTATION_SPEED_Y;
      meshRef.current.rotation.x += ROTATION_SPEED_X;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} frustumCulled={false} />;
};

export { CoreVisualizer };
