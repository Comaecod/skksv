import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getPageViewCount } from './services/firebaseService';
import { NotificationProvider } from './context/NotificationContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import BetaBanner from './components/BetaBanner';
import MainLayout from './components/MainLayout';
import StaffDirectoryScreen from './components/StaffDirectoryScreen';
import HomeScreen from './components/HomeScreen';
import AssessmentsScreen from './components/AssessmentsScreen';
import HolidayHomeworkScreen from './components/HolidayHomeworkScreen';
import ContactScreen from './components/ContactScreen';
import FeedbackScreen from './components/FeedbackScreen';
import FeedbackReportsScreen from './components/FeedbackReportsScreen';
import ReportsScreen from './components/ReportsScreen';
import MakeNotification from './components/MakeNotification';
import TimedAssessmentScreen from './components/TimedAssessmentScreen';
import MakeAssessment from './components/MakeAssessment';
import ShowAssessments from './components/ShowAssessments';
import AdminLayout from './components/admin/AdminLayout';
import AdminPanel from './components/admin/AdminPanel';

function App() {
  const [pageViewCount, setPageViewCount] = useState(null);

  useEffect(() => {
    const initAnalytics = async () => {
      const count = await getPageViewCount();
      setPageViewCount(count);
    };
    initAnalytics();
  }, []);

  const withLayout = (Component) => (
    <MainLayout pageViewCount={pageViewCount}>
      <Component />
    </MainLayout>
  );

  return (
    <BrowserRouter basename="/quiz-app">
      <AdminAuthProvider>
      <NotificationProvider>
        <BetaBanner />
        <Routes>
          <Route path="/" element={withLayout(HomeScreen)} />
          <Route path="/assessments" element={withLayout(AssessmentsScreen)} />
          <Route path="/holiday-homework" element={withLayout(HolidayHomeworkScreen)} />
          <Route path="/people" element={withLayout(StaffDirectoryScreen)} />
          <Route path="/contact" element={withLayout(ContactScreen)} />
          <Route path="/feedback" element={withLayout(FeedbackScreen)} />
          <Route path="/reports" element={withLayout(ReportsScreen)} />
          <Route path="/timed-assessments" element={withLayout(TimedAssessmentScreen)} />

          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminLayout><AdminPanel /></AdminLayout>} />
          <Route path="/admin/assessments" element={<AdminLayout><ShowAssessments skipInitialAuth /></AdminLayout>} />
          <Route path="/admin/assessments/new" element={<AdminLayout><MakeAssessment skipInitialAuth /></AdminLayout>} />
          <Route path="/admin/notifications" element={<AdminLayout><MakeNotification /></AdminLayout>} />
          <Route path="/admin/feedback" element={<AdminLayout><FeedbackReportsScreen /></AdminLayout>} />
        </Routes>
      </NotificationProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;