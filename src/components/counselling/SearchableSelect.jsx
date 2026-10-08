import { useState, useRef, useEffect } from 'react';
import ScrollableArea from '../ui/ScrollableArea';

export default function SearchableSelect({
  value = null,
  onChange,
  options = [],
  placeholder = 'Search and select...',
  className = '',
  disabled = false,
  displayLabel,
  emptyText = 'No matches found',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const selected = options.find((o) => o.value === value) || null;

  const filtered = query.trim()
    ? options.filter((o) => `${o.label} ${o.searchText || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (!disabled) setOpen(!open); }}
        className={`w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none text-left flex items-center justify-between gap-2 text-sm ${disabled ? 'opacity-60 cursor-not-allowed' : 'focus:border-primary/50'}`}
      >
        <span className={`truncate ${selected ? '' : 'text-gray-400 dark:text-gray-500'}`}>
          {selected ? (displayLabel ? displayLabel(selected) : selected.label) : placeholder}
        </span>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!disabled && open && (
        <div className="absolute z-[100] w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 shadow-lg mt-1">
          <div className="p-2 border-b border-gray-100 dark:border-white/10">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm"
            />
          </div>
          <ScrollableArea className="max-h-60">
            {filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500">{emptyText}</p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); setQuery(''); }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${opt.value === value ? 'bg-primary/10 text-primary dark:text-primary' : 'text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {opt.label}
                </button>
              ))
            )}
          </ScrollableArea>
        </div>
      )}
    </div>
  );
}