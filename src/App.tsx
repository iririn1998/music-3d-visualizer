import { useLocalAudio } from './audio/useLocalAudio';
import { VisualizerCanvas } from './components/canvas/visualizerCanvas';
import { Overlay } from './components/ui/overlay';
import { useReducedMotionSync } from './hooks/useReducedMotionSync';

const App = () => {
  const { loadFile, stop } = useLocalAudio();
  useReducedMotionSync();

  return (
    <div className="relative h-screen w-screen">
      <VisualizerCanvas />
      <Overlay onLoadFile={loadFile} onStop={stop} />
    </div>
  );
};

export default App;
