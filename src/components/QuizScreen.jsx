import { useState, useCallback, useRef, useEffect } from 'react';
import Timer from './Timer';
import QuestionCard from './QuestionCard';

const QuizScreen = ({ 
  questions, 
  studentInfo, 
  timeLimitMinutes,
  wrongAnswerPenaltyFraction,
  onQuizComplete 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const mainRef = useRef(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const currentAnswer = answers[currentQuestion.id];
  const hasAnswered = currentAnswer !== undefined && 
    (Array.isArray(currentAnswer) ? currentAnswer.length > 0 : true);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus();
    }
  }, [currentIndex]);

  const handleAnswerChange = useCallback((answer) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  }, [currentQuestion.id]);

  const handleQuestionClick = (index) => {
    setCurrentIndex(index);
    setVisitedQuestions(prev => new Set([...prev, index]));
  };

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setVisitedQuestions(prev => new Set([...prev, nextIndex]));
    }
  }, [currentIndex, totalQuestions]);

  const handleTimeUp = useCallback(() => {
    onQuizComplete(answers);
  }, [answers, onQuizComplete]);

  const handleSubmit = useCallback(() => {
    onQuizComplete(answers);
  }, [answers, onQuizComplete]);

  const handleClearAnswer = () => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[currentQuestion.id];
      return newAnswers;
    });
  };

  const isLastQuestion = currentIndex === totalQuestions - 1;

  const getQuestionStatus = (question, index) => {
    if (index === currentIndex) return 'current';
    
    const isVisited = visitedQuestions.has(index);
    const isAnswered = answers[question.id] !== undefined &&
      (Array.isArray(answers[question.id]) ? answers[question.id].length > 0 : true);
    
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

  const handleKeyDown = useCallback((e) => {
    const target = e.target;
    const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    
    if (isInputFocused) return;

    const key = e.key.toUpperCase();
    const optionKeys = ['A', 'B', 'C', 'D'];
    const currentOptions = currentQuestion?.options || [];

    if (optionKeys.includes(key) && currentOptions.length > 0) {
      e.preventDefault();
      const optionIndex = optionKeys.indexOf(key);
      if (optionIndex < currentOptions.length) {
        if (currentQuestion.type === 'multiple') {
          const current = answers[currentQuestion.id] || [];
          const newAnswer = current.includes(optionIndex)
            ? current.filter(i => i !== optionIndex)
            : [...current, optionIndex];
          handleAnswerChange(newAnswer);
        } else {
          handleAnswerChange(optionIndex);
        }
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (isLastQuestion) {
        handleSubmit();
      } else {
        handleNext();
      }
    }

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      if (currentIndex < totalQuestions - 1) {
        e.preventDefault();
        handleQuestionClick(currentIndex + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (currentIndex > 0) {
        e.preventDefault();
        handleQuestionClick(currentIndex - 1);
      }
    }

    if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') {
      e.preventDefault();
      const numIndex = parseInt(e.key) - 1;
      if (numIndex < currentOptions.length) {
        if (currentQuestion.type === 'multiple') {
          const current = answers[currentQuestion.id] || [];
          const newAnswer = current.includes(numIndex)
            ? current.filter(i => i !== numIndex)
            : [...current, numIndex];
          handleAnswerChange(newAnswer);
        } else {
          handleAnswerChange(numIndex);
        }
      }
    }
  }, [currentQuestion, answers, currentIndex, totalQuestions, isLastQuestion, handleAnswerChange, handleNext, handleSubmit, handleQuestionClick]);

  return (
    <div 
      className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 animate-fadeIn min-h-[calc(100vh-140px)]"
      ref={mainRef}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Quiz"
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
              wrongAnswerPenaltyFraction > 0 ? (
                <span className="text-yellow-400 dark:text-yellow-400">📝 Unattempted (wrong answers have -{wrongAnswerPenaltyFraction * 100}% penalty)</span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">📝 Unattempted question</span>
              )
            ) : (
              <span className="text-green-400">✅ Answered</span>
            )}
          </div>
          
          <div className="flex gap-3">
            {!isLastQuestion ? (
              <button 
                className="px-4 sm:px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all flex items-center gap-2" 
                onClick={handleNext}
                aria-label="Go to next question"
              >
                Next <span aria-hidden="true">👉</span>
              </button>
            ) : (
              <button 
                className="px-4 sm:px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:opacity-90 transition-all flex items-center gap-2" 
                onClick={handleSubmit}
                aria-label="Submit quiz"
              >
                Submit Quiz <span aria-hidden="true">✅</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <aside 
        className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 order-1 lg:order-2"
        aria-label="Quiz navigation"
      >
        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold text-gray-900 dark:text-white">{studentInfo.firstName} {studentInfo.lastName}</div>
              <div className="text-gray-500 dark:text-gray-400 text-sm">Roll: {studentInfo.rollNumber}</div>
            </div>
            <Timer minutes={timeLimitMinutes} onTimeUp={handleTimeUp} />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <div className="flex gap-3 mb-4 flex-wrap justify-center text-xs" role="list" aria-label="Question status legend">
            <div className="flex items-center gap-1" role="listitem">
              <span className="w-3 h-3 rounded bg-primary" aria-hidden="true"></span>
              <span>Current</span>
            </div>
            <div className="flex items-center gap-1" role="listitem">
              <span className="w-3 h-3 rounded bg-green-500" aria-hidden="true"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1" role="listitem">
              <span className="w-3 h-3 rounded bg-yellow-500" aria-hidden="true"></span>
              <span>Skipped</span>
            </div>
            <div className="flex items-center gap-1" role="listitem">
              <span className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" aria-hidden="true"></span>
              <span>Unvisited</span>
            </div>
          </div>

          <nav aria-label="Question navigation">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-5 gap-2 mb-4">
              {questions.map((q, idx) => {
                const status = getQuestionStatus(q, idx);
                const bgColor = status === 'current' ? 'bg-primary' : 
                               status === 'answered' ? 'bg-green-500' : 
                               status === 'skipped' ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600';
                const isCurrent = status === 'current';
                
                return (
                  <button
                    key={q.id}
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg font-medium text-sm text-white ${bgColor} hover:opacity-80 transition-all focus:outline-none focus:ring-2 focus:ring-gray-900/50 dark:focus:ring-white/50 ${isCurrent ? 'ring-2 ring-gray-900 dark:ring-white' : ''}`}
                    onClick={() => handleQuestionClick(idx)}
                    aria-label={`Question ${idx + 1}${status === 'current' ? ', current' : ''}${status === 'answered' ? ', answered' : ''}${status === 'skipped' ? ', skipped' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="space-y-2 text-sm" role="status" aria-live="polite" aria-atomic="true">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Answered:</span>
              <span className="text-green-400 font-medium">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Skipped:</span>
              <span className="text-yellow-400 font-medium">{skippedCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Unvisited:</span>
              <span className="text-gray-500 dark:text-gray-400 font-medium">{remainingCount}</span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Keyboard: A/B/C/D = Select, 1/2/3/4 = Alt, Enter = Next</p>
        </div>
      </aside>
    </div>
  );
};

export default QuizScreen;
