interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}

export function ToggleButton({ active, onClick, children, title }: ToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
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
}
