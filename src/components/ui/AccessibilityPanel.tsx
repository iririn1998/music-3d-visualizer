import { Accessibility } from 'lucide-react';
import { useAccessibilityStore } from '../../stores/accessibilityStore';
import { GlassPanel } from './GlassPanel';
import { Slider } from './Slider';

export function AccessibilityPanel() {
  const shakeEnabled = useAccessibilityStore((s) => s.shakeEnabled);
  const setShakeEnabled = useAccessibilityStore((s) => s.setShakeEnabled);
  const shakeIntensity = useAccessibilityStore((s) => s.shakeIntensity);
  const setShakeIntensity = useAccessibilityStore((s) => s.setShakeIntensity);
  const reducedMotion = useAccessibilityStore((s) => s.reducedMotion);

  return (
    <div className="pointer-events-auto w-64">
      <GlassPanel>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
          <Accessibility size={14} />
          Accessibility
        </h3>

        {reducedMotion && (
          <div className="mb-3 rounded-lg bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300/80">
            システムの「視覚効果を減らす」設定が有効です。アニメーションが抑制されます。
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between">
            <span className="text-xs text-white/70">Camera Shake</span>
            <button
              type="button"
              role="switch"
              aria-checked={shakeEnabled}
              onClick={() => setShakeEnabled(!shakeEnabled)}
              className={`relative h-5 w-9 rounded-full transition-colors duration-200
                ${shakeEnabled ? 'bg-white/30' : 'bg-white/10'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200
                  ${shakeEnabled ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>
          </label>

          {shakeEnabled && (
            <Slider
              label="Shake Intensity"
              value={shakeIntensity}
              min={0}
              max={1}
              step={0.05}
              onChange={setShakeIntensity}
              formatValue={(v) => `${(v * 100).toFixed(0)}%`}
            />
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
