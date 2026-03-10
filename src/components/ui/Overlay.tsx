import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { VisualizerControls } from './VisualizerControls';
import { PlayerControls } from './PlayerControls';
import { AccessibilityPanel } from './AccessibilityPanel';
import { ErrorFeedback } from './ErrorFeedback';

interface OverlayProps {
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

export function Overlay({ onLoadFile, onStop }: OverlayProps) {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex">
      {/* Mobile menu toggle */}
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

      {/* Left column: controls */}
      <div
        className={`flex max-h-full flex-col gap-3 overflow-y-auto p-4 pt-14 transition-transform duration-300
          md:pt-4 md:translate-x-0
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
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
