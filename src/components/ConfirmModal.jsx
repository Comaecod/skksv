import { motion, AnimatePresence } from 'framer-motion';

const variantStyles = {
  primary: { bg: 'var(--accent)', hover: 'opacity-90' },
  danger: { bg: '#ef4444', hover: '#dc2626' },
  success: { bg: '#22c55e', hover: '#16a34a' },
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, description, confirmText = 'Confirm', confirmLoadingText = 'Processing...', isLoading = false, variant = 'primary' }) => {
  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="p-6 rounded-2xl w-full max-w-sm mx-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'var(--overlay)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              {description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{description}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: 'var(--overlay)', color: 'var(--text-primary)' }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                style={{ background: isLoading ? 'var(--text-muted)' : style.bg }}
                onMouseEnter={(e) => { if (!isLoading) e.target.style.background = style.hover; }}
                onMouseLeave={(e) => { if (!isLoading) e.target.style.background = style.bg; }}
              >
                {isLoading ? confirmLoadingText : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
