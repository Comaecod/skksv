import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../services/firebaseService';
import Header from './Header';
import Footer from './Footer';

const MainLayout = ({ children, pageViewCount }) => {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer pageViewCount={pageViewCount} />
    </div>
  );
};

export default MainLayout;
