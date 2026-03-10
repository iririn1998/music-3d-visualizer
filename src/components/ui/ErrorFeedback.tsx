import { X, AlertTriangle, AlertCircle } from 'lucide-react';
import { useErrorStore } from '../../stores/errorStore';

export function ErrorFeedback() {
  const errors = useErrorStore((s) => s.errors);
  const dismissError = useErrorStore((s) => s.dismissError);

  if (errors.length === 0) return null;

  return (
    <div className="pointer-events-auto flex w-80 flex-col gap-2">
      {errors.map((error) => (
        <div
          key={error.id}
          role="alert"
          className={`flex items-start gap-2 rounded-xl border p-3 shadow-lg backdrop-blur-xl
            ${
              error.type === 'error'
                ? 'border-red-400/20 bg-red-500/10 text-red-300'
                : 'border-yellow-400/20 bg-yellow-500/10 text-yellow-300'
            }`}
        >
          {error.type === 'error' ? (
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <p className="flex-1 text-xs leading-relaxed">{error.message}</p>
          {error.dismissible && (
            <button
              type="button"
              onClick={() => dismissError(error.id)}
              className="shrink-0 rounded p-0.5 transition-colors hover:bg-white/10"
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
