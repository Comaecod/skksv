import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/firebaseService';
import { useLayout } from '../context/LayoutContext';
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children, pageViewCount }) => {
  const location = useLocation();
  const { hideHeader, hideFooter } = useLayout();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && <Header />}
      <main className="flex-1 flex flex-col">
        <div className={`${hideHeader && hideFooter ? 'flex items-center justify-center' : ''} flex-1`}>
          {children}
        </div>
      </main>
      {!hideFooter && <Footer pageViewCount={pageViewCount} />}
    </div>
  );
};

export default MainLayout;
