import { motion, AnimatePresence } from 'framer-motion';
import ScrollableArea from './ui/ScrollableArea';

const MinusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const FloatingWidget = ({
  position = 'left',
  buttonIcon,
  buttonLabel,
  badge,
  badgeColor = 'bg-green-500',
  headerIcon,
  title,
  subtitle,
  children,
  footer,
  isOpen,
  onToggle,
  panelHeight,
  visible = true,
  buttonOffset = 0,
  buttonColor,
}) => {
  if (!visible) return null;

  const isLeft = position === 'left';
  const sideClass = isLeft ? 'left-4 sm:left-6' : 'right-4 sm:right-6';
  const alignClass = isLeft ? 'items-start' : 'items-end';
  const panelPosClass = isLeft
    ? 'left-full ml-3'
    : 'right-full mr-3';
  const bgGradient = buttonColor || 'linear-gradient(135deg, var(--accent), #764ba2)';

  return (
    <div className={`fixed bottom-4 ${sideClass} z-40`}
      style={buttonOffset ? { bottom: `${buttonOffset}px` } : undefined}>
      <div className={`relative flex flex-col ${alignClass}`}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`mb-3 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[420px]
                         absolute bottom-0 ${panelPosClass}`}
              style={{
                height: panelHeight || 'min(500px, calc(100vh - 180px))',
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                borderRadius: '1.25rem',
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div className="flex items-center px-4 py-3 border-b shrink-0 w-full"
                style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {headerIcon && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: bgGradient, color: 'white' }}>
                      {headerIcon}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{title}</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block shrink-0" />
                      <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onToggle}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70 shrink-0 ml-2"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label={`Minimize ${title}`}
                >
                  <MinusIcon />
                </button>
              </div>

              <div className="flex-1 min-h-0">
                <ScrollableArea className="h-full">
                  {children}
                </ScrollableArea>
              </div>

              {footer && (
                <div className="shrink-0">{footer}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={onToggle}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 relative"
          style={{ background: bgGradient, color: 'white' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isOpen ? `Close ${title}` : buttonLabel}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <CloseSvg />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                {buttonIcon}
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {badge > 0 && !isOpen && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow ${badgeColor}`}
              >
                {badge > 9 ? '9+' : badge}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
};

const CloseSvg = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default FloatingWidget;
