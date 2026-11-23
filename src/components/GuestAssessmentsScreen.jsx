import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';
import { useSankara } from '../context/SankaraContext';
import { GUEST_MODE } from '../utils/config';
import { buildGuestId, getGuestClasses, getGuestSubjectsForClass, getGuestAssessmentsForClassSubject, getGuestSubmission, hasGuestAttempt, markGuestAttempt, submitMcqAttempt, submitProject } from '../services/assessmentService';
import { getQuizQuestions } from '../utils/shuffle';
import { calculateTotalScore, getGrade } from '../utils/scoring';
import SubjectSelectionScreen from './SubjectSelectionScreen';
import PreAssessmentScreen from './PreAssessmentScreen';
import EmptyState from './EmptyState';
import TimedAssessmentCardsScreen from './TimedAssessmentCardsScreen';
import CodingScreen from './CodingScreen';
import CodingResultScreen from './CodingResultScreen';

import TimedMcqScreen from './TimedMcqScreen';
import TimedProjectScreen from './TimedProjectScreen';
import TimedAssessmentResultScreen from './TimedAssessmentResultScreen';

const GuestAssessmentsScreen = () => {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classNum, setClassNum] = useState(null);
  const [subject, setSubject] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [screen, setScreen] = useState('class');

  const [studentInfo, setStudentInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [assessments, setAssessments] = useState([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [timedResults, setTimedResults] = useState(null);
  const [timedTimeTaken, setTimedTimeTaken] = useState(0);
  const [timedProjectResult, setTimedProjectResult] = useState(null);
  const [codingResult, setCodingResult] = useState(null);
  const [alreadyTaken, setAlreadyTaken] = useState(false);

  useEffect(() => {
    if (!GUEST_MODE) {
      navigate('/', { replace: true });
      return;
    }
    const loadClasses = async () => {
      setClassesLoading(true);
      const cls = await getGuestClasses();
      setClasses(cls);
      setClassesLoading(false);
    };
    loadClasses();
  }, [navigate]);

  useEffect(() => {
    if (!classNum) {
      setSubjects([]);
      return;
    }
    setSubjectsLoading(true);
    getGuestSubjectsForClass(classNum).then(setSubjects).finally(() => setSubjectsLoading(false));
  }, [classNum]);

  useEffect(() => {
    if (!classNum || !subject) {
      setAssessments([]);
      return;
    }
    const loadAssessments = async () => {
      setAssessmentsLoading(true);
      const asms = await getGuestAssessmentsForClassSubject(classNum, subject);
      setAssessments(asms);
      setAssessmentsLoading(false);
    };
    loadAssessments();
  }, [classNum, subject]);

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

  const handleSelectClass = (cls) => {
    setClassNum(cls);
    setScreen('subject');
  };

  const handleSelectSubject = (subj) => {
    setSubject(subj);
    setScreen('timed-assessments');
  };

  const handleSelectAssessment = (id) => {
    const asm = assessments.find(a => a.id === id);
    if (!asm) return;
    if (asm.weakOnly || asm.allowGuest === false) {
      setAlreadyTaken(false);
      setError && setError('This assessment is not available in no-login mode');
      alert('This assessment is not available in no-login mode');
      return;
    }
    setSelectedAssessment(asm);
    if (!studentInfo) {
      setScreen('name');
      return;
    }
    startAssessment(asm);
  };

  const handleNameSubmit = (firstName, lastName) => {
    const guestId = buildGuestId();
    const info = {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      userId: null,
      guestId,
      rollNumber: guestId,
    };
    setStudentInfo(info);
    if (selectedAssessment) {
      startAssessment(selectedAssessment, info);
    }
  };

  const startAssessment = async (asm, infoOverride) => {
    const info = infoOverride || studentInfo;
    if (!info) { setScreen('name'); return; }
    const existing = await getGuestSubmission(asm.id, info.guestId);
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
      setAlreadyTaken(true);
      return;
    }
    if (hasGuestAttempt(asm.id, info.guestId)) {
      setAlreadyTaken(true);
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

  const handleTimedPreAssessmentSuccess = () => {
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
      markGuestAttempt(selectedAssessment.id, studentInfo.guestId);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    setScreen('timed-result');
  };

  const handleTimedProjectComplete = async (projectData, file, onProgress) => {
    const result = await submitProject(selectedAssessment.id, studentInfo, projectData, file, onProgress);
    markGuestAttempt(selectedAssessment.id, studentInfo.guestId);
    setTimedProjectResult(result);
  };

  const handleCodingComplete = useCallback((payload) => {
    if (payload && payload.results) {
      markGuestAttempt(selectedAssessment?.id, studentInfo?.guestId);
    }
    setCodingResult(payload);
    setScreen('timed-coding-result');
  }, [selectedAssessment, studentInfo]);

  const goBack = useCallback(() => {
    if (screen === 'timed-preassessment') { setScreen('timed-assessments'); return; }
    if (screen === 'name') { setScreen('timed-assessments'); return; }
    if (screen === 'timed-assessments') { setScreen('subject'); return; }
    if (screen === 'timed-mcq' || screen === 'timed-project' || screen === 'timed-coding' || screen === 'timed-coding-result') { setScreen('timed-assessments'); return; }
    if (screen === 'subject') { setScreen('class'); return; }
    navigate('/');
  }, [screen, navigate]);

  const handleBackToHome = useCallback(() => {
    setAlreadyTaken(false);
    setClassNum(null);
    setSubject(null);
    setStudentInfo(null);
    setSubjects([]);
    setAssessments([]);
    setSelectedAssessment(null);
    setTimedResults(null);
    setTimedProjectResult(null);
    setCodingResult(null);
    setScreen('class');
  }, []);

  if (!GUEST_MODE) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No-Login Assessments Disabled</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">This feature is currently turned off. Please log in to take assessments.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">Login</button>
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
          <p className="text-gray-500 dark:text-gray-400 mb-6">This device has already submitted this assessment. Multiple submissions are not allowed.</p>
          <button onClick={handleBackToHome} className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">← Back to Classes</button>
        </div>
      </div>
    );
  }

  if (screen === 'class') {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card w-full max-w-2xl animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🏫</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Class</h2>
            <p className="text-gray-500 dark:text-gray-400">No login needed — pick your class to see available assessments</p>
          </div>

          {classesLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500 dark:text-gray-400">No no-login assessments available at the moment.</p>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {classes.map((cls) => (
                <button
                  key={cls}
                  onClick={() => handleSelectClass(cls)}
                  className="w-full p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-primary/50 transition-all text-left flex items-center gap-4 group"
                >
                  <span className="text-3xl">🎓</span>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Class {cls}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Click to select</div>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400 group-hover:text-primary transition-colors">→</span>
                </button>
              ))}
            </div>
          )}

          <div className="text-center">
            <button onClick={goBack} className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all">← Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'subject') {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <SubjectSelectionScreen
            classNum={classNum}
            subjects={subjects}
            isLoading={subjectsLoading}
            onSelect={handleSelectSubject}
          />
          <div className="mt-4 text-center">
            <button onClick={goBack} className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all">← Back to Classes</button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'timed-assessments') {
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
  }

  if (screen === 'name') {
    return (
      <NameEntryScreen onBack={goBack} onSubmit={handleNameSubmit} />
    );
  }

  switch (screen) {
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
            onRestart={handleBackToHome}
          />
        </div>
      );

    default:
      return (
        <div className="w-full flex items-center justify-center px-4 py-8">
          <div className="glass-card p-8 text-center w-full max-w-md animate-slideUp">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Assessments Available</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">There are no no-login exams or assessments available at the moment. Please check back later.</p>
            <button onClick={goBack} className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">← Back</button>
          </div>
        </div>
      );
  }
};

const NameEntryScreen = ({ onBack, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!firstName.trim()) { setError('First name is required'); return; }
    if (!lastName.trim()) { setError('Last name is required'); return; }
    onSubmit(firstName.trim(), lastName.trim());
  };

  return (
    <div className="w-full flex items-center justify-center px-4 py-8">
      <div className="glass-card w-full max-w-md animate-slideUp">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Enter Your Name</h2>
          <p className="text-gray-500 dark:text-gray-400">Your result will be shown to your teacher. No account needed.</p>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">First Name *</label>
            <input
              type="text"
              value={firstName}
              onChange={e => { setFirstName(e.target.value); setError(''); }}
              placeholder="e.g. Aarav"
              className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Last Name *</label>
            <input
              type="text"
              value={lastName}
              onChange={e => { setLastName(e.target.value); setError(''); }}
              placeholder="e.g. Sharma"
              className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-500">⚠️ {error}</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onBack} className="flex-1 px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all">← Back</button>
          <button onClick={handleSubmit} className="flex-1 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">Continue →</button>
        </div>
      </div>
    </div>
  );
};

export default GuestAssessmentsScreen;
