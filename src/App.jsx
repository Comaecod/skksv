import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { getPageViewCount } from './services/firebaseService';
import { NotificationProvider } from './context/NotificationContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { LayoutProvider } from './context/LayoutContext';
import { SankaraProvider } from './context/SankaraContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './auth/contexts/AuthContext';
import { ProtectedRoute, RoleRoute, PublicRoute, GuestRoute } from './auth/components/ProtectedRoute';
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

// Auth components (lazy loaded)
const LoginScreen = lazy(() => import('./auth/components/LoginScreen'));
const ForgotPassword = lazy(() => import('./auth/components/ForgotPassword'));
const ResetPassword = lazy(() => import('./auth/components/ResetPassword'));
const Unauthorized = lazy(() => import('./auth/components/Unauthorized'));
const ProfileScreen = lazy(() => import('./auth/components/ProfileScreen'));
const Dashboard = lazy(() => import('./auth/components/Dashboard'));
const EmailLinkCallback = lazy(() => import('./auth/components/EmailLinkCallback'));
const AdminDashboard = lazy(() => import('./auth/components/admin/AdminDashboard'));
const AdminUserManagement = lazy(() => import('./auth/components/admin/AdminUserManagement'));
const AuditLogViewer = lazy(() => import('./auth/components/admin/AuditLogViewer'));

const AuthFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      <AuthProvider>
      <AdminAuthProvider>
      <NotificationProvider>
      <SankaraProvider>
        <BetaBanner />
        <Routes>
          {/* Public Routes */}
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

          {/* Auth Routes */}
          <Route path="/login" element={
            <Suspense fallback={<AuthFallback />}>
              <GuestRoute>
                <LoginScreen />
              </GuestRoute>
            </Suspense>
          } />
          <Route path="/forgot-password" element={
            <Suspense fallback={<AuthFallback />}>
              <GuestRoute>
                <ForgotPassword />
              </GuestRoute>
            </Suspense>
          } />
          <Route path="/reset-password" element={
            <Suspense fallback={<AuthFallback />}>
              <GuestRoute>
                <ResetPassword />
              </GuestRoute>
            </Suspense>
          } />
          <Route path="/unauthorized" element={
            <Suspense fallback={<AuthFallback />}>
              <Unauthorized />
            </Suspense>
          } />
          <Route path="/login/email-link" element={
            <Suspense fallback={<AuthFallback />}>
              <EmailLinkCallback />
            </Suspense>
          } />

          {/* Protected User Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Suspense fallback={<AuthFallback />}>
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <Suspense fallback={<AuthFallback />}>
                  <ProfileScreen />
                </Suspense>
              </div>
            </ProtectedRoute>
          } />

          {/* Admin Panel Routes */}
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout>
                <Suspense fallback={<AuthFallback />}>
                  <AdminDashboard userRole="super_admin" />
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute>
              <AdminLayout>
                <Suspense fallback={<AuthFallback />}>
                  <AdminUserManagement />
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/audit" element={
            <ProtectedRoute>
              <AdminLayout>
                <Suspense fallback={<AuthFallback />}>
                  <AuditLogViewer />
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/assessments" element={
            <ProtectedRoute>
              <AdminLayout><ShowAssessments skipInitialAuth /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/assessments/new" element={
            <ProtectedRoute>
              <AdminLayout><MakeAssessment skipInitialAuth /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute>
              <AdminLayout><MakeNotification /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/feedback" element={
            <ProtectedRoute>
              <AdminLayout><FeedbackReportsScreen /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/images" element={
            <ProtectedRoute>
              <AdminLayout><AdminImages /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/images/upload" element={
            <ProtectedRoute>
              <AdminLayout><UploadImage /></AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
        <ChatBot />
        <NotificationWidget />
      </SankaraProvider>
      </NotificationProvider>
      </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
