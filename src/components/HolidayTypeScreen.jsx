import { motion } from 'framer-motion';

const HolidayTypeScreen = ({ holidayTypes, onSelect, onBack }) => {
  const getHolidayIcon = (type) => {
    const icons = {
      'Summer Vacation': '☀️',
      'Dussehra Vacation': '🪔',
      'Diwali Vacation': '🪔',
      'Sankranthi Vacation': '🎉',
      'Winter Vacation': '❄️',
      'Christmas Vacation': '🎄',
      'Pongal Vacation': '🌾'
    };
    return icons[type] || '📅';
  };

  const getHolidayPeriod = (type) => {
    const periods = {
      'Summer Vacation': 'Apr 23 - June 10, 2026',
      'Dussehra Vacation': 'TBD',
      'Diwali Vacation': 'TBD',
      'Sankranthi Vacation': 'TBD',
      'Winter Vacation': 'TBD',
      'Christmas Vacation': 'TBD',
      'Pongal Vacation': 'TBD'
    };
    return periods[type] || '';
  };

  return (
    <motion.div 
      className="glass-card w-full max-w-2xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <motion.div 
          className="text-5xl mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          🏖️
        </motion.div>
        <motion.h2 
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Holiday Homework
        </motion.h2>
        <motion.p 
          className="text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Select the holiday type
        </motion.p>
      </div>

      <div className="space-y-3">
        {holidayTypes.map((type, index) => (
          <motion.button
            key={type}
            onClick={() => onSelect(type)}
            className="w-full p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-primary/50 transition-all text-left flex items-center gap-4 group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.span 
              className="text-3xl"
              whileHover={{ scale: 1.2, rotate: 5 }}
            >
              {getHolidayIcon(type)}
            </motion.span>
            <div className="flex-1">
              <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{type}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{getHolidayPeriod(type)}</div>
            </div>
            <motion.span 
              className="text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors"
              whileHover={{ x: 5 }}
            >
              →
            </motion.span>
          </motion.button>
        ))}
      </div>

      <motion.div 
        className="text-center mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <motion.button
          onClick={onBack}
          className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          ← Back to Home
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default HolidayTypeScreen;