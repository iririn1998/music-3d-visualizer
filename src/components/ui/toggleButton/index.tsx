import type { FC, ReactNode } from 'react';

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
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200
        ${
          active
            ? 'bg-white/20 text-white shadow-[0_0_8px_rgba(255,255,255,0.15)]'
            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
        }`}
    >
      {children}
    </button>
  );
};

export { ToggleButton };
