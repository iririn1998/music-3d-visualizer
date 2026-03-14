import clsx from 'clsx';
import type { FC, ReactNode } from 'react';
import styles from './index.module.css';

type ToggleButtonProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
  ariaLabel?: string;
};

export const ToggleButton: FC<ToggleButtonProps> = ({
  active,
  onClick,
  children,
  title,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      aria-label={ariaLabel ?? title}
      className={clsx(styles.button, active && styles.active)}
    >
      {children}
    </button>
  );
};
