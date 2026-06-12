import { motion } from 'framer-motion';

const ClassSelectionScreen = ({ examType, classes, onSelect, onBack, isLoading }) => {
  const showEmpty = !isLoading && (!classes || classes.length === 0);

  return (
    <div className="glass-card w-full max-w-2xl animate-slideUp">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">👥</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{examType}</h2>
        <p className="text-gray-500 dark:text-gray-400">Select your Class</p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading classes...</p>
        </div>
      ) : showEmpty ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-4xl mb-4">📭</div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">No classes available</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">This exam type may not be configured yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {classes.map((classNum) => (
            <button
              key={classNum}
              onClick={() => onSelect(classNum)}
              className="p-6 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-primary/50 transition-all text-center group"
            >
              <div className="text-3xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                Class
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                {classNum}
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
        >
          ← Back to Assessments
        </button>
      </div>
    </div>
  );
};

export default ClassSelectionScreen;