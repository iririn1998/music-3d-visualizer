import { VisualizerCanvas } from '@/components/canvas/visualizerCanvas';
import { useReducedMotionSync } from '@/hooks/useReducedMotionSync';

const App = () => {
  useReducedMotionSync();

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <VisualizerCanvas />
    </div>
  );
};

export default App;
