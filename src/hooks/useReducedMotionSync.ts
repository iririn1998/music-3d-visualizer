import { useEffect } from 'react';
import { useAccessibilityStore } from '../stores/accessibilityStore';

/**
 * prefers-reduced-motion メディアクエリの変化を監視し、
 * accessibilityStore へ自動反映するフック。
 */
export function useReducedMotionSync() {
  const setReducedMotion = useAccessibilityStore((s) => s.setReducedMotion);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [setReducedMotion]);
}
