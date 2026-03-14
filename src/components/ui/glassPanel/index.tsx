import clsx from 'clsx';
import type { FC, ReactNode } from 'react';
import styles from './index.module.css';

type GlassPanelProps = {
  children: ReactNode;
  className?: string;
};

export const GlassPanel: FC<GlassPanelProps> = ({ children, className }) => {
  return <div className={clsx(styles.panel, className)}>{children}</div>;
};
