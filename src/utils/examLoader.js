/**
 * Exam Loader - Optimized for Lazy Loading
 * 1. Fetch exam types only (lightweight)
 * 2. Fetch classes/subjects per type on demand
 * 3. Fetch questions only when exam is selected
 */

import { db } from '../firebase';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

// Lightweight cache - exam types only
const examTypesCache = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000;

// Cache for classes per exam type
const classCache = new Map();

// Cache for subjects per class
const subjectCache = new Map();

// Cache for exam config (full with questions)
const examConfigCache = new Map();

// Holiday Homework - Get available holiday types
export const getHolidayTypes = async () => {
  return ['Summer Vacation'];
};

// Holiday Homework - Get classes for a specific holiday type
export const getHolidayClassesForType = async (holidayType) => {
  if (holidayType === 'Summer Vacation') {
    return ['4', '5', '6', '7', '8', '9', '10'];
  }
  return [];
};

// STAGE 1: Get exam types only
export const getExamTypes = async () => {
  const now = Date.now();
  
  if (examTypesCache.data && (now - examTypesCache.timestamp) < CACHE_TTL) {
    const types = Object.keys(examTypesCache.data);
    return [...types, 'Holiday Homework', 'Timed Assessment'].filter(Boolean);
  }
  
  try {
    const q = query(
      collection(db, 'examTypes'),
      where('enabled', '==', true)
    );
    
    const snapshot = await getDocs(q);
    const types = {};
    
    snapshot.forEach(d => {
      const data = d.data();
      types[data.examType] = {
        id: d.id,
        ...data
      };
    });
    
    examTypesCache.data = types;
    examTypesCache.timestamp = now;
    
    return [...Object.keys(types), 'Holiday Homework', 'Timed Assessment'];
  } catch (error) {
    console.error('Error fetching exam types:', error.message);
    const cached = examTypesCache.data ? Object.keys(examTypesCache.data) : [];
    return [...cached, 'Holiday Homework', 'Timed Assessment'];
  }
};

// STAGE 2: Get classes for exam type
export const getClassesForType = async (examType) => {
  if (classCache.has(examType)) {
    return classCache.get(examType);
  }
  
  try {
    const q = query(
      collection(db, 'examIndex'),
      where('examType', '==', examType)
    );
    
    const snapshot = await getDocs(q);
    const classes = [];
    
    snapshot.forEach(d => {
      const data = d.data();
      if (data.classNum) {
        classes.push(data.classNum);
      }
    });
    
    const uniqueClasses = [...new Set(classes)];
    const sorted = uniqueClasses.sort((a, b) => Number(a) - Number(b));
    classCache.set(examType, sorted);
    return sorted;
  } catch (error) {
    console.error('Error fetching classes:', error.message);
    return [];
  }
};

// STAGE 3: Get subjects for class
export const getSubjectsForClass = async (examType, classNum) => {
  if (examType === 'Holiday Homework') {
    const subjectMap = {
      '4': ['Computers'],
      '5': ['Computers'],
      '6': ['Computers'],
      '7': ['Computers'],
      '8': ['Computers', 'Science'],
      '9': ['Computers', 'Mathematics'],
      '10': ['Computers', 'Mathematics']
    };
    return subjectMap[classNum] || ['Computers'];
  }
  
  const key = `${examType}_${classNum}`;
  
  if (subjectCache.has(key)) {
    return subjectCache.get(key);
  }
  
  try {
    const q = query(
      collection(db, 'examIndex'),
      where('examType', '==', examType),
      where('classNum', '==', classNum)
    );
    
    const snapshot = await getDocs(q);
    const subjects = [];
    
    snapshot.forEach(d => {
      const data = d.data();
      if (data.subject) {
        subjects.push(data.subject);
      }
    });
    
    subjectCache.set(key, subjects);
    return subjects;
  } catch (error) {
    return [];
  }
};

// STAGE 4: Get full exam config with questions
export const getExamConfig = async (examType, classNum, subject, holidayType) => {
  if (examType === 'Holiday Homework') {
    return getHolidayHomeworkConfig(holidayType, classNum, subject);
  }
  
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
      className: exam.className,
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
      isEnabled: exam.enabled !== false
    };
    
    return config;
  } catch (error) {
    console.error('Error fetching exam config:', error.message);
    return null;
  }
};

// Get all exams (legacy)
export const getAllExams = async () => {
  return {};
};

// Holiday Homework cache
const holidayHomeworkCache = new Map();

// Load Holiday Homework config from local JSON
export const getHolidayHomeworkConfig = async (holidayType, classNum, subject) => {
  const cacheKey = `${holidayType}_${classNum}_${subject}`;
  
  if (holidayHomeworkCache.has(cacheKey)) {
    return holidayHomeworkCache.get(cacheKey);
  }
  
  try {
    const module = await import(`../data/Exams/Holiday Homework/${holidayType}/Class ${classNum}/${subject}.json`);
    const data = module.default;
    
    const config = {
      examType: 'Holiday Homework',
      holidayType: data.holidayType || holidayType,
      className: data.className,
      examTitle: data.title,
      classNum: data.classNum,
      subject: data.subject,
      teacher: data.teacher,
      invigilator: data.invigilator,
      schoolName: 'Sri Kanchi Kamakoti Sankara Vidyalaya',
      content: data.content,
      isHolidayHomework: true,
      isEnabled: data.enabled !== false
    };
    
    holidayHomeworkCache.set(cacheKey, config);
    return config;
  } catch (err) {
    console.error('Error loading holiday homework:', err.message);
    return null;
  }
};