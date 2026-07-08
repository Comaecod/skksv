/**
 * Firebase Service
 * Saves quiz results and tracks page views
 */

import { db } from '../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';

const ANALYTICS_DOC = 'analytics';
const VISITOR_COUNT_FIELD = 'pageViews';

/**
 * Increment page view counter
 * Only tracks once per browser session to avoid duplicates in dev mode
 */
export const trackPageView = async () => {
  // Skip if already tracked this session (prevents duplicate in dev mode)
  if (typeof window !== 'undefined' && window.sessionStorage?.getItem('pageViewTracked')) {
    return;
  }
  
  try {
    const analyticsRef = doc(db, 'analytics', ANALYTICS_DOC);
    const snap = await getDoc(analyticsRef);
    
    if (snap.exists()) {
      await setDoc(analyticsRef, {
        [VISITOR_COUNT_FIELD]: increment(1),
        lastVisit: serverTimestamp()
      }, { merge: true });
    } else {
      await setDoc(analyticsRef, {
        [VISITOR_COUNT_FIELD]: 1,
        lastVisit: serverTimestamp()
      });
    }
    
    // Mark as tracked for this session
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem('pageViewTracked', 'true');
    }
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

/**
 * Get current page view count
 * @returns {number|null}
 */
export const getPageViewCount = async () => {
  try {
    const analyticsRef = doc(db, 'analytics', ANALYTICS_DOC);
    const snap = await getDoc(analyticsRef);
    
    if (snap.exists()) {
      return snap.data()[VISITOR_COUNT_FIELD] || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting page view count:', error);
    return null;
  }
};

/**
 * Save quiz result to Firestore
 * @param {Object} studentInfo - Student details
 * @param {Object} config - Quiz configuration
 * @param {Object} results - Calculated scores
 * @returns {string} Document ID
 */
export const saveQuizResult = async (studentInfo, config, results) => {
  try {
    const docRef = await addDoc(collection(db, 'submissions'), {
      type: 'mcq',
      assessmentId: config.id || '',
      assessmentFormat: config.assessmentFormat || 'mcq',
      classNum: String(config.classNum),
      subject: config.subject,
      title: config.examTitle || config.title,
      teacher: config.teacher || '',
      invigilator: config.invigilator || '',
      createdBy: config.createdBy || null,
      
      student: {
        userId: studentInfo.userId || null,
        name: `${studentInfo.firstName || ''} ${studentInfo.lastName || ''}`.trim(),
        rollNumber: String(studentInfo.rollNumber || '')
      },
      
      results: {
        totalMarks: results.totalMarks,
        totalEarned: results.totalEarned,
        percentage: parseFloat(results.percentage),
        grade: results.grade,
        correctCount: results.correctCount,
        wrongCount: results.wrongCount,
        skippedCount: results.skippedCount
      },
      
      timeTaken: results.timeTaken || 0,
      timeLimit: config.timeLimitMinutes || 0,
      submittedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error saving result:', error);
    throw error;
  }
};


