import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  ShaderMaterial,
  BoxGeometry,
  InstancedBufferGeometry,
  InstancedBufferAttribute,
} from 'three';
import { useAudioStore } from '../../../stores/audioStore';
import { useQualityStore } from '../../../stores/qualityStore';
import { currentColorsRef } from '../../../hooks/useTheme';
import gridVertexShader from '../../../shaders/gridVertex.glsl?raw';
import gridFragmentShader from '../../../shaders/gridFragment.glsl?raw';

const GRID_SPACING = 1.2;
const BOX_WIDTH = 0.15;
const BOX_HEIGHT = 1.0;

const GRID_SIZE = {
  low: 20,
  medium: 35,
  high: 50,
} as const;

function buildGridGeometry(gridSize: number) {
  const base = new BoxGeometry(BOX_WIDTH, BOX_HEIGHT, BOX_WIDTH);
  const geo = new InstancedBufferGeometry();
  geo.index = base.index;
  geo.attributes.position = base.attributes.position;
  geo.attributes.normal = base.attributes.normal;

  const count = gridSize * gridSize;
  const offsets = new Float32Array(count * 3);
  const half = (gridSize - 1) * GRID_SPACING * 0.5;

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const idx = (i * gridSize + j) * 3;
      offsets[idx] = i * GRID_SPACING - half;
      offsets[idx + 1] = 0;
      offsets[idx + 2] = j * GRID_SPACING - half;
    }
  }

  geo.setAttribute('instanceOffset', new InstancedBufferAttribute(offsets, 3));
  geo.instanceCount = count;

  return geo;
}

/**
 * "Digital Horizon" — サイバーグリッド床面ビジュアライザー。
 *
 * InstancedBufferGeometry による高速描画。
 * 中音域(mid)でグリッドが波形にうねり、
 * エネルギー(energy)で中心から外側へ放射状に光の波が広がる。
 */
export function GridVisualizer() {
  const geometryDetail = useQualityStore((s) => s.settings.geometryDetail);

  const gridSize = useMemo(() => {
    switch (geometryDetail) {
      case 1:
        return GRID_SIZE.low;
      case 2:
        return GRID_SIZE.medium;
      case 3:
        return GRID_SIZE.high;
      default:
        return GRID_SIZE.medium;
    }
  }, [geometryDetail]);

  const geometry = useMemo(() => buildGridGeometry(gridSize), [gridSize]);

  const shaderMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: gridVertexShader,
        fragmentShader: gridFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uMid: { value: 0 },
          uEnergy: { value: 0 },
          uColor: { value: currentColorsRef.primary.clone() },
          uAccentColor: { value: currentColorsRef.accent.clone() },
        },
        transparent: true,
      }),
    [],
  );

  useFrame((state) => {
    const { smoothedAudioData, sensitivity } = useAudioStore.getState();

    const uniforms = shaderMaterial.uniforms;
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uMid.value = smoothedAudioData.mid * sensitivity;
    uniforms.uEnergy.value = smoothedAudioData.energy * sensitivity;
    uniforms.uColor.value.copy(currentColorsRef.primary);
    uniforms.uAccentColor.value.copy(currentColorsRef.accent);
  });

  return (
    <group position={[0, -2, 0]} rotation={[-0.1, 0, 0]}>
      <mesh geometry={geometry} material={shaderMaterial} frustumCulled={false} />
    </group>
  );
}
