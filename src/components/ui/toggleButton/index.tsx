import type { FC, ReactNode } from 'react';
import styles from './index.module.css';

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  ariaLabel?: string;
}

const ToggleButton: FC<ToggleButtonProps> = ({ active, onClick, children, title, ariaLabel }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      aria-label={ariaLabel ?? title}
      className={`${styles.button} ${active ? styles.active : ''}`}
    >
      {children}
    </button>
  );
};

export { ToggleButton };
