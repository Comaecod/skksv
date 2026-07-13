import { collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';

const AUDIT_COLLECTION = 'auditLogs';

export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  USER_CREATED: 'user_created',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  PASSWORD_RESET: 'password_reset',
  ASSESSMENT_CREATED: 'assessment_created',
  ASSESSMENT_UPDATED: 'assessment_updated',
  ASSESSMENT_DELETED: 'assessment_deleted',
  ASSESSMENT_SUBMITTED: 'assessment_submitted',
  STUDENT_CREATED: 'student_created',
  STUDENT_UPDATED: 'student_updated',
  STUDENT_ACTIVATED: 'student_activated',
  STUDENT_DEACTIVATED: 'student_deactivated',
};

export const auditService = {
  log: async (action, userId, metadata = {}) => {
    try {
      const logEntry = {
        action,
        userId,
        userEmail: metadata.userEmail || '',
        userRole: metadata.userRole || '',
        timestamp: serverTimestamp(),
        ip: metadata.ip || '',
        userAgent: metadata.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : ''),
        metadata,
      };

      const docRef = await addDoc(collection(db, AUDIT_COLLECTION), logEntry);
      return docRef.id;
    } catch (error) {
      console.error('Audit log error:', error);
    }
  },

  getLogs: async (options = {}) => {
    const constraints = [];
    const auditRef = collection(db, AUDIT_COLLECTION);

    if (options.action) {
      constraints.push(where('action', '==', options.action));
    }
    if (options.userId) {
      constraints.push(where('userId', '==', options.userId));
    }
    constraints.push(orderBy('timestamp', options.order || 'desc'));
    constraints.push(limit(options.limit || 100));

    const q = query(auditRef, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getLogsByUser: async (userId, maxLogs = 50) => {
    return auditService.getLogs({ userId, limit: maxLogs });
  },

  getLogsByAction: async (action, maxLogs = 50) => {
    return auditService.getLogs({ action, limit: maxLogs });
  },
};
