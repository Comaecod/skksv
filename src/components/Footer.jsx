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

const Footer = ({ pageViewCount }) => {
  const formattedCount = formatViewCount(pageViewCount);

  return (
    <footer className="py-3 sm:py-4 backdrop-blur-md border-t" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
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
      </div>
    </footer>
  );
};

export default Footer;