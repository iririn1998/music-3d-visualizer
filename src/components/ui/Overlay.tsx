import { VisualizerControls } from './VisualizerControls';
import { PlayerControls } from './PlayerControls';
import { AccessibilityPanel } from './AccessibilityPanel';
import { ErrorFeedback } from './ErrorFeedback';

interface OverlayProps {
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

export function Overlay({ onLoadFile, onStop }: OverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex">
      {/* Left column: controls */}
      <div className="flex flex-col gap-3 p-4">
        <PlayerControls onLoadFile={onLoadFile} onStop={onStop} />
        <VisualizerControls />
        <AccessibilityPanel />
      </div>

      {/* Top-right: error feedback */}
      <div className="ml-auto p-4">
        <ErrorFeedback />
      </div>
    </div>
  );
}
