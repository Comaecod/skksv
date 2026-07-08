import { subjectLabel } from '../utils/format';

const IntroScreen = ({ config, onStart, onReports, userRole }) => {
  const { 
    examTitle, 
    className, 
    schoolName, 
    timeLimitMinutes, 
    teacher, 
    invigilator, 
    subject,
    totalMarks
  } = config;

  return (
    <div className="glass-card w-full max-w-lg animate-slideUp" role="region" aria-labelledby="intro-heading">
      <div className="text-center mb-6 sm:mb-8">
        <div className="text-5xl sm:text-6xl mb-4" aria-hidden="true">🎓</div>
          <h1 id="intro-heading" className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {schoolName}
          </h1>
      </div>

      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">{examTitle}</h2>
        <p className="text-gray-500 dark:text-gray-400">Class {className} | {subjectLabel(subject)}</p>
      </div>

      <div className="flex justify-center gap-3 sm:gap-4 mb-4 sm:mb-6 flex-wrap" role="list" aria-label="Exam staff information">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-sm" role="listitem">
          <span aria-hidden="true">👩‍🏫</span>
          <span>Teacher: {teacher || 'N/A'}</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-sm" role="listitem">
          <span aria-hidden="true">👨‍💼</span>
          <span>Invigilator: {invigilator || 'N/A'}</span>
        </div>
      </div>

      <div className="flex justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 flex-wrap" role="list" aria-label="Exam details">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-sm" role="listitem">
          <span aria-hidden="true">⏱️</span>
          <span>{timeLimitMinutes} Minutes</span>
        </div>
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 text-sm" role="listitem">
          <span aria-hidden="true">📊</span>
          <span>{totalMarks} Marks</span>
        </div>
      </div>

      <div className="flex justify-center gap-4 sm:gap-6 mt-6 sm:mt-8 flex-wrap">
        {userRole && userRole !== 'student' ? (
          <button
            className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all hover:scale-105 min-w-[180px] sm:min-w-[200px] flex items-center justify-center gap-2 text-base sm:text-lg"
            onClick={onReports}
            aria-label="View Reports"
          >
            <span className="text-xl sm:text-2xl" aria-hidden="true">📊</span>
            <span>Reports</span>
          </button>
        ) : (
          <button
            className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all hover:scale-105 min-w-[180px] sm:min-w-[200px] flex items-center justify-center gap-2 text-base sm:text-lg"
            onClick={onStart}
            aria-label="Take Assessment"
          >
            <span className="text-xl sm:text-2xl" aria-hidden="true">📝</span>
            <span>Take Assessment</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default IntroScreen;
