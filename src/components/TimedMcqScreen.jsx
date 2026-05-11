import { useState, useCallback, useRef, useEffect } from 'react';
import QuestionCard from './QuestionCard';

const TimedMcqScreen = ({ questions, studentInfo, assessment, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const startTime = useRef(Date.now());
  const mainRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const currentAnswer = answers[currentQuestion?.id];
  const hasAnswered = currentAnswer !== undefined && (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true);

  useEffect(() => {
    if (mainRef.current) mainRef.current.focus();
  }, [currentIndex]);

  const handleAnswerChange = useCallback((answer) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
  }, [currentQuestion?.id]);

  const handleQuestionClick = (idx) => {
    setCurrentIndex(idx);
    setVisitedQuestions(prev => new Set([...prev, idx]));
  };

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      setVisitedQuestions(prev => new Set([...prev, next]));
    }
  }, [currentIndex, totalQuestions]);

  const getEndTime = () => {
    if (!assessment?.endDateTime) return null;
    if (typeof assessment.endDateTime?.toDate === 'function') return assessment.endDateTime.toDate();
    return new Date(assessment.endDateTime);
  };

  const handleTimeUp = useCallback(() => {
    const taken = Math.floor((Date.now() - startTime.current) / 1000);
    onComplete(answers, taken);
  }, [answers, onComplete]);

  const handleSubmit = useCallback(() => {
    const taken = Math.floor((Date.now() - startTime.current) / 1000);
    onComplete(answers, taken);
  }, [answers, onComplete]);

  const handleClearAnswer = () => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const getQuestionStatus = (q, idx) => {
    if (idx === currentIndex) return 'current';
    const isVisited = visitedQuestions.has(idx);
    const isAnswered = answers[q.id] !== undefined && (Array.isArray(answers[q.id]) ? answers[q.id].length > 0 : true);
    if (!isVisited) return 'unvisited';
    if (isAnswered) return 'answered';
    return 'skipped';
  };

  const answeredCount = questions.filter(q => {
    const a = answers[q.id];
    return a !== undefined && (Array.isArray(a) ? a.length > 0 : true);
  }).length;
  const skippedCount = visitedQuestions.size - answeredCount;
  const remainingCount = totalQuestions - visitedQuestions.size;

  const endTime = getEndTime();

  return (
    <div
      className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 animate-fadeIn min-h-[calc(100vh-140px)] px-4"
      ref={mainRef}
      tabIndex={-1}
    >
      <div className="flex-1 flex flex-col min-w-0 order-2 lg:order-1">
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          selectedAnswer={currentAnswer}
          onAnswerChange={handleAnswerChange}
          onClearAnswer={handleClearAnswer}
        />

        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 flex-shrink-0 gap-3">
          <div className="text-sm text-center sm:text-left">
            {!hasAnswered ? (
              <span className="text-gray-500 dark:text-gray-400">📝 Unattempted question</span>
            ) : (
              <span className="text-green-400">✅ Answered</span>
            )}
          </div>

          <div className="flex gap-3">
            {!isLastQuestion ? (
              <button
                className="px-4 sm:px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all flex items-center gap-2"
                onClick={handleNext}
              >
                Next 👉
              </button>
            ) : (
              <button
                className="px-4 sm:px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-all flex items-center gap-2"
                onClick={handleSubmit}
              >
                Submit ✅
              </button>
            )}
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 order-1 lg:order-2">
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900 dark:text-white">{studentInfo.firstName} {studentInfo.lastName}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Roll: {studentInfo.rollNumber}</div>
            </div>
            {/* {endTime && <TimerDisplay endTime={endTime} />} */}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <div className="flex gap-3 mb-4 flex-wrap justify-center text-xs">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary" /> Current</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500" /> Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500" /> Skipped</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" /> Unvisited</span>
          </div>

          <div className="grid grid-cols-5 gap-2 mb-4">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q, idx);
              const bg = status === 'current' ? 'bg-primary' :
                status === 'answered' ? 'bg-green-500' :
                status === 'skipped' ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600';
              return (
                <button
                  key={q.id}
                  className={`w-9 h-9 rounded-lg font-medium text-sm text-white ${bg} hover:opacity-80 transition-all`}
                  onClick={() => handleQuestionClick(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Answered:</span><span className="text-green-400 font-medium">{answeredCount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Skipped:</span><span className="text-yellow-400 font-medium">{skippedCount}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Unvisited:</span><span className="text-gray-500 dark:text-gray-400 font-medium">{remainingCount}</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
};

const TimerDisplay = ({ endTime }) => {
  const calcRemaining = () => Math.max(0, Math.floor((endTime - new Date()) / 1000));
  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (remaining <= 0) return <span className="text-red-400 font-bold">Expired</span>;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isWarning = remaining <= 180;
  const isCritical = remaining <= 60;

  return (
    <div className={`px-3 py-1.5 rounded-xl border font-mono font-bold text-base sm:text-lg flex items-center gap-2 ${isCritical ? 'bg-red-500/20 border-red-500/50 text-red-400 animate-pulse' : isWarning ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-black/5 dark:bg-white/10 border-gray-300 dark:border-white/20 text-gray-900 dark:text-white'}`}>
      <span>{isCritical ? '🔴' : isWarning ? '🟡' : '⏱️'}</span>
      <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
    </div>
  );
};

export default TimedMcqScreen;
