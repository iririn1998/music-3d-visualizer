import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, MathUtils } from 'three';
import { useAudioStore } from '../stores/audioStore';
import { useThemeStore } from '../stores/themeStore';
import { COLOR_PRESETS, type ColorPalette, type ColorPreset } from '../types/theme';

const COLOR_LERP_SPEED = 3;
const BLOOM_DAMP_SPEED = 5;
const BLOOM_MIN = 0.6;
const BLOOM_MAX = 3.0;

/**
 * エネルギー値に基づいて目標プリセットを決定する。
 * 低エネルギーなら寒色系、高エネルギーなら暖色系へ遷移。
 */
function getTargetPresetByEnergy(energy: number, bass: number): ColorPreset {
  const score = energy * 0.6 + bass * 0.4;
  if (score > 0.7) return 'solarFlare';
  if (score > 0.5) return 'neonPink';
  if (score > 0.3) return 'cyberLime';
  return 'electricBlue';
}

/**
 * 毎フレーム呼ばれ、オーディオデータに基づいて以下を更新する:
 * - カラーパレット（energy/bass に応じて lerp 遷移）
 * - Bloom 強度（rms に連動）
 */
export function useTheme() {
  const colorsRef = useRef<ColorPalette>({
    primary: new Color('#ff44aa'),
    secondary: new Color('#ff66cc'),
    accent: new Color('#cc33ff'),
  });
  const bloomRef = useRef(1.0);

  const setCurrentColors = useThemeStore((s) => s.setCurrentColors);
  const setBloomIntensity = useThemeStore((s) => s.setBloomIntensity);
  const preset = useThemeStore((s) => s.preset);

  useFrame((_state, delta) => {
    const { smoothedAudioData } = useAudioStore.getState();
    const { energy, bass, rms } = smoothedAudioData;

    const autoPreset = getTargetPresetByEnergy(energy, bass);
    const targetPalette = COLOR_PRESETS[autoPreset] ?? COLOR_PRESETS[preset];

    const lerpFactor = 1 - Math.exp(-COLOR_LERP_SPEED * delta);

    colorsRef.current.primary.lerp(targetPalette.primary, lerpFactor);
    colorsRef.current.secondary.lerp(targetPalette.secondary, lerpFactor);
    colorsRef.current.accent.lerp(targetPalette.accent, lerpFactor);

    setCurrentColors({
      primary: colorsRef.current.primary.clone(),
      secondary: colorsRef.current.secondary.clone(),
      accent: colorsRef.current.accent.clone(),
    });

    const targetBloom = MathUtils.lerp(BLOOM_MIN, BLOOM_MAX, rms);
    bloomRef.current = MathUtils.damp(bloomRef.current, targetBloom, BLOOM_DAMP_SPEED, delta);
    setBloomIntensity(bloomRef.current);
  });
}
