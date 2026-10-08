import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { auditService, AUDIT_ACTIONS } from '../auth/services/auditService';
import { userService } from '../auth/services/userService';
import { ROLES } from '../auth/types/roles';

const SESSIONS_COL = 'counsellingSessions';
const QUESTIONS_COL = 'counsellingQuestions';

export const SESSION_TYPES = {
  MONTHLY_CHECKIN: 'monthly-checkin',
  INDIVIDUAL: 'individual',
  GROUP: 'group',
  PARENT_DISCUSSION: 'parent-discussion',
};

export const CONCERN_LEVELS = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const CATEGORY_LABELS = {
  emotional: 'Emotional Wellbeing',
  academic: 'Academic',
  social: 'Social / Peer Relations',
  physical: 'Physical Wellbeing',
  family: 'Family / Home',
  behavioral: 'Behavioural',
  general: 'General / Other',
};

export const buildOptionScores = (type) => {
  if (type === 'rating' || type === 'frequency') {
    return [
      { label: 'Never', value: 1, score: 0 },
      { label: 'Rarely', value: 2, score: 25 },
      { label: 'Sometimes', value: 3, score: 50 },
      { label: 'Often', value: 4, score: 75 },
      { label: 'Always', value: 5, score: 100 },
    ];
  }
  if (type === 'yesno') {
    return [
      { label: 'No', value: 'no', score: 0 },
      { label: 'Yes', value: 'yes', score: 100 },
    ];
  }
  return [];
};

export const todayKey = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export const monthKey = (dateKey) => (dateKey || '').slice(0, 7);

export const monthLabel = (key) => {
  if (!key) return '';
  const [y, m] = key.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m) - 1]} ${y}`;
};

export const computeQuestionScore = (question, value) => {
  if (question == null || value == null || value === '') return null;
  const opts = question.options || [];
  const match = opts.find((o) => String(o.value) === String(value));
  if (!match) return null;
  let score = Number.isFinite(Number(match.score)) ? Number(match.score) : 0;
  if (question.reverse) score = 100 - score;
  return Math.max(0, Math.min(100, score));
};

export const computeSessionScore = (responses = []) => {
  const scores = responses.map((r) => r.numericValue).filter((v) => Number.isFinite(v) && v != null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, v) => sum + v, 0) / scores.length);
};

export const normalizeResponses = (responses = []) => {
  return responses
    .filter((r) => r && r.question)
    .map((r) => ({
      questionId: r.questionId || r.id || '',
      question: r.question || '',
      category: r.category || 'general',
      type: r.type || 'text',
      value: r.value ?? '',
      text: r.text || '',
      numericValue: computeQuestionScore(r, r.value),
    }));
};

export const counsellingService = {
  getStudents: async () => {
    return (await userService.getAllUsers({ role: ROLES.STUDENT })).filter((s) => s.studentClass && s.status !== 'inactive');
  },

  getAllSessions: async () => {
    try {
      const q = query(collection(db, SESSIONS_COL), orderBy('date', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error fetching counselling sessions:', err.message);
      return [];
    }
  },

  getSessionsForStudent: async (userId) => {
    if (!userId) return [];
    const all = await counsellingService.getAllSessions();
    return all.filter((s) => s.student?.userId === userId);
  },

  getSessionById: async (id) => {
    try {
      const snap = await getDoc(doc(db, SESSIONS_COL, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (err) {
      console.error('Error fetching counselling session:', err.message);
      return null;
    }
  },

  createSession: async (data, actor) => {
    const docRef = await addDoc(collection(db, SESSIONS_COL), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const student = data.student || {};
    auditService.log(AUDIT_ACTIONS.COUNSELLING_SESSION_CREATED, actor?.uid, {
      sessionId: docRef.id,
      studentName: student.name || '',
      studentId: student.userId || '',
      classNum: student.studentClass || '',
      sessionType: data.sessionType || '',
    });
    return docRef.id;
  },

  updateSession: async (id, data, actor) => {
    await setDoc(
      doc(db, SESSIONS_COL, id),
      { ...data, updatedAt: serverTimestamp() },
      { merge: true }
    );
    const student = data.student || {};
    auditService.log(AUDIT_ACTIONS.COUNSELLING_SESSION_UPDATED, actor?.uid, {
      sessionId: id,
      studentName: student.name || '',
      sessionType: data.sessionType || '',
    });
    return id;
  },

  deleteSession: async (id, actor) => {
    const snap = await getDoc(doc(db, SESSIONS_COL, id));
    const data = snap.exists() ? snap.data() : {};
    await deleteDoc(doc(db, SESSIONS_COL, id));
    auditService.log(AUDIT_ACTIONS.COUNSELLING_SESSION_DELETED, actor?.uid, {
      sessionId: id,
      studentName: data?.student?.name || '',
    });
  },

  markFollowUpCompleted: async (id, actor) => {
    const data = { followUp: { required: true, status: 'completed', completedAt: todayKey(), completedBy: actor?.uid || '' } };
    await setDoc(doc(db, SESSIONS_COL, id), data, { merge: true });
    auditService.log(AUDIT_ACTIONS.COUNSELLING_FOLLOWUP_COMPLETED, actor?.uid, { sessionId: id, completedAt: todayKey() });
    return id;
  },

  getQuestions: async () => {
    try {
      const q = query(collection(db, QUESTIONS_COL), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      console.error('Error fetching counselling questions:', err.message);
      return [];
    }
  },

  createQuestion: async (data, actor) => {
    const q = query(collection(db, QUESTIONS_COL), orderBy('order', 'desc'));
    const snap = await getDocs(q);
    const maxOrder = snap.docs.length ? snap.docs[0].data().order ?? snap.docs.length : snap.size;
    const docRef = await addDoc(collection(db, QUESTIONS_COL), {
      ...data,
      order: maxOrder + 1,
      active: data.active !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    auditService.log(AUDIT_ACTIONS.COUNSELLING_QUESTION_CREATED, actor?.uid, { question: data.question || '', questionId: docRef.id });
    return docRef.id;
  },

  updateQuestion: async (id, data, actor) => {
    await setDoc(doc(db, QUESTIONS_COL, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    auditService.log(AUDIT_ACTIONS.COUNSELLING_QUESTION_UPDATED, actor?.uid, { questionId: id });
    return id;
  },

  deleteQuestion: async (id, actor) => {
    await setDoc(doc(db, QUESTIONS_COL, id), { active: false, updatedAt: serverTimestamp() }, { merge: true });
    auditService.log(AUDIT_ACTIONS.COUNSELLING_QUESTION_DELETED, actor?.uid, { questionId: id });
  },
};