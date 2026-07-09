import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { LayoutProvider, useLayout } from '../../context/LayoutContext';
import ScrollableArea from '../ui/ScrollableArea';
import { ROLES } from '../../auth/types/roles';

const ALL_NAV_ITEMS = {
  super_admin: [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/dashboard/users', icon: '👥', label: 'Users' },
    { to: '/dashboard/students', icon: '🎓', label: 'Students' },
    { to: '/dashboard/audit', icon: '📋', label: 'Audit Logs' },
    { to: '/dashboard/results', icon: '📊', label: 'Results' },
    { to: '/dashboard/assessments', icon: '📝', label: 'Assessments' },
    { to: '/dashboard/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/dashboard/feedback', icon: '💬', label: 'Feedback Reports' },
    { to: '/dashboard/images', icon: '🖼️', label: 'Images' },
  ],
  admin: [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/dashboard/users', icon: '👥', label: 'Users' },
    { to: '/dashboard/students', icon: '🎓', label: 'Students' },
    { to: '/dashboard/results', icon: '📊', label: 'Results' },
    { to: '/dashboard/assessments', icon: '📝', label: 'Assessments' },
    { to: '/dashboard/notifications', icon: '🔔', label: 'Notifications' },
    { to: '/dashboard/feedback', icon: '💬', label: 'Feedback Reports' },
    { to: '/dashboard/images', icon: '🖼️', label: 'Images' },
  ],
  staff: [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/dashboard/students', icon: '🎓', label: 'Students' },
    { to: '/dashboard/results', icon: '📊', label: 'Results' },
    { to: '/dashboard/assessments', icon: '📝', label: 'Assessments' },
  ],
  student: [
    { to: '/dashboard', icon: '📊', label: 'Dashboard' },
    { to: '/assessments', icon: '📝', label: 'Assessments' },
    { to: '/reports', icon: '📊', label: 'My Results' },
  ],
};

const DashboardLayoutInner = ({ children, collapsed, setCollapsed, mobileOpen, setMobileOpen, handleLogout, isActive, navItems }) => {
  const { hideSidebar } = useLayout();
  const sidebarWidth = collapsed ? 'w-16' : 'w-64';
  const sidebarPadding = collapsed ? 'px-2' : 'px-3';
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-white/10 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Toggle sidebar">
          <svg className="w-6 h-6 text-gray-900 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
        >
          Logout
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 h-full ${sidebarWidth} bg-white/95 dark:bg-slate-900/95 border-r border-gray-200 dark:border-white/10 transform transition-all duration-200 ease-in-out flex flex-col ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${hideSidebar ? 'lg:-translate-x-full lg:opacity-0 lg:pointer-events-none' : ''}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-5 border-b border-gray-200 dark:border-white/10 shrink-0`}>
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <span className="text-2xl">📊</span>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">School Management</p>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-all"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <ScrollableArea className={`flex-1 ${sidebarPadding} py-4`} hideTrack>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive(item.to)
                    ? 'bg-primary/10 text-primary dark:text-primary-light shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-lg shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </nav>
        </ScrollableArea>

        <div className={`p-4 border-t border-gray-200 dark:border-white/10 shrink-0 ${collapsed ? 'px-2' : ''}`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all mb-1 ${collapsed ? 'justify-center px-2' : ''}`}
            title={`Theme: ${theme}`}
          >
            <span className="text-lg">{theme === 'dark' ? '🌙' : theme === 'light' ? '☀️' : '💻'}</span>
            {!collapsed && <span className="capitalize">{theme}</span>}
          </button>
          <Link
            to="/"
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
            title="Back to Site"
          >
            <span>←</span>
            {!collapsed && <span>Back to Site</span>}
          </Link>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all mt-1 ${collapsed ? 'justify-center px-2' : ''}`}
            title="Logout"
          >
            <span>🚪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={`${hideSidebar ? 'lg:pl-0' : (collapsed ? 'lg:pl-16' : 'lg:pl-64')} pt-14 lg:pt-0 transition-all duration-200`}>
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

const DashboardLayout = ({ children }) => {
  const { isAuthenticated, userProfile, logout, loading: authLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const role = userProfile?.role;
  const navItems = ALL_NAV_ITEMS[role] || ALL_NAV_ITEMS.student;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <LayoutProvider>
      <DashboardLayoutInner
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        handleLogout={handleLogout}
        isActive={isActive}
        navItems={navItems}
      >
        {children}
      </DashboardLayoutInner>
    </LayoutProvider>
  );
};

export default DashboardLayout;
