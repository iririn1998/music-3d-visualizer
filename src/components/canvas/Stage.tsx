import { useAudioStore } from '../../stores/audioStore';
import { CoreVisualizer } from './visualizers/CoreVisualizer';
import { GridVisualizer } from './visualizers/GridVisualizer';
import { ParticleVisualizer } from './visualizers/ParticleVisualizer';

/**
 * ビジュアライザーモードに応じた 3D オブジェクトを切り替えるディスパッチャー。
 * モード変更時に対応するビジュアライザーコンポーネントがアンマウント→再マウントされることで、
 * そのビジュアライザー固有の 3D オブジェクトや内部状態が自然にリセットされる。
 */
export function Stage() {
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
}
