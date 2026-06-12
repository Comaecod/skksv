import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

const CACHE_TTL = 60 * 1000;
const queryCache = new Map();

const cachedQuery = async (cacheKey, queryFn, ttl = CACHE_TTL) => {
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  const data = await queryFn();
  queryCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

export const getExamTypes = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'examConfigs'));
    const types = new Set();
    snapshot.forEach(d => {
      const data = d.data();
      if (data.examType) types.add(data.examType);
    });
    return [...types, 'Timed Assessment'].filter(Boolean);
  } catch (error) {
    console.error('Error fetching exam types:', error.message);
    return ['Timed Assessment'];
  }
};

export const getExamTypesForClass = async (classNum) => {
  try {
    const q = query(
      collection(db, 'examConfigs'),
      where('classNum', '==', classNum)
    );
    const snapshot = await getDocs(q);
    const types = new Set();
    snapshot.forEach(d => {
      const data = d.data();
      if (data.examType) types.add(data.examType);
    });
    return [...types, 'Timed Assessment'];
  } catch (error) {
    console.error('Error fetching exam types for class:', error.message);
    return [];
  }
};

export const getClassesForType = async (examType) => {
  try {
    const q = query(
      collection(db, 'examConfigs'),
      where('examType', '==', examType)
    );
    const snapshot = await getDocs(q);
    const classes = new Set();
    snapshot.forEach(d => {
      const data = d.data();
      if (data.classNum) classes.add(data.classNum);
    });
    return [...classes].sort((a, b) => Number(a) - Number(b));
  } catch (error) {
    console.error('Error fetching classes:', error.message);
    return [];
  }
};

export const getSubjectsForClass = async (examType, classNum) => {
  try {
    const q = query(
      collection(db, 'examConfigs'),
      where('examType', '==', examType),
      where('classNum', '==', classNum)
    );
    const snapshot = await getDocs(q);
    const subjects = [];
    snapshot.forEach(d => {
      const data = d.data();
      if (data.subject) subjects.push(data.subject);
    });
    return subjects;
  } catch (error) {
    console.error('Error fetching subjects:', error.message);
    return [];
  }
};

export const getExamConfig = async (examType, classNum, subject) => {
  const key = `${examType}_${classNum}_${subject}`;

  try {
    const docRef = doc(db, 'examConfigs', key);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const exam = docSnap.data();

    const config = {
      examType: exam.examType,
      className: exam.classNum,
      examTitle: exam.title,
      classNum: exam.classNum,
      subject: exam.subject,
      teacher: exam.teacher || '',
      invigilator: exam.invigilator || '',
      preassessmentsecretkey: exam.preassessmentsecretkey || '',
      secretKey: exam.secretKey || '',
      teacherSecretKey: exam.teacherSecretKey || '',
      schoolName: 'Sri Kanchi Kamakoti Sankara Vidyalaya',
      sections: exam.sections || [],
      totalQuestions: exam.totalQuestions,
      totalMarks: exam.totalMarks,
      marksPerQuestion: (exam.sections || []).map(s => ({ range: s.range, marks: s.marks })),
      wrongAnswerPenaltyFraction: exam.wrongAnswerPenaltyFraction ?? 0,
      timeLimitMinutes: exam.timeLimitMinutes || 0,
      questions: exam.questions || [],
      isEnabled: exam.enabled !== false,
      assessmentFormat: exam.assessmentFormat || 'mcq',
      isHolidayHomework: exam.examType === 'Holiday Homework',
      holidayType: exam.holidayType || '',
      content: exam.content || null,
      coding: exam.coding || null
    };

    return config;
  } catch (error) {
    console.error('Error fetching exam config:', error.message);
    return null;
  }
};

export const getAllExams = async () => {
  return {};
};
