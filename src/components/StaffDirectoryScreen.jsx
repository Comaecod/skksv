import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import staffData from '../data/staffDirectory.json';
import { Avatar, PersonCard, capitalize } from './StaffComponents';
import PersonModal from './PersonModal';

const SectionWithConnector = ({ title, icon, count, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="flex flex-col items-center"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
        <span className="text-sm">{icon}</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</span>
        <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full text-primary">{count}</span>
      </div>
      <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
    </div>
    <div className="flex flex-wrap gap-4 justify-center">
      {children}
    </div>
  </motion.div>
);

const StaffDirectoryScreen = () => {
  const { correspondent, principal, director, adminTeam, staff } = staffData;
  const [selectedPerson, setSelectedPerson] = useState(null);

  const handlePersonClick = (person) => {
    setSelectedPerson(person);
  };

  const closeModal = () => {
    setSelectedPerson(null);
  };

  const CardButton = ({ person, size = 'lg' }) => (
    <motion.button
      className="glass-card p-4 flex flex-col items-center cursor-pointer w-56 h-36"
      whileHover={{ scale: 1.05, boxShadow: '0 8px 30px rgba(102, 126, 234, 0.3)' }}
      onClick={() => handlePersonClick(person)}
    >
      <Avatar person={person} size={size} />
      <h3 className="mt-3 font-bold text-gray-900 dark:text-white text-sm text-center line-clamp-2 break-words" style={{ maxWidth: '180px' }}>
        {person.salutation === 'Mr' ? 'Mr.' : 'Mrs.'} {capitalize(person.name)}
      </h3>
      <p className="text-xs text-primary/80">{person.designation}</p>
    </motion.button>
  );

  return (
    <motion.div
      className="w-full pb-12 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="py-6 px-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent text-center mb-1">
          People of SKKSV
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center">Our School Family</p>
      </motion.div>

      <div className="px-4 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <CardButton person={correspondent} size="lg" />
        </motion.div>

        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-px h-8 bg-gradient-to-b from-primary/60 to-primary/30" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
          </div>
        </div>

        <div className="flex justify-center gap-8 flex-wrap">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <CardButton person={principal} size="lg" />
          </motion.div>

          {director && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
            >
              <CardButton person={director} size="lg" />
            </motion.div>
          )}
        </div>

        <div className="flex justify-center">
          <div className="flex flex-col items-center">
            <div className="w-px h-8 bg-gradient-to-b from-primary/60 to-primary/30" />
            <div className="w-3 h-3 rounded-full bg-primary/60" />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-px h-8 bg-gradient-to-b from-primary/60 to-primary/30" />
        </div>

        <div className="flex justify-center">
          <div className="h-px w-full max-w-lg bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        <SectionWithConnector title="Teaching Staff" icon="👨‍🏫" count={staff.length} delay={0.3}>
          {staff.map((person, index) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + index * 0.05 }}
            >
              <PersonCard person={person} onClick={handlePersonClick} />
            </motion.div>
          ))}
        </SectionWithConnector>

        <div className="flex justify-center">
          <div className="h-px w-full max-w-lg bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>

        <SectionWithConnector title="Admin Team" icon="👔" count={adminTeam.length} delay={0.5}>
          {adminTeam.map((person, index) => (
            <motion.div
              key={person.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + index * 0.05 }}
            >
              <PersonCard person={person} onClick={handlePersonClick} />
            </motion.div>
          ))}
        </SectionWithConnector>
      </div>

      <AnimatePresence>
        {selectedPerson && (
          <PersonModal person={selectedPerson} onClose={closeModal} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaffDirectoryScreen;