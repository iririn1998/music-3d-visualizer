import clsx from 'clsx';
import { useState, type FC } from 'react';
import { Menu, X } from 'lucide-react';
import { ErrorFeedback } from '@/components/ui/ErrorFeedback';
import { PlayerControls } from '@/components/ui/PlayerControls';
import { VisualizerControls } from '@/components/ui/VisualizerControls';
import styles from './index.module.css';

type OverlayProps = {
  onLoadFile: (file: File) => void;
  onPlay: () => void;
  onStop: () => void;
};

export const Overlay: FC<OverlayProps> = ({ onLoadFile, onPlay, onStop }) => {
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

      <div className={clsx(styles.sidebar, menuOpen ? styles.sidebarOpen : styles.sidebarClosed)}>
        <PlayerControls onLoadFile={onLoadFile} onPlay={onPlay} onStop={onStop} />
        <VisualizerControls />
      </div>

      <div className={styles.errorArea}>
        <ErrorFeedback />
      </div>
    </div>
  );
};
