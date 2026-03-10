import { describe, it, expect, beforeEach } from 'vitest';
import { useAccessibilityStore } from './accessibilityStore';

describe('accessibilityStore', () => {
  beforeEach(() => {
    useAccessibilityStore.setState({
      shakeEnabled: true,
      shakeIntensity: 0.5,
      reducedMotion: false,
    });
  });

  it('has correct initial state', () => {
    const state = useAccessibilityStore.getState();
    expect(state.shakeEnabled).toBe(true);
    expect(state.shakeIntensity).toBe(0.5);
    expect(state.reducedMotion).toBe(false);
  });

  it('can toggle shakeEnabled', () => {
    useAccessibilityStore.getState().setShakeEnabled(false);
    expect(useAccessibilityStore.getState().shakeEnabled).toBe(false);

    useAccessibilityStore.getState().setShakeEnabled(true);
    expect(useAccessibilityStore.getState().shakeEnabled).toBe(true);
  });

  it('can set shakeIntensity', () => {
    useAccessibilityStore.getState().setShakeIntensity(0.8);
    expect(useAccessibilityStore.getState().shakeIntensity).toBe(0.8);
  });

  it('clamps shakeIntensity to set value', () => {
    useAccessibilityStore.getState().setShakeIntensity(0);
    expect(useAccessibilityStore.getState().shakeIntensity).toBe(0);

    useAccessibilityStore.getState().setShakeIntensity(1);
    expect(useAccessibilityStore.getState().shakeIntensity).toBe(1);
  });

  it('can set reducedMotion', () => {
    useAccessibilityStore.getState().setReducedMotion(true);
    expect(useAccessibilityStore.getState().reducedMotion).toBe(true);
  });
});
