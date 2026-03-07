import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { useThemeStore } from '../../stores/themeStore';

/**
 * シーン全体のポストプロセッシング。
 * Bloom の intensity は useTheme フックによって rms に連動して更新される。
 */
export function PostProcessing() {
  const bloomIntensity = useThemeStore((s) => s.bloomIntensity);
  const bloomThreshold = useThemeStore((s) => s.bloomThreshold);

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
