import type { FC, ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

const GlassPanel: FC<GlassPanelProps> = ({ children, className = '' }) => {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
};

export { GlassPanel };
