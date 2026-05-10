import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getExamTypes, getClassesForType, getSubjectsForClass, getExamConfig, getHolidayTypes, getHolidayClassesForType } from '../utils/examLoader';
import { getQuizQuestions } from '../utils/shuffle';
import { trackPageView, getPageViewCount } from '../services/firebaseService';
import migrateToLazyStructure from '../utils/migrateLazy';
import ExamTypeScreen from './ExamTypeScreen';
import HolidayTypeScreen from './HolidayTypeScreen';
import ClassSelectionScreen from './ClassSelectionScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import IntroScreen from './IntroScreen';
import PreAssessmentScreen from './PreAssessmentScreen';
import RollNumberScreen from './RollNumberScreen';
import QuizScreen from './QuizScreen';
import ResultScreen from './ResultScreen';
import ReportsScreen from './ReportsScreen';
import EmptyState from './EmptyState';
import HolidayHomeworkScreen from './HolidayHomeworkScreen';

export const useExamFlow = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [examConfig, setExamConfig] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [examTypes, setExamTypes] = useState([]);
  const [showMainCategory, setShowMainCategory] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [holidayTypes, setHolidayTypes] = useState([]);

  const examType = searchParams.get('exam') || null;
  const classNum = searchParams.get('class') || null;
  const subject = searchParams.get('subject') || null;
  const screen = searchParams.get('screen') || 'home';
  const hasExams = examTypes.length > 0;

  useEffect(() => {
    const loadExamTypes = async () => {
      try {
        const types = await getExamTypes();
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
    const loadClasses = async () => {
      if (!examType) {
        setClasses([]);
        return;
      }
      try {
        let cls;
        if (examType === 'Holiday Homework') {
          const holidayType = searchParams.get('holidayType');
          if (holidayType) {
            cls = await getHolidayClassesForType(holidayType);
          } else {
            cls = [];
          }
        } else {
          cls = await getClassesForType(examType);
        }
        setClasses(cls);
      } catch (err) {
        console.error('Error loading classes:', err);
      }
    };
    loadClasses();
  }, [examType, searchParams]);

  useEffect(() => {
    const loadHolidayTypes = async () => {
      if (examType === 'Holiday Homework') {
        try {
          const types = await getHolidayTypes();
          setHolidayTypes(types);
        } catch (err) {
          console.error('Error loading holiday types:', err);
        }
      } else {
        setHolidayTypes([]);
      }
    };
    loadHolidayTypes();
  }, [examType]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!examType || !classNum) {
        setSubjects([]);
        return;
      }
      setSubjectsLoading(true);
      try {
        const subs = await getSubjectsForClass(examType, classNum);
        setSubjects(subs);
      } catch (err) {
        console.error('Error loading subjects:', err);
        setSubjects([]);
      } finally {
        setSubjectsLoading(false);
      }
    };
    loadSubjects();
  }, [examType, classNum]);

  useEffect(() => {
    const loadConfig = async () => {
      if (!examType || !subject) {
        setExamConfig(null);
        return;
      }
      setConfigLoading(true);
      try {
        const holidayType = examType === 'Holiday Homework' ? searchParams.get('holidayType') : null;
        const config = await getExamConfig(examType, classNum, subject, holidayType);
        setExamConfig(config);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    loadConfig();
  }, [examType, classNum, subject, searchParams]);

  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      return newParams;
    });
  }, [setSearchParams]);

  const clearExamParams = useCallback(() => {
    setSearchParams({});
    setExamConfig(null);
    setStudentInfo(null);
    setQuizQuestions([]);
    setAnswers({});
  }, [setSearchParams]);

  const goBack = useCallback(() => {
    if (screen === 'reports') { updateParams({ screen: 'intro' }); return; }
    if (screen === 'result') { updateParams({ screen: 'quiz' }); return; }
    if (screen === 'quiz') { updateParams({ screen: 'student' }); return; }
    if (screen === 'student') { updateParams({ screen: 'preassessment' }); return; }
    if (screen === 'preassessment') { updateParams({ screen: 'intro' }); return; }
    if (screen === 'intro') { updateParams({ screen: 'subject' }); return; }
    if (screen === 'content') { updateParams({ screen: 'subject' }); return; }
    if (screen === 'subject') {
      if (examType === 'Holiday Homework') {
        updateParams({ class: null, subject: null, screen: 'holiday-type' });
      } else {
        updateParams({ class: null, subject: null, screen: 'class' });
      }
      return;
    }
    if (screen === 'class') {
      if (examType === 'Holiday Homework') {
        updateParams({ screen: 'holiday-type', holidayType: null, class: null });
      } else {
        setShowMainCategory(true);
        updateParams({});
      }
      return;
    }
    if (screen === 'holiday-type') {
      setShowMainCategory(true);
      updateParams({});
      return;
    }
    updateParams({});
  }, [screen, updateParams, examType, setShowMainCategory]);

  const handleSelectExamType = useCallback((type) => {
    if (type === 'Holiday Homework') {
      updateParams({ exam: type, screen: 'holiday-type' });
    } else {
      setShowMainCategory(false);
      updateParams({ exam: type, screen: 'class' });
    }
  }, [updateParams]);

  const handleSelectHolidayType = useCallback((type) => {
    updateParams({ holidayType: type, screen: 'class' });
  }, [updateParams]);

  const handleSelectClass = useCallback((num) => {
    updateParams({ class: num, screen: 'subject' });
  }, [updateParams]);

  const handleSelectSubject = useCallback((subj) => {
    if (examType === 'Holiday Homework') {
      updateParams({ subject: subj, screen: 'content' });
    } else {
      updateParams({ subject: subj, screen: 'intro' });
    }
  }, [examType, updateParams]);

  const handleIntroStart = useCallback(() => {
    updateParams({ screen: 'preassessment' });
  }, [updateParams]);

  const handlePreAssessmentSuccess = useCallback(() => {
    updateParams({ screen: 'student' });
  }, [updateParams]);

  const handleOpenReports = useCallback(() => {
    updateParams({ screen: 'reports' });
  }, [updateParams]);

  const handleStartWithStudentInfo = useCallback((info) => {
    if (!examConfig?.questions) return;
    const preparedQuestions = getQuizQuestions(examConfig.questions, examConfig.sections);
    setStudentInfo(info);
    setQuizQuestions(preparedQuestions);
    setAnswers({});
    updateParams({ screen: 'quiz' });
  }, [examConfig, updateParams]);

  const handleQuizComplete = useCallback((finalAnswers) => {
    setAnswers(finalAnswers);
    updateParams({ screen: 'result' });
  }, [updateParams]);

  const renderScreen = () => {
    if (loading) {
      return (
        <div className="glass-card p-8 text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      );
    }

    if (!loading && !hasExams && screen !== 'result') {
      return (
        <div className="glass-card p-8 text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading exam data...</p>
        </div>
      );
    }

    switch (screen) {
      case 'home':
        return <ExamTypeScreen examTypes={examTypes} onSelect={handleSelectExamType} showMainCategory={showMainCategory} setShowMainCategory={setShowMainCategory} />;

      case 'holiday-type':
        return <HolidayTypeScreen holidayTypes={holidayTypes} onSelect={handleSelectHolidayType} onBack={() => updateParams({})} />;

      case 'class':
        return <ClassSelectionScreen examType={examType} classes={classes} onSelect={handleSelectClass} onBack={() => updateParams({})} />;

      case 'subject':
        return <SubjectSelectionScreen examType={examType} classNum={classNum} subjects={subjects} isLoading={subjectsLoading} onSelect={handleSelectSubject} onBack={goBack} />;

      case 'intro':
        return configLoading ? (
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading assessment...</p>
          </div>
        ) : examConfig ? (
          <IntroScreen config={examConfig} onStart={handleIntroStart} onReports={handleOpenReports} onBack={goBack} />
        ) : <EmptyState />;

      case 'preassessment':
        return examConfig ? (
          <PreAssessmentScreen config={examConfig} onSuccess={handlePreAssessmentSuccess} onBack={goBack} />
        ) : (
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading assessment...</p>
          </div>
        );

      case 'student':
        return examConfig ? (
          <RollNumberScreen onStartQuiz={handleStartWithStudentInfo} questionsCount={examConfig.totalQuestions || 0} onBack={goBack} />
        ) : (
          <div className="glass-card p-8 text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        );

      case 'quiz':
        return (
          <QuizScreen questions={quizQuestions} studentInfo={studentInfo} timeLimitMinutes={examConfig?.timeLimitMinutes || 0} wrongAnswerPenaltyFraction={examConfig?.wrongAnswerPenaltyFraction || 0} onQuizComplete={handleQuizComplete} />
        );

      case 'result':
        return (
          <ResultScreen questions={quizQuestions} answers={answers} studentInfo={studentInfo} config={examConfig} onRestart={() => navigate('/')} />
        );

      case 'reports':
        return <ReportsScreen config={examConfig} onBack={goBack} />;

      case 'content':
        return examConfig && examConfig.isHolidayHomework ? (
          <HolidayHomeworkScreen config={examConfig} onBack={goBack} />
        ) : <EmptyState />;

      default:
        return <ExamTypeScreen examTypes={examTypes} onSelect={handleSelectExamType} showMainCategory={showMainCategory} setShowMainCategory={setShowMainCategory} />;
    }
  };

  return { renderScreen, goBack, examConfig };
};