import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const App = lazy(() => import('./App'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--body-bg-start) 0%, var(--body-bg-end) 100%)' }}>
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500">Loading...</p>
    </div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Suspense fallback={<LoadingFallback />}>
        <App />
      </Suspense>
    </ThemeProvider>
  </React.StrictMode>
);
