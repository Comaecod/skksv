import { useState, useEffect, useRef } from 'react';

const Timer = ({ minutes, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(minutes * 60);
  
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const hasTriggered = useRef(false);

  useEffect(() => {
    if (timeLeft <= 0 && !hasTriggered.current) {
      hasTriggered.current = true;
      setTimeout(() => onTimeUpRef.current(), 0);
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!hasTriggered.current) {
            hasTriggered.current = true;
            setTimeout(() => onTimeUpRef.current(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  if (minutes <= 0) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isWarning = timeLeft <= 180;
  const isCritical = timeLeft <= 60;

  const getColor = () => {
    if (isCritical) return 'text-red-400';
    if (isWarning) return 'text-yellow-400';
    return 'text-gray-900 dark:text-white';
  };

  const getBgColor = () => {
    if (isCritical) return 'bg-red-500/20 dark:bg-red-500/20 border-red-500/50 dark:border-red-500/50';
    if (isWarning) return 'bg-yellow-500/20 dark:bg-yellow-500/20 border-yellow-500/50 dark:border-yellow-500/50';
    return 'bg-black/5 dark:bg-white/10 border-gray-300 dark:border-white/20';
  };

  const getAriaLabel = () => {
    if (isCritical) return `Time remaining: ${mins} minutes and ${secs} seconds, critical`;
    if (isWarning) return `Time remaining: ${mins} minutes and ${secs} seconds, warning`;
    return `Time remaining: ${mins} minutes and ${secs} seconds`;
  };

  return (
    <div 
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border ${getBgColor()} ${getColor()} font-mono font-bold text-base sm:text-lg flex items-center gap-2 ${isCritical ? 'animate-pulse' : ''}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={getAriaLabel()}
    >
      <span aria-hidden="true">{isCritical ? '🔴' : isWarning ? '🟡' : '⏱️'}</span>
      <span aria-hidden="true">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
    </div>
  );
};

export default Timer;