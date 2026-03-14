import { useEffect } from 'react';
import { useAccessibilityStore } from '@/stores/accessibilityStore';

/**
 * prefers-reduced-motion メディアクエリの変化を監視し、
 * accessibilityStore へ自動反映するフック。
 */
export const useReducedMotionSync = () => {
  const setReducedMotion = useAccessibilityStore((s) => s.setReducedMotion);

  useEffect(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setReducedMotion]);
};
