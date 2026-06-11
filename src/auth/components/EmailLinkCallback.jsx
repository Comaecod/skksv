import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

export default function EmailLinkCallback() {
  const navigate = useNavigate();
  const { loginWithEmailLink, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  const completeSignIn = async (emailToUse) => {
    setStatus('verifying');
    setError('');
    try {
      authService.setStoredEmailForLink(emailToUse);
      await loginWithEmailLink();
      setStatus('success');
      setTimeout(() => navigate('/dashboard', { replace: true }), 1000);
    } catch (err) {
      setError(err.message || 'Failed to sign in with email link.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (!authService.isSignInWithEmailLink()) {
      setError('Invalid or expired sign-in link.');
      setStatus('error');
      return;
    }
    const storedEmail = authService.getStoredEmailForLink();
    if (storedEmail) {
      completeSignIn(storedEmail);
    } else {
      setStatus('need_email');
    }
  }, [loginWithEmailLink, navigate, isAuthenticated]);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    completeSignIn(email);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 text-center animate-slideUp">
          {status === 'verifying' && (
            <>
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Verifying Link...</h2>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we sign you in.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Signed In!</h2>
              <p className="text-gray-500 dark:text-gray-400">Redirecting to your dashboard...</p>
            </>
          )}

          {status === 'need_email' && (
            <>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Your Email</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Please enter the email address you used to request the sign-in link.
              </p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all"
                  required
                />
                <button
                  type="submit"
                  className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
                >
                  Sign In
                </button>
              </form>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">❌</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sign-In Failed</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
