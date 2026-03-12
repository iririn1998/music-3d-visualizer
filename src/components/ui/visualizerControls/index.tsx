import { useState, type CSSProperties, type FC } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';
import { useThemeStore } from '@/stores/themeStore';
import type { VisualizerMode } from '@/types/audio';
import type { ColorPreset } from '@/types/theme';
import { GlassPanel } from '@/components/ui/glassPanel';
import { Slider } from '@/components/ui/slider';
import { ToggleButton } from '@/components/ui/toggleButton';

const MODE_OPTIONS: { value: VisualizerMode; label: string }[] = [
  { value: 'core', label: 'Pulsing Core' },
  { value: 'horizon', label: 'Digital Horizon' },
  { value: 'vortex', label: 'Stardust Vortex' },
];

const COLOR_OPTIONS: { value: ColorPreset; label: string; color: string }[] = [
  { value: 'neonPink', label: 'Neon Pink', color: '#ff44aa' },
  { value: 'electricBlue', label: 'Electric Blue', color: '#4488ff' },
  { value: 'cyberLime', label: 'Cyber Lime', color: '#44ff88' },
  { value: 'solarFlare', label: 'Solar Flare', color: '#ff8844' },
];

const VisualizerControls: FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  const mode = useAudioStore((s) => s.mode);
  const setMode = useAudioStore((s) => s.setMode);
  const sensitivity = useAudioStore((s) => s.sensitivity);
  const setSensitivity = useAudioStore((s) => s.setSensitivity);

  const preset = useThemeStore((s) => s.preset);
  const setPreset = useThemeStore((s) => s.setPreset);

  return (
    <div className="pointer-events-auto w-64">
      <GlassPanel>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="flex w-full items-center justify-between text-sm font-semibold text-white/90"
        >
          <span className="flex items-center gap-2">
            <Settings size={14} />
            Controls
          </span>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsed && (
          <div className="mt-3 flex flex-col gap-4">
            <section>
              <h3 className="mb-2 text-xs font-medium text-white/50 uppercase">Mode</h3>
              <div className="flex gap-1">
                {MODE_OPTIONS.map((option) => (
                  <ToggleButton
                    key={option.value}
                    active={mode === option.value}
                    onClick={() => setMode(option.value)}
                    title={option.label}
                  >
                    {option.label.split(' ')[0]}
                  </ToggleButton>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium text-white/50 uppercase">Color</h3>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreset(option.value)}
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={preset === option.value}
                    className={`h-6 w-6 rounded-full border-2 transition-all duration-200
                      ${
                        preset === option.value
                          ? 'scale-110 border-white shadow-[0_0_8px_var(--glow)]'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    style={
                      {
                        backgroundColor: option.color,
                        '--glow': option.color,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-medium text-white/50 uppercase">Audio</h3>
              <Slider
                label="Sensitivity"
                value={sensitivity}
                min={0.1}
                max={2.0}
                step={0.05}
                onChange={setSensitivity}
                formatValue={(value) => `${(value * 100).toFixed(0)}%`}
              />
            </section>
          </div>
        )}
      </GlassPanel>
    </div>
  );
};

export { VisualizerControls };
