import { useEffect, useRef, useCallback } from 'react';

/**
 * useInactivityTimer
 * - onWarn()      : appelé X minutes avant la déconnexion
 * - onLogout()    : appelé à l'expiration
 * - timeoutMin    : minutes d'inactivité avant déconnexion
 * - warningMin    : minutes avant déconnexion où on avertit
 * - enabled       : activer/désactiver le timer
 */
export function useInactivityTimer({ onWarn, onLogout, timeoutMin = 30, warningMin = 2, enabled = true }) {
  const logoutTimer  = useRef(null);
  const warnTimer    = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(logoutTimer.current);
    clearTimeout(warnTimer.current);
  }, []);

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    clearTimers();

    const timeoutMs = timeoutMin * 60 * 1000;
    const warningMs = (timeoutMin - warningMin) * 60 * 1000;

    if (warningMs > 0) {
      warnTimer.current = setTimeout(() => onWarn(), warningMs);
    }
    logoutTimer.current = setTimeout(() => onLogout(), timeoutMs);
  }, [enabled, timeoutMin, warningMin, onWarn, onLogout, clearTimers]);

  useEffect(() => {
    if (!enabled) { clearTimers(); return; }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handler = () => resetTimers();

    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetTimers();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      clearTimers();
    };
  }, [enabled, resetTimers, clearTimers]);

  return { resetTimers };
}
