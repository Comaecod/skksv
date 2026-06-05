import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo.png';
import { SCHOOL_CONFIG } from '../config/schoolConfig';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAcademicsOpen, setIsAcademicsOpen] = useState(false);
  const [isMobileAcademicsOpen, setIsMobileAcademicsOpen] = useState(false);
  const academicsRef = useRef(null);

  const navItems = [
    {
      label: 'Academics',
      icon: '📚',
      children: [
        { to: '/assessments', icon: '📝', label: 'Assessments' },
        { to: '/holiday-homework', icon: '🏖️', label: 'Holiday Homework' },
      ]
    },
    { to: '/people', icon: '👥', label: 'People' },
    { to: '/contact', icon: '📞', label: 'Contact' },
    { to: '/feedback', icon: '💬', label: 'Feedback' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (academicsRef.current && !academicsRef.current.contains(event.target)) {
        setIsAcademicsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const ChevronIcon = ({ isOpen }) => (
    <svg 
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-white/10">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white p-0.5 flex items-center justify-center">
              <img 
                src={logoImg}
                alt="SKKSV Logo" 
                className="w-full h-full rounded-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-2xl">🎓</span>';
                }}
              />
            </div>
            <div className="hidden sm:flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent leading-tight">
                  {SCHOOL_CONFIG.shortName}
                </h1>
                {SCHOOL_CONFIG.beta && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">
                    BETA
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <div key={item.label} className="relative" ref={academicsRef}>
                    <button
                      onClick={() => setIsAcademicsOpen(!isAcademicsOpen)}
                      className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 text-sm hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <ChevronIcon isOpen={isAcademicsOpen} />
                    </button>
                    <AnimatePresence>
                      {isAcademicsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 mt-1 bg-gray-100 dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-white/10 py-1 min-w-[200px]"
                        >
                          {item.children.map((child) => (
                            <Link
                              key={child.to}
                              to={child.to}
                              className="block px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                              onClick={() => setIsAcademicsOpen(false)}
                            >
                              <span>{child.icon}</span>
                              <span>{child.label}</span>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 text-sm hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <Link
            to="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-300 text-sm hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            title="Admin Panel"
          >
            <span>🔐</span>
          </Link>

          <button 
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <motion.div 
        className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isMenuOpen ? 1 : 0, height: isMenuOpen ? 'auto' : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="px-4 py-3 border-t border-gray-200 dark:border-white/10 bg-white/95 dark:bg-slate-900/95">
          {navItems.map((item) => {
            if (item.children) {
              return (
                <div key={item.label}>
                  <button
                    onClick={() => setIsMobileAcademicsOpen(!isMobileAcademicsOpen)}
                    className="w-full px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                    <ChevronIcon isOpen={isMobileAcademicsOpen} />
                  </button>
                  <AnimatePresence>
                    {isMobileAcademicsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            className="block px-6 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                            onClick={() => {
                              setIsMenuOpen(false);
                              setIsMobileAcademicsOpen(false);
                            }}
                          >
                            <span>{child.icon}</span>
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                className="block px-3 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </header>
  );
};

export default Header;