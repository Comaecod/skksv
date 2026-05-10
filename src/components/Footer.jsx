import { useTheme } from '../context/ThemeContext';

const formatViewCount = (count) => {
  if (count === null || count === undefined) return null;
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'm';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
};

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

const Footer = ({ pageViewCount }) => {
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const formattedCount = formatViewCount(pageViewCount);

  const ThemeIcon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon;
  const tooltip = theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System';
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-3 sm:py-4 z-20 backdrop-blur-md border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:scale-105"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          aria-label={`Switch theme. Currently: ${tooltip}`}
          title={tooltip}
        >
          <span className="shrink-0"><ThemeIcon /></span>
          <span className="text-xs hidden sm:inline capitalize">{theme}</span>
        </button>

        <p className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>
            Built with <span className="text-red-400">❤</span> by <a href="https://comaecod.github.io/portfolio" target="_blank" rel="noopener noreferrer" className="font-medium" style={{ color: 'var(--accent)' }}>Vishnu</a>
          </span>
          {formattedCount !== null && (
            <span style={{ color: 'var(--text-muted)' }}>
              👁 {formattedCount} views
            </span>
          )}
        </p>

        <div className="w-12 sm:w-16" />
      </div>
    </footer>
  );
};

export default Footer;