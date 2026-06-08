import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';
import { useSankara } from '../context/SankaraContext';
import { getExamTypes, getClassesForType, getSubjectsForClass, getExamConfig } from '../utils/examLoader';
import { getClassesWithActive } from '../services/timedAssessmentService';
import { getQuizQuestions } from '../utils/shuffle';
import ExamTypeScreen from './ExamTypeScreen';
import ClassSelectionScreen from './ClassSelectionScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import IntroScreen from './IntroScreen';
import PreAssessmentScreen from './PreAssessmentScreen';
import RollNumberScreen from './RollNumberScreen';
import QuizScreen from './QuizScreen';
import ResultScreen from './ResultScreen';
import EmptyState from './EmptyState';

const AssessmentsScreen = () => {
  const navigate = useNavigate();
  
  const [examConfig, setExamConfig] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [examTypes, setExamTypes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [selectedExamType, setSelectedExamType] = useState(null);
  const [classNum, setClassNum] = useState(null);
  const [subject, setSubject] = useState(null);
  const [screen, setScreen] = useState('exam-type');

  useEffect(() => {
    const loadExamTypes = async () => {
      setLoading(true);
      try {
        const types = await getExamTypes();
        const activeTimedClasses = await getClassesWithActive();
        setExamTypes(activeTimedClasses.length > 0 ? types : types.filter(t => t !== 'Timed Assessment'));
      } catch (err) {
        console.error('Error loading exam types:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExamTypes();
  }, []);

  useEffect(() => {
    const loadClasses = async () => {
      if (!selectedExamType) {
        setClasses([]);
        return;
      }
      setLoading(true);
      try {
        const cls = await getClassesForType(selectedExamType);
        setClasses(cls);
      } catch (err) {
        console.error('Error loading classes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [selectedExamType]);

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
  const { setSankaraVisible } = useSankara();

  useEffect(() => {
    const hide = ['preassessment', 'student', 'quiz', 'result'].includes(screen);
    setHideHeader(hide);
    setHideFooter(hide);
    setSankaraVisible(!hide);
    return () => { setHideHeader(false); setHideFooter(false); setSankaraVisible(true); };
  }, [screen, setHideHeader, setHideFooter, setSankaraVisible]);

  const handleSelectExamType = (type) => {
    if (type === 'Timed Assessment') {
      navigate('/timed-assessments');
      return;
    }
    setSelectedExamType(type);
    setClassNum(null);
    setSubject(null);
    setScreen('class');
  };

  const handleSelectClass = (num) => {
    setClassNum(num);
    setSubject(null);
    setScreen('subject');
  };

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    setScreen('intro');
  };

  const handleStartQuiz = (info) => {
    if (!examConfig?.questions) return;
    const preparedQuestions = getQuizQuestions(examConfig.questions, examConfig.sections);
    setStudentInfo(info);
    setQuizQuestions(preparedQuestions);
    setAnswers({});
    setScreen('quiz');
  };

  const handleQuizComplete = (finalAnswers) => {
    setAnswers(finalAnswers);
    setScreen('result');
  };

  const goBack = useCallback(() => {
    if (screen === 'subject') {
      setScreen('class');
      setClassNum(null);
      return;
    }
    if (screen === 'intro') { setScreen('subject'); return; }
    if (screen === 'preassessment') { setScreen('intro'); return; }
    if (screen === 'student') { setScreen('preassessment'); return; }
    if (screen === 'quiz') { setScreen('student'); return; }
    if (screen === 'class') {
      setScreen('exam-type');
      setSelectedExamType(null);
      return;
    }
    navigate('/');
  }, [screen, navigate]);

  const handleBackToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleOpenReports = useCallback(() => {
    navigate('/reports', { state: { config: examConfig } });
  }, [navigate, examConfig]);

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
          <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all">← Back to Home</button>
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

    case 'class':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <ClassSelectionScreen 
            examType={selectedExamType} 
            classes={classes} 
            onSelect={handleSelectClass} 
            onBack={goBack} 
            isLoading={loading}
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
            onSuccess={() => setScreen('student')} 
            onBack={goBack} 
          />
        </div>
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    case 'student':
      return examConfig ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <RollNumberScreen 
            onStartQuiz={handleStartQuiz} 
            questionsCount={examConfig.totalQuestions || 0} 
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