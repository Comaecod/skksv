import { useState, useEffect, useRef } from 'react';

const Timer = ({ minutes, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(minutes > 0 ? minutes * 60 : 0);
  const [elapsed, setElapsed] = useState(0);
  const isCountdown = minutes > 0;
  
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const hasTriggered = useRef(false);

  useEffect(() => {
    if (isCountdown && timeLeft <= 0 && !hasTriggered.current) {
      hasTriggered.current = true;
      setTimeout(() => onTimeUpRef.current(), 0);
      return;
    }

    const interval = setInterval(() => {
      if (isCountdown) {
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
      } else {
        setElapsed(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isCountdown]);

  const display = isCountdown ? timeLeft : elapsed;
  const mins = Math.floor(display / 60);
  const secs = display % 60;

  const isWarning = isCountdown ? timeLeft <= 180 : false;
  const isCritical = isCountdown ? timeLeft <= 60 : false;

  const getColor = () => {
    if (!isCountdown) return 'text-gray-400 dark:text-gray-400';
    if (isCritical) return 'text-red-400';
    if (isWarning) return 'text-yellow-400';
    return 'text-gray-900 dark:text-white';
  };

  const getBgColor = () => {
    if (!isCountdown) return 'bg-black/5 dark:bg-white/10 border-gray-300 dark:border-white/20';
    if (isCritical) return 'bg-red-500/20 dark:bg-red-500/20 border-red-500/50 dark:border-red-500/50';
    if (isWarning) return 'bg-yellow-500/20 dark:bg-yellow-500/20 border-yellow-500/50 dark:border-yellow-500/50';
    return 'bg-black/5 dark:bg-white/10 border-gray-300 dark:border-white/20';
  };

  const getAriaLabel = () => {
    if (isCountdown) {
      if (isCritical) return `Time remaining: ${mins} minutes and ${secs} seconds, critical`;
      if (isWarning) return `Time remaining: ${mins} minutes and ${secs} seconds, warning`;
      return `Time remaining: ${mins} minutes and ${secs} seconds`;
    }
    return `Elapsed time: ${mins} minutes and ${secs} seconds`;
  };

  return (
    <div 
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border ${getBgColor()} ${getColor()} font-mono font-bold text-base sm:text-lg flex items-center gap-2 ${isCountdown && isCritical ? 'animate-pulse' : ''}`}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      aria-label={getAriaLabel()}
    >
      <span aria-hidden="true">{isCountdown ? (isCritical ? '🔴' : isWarning ? '🟡' : '⏱️') : '⏱️'}</span>
      <span aria-hidden="true">{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
    </div>
  );
};

export default Timer;