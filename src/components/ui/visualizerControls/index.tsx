import { useState, type CSSProperties, type FC } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useAudioStore } from '@/stores/audioStore';
import { useThemeStore } from '@/stores/themeStore';
import type { VisualizerMode } from '@/types/audio';
import type { ColorPreset } from '@/types/theme';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Slider } from '@/components/ui/slider';
import { ToggleButton } from '@/components/ui/toggleButton';
import styles from './index.module.css';

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
    <div className={styles.root}>
      <GlassPanel>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className={styles.collapseButton}
        >
          <span className={styles.collapseLabel}>
            <Settings size={14} />
            Controls
          </span>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>

        {!collapsed && (
          <div className={styles.body}>
            <section>
              <h3 className={styles.sectionTitle}>Mode</h3>
              <div className={styles.modeRow}>
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
              <h3 className={styles.sectionTitle}>Color</h3>
              <div className={styles.colorRow}>
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPreset(option.value)}
                    title={option.label}
                    aria-label={option.label}
                    aria-pressed={preset === option.value}
                    className={`${styles.colorSwatch} ${preset === option.value ? styles.colorSwatchActive : ''}`}
                    style={
                      {
                        backgroundColor: option.color,
                        '--glow': option.color,
                        boxShadow: preset === option.value ? `0 0 8px ${option.color}` : undefined,
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            </section>

            <section>
              <h3 className={styles.sectionTitle}>Audio</h3>
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
