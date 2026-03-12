import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// vi.hoisted で matchMedia stub を import より前に確定させる
const { mockMql, mockMatchMedia } = vi.hoisted(() => {
  const mockMql = {
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  const mockMatchMedia = vi.fn(() => mockMql);
  return { mockMql, mockMatchMedia };
});

vi.stubGlobal('matchMedia', mockMatchMedia);

import { useReducedMotionSync } from '@/hooks/useReducedMotionSync';
import { useAccessibilityStore } from '@/stores/accessibilityStore';

describe('useReducedMotionSync', () => {
  beforeEach(() => {
    useAccessibilityStore.setState({ reducedMotion: false });
    mockMql.addEventListener.mockClear();
    mockMql.removeEventListener.mockClear();
    mockMatchMedia.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('マウント時に matchMedia.matches=false をストアへ反映する', () => {
    mockMql.matches = false;
    renderHook(() => useReducedMotionSync());
    expect(useAccessibilityStore.getState().reducedMotion).toBe(false);
  });

  it('マウント時に matchMedia.matches=true をストアへ反映する', () => {
    mockMql.matches = true;
    renderHook(() => useReducedMotionSync());
    expect(useAccessibilityStore.getState().reducedMotion).toBe(true);
  });

  it('change イベントで reducedMotion が更新される', () => {
    mockMql.matches = false;
    renderHook(() => useReducedMotionSync());

    const handler = mockMql.addEventListener.mock.calls[0][1] as (e: { matches: boolean }) => void;
    handler({ matches: true });
    expect(useAccessibilityStore.getState().reducedMotion).toBe(true);

    handler({ matches: false });
    expect(useAccessibilityStore.getState().reducedMotion).toBe(false);
  });

  it('アンマウント時に change リスナーが解除される', () => {
    mockMql.matches = false;
    const { unmount } = renderHook(() => useReducedMotionSync());
    unmount();
    expect(mockMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
