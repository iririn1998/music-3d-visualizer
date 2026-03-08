import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { type Mesh, ShaderMaterial, IcosahedronGeometry } from 'three';
import { useAudioStore } from '../../../stores/audioStore';
import { useQualityStore } from '../../../stores/qualityStore';
import { currentColorsRef } from '../../../hooks/useTheme';
import coreVertexShader from '../../../shaders/coreVertex.glsl?raw';
import coreFragmentShader from '../../../shaders/coreFragment.glsl?raw';

/**
 * "The Pulsing Core" — 球体ビジュアライザー。
 *
 * IcosahedronGeometry にカスタムシェーダーを適用し、
 * 低音(bass)で球体がスケール膨張、高音(treble)で表面にスパイクが発生する。
 * Noise関数で有機的な変形を実現。
 */
export function CoreVisualizer() {
  const meshRef = useRef<Mesh>(null);
  const geometryDetail = useQualityStore((s) => s.settings.geometryDetail);

  const detail = useMemo(() => {
    switch (geometryDetail) {
      case 1: return 12;
      case 2: return 24;
      case 3: return 48;
      default: return 24;
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
      meshRef.current.rotation.y += 0.002;
      meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} material={shaderMaterial} />
  );
}
