import { useMemo, useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
  type Points,
  ShaderMaterial,
} from 'three';
import { currentColorsRef } from '../../../../hooks/useTheme';
import particleFragmentShader from '../../../../shaders/particleFragment.glsl?raw';
import particleVertexShader from '../../../../shaders/particleVertex.glsl?raw';
import { useAudioStore } from '../../../../stores/audioStore';
import { useQualityStore } from '../../../../stores/qualityStore';

const MIN_RADIUS = 0.5;
const RADIUS_RANGE = 6.0;
const MIN_SPEED = 0.2;
const SPEED_RANGE = 1.0;
const DEFAULT_PARTICLE_SIZE = 3.0;
const ROTATION_SPEED = 0.001;

const buildParticleGeometry = (count: number) => {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const angles = new Float32Array(count);
  const radii = new Float32Array(count);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;

    angles[i] = Math.random() * Math.PI * 2;
    radii[i] = MIN_RADIUS + Math.random() * RADIUS_RANGE;
    speeds[i] = MIN_SPEED + Math.random() * SPEED_RANGE;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aAngle', new Float32BufferAttribute(angles, 1));
  geometry.setAttribute('aRadius', new Float32BufferAttribute(radii, 1));
  geometry.setAttribute('aSpeed', new Float32BufferAttribute(speeds, 1));
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1));

  return geometry;
};

/**
 * "Stardust Vortex" — パーティクル渦巻きビジュアライザー。
 *
 * GPU 頂点シェーダーで数千パーティクルの位置を計算。
 * 音量(rms)で回転速度と拡散範囲が変化し、
 * 低音のピーク(bass)で粒子が外側へ弾け飛ぶ。
 */
const ParticleVisualizer: FC = () => {
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
          uParticleSize: { value: DEFAULT_PARTICLE_SIZE },
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
      pointsRef.current.rotation.y += ROTATION_SPEED;
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={shaderMaterial} frustumCulled={false} />
  );
};

export { ParticleVisualizer };
