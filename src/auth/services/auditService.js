import { collection, addDoc, query, orderBy, limit, getDocs, where, serverTimestamp, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';

const AUDIT_COLLECTION = 'auditLogs';

export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  ASSESSMENT_CREATED: 'assessment_created',
  ASSESSMENT_UPDATED: 'assessment_updated',
  ASSESSMENT_DELETED: 'assessment_deleted',
  ASSESSMENT_SUBMITTED: 'assessment_submitted',
  RESULT_DELETED: 'result_deleted',
  STUDENT_CREATED: 'student_created',
  STUDENT_UPDATED: 'student_updated',
  STUDENT_ACTIVATED: 'student_activated',
  STUDENT_DEACTIVATED: 'student_deactivated',
  NOTIFICATION_CREATED: 'notification_created',
  NOTIFICATION_UPDATED: 'notification_updated',
  NOTIFICATION_DELETED: 'notification_deleted',
  AUDIT_LOG_DELETED: 'audit_log_deleted',
  COUNSELLING_SESSION_CREATED: 'counselling_session_created',
  COUNSELLING_SESSION_UPDATED: 'counselling_session_updated',
  COUNSELLING_SESSION_DELETED: 'counselling_session_deleted',
  COUNSELLING_FOLLOWUP_COMPLETED: 'counselling_followup_completed',
  COUNSELLING_QUESTION_CREATED: 'counselling_question_created',
  COUNSELLING_QUESTION_UPDATED: 'counselling_question_updated',
  COUNSELLING_QUESTION_DELETED: 'counselling_question_deleted',
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

  deleteLog: async (id) => {
    await deleteDoc(doc(db, AUDIT_COLLECTION, id));
  },

  deleteLogs: async (ids) => {
    if (!ids?.length) return;
    const batch = writeBatch(db);
    ids.forEach((id) => {
      batch.delete(doc(db, AUDIT_COLLECTION, id));
    });
    await batch.commit();
  },
};
