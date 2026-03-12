import { useRef, type FC } from 'react';
import { useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import type { BloomEffect } from 'postprocessing';
import { bloomIntensityRef } from '@/hooks/useTheme';
import { useQualityStore } from '@/stores/qualityStore';
import { useThemeStore } from '@/stores/themeStore';

/**
 * シーン全体のポストプロセッシング。
 * Bloom の intensity は bloomIntensityRef から useFrame 内で直接書き込み、
 * Zustand 経由の React 再レンダーを発生させない。
 * 品質設定で bloom が無効な場合はレンダリングしない。
 */
const PostProcessing: FC = () => {
  const bloomEffectRef = useRef<BloomEffect>(null);
  const bloomThreshold = useThemeStore((s) => s.bloomThreshold);
  const bloomEnabled = useQualityStore((s) => s.settings.bloomEnabled);

  useFrame(() => {
    if (bloomEffectRef.current) {
      bloomEffectRef.current.intensity = bloomIntensityRef.value;
    }
  });

  if (!bloomEnabled) return null;

  return (
    <EffectComposer>
      <Bloom
        ref={bloomEffectRef}
        intensity={bloomIntensityRef.value}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
};

export { PostProcessing };
