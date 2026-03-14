import { useState, type FC } from 'react';
import { Menu, X } from 'lucide-react';
import { AccessibilityPanel } from '@/components/ui/accessibilityPanel';
import { ErrorFeedback } from '@/components/ui/errorFeedback';
import { PlayerControls } from '@/components/ui/playerControls';
import { VisualizerControls } from '@/components/ui/visualizerControls';
import styles from './styles.module.css';

interface OverlayProps {
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

const Overlay: FC<OverlayProps> = ({ onLoadFile, onStop }) => {
  const [menuOpen, setMenuOpen] = useState(true);

  return (
    <div className={styles.root}>
      <button
        type="button"
        onClick={() => setMenuOpen((prev) => !prev)}
        className={styles.menuButton}
        aria-label={menuOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        {menuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <div className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : styles.sidebarClosed}`}>
        <PlayerControls onLoadFile={onLoadFile} onStop={onStop} />
        <VisualizerControls />
        <AccessibilityPanel />
      </div>

      <div className={styles.errorArea}>
        <ErrorFeedback />
      </div>
    </div>
  );
};

export { Overlay };
