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
import HomeScreen from './components/HomeScreen';
import DashboardLayout from './components/admin/AdminLayout';
import { StaffAssetProvider } from './components/StaffComponents';

const ChatBot = lazy(() => import('./components/ChatBot'));
const NotificationWidget = lazy(() => import('./components/NotificationWidget'));
const StaffDirectoryScreen = lazy(() => import('./components/StaffDirectoryScreen'));
const ExecutiveMembersScreen = lazy(() => import('./components/ExecutiveMembersScreen'));
const AssessmentsScreen = lazy(() => import('./components/AssessmentsScreen'));
const GuestAssessmentsScreen = lazy(() => import('./components/GuestAssessmentsScreen'));
const GalleryScreen = lazy(() => import('./components/GalleryScreen'));

const AcademicCalendar = lazy(() => import('./components/AcademicCalendar'));
const Term1ExamSchedule = lazy(() => import('./components/Term1ExamSchedule'));
const ContactScreen = lazy(() => import('./components/ContactScreen'));
const FeedbackScreen = lazy(() => import('./components/FeedbackScreen'));
const FeedbackReportsScreen = lazy(() => import('./components/FeedbackReportsScreen'));
const ReportsScreen = lazy(() => import('./components/ReportsScreen'));
const MakeNotification = lazy(() => import('./components/MakeNotification'));

const MakeAssessment = lazy(() => import('./components/MakeAssessment'));
const ShowAssessments = lazy(() => import('./components/ShowAssessments'));
const AdminImages = lazy(() => import('./components/admin/AdminImages'));
const UploadImage = lazy(() => import('./components/admin/UploadImage'));
const AdminResults = lazy(() => import('./components/admin/AdminResults'));

const LoginScreen = lazy(() => import('./auth/components/LoginScreen'));
const ForgotPassword = lazy(() => import('./auth/components/ForgotPassword'));
const Unauthorized = lazy(() => import('./auth/components/Unauthorized'));
const ProfileScreen = lazy(() => import('./auth/components/ProfileScreen'));
const ForcePasswordChangeGate = lazy(() => import('./auth/components/ForcePasswordChangeGate'));
const Dashboard = lazy(() => import('./auth/components/Dashboard'));
const AdminUserManagement = lazy(() => import('./auth/components/admin/AdminUserManagement'));
const StudentManagement = lazy(() => import('./auth/components/admin/StudentManagement'));
const AuditLogViewer = lazy(() => import('./auth/components/admin/AuditLogViewer'));

const CounsellingDashboard = lazy(() => import('./components/counselling/CounsellingDashboard'));
const CounsellingSessionsList = lazy(() => import('./components/counselling/CounsellingSessionsList'));
const CounsellingSessionForm = lazy(() => import('./components/counselling/CounsellingSessionForm'));
const StudentCounsellingProfile = lazy(() => import('./components/counselling/StudentCounsellingProfile'));
const QuestionBankManager = lazy(() => import('./components/counselling/QuestionBankManager'));

const AuthFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  const [pageViewCount, setPageViewCount] = useState(null);
  const [activeFloating, setActiveFloating] = useState(null);

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
        <Suspense fallback={<AuthFallback />}>
          <Component />
        </Suspense>
      </MainLayout>
    </LayoutProvider>
  );

  return (
    <BrowserRouter basename="/">
      <StaffAssetProvider>
      <AuthProvider>
      <AdminAuthProvider>
      <NotificationProvider>
      <SankaraProvider>
        <BetaBanner />
        <Suspense fallback={<AuthFallback />}>
          <ForcePasswordChangeGate />
        </Suspense>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={withLayout(HomeScreen)} />
          <Route path="/people" element={withLayout(StaffDirectoryScreen)} />
          <Route path="/people/executive" element={withLayout(ExecutiveMembersScreen)} />
          <Route path="/gallery" element={withLayout(GalleryScreen)} />
          <Route path="/contact" element={withLayout(ContactScreen)} />
          <Route path="/academic-calendar" element={withLayout(AcademicCalendar)} />
          <Route path="/exams" element={withLayout(Term1ExamSchedule)} />
          <Route path="/feedback" element={withLayout(FeedbackScreen)} />

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
          <Route path="/unauthorized" element={
            <Suspense fallback={<AuthFallback />}>
              <Unauthorized />
            </Suspense>
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

          <Route path="/assessments" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<AuthFallback />}>
                  <AssessmentsScreen />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/assessments/guest" element={withLayout(GuestAssessmentsScreen)} />
          {/* Dashboard Panel Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<AuthFallback />}>
                  <Dashboard />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/users" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<AuthFallback />}>
                  <AdminUserManagement />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/students" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<AuthFallback />}>
                  <StudentManagement />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/audit" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Suspense fallback={<AuthFallback />}>
                  <AuditLogViewer />
                </Suspense>
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/assessments" element={
            <ProtectedRoute>
              <DashboardLayout><ShowAssessments skipInitialAuth /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/assessments/new" element={
            <ProtectedRoute>
              <DashboardLayout><MakeAssessment skipInitialAuth /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/assessments/edit/:id" element={
            <ProtectedRoute>
              <DashboardLayout><MakeAssessment skipInitialAuth /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/assessments/view/:id" element={
            <ProtectedRoute>
              <DashboardLayout><MakeAssessment skipInitialAuth readOnly /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/notifications" element={
            <ProtectedRoute>
              <DashboardLayout><MakeNotification /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/feedback" element={
            <ProtectedRoute>
              <DashboardLayout><FeedbackReportsScreen /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/images" element={
            <ProtectedRoute>
              <DashboardLayout><AdminImages /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/images/upload" element={
            <ProtectedRoute>
              <DashboardLayout><UploadImage /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/results" element={
            <ProtectedRoute>
              <DashboardLayout><AdminResults /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/counselling" element={
            <ProtectedRoute>
              <DashboardLayout><CounsellingDashboard /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/counselling/sessions" element={
            <ProtectedRoute>
              <DashboardLayout><CounsellingSessionsList /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/counselling/sessions/new" element={
            <ProtectedRoute>
              <DashboardLayout><CounsellingSessionForm /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/counselling/sessions/edit/:id" element={
            <ProtectedRoute>
              <DashboardLayout><CounsellingSessionForm /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/counselling/student/:studentId" element={
            <ProtectedRoute>
              <DashboardLayout><StudentCounsellingProfile /></DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/dashboard/counselling/question-bank" element={
            <ProtectedRoute>
              <DashboardLayout><QuestionBankManager /></DashboardLayout>
            </ProtectedRoute>
          } />
        </Routes>
        <ChatBot isOpen={activeFloating === 'chat'} onToggle={() => setActiveFloating(prev => prev === 'chat' ? null : 'chat')} />
        <NotificationWidget isOpen={activeFloating === 'notifications'} onToggle={() => setActiveFloating(prev => prev === 'notifications' ? null : 'notifications')} />
      </SankaraProvider>
      </NotificationProvider>
      </AdminAuthProvider>
      </AuthProvider>
      </StaffAssetProvider>
    </BrowserRouter>
  );
}

export default App;
