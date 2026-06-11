import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="text-center">
        <div className="text-8xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Access Denied</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          You do not have the required permissions to access this page.
          If you believe this is a mistake, please contact your administrator.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/"
            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all"
          >
            Go Home
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
}
