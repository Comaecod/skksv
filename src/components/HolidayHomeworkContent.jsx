import { motion } from 'framer-motion';

const HolidayHomeworkContent = ({ config, onBack }) => {
  const { title, classNum, subject, holidayType, teacher, content } = config;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <span className="text-lg">←</span>
        <span>Back</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-8"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 text-primary mb-4">
            <span>📚</span>
            <span className="text-sm font-medium">Holiday Homework</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400">Class {classNum} • {subject}</p>
        </div>

        {content && (
          <>
            {content.period && (
              <div className="flex items-center justify-center gap-2 mb-8 text-gray-600 dark:text-gray-300">
                <span>📅</span>
                <span>Holiday Period: {content.period}</span>
              </div>
            )}

            {content.projects && content.projects.length > 0 && (
              <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span>🎨</span>
                  Projects to Complete
                </h2>
                {content.projects.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4"
                  >
                    <h3 className="font-semibold text-primary mb-2">
                      {index + 1}. {project.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {project.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}

            {content.materials && (
              <div className="bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span>✅</span>
                  Materials Needed
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{content.materials}</p>
              </div>
            )}

            {content.submission && (
              <div className="bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  Submission Instructions
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">{content.submission}</p>
              </div>
            )}

            {content.grading && (
              <div className="bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Grading Criteria</h3>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold shrink-0">C</span>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Below Average</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{content.grading.belowAverage}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center text-xs font-bold shrink-0">B</span>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{content.grading.average}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold shrink-0">A</span>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bright</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{content.grading.bright}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {content.note && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-primary">📧</span>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{content.note}</p>
                </div>
              </div>
            )}

            {teacher && (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-8">
                Assigned by: {teacher}
              </p>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default HolidayHomeworkContent;