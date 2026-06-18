import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginWithEmail, loginWithGoogle, sendSignInLink, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (showPassword) {
      clearError();
      setLocalError('');
      setIsLoading(true);
      try {
        await loginWithEmail(email, password);
        navigate(from, { replace: true });
      } catch (err) {
        setLocalError(err.message || 'Login failed');
      } finally {
        setIsLoading(false);
      }
    } else {
      handleSendLink(e);
    }
  };

  const handleSendLink = async (e) => {
    e?.preventDefault();
    clearError();
    setLocalError('');
    setIsLoading(true);
    try {
      await sendSignInLink(email);
      setLinkSent(true);
    } catch (err) {
      setLocalError(err.message || 'Failed to send sign-in link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    setLocalError('');
    setIsLoading(true);
    try {
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLocalError(err.message || 'Google sign-in failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || localError;

  if (linkSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md">
          <div className="glass-card p-8 animate-slideUp text-center">
            <div className="text-5xl mb-4">✉️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              A sign-in link has been sent to <strong>{email}</strong>
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-2">
              Click the link in the email to sign in instantly. No password needed.
            </p>
            <div className="mb-6 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-sm text-amber-700 dark:text-amber-400">
              📬 Didn't see it? Check your <strong>Spam</strong> or <strong>Promotions</strong> folder and mark it as "Not Spam" so future emails land in your inbox.
            </div>
            <button
              onClick={() => setLinkSent(false)}
              className="text-sm text-primary dark:text-primary-light hover:underline"
            >
              Use a different email →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="w-full max-w-md">
        <div className="glass-card p-8 animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-gray-500 dark:text-gray-400">Sign in to your account</p>
          </div>

          {displayError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
              <p className="text-red-600 dark:text-red-400 text-sm">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all"
                required
                autoComplete="email"
              />
            </div>

            {showPassword && (
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all"
                  required
                  autoComplete="current-password"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light transition-colors"
              >
                {showPassword ? '← Use magic link instead' : 'Use password instead →'}
              </button>
              {showPassword && (
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary dark:text-primary-light hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Sending...' : showPassword ? 'Sign In' : 'Send Magic Link ✉️'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-slate-800 text-gray-500 dark:text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full px-6 py-3 rounded-xl font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/contact" className="text-primary dark:text-primary-light hover:underline">
              Contact Administrator
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
