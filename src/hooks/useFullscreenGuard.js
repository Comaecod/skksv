import { useState, useEffect, useRef, useCallback } from 'react';

const VIOLATION_TIMEOUT = parseInt(import.meta.env.VITE_FULLSCREEN_TIMEOUT, 10) || 5;

export default function useFullscreenGuard({ onViolation, enabled = true }) {
  const [violation, setViolation] = useState(false);
  const [countdown, setCountdown] = useState(VIOLATION_TIMEOUT);
  const intervalRef = useRef(null);
  const violatingRef = useRef(false);
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  const reset = useCallback(() => {
    violatingRef.current = false;
    setViolation(false);
    setCountdown(VIOLATION_TIMEOUT);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (violatingRef.current) return;
    violatingRef.current = true;
    setViolation(true);
    setCountdown(VIOLATION_TIMEOUT);
    intervalRef.current = setInterval(() => {
      if (!violatingRef.current) return;
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          onViolationRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const tryEnterFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        reset();
      } else {
        start();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        start();
      } else {
        tryEnterFullscreen();
        reset();
      }
    };

    const handleBlur = () => start();
    const handleFocus = () => {
      tryEnterFullscreen();
      reset();
    };

    // Detect F11 or any browser-level fullscreen toggling (doesn't fire fullscreenchange)
    const handleResize = () => {
      if (!violatingRef.current) return;
      const isFullscreenSize = Math.abs(window.innerWidth - screen.width) <= 2
        && Math.abs(window.innerHeight - screen.height) <= 2;
      if (isFullscreenSize) {
        tryEnterFullscreen();
        reset();
      }
    };

    // Intercept F11 to use Fullscreen API instead of browser-level fullscreen
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resize', handleResize);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, start, reset, tryEnterFullscreen]);

  return { violation, countdown };
}
