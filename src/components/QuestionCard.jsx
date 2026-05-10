import { useMemo } from 'react';

const QuestionCard = ({ 
  question, 
  selectedAnswer, 
  onAnswerChange,
  onClearAnswer
}) => {
  const {
    questionNumber,
    text,
    image,
    type,
    options,
    explanation,
    marks = 1
  } = question;

  const isMultiple = type === 'multiple';

  const isAnswered = selectedAnswer !== undefined && 
    (Array.isArray(selectedAnswer) ? selectedAnswer.length > 0 : true);

  const handleOptionClick = (index) => {
    if (isMultiple) {
      const current = selectedAnswer || [];
      const updated = current.includes(index)
        ? current.filter(i => i !== index)
        : [...current, index];
      onAnswerChange(updated);
    } else {
      if (selectedAnswer === index) {
        onClearAnswer();
      } else {
        onAnswerChange(index);
      }
    }
  };

  const isOptionSelected = (index) => {
    if (isMultiple) {
      return (selectedAnswer || []).includes(index);
    }
    return selectedAnswer === index;
  };

  const shouldUseGrid = image && options.every(opt => opt.text.length <= 40);
  const isGridLayout = shouldUseGrid && !isMultiple;

  const selectedCount = useMemo(() => {
    if (isMultiple && Array.isArray(selectedAnswer)) {
      return selectedAnswer.length;
    }
    return selectedAnswer !== undefined ? 1 : 0;
  }, [selectedAnswer, isMultiple]);

  return (
    <article className="glass-card animate-scaleIn h-full flex flex-col" aria-labelledby={`question-${questionNumber}-text`}>
      <header className="flex items-center justify-between mb-4 flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-primary/20 text-primary font-semibold" aria-label={`Question ${questionNumber}`}>Q{questionNumber}</span>
          {isMultiple && (
            <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-medium" aria-label="Multiple answers allowed">
              Multiple Answers
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-sm" aria-label={`${marks} ${marks === 1 ? 'mark' : 'marks'} available`}>
            +{marks} {marks === 1 ? 'mark' : 'marks'}
          </span>
          {isAnswered && (
            <button 
              className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
              onClick={onClearAnswer}
              aria-label="Clear your answer"
            >
              Clear Answer
            </button>
          )}
        </div>
      </header>

      <h3 id={`question-${questionNumber}-text`} className="text-base sm:text-lg mb-4 flex-shrink-0">{text}</h3>

      {image && (
        <figure className="flex-shrink-0 mb-4 flex justify-center">
          <img 
            src={image} 
            alt="" 
            className="max-h-64 sm:max-h-52 max-w-full object-contain rounded-xl"
            loading="lazy"
            onError={(e) => { e.target.style.display = 'none'; e.target.setAttribute('aria-hidden', 'true'); }}
          />
        </figure>
      )}

      <div 
        className={`flex-1 overflow-y-auto min-h-0 ${isGridLayout ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3'}`}
        role="group"
        aria-label={`Question ${questionNumber} options${isMultiple ? ', select all that apply' : ''}`}
        aria-describedby={isMultiple ? `multiple-hint-${questionNumber}` : undefined}
      >
        {options.map((option, index) => {
          const optionId = `q${questionNumber}-option-${index}`;
          const isSelected = isOptionSelected(index);
          
          return (
                <div
                  key={index}
                  id={optionId}
                  className={`p-3 sm:p-4 rounded-xl border cursor-pointer transition-all flex-shrink-0 ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : 'border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
              onClick={() => handleOptionClick(index)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleOptionClick(index);
                }
              }}
              role={isMultiple ? 'checkbox' : 'radio'}
              role-checked={isMultiple ? isSelected : undefined}
              aria-checked={isSelected}
              tabIndex={0}
              aria-label={`Option ${index + 1}: ${option.text}${isSelected ? ', selected' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div 
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'border-primary bg-primary' : 'border-gray-400 dark:border-gray-500'
                  }`}
                  aria-hidden="true"
                >
                  {!isSelected && <span className="sr-only">Not selected</span>}
                  {isSelected && !isMultiple && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                  {isSelected && isMultiple && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{option.text}</span>
              </div>
            </div>
          );
        })}
      </div>

      {isMultiple && (
        <p id={`multiple-hint-${questionNumber}`} className="text-sm text-gray-500 dark:text-gray-400 mt-4 flex-shrink-0">
          Select all answers that apply{selectedCount > 0 ? ` (${selectedCount} selected)` : ''}
        </p>
      )}

      {explanation && (
        <aside className="mt-3 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex-shrink-0" aria-label="Explanation">
          <strong className="text-sm"><span aria-hidden="true">💡</span> Explanation:</strong>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">{explanation}</p>
        </aside>
      )}
    </article>
  );
};

export default QuestionCard;
