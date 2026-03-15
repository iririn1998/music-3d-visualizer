import { describe, it, expect, beforeEach } from 'vitest';
import { useAccessibilityStore } from '@/stores/accessibilityStore';

describe('accessibilityStore', () => {
  beforeEach(() => {
    useAccessibilityStore.setState({
      reducedMotion: false,
    });
  });

  it('has correct initial state', () => {
    const state = useAccessibilityStore.getState();
    expect(state.reducedMotion).toBe(false);
  });

  it('can set reducedMotion', () => {
    useAccessibilityStore.getState().setReducedMotion(true);
    expect(useAccessibilityStore.getState().reducedMotion).toBe(true);
  });
});
