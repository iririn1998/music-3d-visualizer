import { useRef, useCallback } from 'react';
import { Upload, Play, Square, Music } from 'lucide-react';
import { useAudioStore } from '../../stores/audioStore';
import { useErrorStore } from '../../stores/errorStore';
import { GlassPanel } from './GlassPanel';

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

function isAudioFile(file: File): boolean {
  if (SUPPORTED_TYPES.has(file.type)) return true;
  return SUPPORTED_EXTENSIONS.test(file.name);
}

interface PlayerControlsProps {
  onLoadFile: (file: File) => void;
  onStop: () => void;
}

export function PlayerControls({ onLoadFile, onStop }: PlayerControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackState = useAudioStore((s) => s.playbackState);
  const pushError = useErrorStore((s) => s.pushError);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
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
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const isPlaying = playbackState === 'playing';

  return (
    <div className="pointer-events-auto w-64">
      <GlassPanel>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
          <Music size={14} />
          Player
        </h3>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="mb-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl
            border border-dashed border-white/20 px-4 py-5
            transition-colors duration-200 hover:border-white/40 hover:bg-white/5"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
          }}
          role="button"
          tabIndex={0}
          aria-label="音声ファイルをアップロード"
        >
          <Upload size={20} className="text-white/50" />
          <span className="text-center text-xs text-white/50">
            クリックまたはドラッグ&amp;ドロップ
          </span>
          <span className="text-[10px] text-white/30">MP3, WAV, OGG, FLAC, AAC, M4A, WebM</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="音声ファイル選択"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPlaying}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2
              text-xs font-medium text-white/80 transition-all duration-200
              hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Play size={12} />
            再生
          </button>
          <button
            type="button"
            onClick={onStop}
            disabled={!isPlaying}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2
              text-xs font-medium text-white/80 transition-all duration-200
              hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <Square size={12} />
            停止
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
