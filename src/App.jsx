import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getPageViewCount } from './services/firebaseService';
import { NotificationProvider } from './context/NotificationContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { LayoutProvider } from './context/LayoutContext';
import { SankaraProvider } from './context/SankaraContext';
import BetaBanner from './components/BetaBanner';
import MainLayout from './components/MainLayout';
import ChatBot from './components/ChatBot';
import NotificationWidget from './components/NotificationWidget';
import StaffDirectoryScreen from './components/StaffDirectoryScreen';
import HomeScreen from './components/HomeScreen';
import AssessmentsScreen from './components/AssessmentsScreen';
import GalleryScreen from './components/GalleryScreen';
import HolidayHomeworkScreen from './components/HolidayHomeworkScreen';
import AboutShankaracharya from './components/AboutShankaracharya';
import AboutSchool from './components/AboutSchool';
import PanchangamScreen from './components/PanchangamScreen';
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
import AdminImages from './components/admin/AdminImages';
import UploadImage from './components/admin/UploadImage';

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
    <LayoutProvider>
      <MainLayout pageViewCount={pageViewCount}>
        <Component />
      </MainLayout>
    </LayoutProvider>
  );

  return (
    <BrowserRouter basename="/">
      <AdminAuthProvider>
      <NotificationProvider>
      <SankaraProvider>
        <BetaBanner />
        <Routes>
          <Route path="/" element={withLayout(HomeScreen)} />
          <Route path="/assessments" element={withLayout(AssessmentsScreen)} />
          <Route path="/holiday-homework" element={withLayout(HolidayHomeworkScreen)} />
          <Route path="/people" element={withLayout(StaffDirectoryScreen)} />
          <Route path="/gallery" element={withLayout(GalleryScreen)} />
          <Route path="/contact" element={withLayout(ContactScreen)} />
          <Route path="/panchangam" element={withLayout(PanchangamScreen)} />
          <Route path="/about-shankaracharya" element={withLayout(AboutShankaracharya)} />
          <Route path="/about-school" element={withLayout(AboutSchool)} />
          <Route path="/feedback" element={withLayout(FeedbackScreen)} />
          <Route path="/reports" element={withLayout(ReportsScreen)} />
          <Route path="/timed-assessments" element={withLayout(TimedAssessmentScreen)} />

          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminLayout><AdminPanel /></AdminLayout>} />
          <Route path="/admin/assessments" element={<AdminLayout><ShowAssessments skipInitialAuth /></AdminLayout>} />
          <Route path="/admin/assessments/new" element={<AdminLayout><MakeAssessment skipInitialAuth /></AdminLayout>} />
          <Route path="/admin/notifications" element={<AdminLayout><MakeNotification /></AdminLayout>} />
          <Route path="/admin/feedback" element={<AdminLayout><FeedbackReportsScreen /></AdminLayout>} />
          <Route path="/admin/images" element={<AdminLayout><AdminImages /></AdminLayout>} />
          <Route path="/admin/images/upload" element={<AdminLayout><UploadImage /></AdminLayout>} />
        </Routes>
        <ChatBot />
        <NotificationWidget />
      </SankaraProvider>
      </NotificationProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;