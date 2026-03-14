import {
  useCallback,
  useRef,
  type ChangeEvent,
  type DragEvent,
  type FC,
  type KeyboardEvent,
} from 'react';
import { Music, Play, Square, Upload } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';
import { useErrorStore } from '@/stores/errorStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import styles from './index.module.css';

const SUPPORTED_TYPES = new Set([
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/flac',
  'audio/aac',
  'audio/mp4',
  'audio/webm',
  'audio/x-m4a',
]);

const SUPPORTED_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|weba|webm|mp4)$/i;

const isAudioFile = (file: File): boolean => {
  if (SUPPORTED_TYPES.has(file.type)) return true;
  return SUPPORTED_EXTENSIONS.test(file.name);
};

interface PlayerControlsProps {
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

const PlayerControls: FC<PlayerControlsProps> = ({ onLoadFile, onStop }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackState = useAudioStore((s) => s.playbackState);
  const pushError = useErrorStore((s) => s.pushError);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!isAudioFile(file)) {
        pushError({
          message: `"${file.name}" は対応していない形式です。MP3, WAV, OGG, FLAC, AAC, M4A, WebM をお試しください。`,
          type: 'error',
          dismissible: true,
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      onLoadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [onLoadFile, pushError],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (!file) return;

      if (!isAudioFile(file)) {
        pushError({
          message: `"${file.name}" は対応していない形式です。MP3, WAV, OGG, FLAC, AAC, M4A, WebM をお試しください。`,
          type: 'error',
          dismissible: true,
        });
        return;
      }

      onLoadFile(file);
    },
    [onLoadFile, pushError],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      fileInputRef.current?.click();
    }
  }, []);

  const isPlaying = playbackState === 'playing';

  return (
    <div className={styles.root}>
      <GlassPanel>
        <h3 className={styles.heading}>
          <Music size={14} />
          Player
        </h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={styles.dropZone}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label="音声ファイルをアップロード"
        >
          <Upload size={20} className={styles.dropIcon} />
          <span className={styles.dropText}>クリックまたはドラッグ&amp;ドロップ</span>
          <span className={styles.dropHint}>MP3, WAV, OGG, FLAC, AAC, M4A, WebM</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className={styles.hiddenInput}
          aria-label="音声ファイル選択"
        />

        <div className={styles.buttonRow}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPlaying}
            className={styles.actionButton}
          >
            <Play size={12} />
            再生
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying}
            className={styles.actionButton}
          >
            <Square size={12} />
            停止
          </button>
        </div>
      </GlassPanel>
    </div>
  );
};

export { PlayerControls };
