import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from 'firebase/firestore';
import { isMasterKey } from '../utils/auth';

const SEVERITY_ORDER = {
  critical: 0,
  severe: 1,
  normal: 2,
  minor: 3
};

const SEVERITY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🔴' },
  severe: { label: 'Severe', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '🟠' },
  normal: { label: 'Normal', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '🟡' },
  minor: { label: 'Minor', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🟢' }
};

const FeedbackReportsScreen = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const loadFeedbacks = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'feedback'),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        const items = [];
        snapshot.forEach(d => {
          items.push({ id: d.id, ...d.data() });
        });
        items.sort((a, b) => {
          const severityDiff = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
          if (severityDiff !== 0) return severityDiff;
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        setFeedbacks(items);
      } catch (err) {
        console.error('Error loading feedbacks:', err);
      } finally {
        setLoading(false);
      }
    };
    loadFeedbacks();
  }, []);

  const handleResolveClick = (feedback) => {
    setSelectedFeedback(feedback);
    setPassword('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async () => {
    if (!isMasterKey(password)) {
      setPasswordError('Invalid password');
      return;
    }

    setIsResolving(true);
    try {
      await updateDoc(doc(db, 'feedback', selectedFeedback.id), {
        status: 'resolved',
        resolvedAt: new Date()
      });
      setFeedbacks(prev => prev.filter(f => f.id !== selectedFeedback.id));
      setShowPasswordModal(false);
    } catch (err) {
      console.error('Error resolving feedback:', err);
      setPasswordError('Failed to resolve. Please try again.');
    } finally {
      setIsResolving(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Feedback Reports</h2>
          <p className="text-gray-500 dark:text-gray-400">{feedbacks.length} pending feedback(s)</p>
        </div>

        {feedbacks.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-4">🎉</div>
            <p className="text-gray-500 dark:text-gray-400">No pending feedbacks</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback, index) => {
              const severity = SEVERITY_CONFIG[feedback.severity] || SEVERITY_CONFIG.normal;
              return (
                <motion.div
                  key={feedback.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severity.color} flex items-center gap-1.5`}>
                          <span>{severity.icon}</span>
                          <span>{severity.label}</span>
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(feedback.createdAt)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                          <p className="text-gray-900 dark:text-white font-medium">{feedback.name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-gray-900 dark:text-white font-medium">{feedback.phone}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                          <p className="text-gray-900 dark:text-white font-medium">{feedback.email}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message</p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm bg-black/5 dark:bg-white/5 rounded-lg p-3">
                          {feedback.message}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleResolveClick(feedback)}
                      className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/30 transition-all whitespace-nowrap"
                    >
                      Resolve
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-sm mx-4"
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🔒</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Resolution</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Enter admin password to resolve this feedback</p>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                placeholder="Enter password"
                className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border ${passwordError ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all mb-4`}
                autoFocus
              />

              {passwordError && (
                <p className="text-red-400 text-sm text-center mb-4">{passwordError}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordSubmit}
                  disabled={isResolving}
                  className="flex-1 py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 transition-all"
                >
                  {isResolving ? 'Resolving...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackReportsScreen;