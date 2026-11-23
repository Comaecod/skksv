import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { useLayout } from '../context/LayoutContext';
import { useSankara } from '../context/SankaraContext';
import { getSubjectsForClass } from '../utils/assessmentLoader';
import { getAssessmentsForClassSubject, submitMcqAttempt, submitProject, getStudentSubmission } from '../services/assessmentService';
import { getQuizQuestions } from '../utils/shuffle';
import { calculateTotalScore, getGrade } from '../utils/scoring';
import { ROLES } from '../auth/types/roles';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import PreAssessmentScreen from './PreAssessmentScreen';
import EmptyState from './EmptyState';
import TimedAssessmentCardsScreen from './TimedAssessmentCardsScreen';
import CodingScreen from './CodingScreen';
import CodingResultScreen from './CodingResultScreen';

import TimedMcqScreen from './TimedMcqScreen';
import TimedProjectScreen from './TimedProjectScreen';
import TimedAssessmentResultScreen from './TimedAssessmentResultScreen';
import ReportsScreen from './ReportsScreen';

const AssessmentsScreen = () => {
  const navigate = useNavigate();
  const { userProfile: authUser } = useAuth();

  const [studentInfo, setStudentInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const [classNum, setClassNum] = useState(null);
  const [subject, setSubject] = useState(null);
  const [screen, setScreen] = useState('subject');
  const [alreadyTaken, setAlreadyTaken] = useState(false);
  const [error, setError] = useState(null);

  // Assessment state
  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [timedResults, setTimedResults] = useState(null);
  const [timedTimeTaken, setTimedTimeTaken] = useState(0);
  const [timedProjectResult, setTimedProjectResult] = useState(null);
  const [codingResult, setCodingResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (!authUser?.studentClass) {
        const role = authUser?.role;
        if (role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN || role === ROLES.STAFF) {
          navigate('/dashboard/assessments');
          setLoading(false);
          return;
        }
        setError('Your profile does not have a class assigned. Contact your administrator to set your class.');
        setLoading(false);
        return;
      }
      setClassNum(authUser.studentClass);
      setSubjectsLoading(true);
      try {
        let subs = await getSubjectsForClass(authUser.studentClass);
        if (authUser?.isWeak) {
          const hasGeneral = subs.some(s => {
            const val = typeof s === 'object' ? (s?.value ?? s?.id ?? s) : s;
            return String(val) === '17' || String(val).toLowerCase() === 'general';
          });
          if (!hasGeneral) {
            subs = [...subs, 17];
          }
        }
        setSubjects(subs);
      } catch (err) {
        console.error('Error loading subjects:', err);
      } finally {
        setSubjectsLoading(false);
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!classNum || !subject) {
      setAssessments([]);
      return;
    }
    const loadAssessments = async () => {
      setAssessmentsLoading(true);
      try {
        const asms = await getAssessmentsForClassSubject(classNum, subject);
        let merged = [...asms];
        if (authUser?.isWeak) {
          const { getWeakOnlyAssessmentsForUser } = await import('../services/assessmentService');
          const weakOnes = await getWeakOnlyAssessmentsForUser(authUser);
          const seen = new Set(merged.map(a => a.id));
          for (const w of weakOnes) {
            if (seen.has(w.id)) continue;
            const wSubject = w.subject;
            if (wSubject == null) continue;
            if (String(wSubject) === String(subject)) {
              merged.push(w);
              seen.add(w.id);
            }
          }
        }
        setAssessments(merged);
      } catch (err) {
        console.error('Error loading assessments:', err);
        setAssessments([]);
      } finally {
        setAssessmentsLoading(false);
      }
    };
    loadAssessments();
  }, [classNum, subject, authUser]);

  const { setHideHeader, setHideFooter, setHideSidebar } = useLayout();
  const { setSankaraVisible, setNotificationVisible } = useSankara();

  const HIDE_SCREENS = ['timed-mcq', 'timed-project', 'timed-coding', 'timed-coding-result', 'timed-result', 'timed-preassessment'];

  const guardDisabled = import.meta.env.VITE_DISABLE_FULLSCREEN_GUARD === 'true' && import.meta.env.DEV;

  useEffect(() => {
    const hide = HIDE_SCREENS.includes(screen);
    setHideHeader(hide);
    setHideFooter(hide);
    setHideSidebar(hide);
    setSankaraVisible(!hide);
    setNotificationVisible(!hide);
    if (hide && !guardDisabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (!hide && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    return () => { setHideHeader(false); setHideFooter(false); setHideSidebar(false); setSankaraVisible(true); setNotificationVisible(true); };
  }, [screen, setHideHeader, setHideFooter, setHideSidebar, setSankaraVisible, setNotificationVisible]);

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    setScreen('timed-assessments');
  };

  const requestFullscreenIfNeeded = () => {
    try {
      if (guardDisabled) return;
      if (document.fullscreenElement) return;
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch (_) {}
  };

  const handleSelectAssessment = async (id) => {
    requestFullscreenIfNeeded();
    const asm = assessments.find(a => a.id === id);
    if (!asm) return;
    if (asm.weakOnly) {
      if (asm.allowGuest) { setError('This assessment is not available in no-login mode'); return; }
      if (!authUser?.id) { setError('This assessment is only for weak students'); return; }
      if (authUser?.isWeak !== true) { setError('This assessment is only for weak students'); return; }
      if (asm.weakTargetMode === 'classes') {
        const classes = Array.isArray(asm.weakTargetClasses) ? asm.weakTargetClasses.map(String) : [];
        const userClass = authUser?.studentClass != null ? String(authUser.studentClass) : null;
        if (!userClass || !classes.includes(userClass)) { setError('This assessment is not available for your class'); return; }
      }
    }
    setSelectedAssessment(asm);
    const info = buildStudentInfo();
    setStudentInfo(info);
    const existing = await getStudentSubmission(id, info.userId);
    if (existing) {
      if (asm.assessmentFormat === 'coding') {
        const fallbackResults = existing.results || {
          type: 'coding',
          correctCount: existing.score || 0,
          wrongCount: (existing.total || 0) - (existing.score || 0),
          skippedCount: 0,
          totalMarks: existing.totalMarks || 10,
          totalEarned: existing.marks != null ? existing.marks : (existing.score || 0),
          percentage: '0.00',
          grade: 'E',
          testCaseResults: existing.testResults || [],
        };
        const fallbackTotal = fallbackResults.totalMarks || 10;
        fallbackResults.percentage = ((fallbackResults.totalEarned / fallbackTotal) * 100).toFixed(2);
        fallbackResults.grade = getGrade(fallbackResults.percentage);
        setCodingResult({
          results: fallbackResults,
          code: existing.code || '',
          testResults: existing.testResults || [],
          solutionCode: existing.solutionCode || '',
        });
        setScreen('timed-coding-result');
        return;
      }
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
    setCodingResult(null);
    if (asm.preassessmentsecretkey?.length > 0) {
      setScreen('timed-preassessment');
    } else if (asm.assessmentFormat === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setScreen('timed-mcq');
    } else if (asm.assessmentFormat === 'coding') {
      setScreen('timed-coding');
    } else {
      setScreen('timed-project');
    }
  };

  const handleTimedEntrySubmit = async (info) => {
    requestFullscreenIfNeeded();
    setStudentInfo(info);
    if (!selectedAssessment) return;
    const asm = selectedAssessment;
    if (asm.preassessmentsecretkey?.length > 0) {
      setScreen('timed-preassessment');
    } else if (asm.assessmentFormat === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setAnswers({});
      setScreen('timed-mcq');
    } else if (asm.assessmentFormat === 'coding') {
      setScreen('timed-coding');
    } else {
      setScreen('timed-project');
    }
  };

  const handleTimedPreAssessmentSuccess = () => {
    requestFullscreenIfNeeded();
    const asm = selectedAssessment;
    if (!asm) return;
    if (asm.assessmentFormat === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setAnswers({});
      setScreen('timed-mcq');
    } else if (asm.assessmentFormat === 'coding') {
      setScreen('timed-coding');
    } else {
      setScreen('timed-project');
    }
  };

  const handleTimedMcqComplete = async (finalAnswers, taken) => {
    setAnswers(finalAnswers);
    setTimedTimeTaken(taken);
    const scraped = calculateTotalScore(quizQuestions, finalAnswers, selectedAssessment?.wrongAnswerPenaltyFraction || 0);
    setTimedResults(scraped);
    try {
      await submitMcqAttempt(selectedAssessment.id, studentInfo, finalAnswers, scraped, taken);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    setScreen('timed-result');
  };

  const handleTimedProjectComplete = async (projectData, file, onProgress) => {
    const result = await submitProject(selectedAssessment.id, studentInfo, projectData, file, onProgress);
    setTimedProjectResult(result);
  };

  const handleCodingComplete = useCallback((payload) => {
    setCodingResult(payload);
    setScreen('timed-coding-result');
  }, []);

  const buildStudentInfo = () => {
    const nameParts = authUser?.displayName ? authUser.displayName.split(' ') : [];
    return {
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      userId: authUser?.id || authUser?.uid || null,
    };
  };

  const goBack = useCallback(() => {
    if (screen === 'timed-preassessment') { setScreen('timed-assessments'); return; }
    if (screen === 'timed-assessments') { setScreen('subject'); return; }
    if (screen === 'timed-mcq' || screen === 'timed-project' || screen === 'timed-coding' || screen === 'timed-coding-result' || screen === 'timed-reports') { setScreen('timed-assessments'); return; }
    if (screen === 'subject') { navigate('/'); return; }
    navigate('/');
  }, [screen, navigate]);

  const handleBackToHome = useCallback(() => {
    setAlreadyTaken(false);
    setSubject(null);
    setSelectedAssessment(null);
    setTimedResults(null);
    setTimedProjectResult(null);
    setCodingResult(null);
    setScreen('subject');
  }, []);

  const handleTimedRestart = useCallback(() => {
    handleBackToHome();
  }, [handleBackToHome]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!loading && screen === 'subject' && subjects.length === 0 && !error) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md animate-slideUp">
          <div className="text-5xl mb-4">📭</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Assessments Available</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">There are no exams or assessments available at the moment. Please check back later.</p>
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
    case 'subject':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          {error && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm max-w-lg text-center backdrop-blur-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-3 text-red-300 hover:text-red-200">✕</button>
            </div>
          )}
          <SubjectSelectionScreen
            classNum={classNum}
            subjects={subjects}
            isLoading={subjectsLoading}
            onSelect={handleSelectSubject}
            onBack={goBack}
          />
        </div>
      );

    case 'timed-assessments':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <TimedAssessmentCardsScreen
            classNum={classNum}
            subject={subject}
            assessments={assessments}
            isLoading={assessmentsLoading}
            onSelect={handleSelectAssessment}
            onBack={goBack}
          />
        </div>
      );

    case 'timed-preassessment':
      return selectedAssessment ? (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <PreAssessmentScreen
            config={selectedAssessment}
            onSuccess={handleTimedPreAssessmentSuccess}
            onBack={goBack}
          />
        </div>
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    case 'timed-mcq':
      return (
        <div className="">
          <TimedMcqScreen
            questions={quizQuestions}
            studentInfo={studentInfo}
            assessment={selectedAssessment}
            onComplete={handleTimedMcqComplete}
          />
        </div>
      );

    case 'timed-project':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <TimedProjectScreen
            assessment={selectedAssessment}
            onComplete={handleTimedProjectComplete}
            onBack={goBack}
          />
        </div>
      );

    case 'timed-coding':
      return selectedAssessment ? (
        <CodingScreen
          config={{ ...selectedAssessment, examTitle: selectedAssessment.title || selectedAssessment.examTitle }}
          studentInfo={studentInfo}
          onComplete={handleCodingComplete}
        />
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    case 'timed-coding-result':
      return selectedAssessment && codingResult ? (
        <CodingResultScreen
          assessment={selectedAssessment}
          studentInfo={studentInfo}
          results={codingResult.results}
          code={codingResult.code}
          solutionCode={codingResult.solutionCode}
          onBack={goBack}
        />
      ) : (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <EmptyState />
        </div>
      );

    case 'timed-result':
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <TimedAssessmentResultScreen
            questions={quizQuestions}
            answers={answers}
            studentInfo={studentInfo}
            assessment={selectedAssessment}
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
            assessmentId={selectedAssessment?.id}
            assessment={selectedAssessment}
            onBack={goBack}
          />
        </div>
      );

    default:
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <SubjectSelectionScreen
            classNum={classNum}
            subjects={subjects}
            isLoading={subjectsLoading}
            onSelect={handleSelectSubject}
            onBack={goBack}
          />
        </div>
      );
  }
};

export default AssessmentsScreen;
