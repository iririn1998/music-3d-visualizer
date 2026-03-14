import type { FC } from 'react';
import { Accessibility } from 'lucide-react';
import { useAccessibilityStore } from '@/stores/accessibilityStore';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { Slider } from '@/components/ui/slider';
import styles from './index.module.css';

const AccessibilityPanel: FC = () => {
  const shakeEnabled = useAccessibilityStore((s) => s.shakeEnabled);
  const setShakeEnabled = useAccessibilityStore((s) => s.setShakeEnabled);
  const shakeIntensity = useAccessibilityStore((s) => s.shakeIntensity);
  const setShakeIntensity = useAccessibilityStore((s) => s.setShakeIntensity);
  const reducedMotion = useAccessibilityStore((s) => s.reducedMotion);

  return (
    <div className={styles.root}>
      <GlassPanel>
        <h3 className={styles.heading}>
          <Accessibility size={14} />
          Accessibility
        </h3>

        {reducedMotion && (
          <div className={styles.warning}>
            システムの「視覚効果を減らす」設定が有効です。アニメーションが抑制されます。
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.switchRow}>
            <span id="camera-shake-label" className={styles.switchLabel}>
              Camera Shake
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={shakeEnabled}
              aria-labelledby="camera-shake-label"
              onClick={() => setShakeEnabled(!shakeEnabled)}
              className={`${styles.switchTrack} ${shakeEnabled ? styles.switchTrackOn : ''}`}
            >
              <span
                className={`${styles.switchThumb} ${shakeEnabled ? styles.switchThumbOn : ''}`}
              />
            </button>
          </div>

          {shakeEnabled && (
            <Slider
              label="Shake Intensity"
              value={shakeIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={setShakeIntensity}
              formatValue={(value) => `${(value * 100).toFixed(0)}%`}
            />
          )}
        </div>
      </GlassPanel>
    </div>
  );
};

export { AccessibilityPanel };
