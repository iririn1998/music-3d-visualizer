import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import { useAudioStore } from '../stores/audioStore';
import { useThemeStore } from '../stores/themeStore';
import { COLOR_PRESETS, type ColorPalette, type ColorPreset } from '../types/theme';

const COLOR_LERP_SPEED = 3;
const BLOOM_DAMP_SPEED = 5;
const BLOOM_MIN = 0.6;
const BLOOM_MAX = 3.0;

/**
 * Module-level mutable refs shared with consumers (Experience, PostProcessing).
 * Updated in-place every frame so reads are always current without triggering
 * any React re-renders or Zustand subscriber notifications.
 */
export const currentColorsRef: ColorPalette = {
  primary: COLOR_PRESETS.neonPink.primary.clone(),
  secondary: COLOR_PRESETS.neonPink.secondary.clone(),
  accent: COLOR_PRESETS.neonPink.accent.clone(),
};
export const bloomIntensityRef = { value: 1.0 };

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
 *
 * 結果は currentColorsRef / bloomIntensityRef に直接書き込み、
 * Zustand の state 更新は行わない（React の再レンダーを防ぐため）。
 */
export function useTheme() {
  const bloomRef = useRef(1.0);
  const presetRef = useRef(useThemeStore.getState().preset);

  useFrame((_state, delta) => {
    const { smoothedAudioData } = useAudioStore.getState();
    const { preset } = useThemeStore.getState();
    const { energy, bass, rms } = smoothedAudioData;

    // When the preset changes externally, snap colorsRef to the new palette so
    // the lerp starts from the correct base instead of the stale previous color.
    if (presetRef.current !== preset) {
      const newPalette = COLOR_PRESETS[preset];
      currentColorsRef.primary.copy(newPalette.primary);
      currentColorsRef.secondary.copy(newPalette.secondary);
      currentColorsRef.accent.copy(newPalette.accent);
      presetRef.current = preset;
    }

    const autoPreset = getTargetPresetByEnergy(energy, bass);
    const targetPalette = COLOR_PRESETS[autoPreset];

    const lerpFactor = 1 - Math.exp(-COLOR_LERP_SPEED * delta);

    currentColorsRef.primary.lerp(targetPalette.primary, lerpFactor);
    currentColorsRef.secondary.lerp(targetPalette.secondary, lerpFactor);
    currentColorsRef.accent.lerp(targetPalette.accent, lerpFactor);

    const targetBloom = MathUtils.lerp(BLOOM_MIN, BLOOM_MAX, rms);
    bloomRef.current = MathUtils.damp(bloomRef.current, targetBloom, BLOOM_DAMP_SPEED, delta);
    bloomIntensityRef.value = bloomRef.current;
  });
}
