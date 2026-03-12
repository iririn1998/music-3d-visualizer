import { MathUtils } from 'three';
import { type AudioData } from '@/types/audio';

/**
 * THREE.MathUtils.damp() を用いて AudioData の各値を滑らかに補間する。
 * アニメーションループ内で毎フレーム呼び出すことを想定。
 *
 * @param current 現在の平滑化済み値
 * @param target  目標値（生の AudioData）
 * @param lambda  減衰係数。大きいほど速く追従する（推奨: 3〜8）
 * @param delta   前フレームからの経過秒数
 */
export function dampAudioData(
  current: AudioData,
  target: AudioData,
  lambda: number,
  delta: number,
): AudioData {
  return {
    bass: MathUtils.damp(current.bass, target.bass, lambda, delta),
    mid: MathUtils.damp(current.mid, target.mid, lambda, delta),
    treble: MathUtils.damp(current.treble, target.treble, lambda, delta),
    energy: MathUtils.damp(current.energy, target.energy, lambda, delta),
    rms: MathUtils.damp(current.rms, target.rms, lambda, delta),
  };
}

/**
 * 単一の数値を damp で補間するユーティリティ。
 */
export function dampValue(current: number, target: number, lambda: number, delta: number): number {
  return MathUtils.damp(current, target, lambda, delta);
}
