import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { addNotification } from '../services/notificationService';
import { isMasterKey } from '../utils/auth';

const MakeNotification = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isValid = title.trim() && message.trim() && expiresAt;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    setShowModal(true);
    setPassword('');
    setPasswordError('');
  };

  const handleConfirm = async () => {
    if (!isMasterKey(password)) {
      setPasswordError('Incorrect password');
      return;
    }

    setSubmitting(true);
    try {
      await addNotification({ title: title.trim(), message: message.trim(), expiresAt });
      setSubmitting(false);
      setShowModal(false);
      setSubmitted(true);
    } catch (err) {
      console.error('Error creating notification:', err);
      setPasswordError('Failed to create notification. Try again.');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl text-center w-full max-w-md"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--overlay)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Notification Created</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>The notification has been published successfully.</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSubmitted(false); setTitle(''); setMessage(''); setExpiresAt(''); }}
              className="px-5 py-2.5 rounded-xl font-medium text-sm transition-all"
              style={{ background: 'var(--overlay)', color: 'var(--text-primary)' }}
            >
              Create Another
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 rounded-xl font-medium text-sm text-white transition-all"
              style={{ background: 'var(--accent)' }}
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-2xl w-full max-w-lg"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'var(--overlay)' }}>
            <svg className="w-7 h-7" style={{ color: 'var(--accent)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create Notification</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Publish a new notification for all users</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Exam Schedule Updated"
              className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
              style={{ background: 'var(--overlay)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Message <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write the notification message..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm resize-none"
              style={{ background: 'var(--overlay)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Expires At <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
              style={{ background: 'var(--overlay)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
            style={{ background: !isValid ? 'var(--text-muted)' : 'var(--accent)' }}
          >
            Add Notification
          </button>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm transition-all"
            style={{ color: 'var(--text-muted)' }}
          >
            ← Back to Home
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Admin Authorization</h3>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Enter the admin password to publish this notification</p>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm mb-1"
                style={{ background: 'var(--overlay)', border: `1px solid ${passwordError ? '#ef4444' : 'var(--border-color)'}`, color: 'var(--text-primary)' }}
                autoFocus
              />
              {passwordError && (
                <p className="text-red-400 text-xs mt-2">{passwordError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: 'var(--overlay)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: submitting ? 'var(--text-muted)' : 'var(--accent)' }}
                >
                  {submitting ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MakeNotification;