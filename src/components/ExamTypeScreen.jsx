import { motion } from 'framer-motion';

const ExamTypeScreen = ({ examTypes, onSelect, onBack }) => {
  const getExamIcon = (type) => {
    const icons = {
      'Slip Test': '📝',
      'Bridge Course': '🌉',
      'Unit Test 1': '📖',
      'Term 1': '📚',
      'Unit Test 2': '📖',
      'Term 2': '📚',
      'Holiday Homework': '🏖️',
      'Assessment': '📋'
    };
    return icons[type] || '📋';
  };

  const getExamDescription = (type) => {
    const descriptions = {
      'Slip Test': 'Short assessment tests',
      'Bridge Course': 'Foundation courses',
      'Unit Test 1': 'First unit evaluation',
      'Term 1': 'First term examination',
      'Unit Test 2': 'Second unit evaluation',
      'Term 2': 'Second term examination',
      'Holiday Homework': 'View holiday homework projects',
      'Assessment': 'Take tests and quizzes'
    };
    return descriptions[type] || 'Assessment';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card w-full max-w-2xl animate-slideUp"
    >
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assessments</h2>
        <p className="text-gray-500 dark:text-gray-400">Choose the type of exam you want to take</p>
      </div>

      <div className="space-y-3">
        {examTypes.filter(t => t !== 'Holiday Homework').map((type) => (
          <motion.button
            key={type}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(type)}
            className="w-full p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-primary/50 transition-all text-left flex items-center gap-4 group"
          >
            <span className="text-3xl">{getExamIcon(type)}</span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{type}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{getExamDescription(type)}</div>
            </div>
            <span className="text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors text-xl">→</span>
          </motion.button>
        ))}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
        >
          ← Back to Home
        </button>
      </div>
    </motion.div>
  );
};

export default ExamTypeScreen;