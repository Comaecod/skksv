import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { useSankara } from '../context/SankaraContext';
import { getExamTypes, getExamTypesForClass, getSubjectsForClass, getExamConfig } from '../utils/examLoader';
import { getClassesWithActive } from '../services/timedAssessmentService';
import { getQuizQuestions } from '../utils/shuffle';
import { checkExistingQuizResult, checkExistingCodingSubmission } from '../services/firebaseService';
import ExamTypeScreen from './ExamTypeScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import IntroScreen from './IntroScreen';
import PreAssessmentScreen from './PreAssessmentScreen';

import QuizScreen from './QuizScreen';
import CodingScreen from './CodingScreen';
import ResultScreen from './ResultScreen';
import EmptyState from './EmptyState';

const AssessmentsScreen = () => {
  const navigate = useNavigate();
  const { userProfile: authUser } = useAuth();
  
  const [examConfig, setExamConfig] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [examTypes, setExamTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [classNum, setClassNum] = useState(null);
  const [subject, setSubject] = useState(null);
  const [screen, setScreen] = useState('exam-type');
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    const loadExamTypes = async () => {
      setLoading(true);
      try {
        const allTypes = authUser?.studentClass
          ? await getExamTypesForClass(authUser.studentClass)
          : await getExamTypes();
        const activeTimedClasses = await getClassesWithActive();
        const types = activeTimedClasses.length > 0 ? allTypes : allTypes.filter(t => t !== 'Timed Assessment');
        setExamTypes(types);
      } catch (err) {
        console.error('Error loading exam types:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExamTypes();
  }, []);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!classNum) {
        setSubjects([]);
        return;
      }
      setSubjectsLoading(true);
      try {
        const subs = await getSubjectsForClass(selectedExamType, classNum);
        setSubjects(subs);
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [classNum, selectedExamType]);

  useEffect(() => {
    const loadConfig = async () => {
      if (!subject) {
        setExamConfig(null);
        return;
      }
      setConfigLoading(true);
      try {
        const config = await getExamConfig(selectedExamType, classNum, subject);
        setExamConfig(config);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, [subject, classNum, selectedExamType]);

  const { setHideHeader, setHideFooter } = useLayout();
  const { setSankaraVisible, setNotificationVisible } = useSankara();

  useEffect(() => {
    const hide = ['preassessment', 'student', 'quiz', 'coding', 'result'].includes(screen);
    setHideHeader(hide);
    setHideFooter(hide);
    setSankaraVisible(!hide);
    setNotificationVisible(!hide);
    return () => { setHideHeader(false); setHideFooter(false); setSankaraVisible(true); setNotificationVisible(true); };
  }, [screen, setHideHeader, setHideFooter, setSankaraVisible, setNotificationVisible]);

  const handleSelectExamType = (type) => {
    if (type === 'Timed Assessment') {
      navigate('/timed-assessments');
      return;
    }
    setSelectedExamType(type);
    setSubject(null);
    setClassNum(authUser?.studentClass || 1);
    setScreen('subject');
  };

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    setScreen('intro');
  };

  const buildStudentInfo = () => {
    const nameParts = authUser?.displayName ? authUser.displayName.split(' ') : [];
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      rollNumber: authUser?.admissionNo || 1,
      userId: authUser?.id || authUser?.uid || null,
    };
  };

  const handleStartQuiz = (info) => {
    if (examConfig?.assessmentFormat === 'coding') {
      setStudentInfo(info);
      setScreen('coding');
      return;
    }
    if (!examConfig?.questions) return;
    const preparedQuestions = getQuizQuestions(examConfig.questions, examConfig.sections);
    setStudentInfo(info);
    setQuizQuestions(preparedQuestions);
    setAnswers({});
    setScreen('quiz');
  };

  const handlePreAssessmentSuccess = async () => {
    const info = buildStudentInfo();
    const examKey = `${examConfig.examType}_${examConfig.classNum}_${examConfig.subject}`;
    const checkFn = examConfig?.assessmentFormat === 'coding'
      ? checkExistingCodingSubmission
      : checkExistingQuizResult;
    const exists = await checkFn(info.userId, examKey);
    if (exists) {
      setAlreadyTaken(true);
      return;
    }
    handleStartQuiz(info);
  };

  const handleQuizComplete = (finalAnswers) => {
    setAnswers(finalAnswers);
    setScreen('result');
  };

  const goBack = useCallback(() => {
    if (screen === 'subject') {
      setScreen('exam-type');
      setSelectedExamType(null);
      setClassNum(null);
      return;
    }
    if (screen === 'intro') { setScreen('subject'); return; }
    if (screen === 'preassessment') { setScreen('intro'); return; }
    if (screen === 'quiz') { setScreen('preassessment'); return; }
    if (screen === 'coding') { setScreen('preassessment'); return; }
    navigate('/');
  }, [screen, navigate]);

  const handleBackToHome = useCallback(() => {
    setAlreadyTaken(false);
    setSelectedExamType(null);
    setClassNum(null);
    setSubject(null);
    setScreen('exam-type');
  }, []);

  const handleOpenReports = useCallback(() => {
    if (authUser?.role && authUser.role !== 'student') {
      navigate('/dashboard/results');
    } else {
      navigate('/reports', { state: { config: examConfig } });
    }
  }, [navigate, examConfig, authUser]);

  if (loading && !examTypes.length) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!loading && screen === 'exam-type' && examTypes.every(t => t === 'Holiday Homework' || t === 'Timed Assessment')) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md animate-slideUp">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Assessments Available</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">There are no exams or assessments available at the moment. Please check back later.</p>
          <button onClick={handleBackToHome} className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all">← Back to Assessments</button>
        </div>
      </div>
    );
  }

  if (alreadyTaken) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md animate-slideUp">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Already Submitted</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">You have already taken this assessment. Multiple submissions are not allowed.</p>
          <button onClick={handleBackToHome} className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">← Back to Assessments</button>
        </div>
      </div>
    );
  }

  switch (screen) {
    case 'exam-type':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <ExamTypeScreen 
            examTypes={examTypes} 
            onSelect={handleSelectExamType} 
            onBack={handleBackToHome} 
          />
        </div>
      );

    case 'subject':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <SubjectSelectionScreen 
            examType={selectedExamType} 
            classNum={classNum} 
            subjects={subjects} 
            isLoading={subjectsLoading} 
            onSelect={handleSelectSubject} 
            onBack={goBack} 
          />
        </div>
      );

    case 'intro':
      return configLoading ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <div className="glass-card p-8 text-center w-full max-w-md">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading assessment...</p>
          </div>
        </div>
      ) : examConfig ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <IntroScreen 
            config={examConfig} 
            onStart={() => setScreen('preassessment')} 
            onReports={handleOpenReports}
            onBack={goBack}
            userRole={authUser?.role}
          />
        </div>
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    case 'preassessment':
      return examConfig ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <PreAssessmentScreen 
            config={examConfig} 
            onSuccess={handlePreAssessmentSuccess}
            onBack={goBack} 
          />
        </div>
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    case 'quiz':
      return (
        <div className="">
          <QuizScreen 
            questions={quizQuestions} 
            studentInfo={studentInfo} 
            timeLimitMinutes={examConfig?.timeLimitMinutes || 0} 
            wrongAnswerPenaltyFraction={examConfig?.wrongAnswerPenaltyFraction || 0} 
            onQuizComplete={handleQuizComplete} 
          />
        </div>
      );

    case 'coding':
      return (
        <CodingScreen
          config={examConfig}
          studentInfo={studentInfo}
          onComplete={() => navigate('/')}
        />
      );

    case 'result':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <ResultScreen 
            questions={quizQuestions} 
            answers={answers} 
            studentInfo={studentInfo} 
            config={examConfig} 
            onRestart={() => navigate('/')} 
          />
        </div>
      );

    default:
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <ExamTypeScreen 
            examTypes={examTypes} 
            onSelect={handleSelectExamType} 
            onBack={handleBackToHome} 
          />
        </div>
      );
  }
};

export default AssessmentsScreen;