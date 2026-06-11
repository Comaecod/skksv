import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import { roleService, getDefaultPermissionsForRole } from '../services/roleService';
import { auditService, AUDIT_ACTIONS } from '../services/auditService';
import { ROLES, USER_STATUS } from '../types/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const profileLoadAttempted = useRef(false);

  const fetchUserProfile = useCallback(async (firebaseUser) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setPermissions([]);
      profileLoadAttempted.current = false;
      return;
    }

    try {
      const profile = await userService.getUserById(firebaseUser.uid);

      if (profile) {
        if (profile.status === USER_STATUS.INACTIVE || profile.status === USER_STATUS.SUSPENDED) {
          setUserProfile(null);
          setPermissions([]);
          await authService.signOut();
          setError('Your account has been deactivated. Contact your administrator.');
          return;
        }

        setUserProfile(profile);
        const userPerms = await roleService.getRolePermissions(profile.role, profile.roleSubtype);
        setPermissions(userPerms);
      } else {
        const defaults = getDefaultPermissionsForRole(
          firebaseUser.email === import.meta.env.VITE_SUPER_ADMIN_EMAIL ? ROLES.SUPER_ADMIN : ROLES.STUDENT
        );
        setPermissions(defaults);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthChanged(async (firebaseUser) => {
      setLoading(true);
      setUser(firebaseUser);

      if (firebaseUser && !profileLoadAttempted.current) {
        profileLoadAttempted.current = true;
        await fetchUserProfile(firebaseUser);
      } else if (!firebaseUser) {
        setUserProfile(null);
        setPermissions([]);
        profileLoadAttempted.current = false;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileLoadAttempted.current = true;
      await fetchUserProfile(user);
    }
  }, [user, fetchUserProfile]);

  const loginWithEmail = useCallback(async (email, password) => {
    setError(null);
    try {
      const firebaseUser = await authService.signInWithEmail(email, password);
      await userService.updateLastLogin(firebaseUser.uid);
      profileLoadAttempted.current = false;
      await fetchUserProfile(firebaseUser);

      auditService.log(AUDIT_ACTIONS.LOGIN, firebaseUser.uid, {
        userEmail: email,
      });

      return firebaseUser;
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw err;
    }
  }, [fetchUserProfile]);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const firebaseUser = await authService.signInWithGoogle();
      await userService.updateLastLogin(firebaseUser.uid);
      profileLoadAttempted.current = false;
      await fetchUserProfile(firebaseUser);

      auditService.log(AUDIT_ACTIONS.LOGIN, firebaseUser.uid, {
        userEmail: firebaseUser.email,
        method: 'google',
      });

      return firebaseUser;
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw err;
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    try {
      if (user) {
        await auditService.log(AUDIT_ACTIONS.LOGOUT, user.uid, {
          userEmail: user.email,
        });
      }
      await authService.signOut();
      setUser(null);
      setUserProfile(null);
      setPermissions([]);
      profileLoadAttempted.current = false;
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, [user]);

  const createUser = useCallback(async (email, password, userData) => {
    setError(null);
    try {
      const newUser = await userService.createUser(email, password, userData);

      if (user) {
        await auditService.log(AUDIT_ACTIONS.USER_CREATED, user.uid, {
          targetUser: email,
          targetRole: userData.role,
          userEmail: user.email,
        });
      }

      return newUser;
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw err;
    }
  }, [user]);

  const resetPassword = useCallback(async (email) => {
    setError(null);
    try {
      await authService.sendPasswordReset(email);

      if (user) {
        await auditService.log(AUDIT_ACTIONS.PASSWORD_RESET, user.uid, {
          targetEmail: email,
          userEmail: user.email,
        });
      }
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw err;
    }
  }, [user]);

  const sendSignInLink = useCallback(async (email) => {
    setError(null);
    try {
      await authService.sendSignInLink(email);
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw err;
    }
  }, []);

  const loginWithEmailLink = useCallback(async () => {
    setError(null);
    try {
      const firebaseUser = await authService.signInWithEmailLink();
      await userService.updateLastLogin(firebaseUser.uid);
      profileLoadAttempted.current = false;
      await fetchUserProfile(firebaseUser);

      await auditService.log(AUDIT_ACTIONS.LOGIN, firebaseUser.uid, {
        userEmail: firebaseUser.email,
        method: 'email_link',
      });

      return firebaseUser;
    } catch (err) {
      const message = getAuthErrorMessage(err.code);
      setError(message);
      throw err;
    }
  }, [fetchUserProfile]);

  const clearError = useCallback(() => setError(null), []);

  const isSuperAdmin = userProfile?.role === ROLES.SUPER_ADMIN;
  const isAdmin = userProfile?.role === ROLES.ADMIN || isSuperAdmin;
  const isStaff = userProfile?.role === ROLES.STAFF;
  const isStudent = userProfile?.role === ROLES.STUDENT;

  const value = {
    user,
    userProfile,
    permissions,
    loading,
    error,
    isAuthenticated: !!user,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isStudent,
    loginWithEmail,
    loginWithGoogle,
    logout,
    createUser,
    resetPassword,
    sendSignInLink,
    loginWithEmailLink,
    refreshProfile,
    clearError,
    hasPermission: (permission) => permissions.includes(permission),
    hasAnyPermission: (requiredPerms) => requiredPerms.some((p) => permissions.includes(p)),
    hasAllPermissions: (requiredPerms) => requiredPerms.every((p) => permissions.includes(p)),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function getAuthErrorMessage(code) {
  const messages = {
    'auth/user-not-found': 'No account found with this email address.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/popup-closed-by-user': 'Sign-in cancelled.',
    'auth/requires-recent-login': 'Please reauthenticate and try again.',
  };
  return messages[code] || 'An authentication error occurred. Please try again.';
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
