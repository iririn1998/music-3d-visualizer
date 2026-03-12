import { useState, type FC } from 'react';
import { Menu, X } from 'lucide-react';
import { AccessibilityPanel } from '../accessibilityPanel';
import { ErrorFeedback } from '../errorFeedback';
import { PlayerControls } from '../playerControls';
import { VisualizerControls } from '../visualizerControls';

interface OverlayProps {
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

const Overlay: FC<OverlayProps> = ({ onLoadFile, onStop }) => {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex">
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className="pointer-events-auto absolute top-4 left-4 z-20 rounded-xl border border-white/10
          bg-white/5 p-2 text-white/70 shadow-lg backdrop-blur-xl
          transition-colors hover:bg-white/10 md:hidden"
        aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div
        className={`flex max-h-full flex-col gap-3 overflow-y-auto p-4 pt-14 transition-transform duration-300
          md:translate-x-0 md:pt-4
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <PlayerControls onLoadFile={onLoadFile} onStop={onStop} />
        <VisualizerControls />
        <AccessibilityPanel />
      </div>

      <div className="ml-auto p-4">
        <ErrorFeedback />
      </div>
    </div>
  );
};

export { Overlay };
