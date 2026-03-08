import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  type Points,
  ShaderMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  AdditiveBlending,
} from 'three';
import { useAudioStore } from '../../../stores/audioStore';
import { useQualityStore } from '../../../stores/qualityStore';
import { currentColorsRef } from '../../../hooks/useTheme';
import particleVertexShader from '../../../shaders/particleVertex.glsl?raw';
import particleFragmentShader from '../../../shaders/particleFragment.glsl?raw';

function buildParticleGeometry(count: number) {
  const geo = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    angles[i] = Math.random() * Math.PI * 2;
    radii[i] = 0.5 + Math.random() * 6.0;
    speeds[i] = 0.2 + Math.random() * 1.0;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('aAngle', new Float32BufferAttribute(angles, 1));
  geo.setAttribute('aRadius', new Float32BufferAttribute(radii, 1));
  geo.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1));
  geo.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

  return geo;
}

/**
 * "Stardust Vortex" — パーティクル渦巻きビジュアライザー。
 *
 * GPU 頂点シェーダーで数千パーティクルの位置を計算。
 * 音量(rms)で回転速度と拡散範囲が変化し、
 * 低音のピーク(bass)で粒子が外側へ弾け飛ぶ。
 */
export function ParticleVisualizer() {
  const pointsRef = useRef<Points>(null);
  const particleCount = useQualityStore((s) => s.settings.particleCount);

  const geometry = useMemo(() => buildParticleGeometry(particleCount), [particleCount]);

  const shaderMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: particleVertexShader,
        fragmentShader: particleFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uRms: { value: 0 },
          uEnergy: { value: 0 },
          uBass: { value: 0 },
          uParticleSize: { value: 3.0 },
          uColor: { value: currentColorsRef.primary.clone() },
          uAccentColor: { value: currentColorsRef.accent.clone() },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );

  useFrame((state) => {
    const { smoothedAudioData, sensitivity } = useAudioStore.getState();

    const uniforms = shaderMaterial.uniforms;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uRms.value = smoothedAudioData.rms * sensitivity;
    uniforms.uEnergy.value = smoothedAudioData.energy * sensitivity;
    uniforms.uBass.value = smoothedAudioData.bass * sensitivity;
    uniforms.uColor.value.copy(currentColorsRef.primary);
    uniforms.uAccentColor.value.copy(currentColorsRef.accent);

    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={shaderMaterial} />;
}
