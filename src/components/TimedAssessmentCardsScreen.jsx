import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { toDate } from '../services/assessmentService';
import { subjectLabel } from '../utils/format';

const CountdownTimer = ({ endDateTime }) => {
  const getEndTime = () => toDate(endDateTime);

  const calcTimeLeft = () => {
    const diff = getEndTime() - new Date();
    if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      total: diff,
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000)
    };
  };

  const [timeLeft, setTimeLeft] = useState(calcTimeLeft);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(calcTimeLeft());
    intervalRef.current = setInterval(() => {
      const tl = calcTimeLeft();
      setTimeLeft(tl);
      if (tl.total <= 0) clearInterval(intervalRef.current);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [endDateTime]);

  if (timeLeft.total <= 0) return <span className="text-red-400 font-semibold">Expired</span>;

  const parts = [];
  if (timeLeft.days > 0) parts.push(`${timeLeft.days}d`);
  if (timeLeft.hours > 0 || timeLeft.days > 0) parts.push(`${String(timeLeft.hours).padStart(2, '0')}h`);
  parts.push(`${String(timeLeft.minutes).padStart(2, '0')}m`);
  parts.push(`${String(timeLeft.seconds).padStart(2, '0')}s`);

  const isWarning = timeLeft.total < 300000;
  const isCritical = timeLeft.total < 60000;

  return (
    <span className={`font-mono font-bold text-sm ${isCritical ? 'text-red-400 animate-pulse' : isWarning ? 'text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
      Ends in {parts.join(' ')}
    </span>
  );
};

const StatusBadge = ({ startDateTime, endDateTime }) => {
  const now = new Date();
  const start = toDate(startDateTime);
  const end = toDate(endDateTime);

  if (now < start) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Upcoming</span>;
  if (now > end) return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Expired</span>;
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Active</span>;
};

const AssessmentTypeBadge = ({ type }) => {
  const labels = { mcq: 'MCQ Test', project: 'Project', hybrid: 'Hybrid' };
  const colors = {
    mcq: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    project: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    hybrid: 'bg-teal-500/20 text-teal-400 border-teal-500/30'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[type] || colors.mcq}`}>
      {labels[type] || type}
    </span>
  );
};

const TimedAssessmentCardsScreen = ({ classNum, subject, assessments, isLoading, onSelect, onBack }) => {
  return (
    <div className="glass-card w-full max-w-2xl animate-slideUp">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">⏱️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timed Assessments</h2>
        <p className="text-gray-500 dark:text-gray-400">Class {classNum} - {subjectLabel(subject)}</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading assessments...</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400">No assessments available</p>
        </div>
      ) : (
        <div className="space-y-4 mb-8">
          {assessments.map((asm) => (
            <div
              key={asm.id}
              className="w-full p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-base">{asm.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{asm.description || ''}</div>
                </div>
                <StatusBadge startDateTime={asm.startDateTime} endDateTime={asm.endDateTime} />
              </div>

              <div className="flex items-center gap-3 flex-wrap mb-4">
                <AssessmentTypeBadge type={asm.assessmentFormat} />
                <CountdownTimer endDateTime={asm.endDateTime} />
                {asm.assessmentFormat === 'mcq' && asm.totalQuestions && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{asm.totalQuestions} questions</span>
                )}
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onSelect(asm.id)}
                  className="w-full px-4 py-2.5 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all text-sm"
                >
                  Start Assessment →
                </motion.button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
        >
          ← Back to Subject Selection
        </button>
      </div>
    </div>
  );
};

export default TimedAssessmentCardsScreen;
