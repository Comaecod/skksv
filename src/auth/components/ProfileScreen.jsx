import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import ChangePassword from './ChangePassword';

export default function ProfileScreen() {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifySent, setVerifySent] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const handleSendVerification = async () => {
    setVerifying(true);
    try {
      await authService.sendEmailVerification();
      setVerifySent(true);
    } catch (err) {
      console.error('Failed to send verification:', err);
    } finally {
      setVerifying(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all mb-4"
      >
        ← Back
      </button>
      <div className="glass-card p-6 sm:p-8 animate-slideUp">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
            {(userProfile?.displayName || user.email || 'U')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userProfile?.displayName || 'User'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Role</p>
            <p className="text-gray-900 dark:text-white font-medium capitalize">
              {userProfile?.role || '—'}
              {userProfile?.roleSubtype && <span className="text-gray-400"> ({userProfile.roleSubtype})</span>}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Status</p>
            <p className="text-gray-900 dark:text-white font-medium capitalize">{userProfile?.status || 'Active'}</p>
          </div>
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-gray-900 dark:text-white font-medium">{userProfile?.phone || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email Verified</p>
            {user.emailVerified ? (
              <p className="text-gray-900 dark:text-white font-medium">✅ Yes</p>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-gray-900 dark:text-white font-medium">❌ No</p>
                {verifySent ? (
                  <span className="text-xs text-green-600 dark:text-green-400">Verification email sent!</span>
                ) : (
                  <button
                    onClick={handleSendVerification}
                    disabled={verifying}
                    className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                  >
                    {verifying ? 'Sending...' : 'Send Verification'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showChangePassword ? (
          <div className="mb-4">
            <ChangePassword
              onCancel={() => setShowChangePassword(false)}
              onSuccess={() => setShowChangePassword(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all mb-3"
          >
            🔑 Change Password
          </button>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all mb-2"
        >
          📊 Go to Dashboard
        </button>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-all"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}
