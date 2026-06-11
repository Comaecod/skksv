import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessRoute } from '../utils/routeGuards';

export function ProtectedRoute({ children, requiredPermissions, fallbackPath = '/login' }) {
  const { isAuthenticated, loading, userProfile, hasAllPermissions, hasAnyPermission } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.mode === 'any'
      ? hasAnyPermission(requiredPermissions.permissions)
      : hasAllPermissions(requiredPermissions.permissions);

    if (!hasAccess) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  const routeAccess = canAccessRoute(location.pathname, userProfile?.role);
  if (!routeAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function RoleRoute({ children, roles, fallbackPath = '/login' }) {
  const { isAuthenticated, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(userProfile?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  return children;
}
