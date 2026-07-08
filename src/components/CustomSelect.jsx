import { useState, useRef, useEffect } from 'react';
import ScrollableArea from './ui/ScrollableArea';

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-4 py-3 text-sm',
};

const CustomSelect = ({ value, onChange, options, className = '', size = 'md', menuPosition = 'bottom', disabled = false }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        className={`w-full ${sizeClasses[size]} rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none text-left flex items-center justify-between gap-2 ${disabled ? 'opacity-60 cursor-not-allowed' : 'focus:border-primary/50'}`}
      >
        <span className="truncate">{selected?.label}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {!disabled && open && (
        <div className={`absolute z-[100] w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 shadow-lg ${
          menuPosition === 'top' ? 'bottom-full mb-1' : 'mt-1'
        }`}>
          <ScrollableArea className="max-h-60">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-primary/10 text-primary dark:text-primary'
                    : 'text-gray-900 dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </ScrollableArea>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;