import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_KEY = 'skksv_theme_preference';
const PROMPT_SEEN_KEY = 'skksv_theme_prompt_seen';

const ThemeContext = createContext(null);

const SunIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem(THEME_KEY) || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState('dark');
  const [showPrompt, setShowPrompt] = useState(false);

  const applyTheme = useCallback((pref) => {
    const root = document.documentElement;
    let resolved;

    if (pref === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolved = pref;
    }

    if (resolved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    setResolvedTheme(resolved);
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) {
      metaTag.setAttribute('content', resolved === 'dark' ? '#0f172a' : '#f8fafc');
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const promptSeen = localStorage.getItem(PROMPT_SEEN_KEY);

    if (!promptSeen) {
      setShowPrompt(true);
    }

    const initial = stored || 'system';
    setTheme(initial);
    applyTheme(initial);
  }, [applyTheme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  const toggleTheme = useCallback(() => {
    const cycle = { light: 'dark', dark: 'system', system: 'light' };
    const next = cycle[theme];
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, [theme, applyTheme]);

  const setThemePreference = useCallback((pref) => {
    setTheme(pref);
    localStorage.setItem(THEME_KEY, pref);
    localStorage.setItem(PROMPT_SEEN_KEY, 'true');
    setShowPrompt(false);
    applyTheme(pref);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme }}>
      {children}
      <ThemePrompt visible={showPrompt} onSelect={setThemePreference} />
    </ThemeContext.Provider>
  );
}

function ThemePrompt({ visible, onSelect }) {
  const options = [
    { value: 'light', icon: SunIcon, label: 'Light', description: 'Bright & easy on the eyes' },
    { value: 'dark', icon: MoonIcon, label: 'Dark', description: 'Easy on the eyes at night' },
    { value: 'system', icon: MonitorIcon, label: 'System', description: 'Follow your device setting' },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-md rounded-2xl p-6 sm:p-8"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--overlay)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Choose Your Theme</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Pick a look that suits your preference</p>
            </div>

            <div className="space-y-3">
              {options.map(({ value, icon: Icon, label, description }) => (
                <motion.button
                  key={value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(value)}
                  className="w-full p-4 rounded-xl flex items-center gap-4 transition-all text-left"
                  style={{ background: 'var(--overlay)', border: '1px solid var(--border-color)' }}
                >
                  <div className="shrink-0" style={{ color: 'var(--accent)' }}>
                    <Icon />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{description}</div>
                  </div>
                  <svg className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </motion.button>
              ))}
            </div>

            <p className="text-center text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
              You can change this anytime from the header
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export default ThemeContext;