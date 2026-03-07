import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useThemeStore } from '../../stores/themeStore';
import { useQualityStore } from '../../stores/qualityStore';

/**
 * シーン全体のポストプロセッシング。
 * Bloom の intensity は useTheme フックによって rms に連動して更新される。
 * 品質設定で bloom が無効な場合はレンダリングしない。
 */
export function PostProcessing() {
  const bloomIntensity = useThemeStore((s) => s.bloomIntensity);
  const bloomThreshold = useThemeStore((s) => s.bloomThreshold);
  const bloomEnabled = useQualityStore((s) => s.settings.bloomEnabled);

  if (!bloomEnabled) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={bloomIntensity}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
    </EffectComposer>
  );
}
