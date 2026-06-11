import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { DEFAULT_ROLE_PERMISSIONS, ROLES } from '../types/roles';

const ROLES_COLLECTION = 'roles';
const PERMISSIONS_COLLECTION = 'permissions';
const ROLE_PERMISSIONS_COLLECTION = 'rolePermissions';

export const roleService = {
  createRole: async (roleData) => {
    const roleRef = doc(collection(db, ROLES_COLLECTION));
    const data = {
      id: roleRef.id,
      name: roleData.name,
      description: roleData.description || '',
      hierarchy: roleData.hierarchy || 0,
      isSystem: roleData.isSystem ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(roleRef, data);
    return { ...data };
  },

  getAllRoles: async () => {
    const snap = await getDocs(collection(db, ROLES_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getRoleById: async (roleId) => {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    const snap = await getDoc(roleRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  updateRole: async (roleId, updates) => {
    const roleRef = doc(db, ROLES_COLLECTION, roleId);
    const data = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(roleRef, data);
    return { id: roleId, ...data };
  },

  deleteRole: async (roleId) => {
    await deleteDoc(doc(db, ROLES_COLLECTION, roleId));
    await deleteDoc(doc(db, ROLE_PERMISSIONS_COLLECTION, roleId));
  },

  createPermission: async (permData) => {
    const permRef = doc(collection(db, PERMISSIONS_COLLECTION));
    const data = {
      id: permRef.id,
      key: permData.key,
      name: permData.name,
      description: permData.description || '',
      group: permData.group || 'general',
      createdAt: serverTimestamp(),
    };
    await setDoc(permRef, data);
    return { ...data };
  },

  getAllPermissions: async () => {
    const snap = await getDocs(collection(db, PERMISSIONS_COLLECTION));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  deletePermission: async (permId) => {
    await deleteDoc(doc(db, PERMISSIONS_COLLECTION, permId));
  },

  setRolePermissions: async (roleId, permissions) => {
    const ref = doc(db, ROLE_PERMISSIONS_COLLECTION, roleId);
    const data = {
      roleId,
      permissions,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data, { merge: true });
    return data;
  },

  getRolePermissions: async (roleId, roleSubtype = null) => {
    const ref = doc(db, ROLE_PERMISSIONS_COLLECTION, roleId);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      return data.permissions || [];
    }

    const defaults = DEFAULT_ROLE_PERMISSIONS[roleId];
    if (!defaults) return [];

    if (roleSubtype && typeof defaults === 'object' && !Array.isArray(defaults)) {
      return defaults[roleSubtype] || [];
    }

    if (Array.isArray(defaults)) return defaults;

    const allSubtypePerms = Object.values(defaults).flat();
    return [...new Set(allSubtypePerms)];
  },

  hasPermission: (userPermissions, requiredPermission) => {
    if (!userPermissions || !requiredPermission) return false;
    return userPermissions.includes(requiredPermission);
  },

  hasAnyPermission: (userPermissions, requiredPermissions) => {
    if (!userPermissions || !requiredPermissions) return false;
    return requiredPermissions.some((p) => userPermissions.includes(p));
  },

  hasAllPermissions: (userPermissions, requiredPermissions) => {
    if (!userPermissions || !requiredPermissions) return false;
    return requiredPermissions.every((p) => userPermissions.includes(p));
  },
};

export const getDefaultPermissionsForRole = (role, roleSubtype = null) => {
  const defaults = DEFAULT_ROLE_PERMISSIONS[role];
  if (!defaults) return [];

  if (roleSubtype && typeof defaults === 'object' && !Array.isArray(defaults)) {
    return defaults[roleSubtype] || [];
  }

  if (Array.isArray(defaults)) return defaults;

  const allSubtypePerms = Object.values(defaults).flat();
  return [...new Set(allSubtypePerms)];
};
