import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQualityManager } from '@/hooks/useQualityManager';
import { useQualityStore } from '@/stores/qualityStore';

// ---------------------------------------------------------------------------
// Constants mirrored from the hook (kept in sync manually)
// ---------------------------------------------------------------------------
const DOWNGRADE_THRESHOLD_FPS = 30;
const UPGRADE_THRESHOLD_FPS = 55;
const UPGRADE_WAIT_SECONDS = 8.0;

// ---------------------------------------------------------------------------
// Mock @react-three/fiber so useFrame works outside of a Canvas
// ---------------------------------------------------------------------------
type FrameCallback = (state: object, delta: number) => void;
let capturedCallback: FrameCallback = () => {};

vi.mock('@react-three/fiber', () => ({
  useFrame: (cb: FrameCallback) => {
    capturedCallback = cb;
  },
}));

// ---------------------------------------------------------------------------
// Helper: simulate one FPS-sample interval (~1 second) at a given frame rate.
//
// Runs `fps` frames each with delta = 1.05 / fps so that:
//   elapsed = fps × (1.05 / fps) = 1.05 > FPS_SAMPLE_INTERVAL (1.0)
//   computed FPS = fps / 1.05 ≈ fps × 0.952
//
// Chosen multiplier (1.05) keeps every test FPS well clear of both thresholds:
//   low  FPS (20) → ~19   < DOWNGRADE_THRESHOLD_FPS (30)  ✓
//   mid  FPS (40) → ~38   between 30 and 55               ✓ (dead zone)
//   high FPS (60) → ~57.1 > UPGRADE_THRESHOLD_FPS   (55)  ✓
// ---------------------------------------------------------------------------
function simulateSecond(fps: number): void {
  const delta = 1.05 / fps;
  for (let i = 0; i < fps; i++) {
    capturedCallback({}, delta);
  }
}

// ---------------------------------------------------------------------------
// Preset helpers to reduce repetition
// ---------------------------------------------------------------------------
function setQuality(level: 'low' | 'medium' | 'high') {
  useQualityStore.getState().setQuality(level);
}

describe('useQualityManager', () => {
  beforeEach(() => {
    capturedCallback = () => {};
    useQualityStore.setState({
      settings: {
        level: 'high',
        particleCount: 10000,
        geometryDetail: 3,
        dpr: 2,
        bloomEnabled: true,
      },
      autoMode: true,
    });
  });

  // -------------------------------------------------------------------------
  // autoMode guard
  // -------------------------------------------------------------------------

  it('does nothing when autoMode is disabled', () => {
    useQualityStore.getState().setAutoMode(false);
    renderHook(() => useQualityManager());
    simulateSecond(20); // critically low FPS, but gate is closed
    expect(useQualityStore.getState().settings.level).toBe('high');
  });

  // -------------------------------------------------------------------------
  // Downgrade logic (immediate)
  // -------------------------------------------------------------------------

  it(`downgrades immediately when FPS drops below ${DOWNGRADE_THRESHOLD_FPS}`, () => {
    renderHook(() => useQualityManager());
    simulateSecond(20); // ~19 FPS → below threshold
    expect(useQualityStore.getState().settings.level).toBe('medium');
  });

  it('downgrades a second time when critically low FPS persists', () => {
    renderHook(() => useQualityManager());
    simulateSecond(20); // high → medium
    simulateSecond(20); // medium → low
    expect(useQualityStore.getState().settings.level).toBe('low');
  });

  it('does not downgrade below low', () => {
    setQuality('low');
    renderHook(() => useQualityManager());
    simulateSecond(20);
    expect(useQualityStore.getState().settings.level).toBe('low');
  });

  // -------------------------------------------------------------------------
  // Upgrade logic (hysteresis: requires UPGRADE_WAIT_SECONDS of sustained FPS)
  // -------------------------------------------------------------------------

  it(`does not upgrade before ${UPGRADE_WAIT_SECONDS} consecutive seconds of high FPS`, () => {
    setQuality('medium');
    renderHook(() => useQualityManager());
    for (let i = 0; i < UPGRADE_WAIT_SECONDS - 1; i++) simulateSecond(60);
    expect(useQualityStore.getState().settings.level).toBe('medium');
  });

  it(`upgrades after sustaining FPS ≥ ${UPGRADE_THRESHOLD_FPS} for ${UPGRADE_WAIT_SECONDS} consecutive seconds`, () => {
    setQuality('medium');
    renderHook(() => useQualityManager());
    for (let i = 0; i < UPGRADE_WAIT_SECONDS; i++) simulateSecond(60);
    expect(useQualityStore.getState().settings.level).toBe('high');
  });

  it('does not upgrade above high', () => {
    renderHook(() => useQualityManager());
    for (let i = 0; i < UPGRADE_WAIT_SECONDS + 2; i++) simulateSecond(60);
    expect(useQualityStore.getState().settings.level).toBe('high');
  });

  // -------------------------------------------------------------------------
  // Upgrade-timer reset (hysteresis: FPS dip resets the timer)
  // -------------------------------------------------------------------------

  it('resets upgrade timer when FPS dips into the dead zone (30–55)', () => {
    setQuality('medium');
    renderHook(() => useQualityManager());
    // Accumulate upgrade timer for 5 seconds
    for (let i = 0; i < 5; i++) simulateSecond(60);
    // One second in the dead zone (38 FPS) resets the timer
    simulateSecond(40);
    // Only 7 more seconds of high FPS (5+1 reset = need 8 fresh) → no upgrade
    for (let i = 0; i < 7; i++) simulateSecond(60);
    expect(useQualityStore.getState().settings.level).toBe('medium');
  });

  it('resets upgrade timer on downgrade', () => {
    setQuality('medium');
    renderHook(() => useQualityManager());
    // Accumulate 5 seconds of good FPS then crash → downgrade, timer resets
    for (let i = 0; i < 5; i++) simulateSecond(60);
    simulateSecond(20); // downgrade medium → low, timer = 0
    // 7 more good seconds from low quality: timer reaches 7, not 8 → no upgrade
    for (let i = 0; i < 7; i++) simulateSecond(60);
    expect(useQualityStore.getState().settings.level).toBe('low');
  });
});
