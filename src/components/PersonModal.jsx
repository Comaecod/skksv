import { motion } from 'framer-motion';
import { Avatar, getHierarchy, capitalize } from './StaffComponents';

const PersonModal = ({ person, onClose }) => {
  if (!person) return null;

  const displayName = capitalize(person.name);
  const salutation = person.salutation === 'Mr' ? 'Mr.' : person.salutation === 'Mrs' ? 'Mrs.' : '';
  const hierarchy = getHierarchy(person);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Details</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center mb-6">
            <Avatar person={person} size="xl" />
            <h3 className="mt-4 font-bold text-gray-900 dark:text-white text-lg text-center">
              {salutation} {displayName}
            </h3>
            <p className="text-primary font-medium">{person.designation}</p>
            {person.alias && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Alias: {person.alias.toUpperCase()}</p>
            )}
          </div>

          <div className="space-y-3">
            {person.subject && (
              <div className="flex items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">Subject:</span>
                <span className="text-sm text-gray-900 dark:text-white">{capitalize(person.subject)}</span>
              </div>
            )}
            {person.qualifications && (
              <div className="flex items-start">
                <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">Qualifications:</span>
                <span className="text-sm text-gray-900 dark:text-white">{person.qualifications}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3">Hierarchy Path</h4>
            <div className="flex flex-col items-center">
              {hierarchy.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`px-3 py-1.5 rounded-lg min-w-[180px] text-center ${item.role === person.designation ? 'bg-primary/20 border border-primary/40' : 'bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10'}`}>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.role}</span>
                    <p className={`text-sm ${item.role === person.designation ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-300'}`}>
                      {item.name}
                    </p>
                  </div>
                  {index < hierarchy.length - 1 && (
                    <div className="w-px h-4 bg-primary/40" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PersonModal;