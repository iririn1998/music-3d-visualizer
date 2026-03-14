import { VisualizerCanvas } from '@/components/canvas/visualizerCanvas';
import { Overlay } from '@/components/ui/overlay';
import { useLocalAudio } from '@/audio/useLocalAudio';
import { useReducedMotionSync } from '@/hooks/useReducedMotionSync';

const App = () => {
  useReducedMotionSync();
  const { loadFile, stop } = useLocalAudio();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <VisualizerCanvas />
      <Overlay onLoadFile={loadFile} onStop={stop} />
    </div>
  );
};

export default App;
