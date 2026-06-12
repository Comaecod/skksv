import { ROLES } from '../types/roles';

export const ROUTE_PERMISSIONS = {
  '/dashboard': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT] },
  '/dashboard/assessments': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT] },
  '/dashboard/assessments/new': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] },
  '/dashboard/notifications': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  '/dashboard/feedback': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  '/dashboard/images': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  '/dashboard/images/upload': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  '/dashboard/users': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN] },
  '/dashboard/students': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF] },
  '/dashboard/audit': { roles: [ROLES.SUPER_ADMIN] },
  '/dashboard/settings': { roles: [ROLES.SUPER_ADMIN] },
  '/profile': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT] },
  '/exams': { roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.STAFF, ROLES.STUDENT] },
};

export function canAccessRoute(pathname, userRole) {
  if (!userRole) return false;

  const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  const exactMatch = ROUTE_PERMISSIONS[normalizedPath];
  if (exactMatch) {
    return exactMatch.roles.includes(userRole);
  }

  const matchingPrefix = Object.entries(ROUTE_PERMISSIONS)
    .filter(([routePath]) => normalizedPath.startsWith(routePath))
    .sort(([a], [b]) => b.length - a.length);

  if (matchingPrefix.length > 0) {
    return matchingPrefix[0][1].roles.includes(userRole);
  }

  return true;
}
