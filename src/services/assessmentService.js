import puter from '@heyputer/puter.js';
import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, addDoc, setDoc, query, where, orderBy, serverTimestamp, Timestamp } from 'firebase/firestore';

const ASSESSMENTS_COL = 'examConfigs';
const SUBMISSIONS_COL = 'submissions';
const NOW = () => new Date();

export const toDate = (ts) => {
  if (!ts) return new Date(0);
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds != null) return new Date(ts.seconds * 1000);
  if (ts instanceof Date) return ts;
  return new Date(ts);
};

export const getActiveAssessments = async () => {
  try {
    const q = query(
      collection(db, ASSESSMENTS_COL),
      where('enabled', '==', true)
    );
    const snapshot = await getDocs(q);
    const now = new Date();
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(a => !a.endDateTime || toDate(a.endDateTime) > now);
  } catch (err) {
    console.error('Error fetching active assessments:', err.message);
    return [];
  }
};

export const getClassesWithActive = async () => {
  const assessments = await getActiveAssessments();
  const classes = [...new Set(assessments.map(a => a.classNum))];
  return classes.sort((a, b) => Number(a) - Number(b));
};

export const getSubjectsForClassWithActive = async (classNum) => {
  const assessments = await getActiveAssessments();
  const subjects = [...new Set(assessments.filter(a => String(a.classNum) === String(classNum)).map(a => a.subject))];
  return subjects;
};

export const getAssessmentsForClassSubject = async (classNum, subject) => {
  try {
    const q = query(
      collection(db, ASSESSMENTS_COL),
      where('classNum', '==', String(classNum)),
      where('subject', '==', subject)
    );
    const snapshot = await getDocs(q);
    const now = new Date();
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(a => a.enabled !== false && (!a.endDateTime || toDate(a.endDateTime) > now));
  } catch (err) {
    console.error('Error fetching assessments:', err.message);
    return [];
  }
};

export const getAssessmentById = async (id) => {
  try {
    const snap = await getDoc(doc(db, ASSESSMENTS_COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (err) {
    console.error('Error fetching assessment:', err.message);
    return null;
  }
};

export const updateAssessment = async (id, data) => {
  try {
    const docData = { ...data, updatedAt: serverTimestamp() };
    if (docData.startDateTime && typeof docData.startDateTime === 'string') {
      docData.startDateTime = Timestamp.fromDate(new Date(docData.startDateTime));
    }
    if (docData.endDateTime && typeof docData.endDateTime === 'string') {
      docData.endDateTime = Timestamp.fromDate(new Date(docData.endDateTime));
    }
    await setDoc(doc(db, ASSESSMENTS_COL, id), docData);
    return id;
  } catch (err) {
    console.error('Error updating assessment:', err.message);
    throw err;
  }
};

export const createAssessment = async (data) => {
  try {
    const docData = { ...data, enabled: data.enabled !== false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    if (docData.startDateTime && typeof docData.startDateTime === 'string') {
      docData.startDateTime = Timestamp.fromDate(new Date(docData.startDateTime));
    }
    if (docData.endDateTime && typeof docData.endDateTime === 'string') {
      docData.endDateTime = Timestamp.fromDate(new Date(docData.endDateTime));
    }
    const docRef = await addDoc(collection(db, ASSESSMENTS_COL), docData);
    return docRef.id;
  } catch (err) {
    console.error('Error creating assessment:', err.message);
    throw err;
  }
};

export const submitMcqAttempt = async (assessmentId, studentInfo, answers, results, timeTaken) => {
  try {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');
    if (new Date() > toDate(assessment.endDateTime)) {
      throw new Error('Assessment has expired');
    }
    const docRef = await addDoc(collection(db, SUBMISSIONS_COL), {
      type: 'mcq',
      assessmentId,
      assessmentFormat: assessment.assessmentFormat || 'mcq',
      classNum: String(assessment.classNum),
      subject: assessment.subject,
      title: assessment.title,
      teacher: assessment.teacher || '',
      createdBy: assessment.createdBy || null,
      student: {
        userId: studentInfo.userId || null,
        name: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim(),
      },
      answers,
      results,
      timeTaken,
      timeLimit: assessment.timeLimitMinutes || 0,
      submittedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error('Error submitting MCQ:', err.message);
    throw err;
  }
};

export const submitProject = async (assessmentId, studentInfo, projectData, file, onProgress) => {
  try {
    const assessment = await getAssessmentById(assessmentId);
    if (!assessment) throw new Error('Assessment not found');
    if (new Date() > toDate(assessment.endDateTime)) {
      throw new Error('Assessment has expired');
    }
    let fileUrl = '';
    let fileName = '';
    if (file && assessment.allowFileUpload) {
      const uploadResult = await uploadFile(file, assessmentId, studentInfo.rollNumber, onProgress);
      fileUrl = uploadResult.url;
      fileName = uploadResult.name;
    }
    const docRef = await addDoc(collection(db, SUBMISSIONS_COL), {
      type: 'project',
      assessmentId,
      assessmentFormat: assessment.assessmentFormat || 'project',
      classNum: String(assessment.classNum),
      subject: assessment.subject,
      title: assessment.title,
      teacher: assessment.teacher || '',
      createdBy: assessment.createdBy || null,
      student: {
        userId: studentInfo.userId || null,
        name: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim(),
      },
      topic: projectData.topic || '',
      description: projectData.description || '',
      fileUrl,
      fileName,
      submittedAt: serverTimestamp(),
    });
    return { id: docRef.id, fileUrl, fileName };
  } catch (err) {
    console.error('Error submitting project:', err.message);
    throw err;
  }
};

export const uploadFile = async (file, assessmentId, rollNumber, onProgress) => {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const fileName = `${rollNumber}_${timestamp}_${safeName}`;
  const dirPath = `assessments/${assessmentId}`;

  const result = await puter.fs.upload([file], dirPath, {
    createMissingParents: true,
    dedupeName: true,
    onProgress: (p) => onProgress?.(Math.round(p * 100))
  });
  const fsItem = Array.isArray(result) ? result[0] : result;

  const url = await puter.fs.getReadURL(fsItem.path, 365 * 24 * 60 * 60 * 1000);

  return { url, name: file.name, path: fsItem.path };
};

export const getSubmissionsForAssessment = async (assessmentId) => {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COL),
      where('assessmentId', '==', assessmentId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => {
      const data = d.data();
      const submittedAt = data.submittedAt?.toDate?.() || (data.submittedAt?.seconds ? new Date(data.submittedAt.seconds * 1000) : null);
      const student = data.student || data.studentInfo || {};
      return {
        id: d.id,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '',
        rollNumber: student.rollNumber || '',
        assessmentType: data.type || data.assessmentType,
        submittedAt,
        submittedTime: submittedAt ? submittedAt.toLocaleString() : '-',
        ...data
      };
    });
  } catch (err) {
    console.error('Error fetching submissions:', err.message);
    return [];
  }
};

export const checkDuplicateSubmission = async (assessmentId, rollNumber) => {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COL),
      where('assessmentId', '==', assessmentId),
      where('student.rollNumber', '==', String(rollNumber))
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.length > 0;
  } catch {
    return false;
  }
};

export const getStudentSubmission = async (assessmentId, userId) => {
  try {
    const q = query(
      collection(db, SUBMISSIONS_COL),
      where('assessmentId', '==', assessmentId),
      where('student.userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return { id: doc.id, ...data };
  } catch (err) {
    console.error('Error fetching student submission:', err.message);
    return null;
  }
};
