import { VisualizerCanvas } from './components/canvas/VisualizerCanvas';
import { Overlay } from './components/ui/Overlay';
import { useLocalAudio } from './audio/useLocalAudio';
import { useReducedMotionSync } from './hooks/useReducedMotionSync';

function App() {
  const { loadFile, stop } = useLocalAudio();
  useReducedMotionSync();

  return (
    <div className="relative h-screen w-screen">
      <VisualizerCanvas />
      <Overlay onLoadFile={loadFile} onStop={stop} />
    </div>
  );
}

export default App;
