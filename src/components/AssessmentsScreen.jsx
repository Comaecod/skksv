import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  switch (screen) {
    case 'exam-type':
      return (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <ExamTypeScreen 
            examTypes={examTypes} 
            onSelect={handleSelectExamType} 
            onBack={handleBackToHome} 
          />
        </div>
      );

    case 'class':
      return (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
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
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
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
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <div className="glass-card p-8 text-center w-full max-w-md">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading assessment...</p>
          </div>
        </div>
      ) : examConfig ? (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <IntroScreen 
            config={examConfig} 
            onStart={() => setScreen('preassessment')} 
            onReports={handleOpenReports}
            onBack={goBack} 
          />
        </div>
      ) : (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <EmptyState />
        </div>
      );

    case 'preassessment':
      return examConfig ? (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <PreAssessmentScreen 
            config={examConfig} 
            onSuccess={() => setScreen('student')} 
            onBack={goBack} 
          />
        </div>
      ) : (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <EmptyState />
        </div>
      );

    case 'student':
      return examConfig ? (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <RollNumberScreen 
            onStartQuiz={handleStartQuiz} 
            questionsCount={examConfig.totalQuestions || 0} 
            onBack={goBack} 
          />
        </div>
      ) : (
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
          <EmptyState />
        </div>
      );

    case 'quiz':
      return (
        <div className="pt-20 sm:pt-16">
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
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
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
        <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
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