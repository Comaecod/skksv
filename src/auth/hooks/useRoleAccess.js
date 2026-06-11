import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_HIERARCHY } from '../types/roles';

export function useRoleAccess() {
  const { userProfile, permissions, isSuperAdmin, isAdmin, isStaff, isStudent } = useAuth();

  const hasRole = (role) => userProfile?.role === role;
  const hasSubtype = (subtype) => userProfile?.roleSubtype === subtype;

  const isAtLeast = (role) => {
    const userIdx = ROLE_HIERARCHY.indexOf(userProfile?.role);
    const requiredIdx = ROLE_HIERARCHY.indexOf(role);
    if (userIdx === -1 || requiredIdx === -1) return false;
    return userIdx <= requiredIdx;
  };

  const canManage = (targetRole) => {
    if (isSuperAdmin) return true;
    if (isAdmin && targetRole !== ROLES.SUPER_ADMIN) return true;
    return false;
  };

  return {
    role: userProfile?.role,
    roleSubtype: userProfile?.roleSubtype,
    hasRole,
    hasSubtype,
    isAtLeast,
    canManage,
    isSuperAdmin,
    isAdmin,
    isStaff,
    isStudent,
    permissions,
    hasPermission: (permission) => permissions.includes(permission),
    hasAnyPermission: (requiredPerms) => requiredPerms.some((p) => permissions.includes(p)),
    hasAllPermissions: (requiredPerms) => requiredPerms.every((p) => permissions.includes(p)),
  };
}
