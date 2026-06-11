import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import {
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '../../firebase';
import { USER_STATUS, ROLES } from '../types/roles';

const USERS_COLLECTION = 'users';

const createUserDocument = async (uid, userData) => {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const now = serverTimestamp();

  const userDoc = {
    id: uid,
    email: userData.email || '',
    displayName: userData.displayName || '',
    role: userData.role || ROLES.STUDENT,
    roleSubtype: userData.roleSubtype || null,
    phone: userData.phone || '',
    status: userData.status || USER_STATUS.ACTIVE,
    profileImage: userData.profileImage || '',
    customFields: userData.customFields || {},
    createdBy: userData.createdBy || null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
    forcePasswordChange: userData.forcePasswordChange ?? false,
  };

  await setDoc(userRef, userDoc);
  return userDoc;
};

const createAuthUserViaRest = async (email, password) => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const resp = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(data.error?.message || 'Failed to create auth user');
  }
  return { uid: data.localId, email: data.email };
};

export const userService = {
  createUser: async (email, password, userData) => {
    const { uid } = await createAuthUserViaRest(email, password);
    const userDoc = await createUserDocument(uid, {
      ...userData,
      email,
    });

    await sendPasswordResetEmail(auth, email);

    return { uid, ...userDoc };
  },

  getUserById: async (uid) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  },

  updateUser: async (uid, updates) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const data = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(userRef, data);
    return { id: uid, ...data };
  },

  deleteUser: async (uid) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await deleteDoc(userRef);
  },

  getAllUsers: async (options = {}) => {
    const constraints = [];
    const usersRef = collection(db, USERS_COLLECTION);

    if (options.role) {
      constraints.push(where('role', '==', options.role));
    }
    if (options.status) {
      constraints.push(where('status', '==', options.status));
    }
    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(usersRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getUserByEmail: async (email) => {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  },

  activateUser: async (uid) => {
    return userService.updateUser(uid, { status: USER_STATUS.ACTIVE });
  },

  deactivateUser: async (uid) => {
    return userService.updateUser(uid, { status: USER_STATUS.INACTIVE });
  },

  sendPasswordReset: async (email) => {
    await sendPasswordResetEmail(auth, email);
  },

  updateLastLogin: async (uid) => {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    });
  },

  createUserDocument,
};
