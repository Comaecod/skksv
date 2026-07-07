import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { useSankara } from '../context/SankaraContext';
import { getExamTypes, getExamTypesForClass, getSubjectsForClass, getExamConfig } from '../utils/examLoader';
import { getClassesWithActive, getAssessmentsForClassSubject, getAssessmentById, submitMcqAttempt, submitProject, toDate, getStudentSubmission } from '../services/timedAssessmentService';
import { getQuizQuestions } from '../utils/shuffle';
import { calculateTotalScore } from '../utils/scoring';
import { checkExistingSubmission } from '../services/firebaseService';
import ExamTypeScreen from './ExamTypeScreen';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import IntroScreen from './IntroScreen';
import PreAssessmentScreen from './PreAssessmentScreen';
import QuizScreen from './QuizScreen';
import CodingScreen from './CodingScreen';
import ResultScreen from './ResultScreen';
import HolidayHomeworkContent from './HolidayHomeworkContent';
import EmptyState from './EmptyState';
import TimedAssessmentCardsScreen from './TimedAssessmentCardsScreen';

import TimedMcqScreen from './TimedMcqScreen';
import TimedProjectScreen from './TimedProjectScreen';
import TimedAssessmentResultScreen from './TimedAssessmentResultScreen';
import ReportsScreen from './ReportsScreen';

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
  const [error, setError] = useState(null);

  // Timed assessment state
  const [timedAssessments, setTimedAssessments] = useState([]);
  const [timedAssessmentsLoading, setTimedAssessmentsLoading] = useState(false);
  const [selectedTimedAssessment, setSelectedTimedAssessment] = useState(null);
  const [timedResults, setTimedResults] = useState(null);
  const [timedTimeTaken, setTimedTimeTaken] = useState(0);
  const [timedProjectResult, setTimedProjectResult] = useState(null);

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
    if (selectedExamType === 'Timed Assessment') {
      setExamConfig(null);
      return;
    }
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

  useEffect(() => {
    if (selectedExamType !== 'Timed Assessment' || !subject) {
      setTimedAssessments([]);
      return;
    }
    const loadTimed = async () => {
      setTimedAssessmentsLoading(true);
      const asms = await getAssessmentsForClassSubject(classNum, subject);
      setTimedAssessments(asms);
      setTimedAssessmentsLoading(false);
    };
    loadTimed();
  }, [subject, classNum, selectedExamType]);

  const { setHideHeader, setHideFooter, setHideSidebar } = useLayout();
  const { setSankaraVisible, setNotificationVisible } = useSankara();

  const HIDE_SCREENS = ['preassessment', 'quiz', 'coding', 'result', 'timed-mcq', 'timed-project', 'timed-result', 'timed-preassessment'];

  useEffect(() => {
    const hide = HIDE_SCREENS.includes(screen);
    setHideHeader(hide);
    setHideFooter(hide);
    setHideSidebar(hide);
    setSankaraVisible(!hide);
    setNotificationVisible(!hide);
    if (hide && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!hide && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    return () => { setHideHeader(false); setHideFooter(false); setHideSidebar(false); setSankaraVisible(true); setNotificationVisible(true); };
  }, [screen, setHideHeader, setHideFooter, setHideSidebar, setSankaraVisible, setNotificationVisible]);

  const handleSelectExamType = (type) => {
    setError(null);
    setSelectedExamType(type);
    setSubject(null);
    if (!authUser?.studentClass) {
      setError('Your profile does not have a class assigned. Contact your administrator to set your class.');
      return;
    }
    setClassNum(authUser.studentClass);
    setScreen('subject');
  };

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    if (selectedExamType === 'Timed Assessment') {
      setScreen('timed-assessments');
    } else {
      setScreen('intro');
    }
  };

  const handleSelectTimedAssessment = async (id) => {
    const asm = timedAssessments.find(a => a.id === id);
    if (!asm) return;
    setSelectedTimedAssessment(asm);
    const info = buildStudentInfo();
    setStudentInfo(info);
    const existing = await getStudentSubmission(id, info.userId);
    if (existing) {
      setQuizQuestions(existing.answers ? asm.questions || [] : []);
      setAnswers(existing.answers || {});
      setTimedResults(existing.results || null);
      setTimedTimeTaken(existing.timeTaken || 0);
      setScreen('timed-result');
      return;
    }
    setQuizQuestions([]);
    setAnswers({});
    setTimedResults(null);
    setTimedTimeTaken(0);
    if (asm.preassessmentsecretkey?.length > 0) {
      setScreen('timed-preassessment');
    } else if (asm.assessmentFormat === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setScreen('timed-mcq');
    } else {
      setScreen('timed-project');
    }
  };

  const handleTimedEntrySubmit = async (info) => {
    setStudentInfo(info);
    if (!selectedTimedAssessment) return;
    const asm = selectedTimedAssessment;
    if (asm.preassessmentsecretkey?.length > 0) {
      setScreen('timed-preassessment');
    } else if (asm.assessmentFormat === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setAnswers({});
      setScreen('timed-mcq');
    } else {
      setScreen('timed-project');
    }
  };

  const handleTimedPreAssessmentSuccess = () => {
    const asm = selectedTimedAssessment;
    if (!asm) return;
    if (asm.assessmentFormat === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setAnswers({});
      setScreen('timed-mcq');
    } else {
      setScreen('timed-project');
    }
  };

  const handleTimedMcqComplete = async (finalAnswers, taken) => {
    setAnswers(finalAnswers);
    setTimedTimeTaken(taken);
    const scraped = calculateTotalScore(quizQuestions, finalAnswers, selectedTimedAssessment?.wrongAnswerPenaltyFraction || 0);
    setTimedResults(scraped);
    try {
      await submitMcqAttempt(selectedTimedAssessment.id, studentInfo, finalAnswers, scraped, taken);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    setScreen('timed-result');
  };

  const handleTimedProjectComplete = async (projectData, file, onProgress) => {
    const result = await submitProject(selectedTimedAssessment.id, studentInfo, projectData, file, onProgress);
    setTimedProjectResult(result);
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
    const exists = await checkExistingSubmission(info.userId, examKey);
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
    if (screen === 'timed-preassessment') { setScreen('timed-assessments'); return; }
    if (screen === 'quiz') { setScreen('preassessment'); return; }
    if (screen === 'coding') { setScreen('preassessment'); return; }
    if (screen === 'timed-assessments') { setScreen('subject'); return; }
    if (screen === 'timed-mcq' || screen === 'timed-project' || screen === 'timed-reports') { setScreen('timed-assessments'); return; }
    navigate('/');
  }, [screen, navigate]);

  const handleBackToHome = useCallback(() => {
    setAlreadyTaken(false);
    setSelectedExamType(null);
    setClassNum(null);
    setSubject(null);
    setSelectedTimedAssessment(null);
    setTimedResults(null);
    setTimedProjectResult(null);
    setScreen('exam-type');
  }, []);

  const handleTimedRestart = useCallback(() => {
    handleBackToHome();
  }, [handleBackToHome]);

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

  if (!loading && screen === 'exam-type' && examTypes.length === 0) {
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
          {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm max-w-lg text-center backdrop-blur-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-3 text-red-300 hover:text-red-200">✕</button>
            </div>
          )}
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
        examConfig.isHolidayHomework ? (
          <HolidayHomeworkContent config={examConfig} onBack={goBack} />
        ) : (
          <IntroScreen
            config={examConfig}
            onStart={() => setScreen('preassessment')}
            onReports={handleOpenReports}
            onBack={goBack}
            userRole={authUser?.role}
          />
        )
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

    case 'timed-preassessment':
      return selectedTimedAssessment ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <PreAssessmentScreen
            config={selectedTimedAssessment}
            onSuccess={handleTimedPreAssessmentSuccess}
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

    // Timed Assessment screens
    case 'timed-assessments':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <TimedAssessmentCardsScreen
            classNum={classNum}
            subject={subject}
            assessments={timedAssessments}
            isLoading={timedAssessmentsLoading}
            onSelect={handleSelectTimedAssessment}
            onBack={goBack}
          />
        </div>
      );

    case 'timed-mcq':
      return (
        <div className="">
          <TimedMcqScreen
            questions={quizQuestions}
            studentInfo={studentInfo}
            assessment={selectedTimedAssessment}
            onComplete={handleTimedMcqComplete}
          />
        </div>
      );

    case 'timed-project':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <TimedProjectScreen
            assessment={selectedTimedAssessment}
            onComplete={handleTimedProjectComplete}
            onBack={goBack}
          />
        </div>
      );

    case 'timed-result':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <TimedAssessmentResultScreen
            questions={quizQuestions}
            answers={answers}
            studentInfo={studentInfo}
            assessment={selectedTimedAssessment}
            results={timedResults}
            timeTaken={timedTimeTaken}
            projectResult={timedProjectResult}
            onRestart={handleTimedRestart}
          />
        </div>
      );

    case 'timed-reports':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <ReportsScreen
            assessmentId={selectedTimedAssessment?.id}
            assessment={selectedTimedAssessment}
            onBack={goBack}
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
