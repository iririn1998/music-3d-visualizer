import type { FC, ReactNode } from 'react';
import styles from './index.module.css';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

const GlassPanel: FC<GlassPanelProps> = ({ children, className = '' }) => {
  return <div className={`${styles.panel} ${className}`}>{children}</div>;
};

export { GlassPanel };
