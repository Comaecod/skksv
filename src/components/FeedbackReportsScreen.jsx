import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import ConfirmModal from './ConfirmModal';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
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
    setShowConfirmModal(true);
  };

  const handleConfirmResolve = async () => {
    setIsResolving(true);
    try {
      await updateDoc(doc(db, 'feedback', selectedFeedback.id), {
        status: 'resolved',
        resolvedAt: new Date()
      });
      setFeedbacks(prev => prev.filter(f => f.id !== selectedFeedback.id));
      setShowConfirmModal(false);
    } catch (err) {
      console.error('Error resolving feedback:', err);
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
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading feedbacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
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

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmResolve}
        title="Confirm Resolution"
        description="Are you sure you want to mark this feedback as resolved?"
        confirmText="Resolve"
        confirmLoadingText="Resolving..."
        isLoading={isResolving}
        variant="success"
      />
    </div>
  );
};

export default FeedbackReportsScreen;