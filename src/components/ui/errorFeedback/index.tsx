import clsx from 'clsx';
import type { FC } from 'react';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useErrorStore } from '@/stores/errorStore';
import styles from './index.module.css';

export const ErrorFeedback: FC = () => {
  const errors = useErrorStore((s) => s.errors);
  const dismissError = useErrorStore((s) => s.dismissError);

  if (errors.length === 0) return null;

  return (
    <div className={styles.root}>
      {errors.map((error) => (
        <div
          key={error.id}
          role="alert"
          className={clsx(
            styles.alert,
            error.type === 'error' ? styles.alertError : styles.alertWarning,
          )}
        >
          {error.type === 'error' ? (
            <AlertCircle size={16} className={styles.alertIcon} />
          ) : (
            <AlertTriangle size={16} className={styles.alertIcon} />
          )}
          <p className={styles.alertMessage}>{error.message}</p>
          {error.dismissible && (
            <button
              type="button"
              onClick={() => dismissError(error.id)}
              className={styles.dismissButton}
              aria-label="閉じる"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};
