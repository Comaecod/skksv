import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { trackPageView, getPageViewCount } from './services/firebaseService';
import Header from './components/Header';
import BetaBanner from './components/BetaBanner';
import Footer from './components/Footer';
import StaffDirectoryScreen from './components/StaffDirectoryScreen';
import HomeScreen from './components/HomeScreen';
import AssessmentsScreen from './components/AssessmentsScreen';
import HolidayHomeworkScreen from './components/HolidayHomeworkScreen';
import ContactScreen from './components/ContactScreen';
import FeedbackScreen from './components/FeedbackScreen';
import FeedbackReportsScreen from './components/FeedbackReportsScreen';
import ReportsScreen from './components/ReportsScreen';

function App() {
  const [pageViewCount, setPageViewCount] = useState(null);

  useEffect(() => {
    const initAnalytics = async () => {
      await trackPageView();
      const count = await getPageViewCount();
      setPageViewCount(count);
    };
    initAnalytics();
  }, []);

  return (
    <BrowserRouter basename="/quiz-app">
      <BetaBanner />
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <HomeScreen />
            <Footer pageViewCount={pageViewCount} />
          </>
        } />
        <Route path="/assessments" element={
          <>
            <Header />
            <AssessmentsScreen />
            <Footer />
          </>
        } />
        <Route path="/holiday-homework" element={
          <>
            <Header />
            <HolidayHomeworkScreen />
            <Footer />
          </>
        } />
        <Route path="/people" element={
          <>
            <Header />
            <StaffDirectoryScreen />
            <Footer />
          </>
        } />
        <Route path="/contact" element={
          <>
            <Header />
            <ContactScreen />
            <Footer />
          </>
        } />
        <Route path="/feedback" element={
          <>
            <Header />
            <FeedbackScreen />
            <Footer />
          </>
        } />
        <Route path="/feedback-reports" element={
          <>
            <Header />
            <FeedbackReportsScreen />
            <Footer />
          </>
        } />
        <Route path="/reports" element={
          <>
            <Header />
            <ReportsScreen />
            <Footer />
          </>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;