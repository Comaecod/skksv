import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isMasterKey } from '../utils/auth';

const AUTH_KEY = 'skksv_admin_authed';
const SESSION_KEY = 'skksv_admin_session';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [isAuthed, setIsAuthed] = useState(() => {
    const stored = sessionStorage.getItem(AUTH_KEY);
    return stored === 'true' && localStorage.getItem(SESSION_KEY) === 'true';
  });

  useEffect(() => {
    if (isAuthed) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(SESSION_KEY, 'true');
    } else {
      sessionStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  }, [isAuthed]);

  const login = useCallback((password) => {
    if (isMasterKey(password)) {
      setIsAuthed(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthed(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthed, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}

export default AdminAuthContext;
