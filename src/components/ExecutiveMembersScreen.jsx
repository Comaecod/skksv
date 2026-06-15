import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import executiveCommittee from '../data/executiveCommittee.json';
import { Avatar, capitalize } from './StaffComponents';

const ExecutiveCard = ({ person, index, onClick }) => {
  const displayName = capitalize(person.name);
  const salutation = person.salutation === 'Mr' ? 'Mr.' : 'Mrs.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 w-72 min-h-[7rem] flex flex-col justify-center cursor-pointer"
      whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}
      onClick={() => onClick(person)}
    >
      <div className="flex items-center gap-3">
        <Avatar person={person} size="md" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight line-clamp-2 break-words" title={displayName}>
            {salutation} {displayName}
          </h4>
          <p className="text-xs text-primary/80 mt-1">{person.designation}</p>
          {person.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed line-clamp-2">{person.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const ExecutiveModal = ({ person, onClose }) => {
  if (!person) return null;
  const displayName = capitalize(person.name);
  const salutation = person.salutation === 'Mr' ? 'Mr.' : 'Mrs.';

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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Executive Member</h2>
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
          </div>

          {person.description && (
            <div className="bg-black/5 dark:bg-white/5 rounded-xl p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{person.description}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const ExecutiveMembersScreen = () => {
  const [selectedPerson, setSelectedPerson] = useState(null);

  return (
    <motion.div
      className="w-full pb-12 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-primary/10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative py-6 px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center">
            Executive Committee
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center mt-1 max-w-xl mx-auto">
            At the heart of our functioning is a team of remarkable individuals, stalwarts in the field of education and masters of their domains.
          </p>
        </div>
      </motion.div>

      <div className="px-4 mt-8">
        <div className="flex flex-wrap gap-4 justify-center">
          {executiveCommittee.map((person, index) => (
            <ExecutiveCard key={person.id} person={person} index={index} onClick={setSelectedPerson} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedPerson && (
          <ExecutiveModal person={selectedPerson} onClose={() => setSelectedPerson(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ExecutiveMembersScreen;
