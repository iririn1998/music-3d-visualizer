import type { FC } from 'react';
import { useAudioStore } from '@/stores/audioStore';
import { CoreVisualizer } from '@/components/canvas/visualizers/coreVisualizer';
import { GridVisualizer } from '@/components/canvas/visualizers/gridVisualizer';
import { ParticleVisualizer } from '@/components/canvas/visualizers/particleVisualizer';

/**
 * ビジュアライザーモードに応じた 3D オブジェクトを切り替えるディスパッチャー。
 * モード変更時に対応するビジュアライザーコンポーネントがアンマウント→再マウントされることで、
 * そのビジュアライザー固有の 3D オブジェクトや内部状態が自然にリセットされる。
 */
const Stage: FC = () => {
  const mode = useAudioStore((s) => s.mode);

  switch (mode) {
    case 'core':
      return <CoreVisualizer />;
    case 'horizon':
      return <GridVisualizer />;
    case 'vortex':
      return <ParticleVisualizer />;
    default: {
      const exhaustiveCheck: never = mode;
      console.error(`Unhandled VisualizerMode: ${exhaustiveCheck}`);
      return null;
    }
  }
};

export { Stage };
