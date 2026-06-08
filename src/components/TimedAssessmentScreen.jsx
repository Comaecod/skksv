import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLayout } from '../context/LayoutContext';
import { useSankara } from '../context/SankaraContext';
import { getClassesWithActive, getSubjectsForClassWithActive, getAssessmentsForClassSubject, getAssessmentById, getSubmissionsForAssessment, submitMcqAttempt, submitProject, toDate } from '../services/timedAssessmentService';
import { getQuizQuestions } from '../utils/shuffle';
import { calculateTotalScore } from '../utils/scoring';
import TimedAssessmentClassesScreen from './TimedAssessmentClassesScreen';
import TimedAssessmentSubjectsScreen from './TimedAssessmentSubjectsScreen';
import TimedAssessmentCardsScreen from './TimedAssessmentCardsScreen';
import TimedAssessmentEntryScreen from './TimedAssessmentEntryScreen';
import TimedMcqScreen from './TimedMcqScreen';
import TimedProjectScreen from './TimedProjectScreen';
import TimedAssessmentResultScreen from './TimedAssessmentResultScreen';
import TimedAssessmentReportsScreen from './TimedAssessmentReportsScreen';
import EmptyState from './EmptyState';

const TimedAssessmentScreen = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedClass = searchParams.get('class');
  const selectedSubject = searchParams.get('subject');
  const selectedAssessmentId = searchParams.get('assessment');
  const screen = searchParams.get('screen') || 'classes';

  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [projectResult, setProjectResult] = useState(null);
  const [reportData, setReportData] = useState([]);

  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  const { setHideHeader, setHideFooter } = useLayout();
  const { setSankaraVisible, setNotificationVisible } = useSankara();

  useEffect(() => {
    const hide = ['entry', 'mcq', 'project', 'result'].includes(screen);
    setHideHeader(hide);
    setHideFooter(hide);
    setSankaraVisible(!hide);
    setNotificationVisible(!hide);
    return () => { setHideHeader(false); setHideFooter(false); setSankaraVisible(true); setNotificationVisible(true); };
  }, [screen, setHideHeader, setHideFooter, setSankaraVisible, setNotificationVisible]);

  const updateParams = useCallback((updates) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined) p.delete(k);
        else p.set(k, v);
      });
      return p;
    });
  }, [setSearchParams]);

  useEffect(() => {
    const load = async () => {
      setLoadingClasses(true);
      const cls = await getClassesWithActive();
      setClasses(cls);
      setLoadingClasses(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) { setSubjects([]); return; }
    const load = async () => {
      setLoadingSubjects(true);
      const subs = await getSubjectsForClassWithActive(selectedClass);
      setSubjects(subs);
      setLoadingSubjects(false);
    };
    load();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSubject) { setAssessments([]); return; }
    const load = async () => {
      setLoadingAssessments(true);
      const now = new Date();
      const asm = await getAssessmentsForClassSubject(selectedClass, selectedSubject);
      setAssessments(asm.filter(a => toDate(a.endDateTime) > now));
      setLoadingAssessments(false);
    };
    load();
  }, [selectedClass, selectedSubject]);

  useEffect(() => {
    if (screen !== 'reports' || !selectedAssessmentId) return;
    const load = async () => {
      setAssessment(await getAssessmentById(selectedAssessmentId));
      setReportData(await getSubmissionsForAssessment(selectedAssessmentId));
    };
    load();
  }, [screen, selectedAssessmentId]);

  const handleSelectClass = useCallback((num) => {
    updateParams({ class: num, subject: null, assessment: null, screen: 'subjects' });
  }, [updateParams]);

  const handleSelectSubject = useCallback((subj) => {
    updateParams({ subject: subj, assessment: null, screen: 'assessments' });
  }, [updateParams]);

  const handleSelectAssessment = useCallback((id) => {
    updateParams({ assessment: id, screen: 'entry' });
  }, [updateParams]);

  const handleOpenReports = useCallback((id) => {
    updateParams({ assessment: id, screen: 'reports' });
  }, [updateParams]);

  const handleEntrySubmit = useCallback(async (info) => {
    setStudentInfo(info);
    if (!selectedAssessmentId) return;
    const asm = await getAssessmentById(selectedAssessmentId);
    setAssessment(asm);
    if (asm?.assessmentType === 'mcq') {
      const prepared = getQuizQuestions(asm.questions || [], asm.sections || []);
      setQuizQuestions(prepared);
      setAnswers({});
      updateParams({ screen: 'mcq' });
    } else {
      updateParams({ screen: 'project' });
    }
  }, [selectedAssessmentId, updateParams]);

  const handleMcqComplete = useCallback(async (finalAnswers, taken) => {
    setAnswers(finalAnswers);
    setTimeTaken(taken);
    const scraped = calculateTotalScore(quizQuestions, finalAnswers, assessment?.wrongAnswerPenaltyFraction || 0);
    setResults(scraped);
    try {
      await submitMcqAttempt(selectedAssessmentId, studentInfo, finalAnswers, scraped, taken);
    } catch (err) {
      console.error('Failed to save result:', err);
    }
    updateParams({ screen: 'result' });
  }, [quizQuestions, assessment, selectedAssessmentId, studentInfo, updateParams]);

  const handleProjectComplete = useCallback(async (projectData, file, onProgress) => {
    const result = await submitProject(selectedAssessmentId, studentInfo, projectData, file, onProgress);
    setProjectResult(result);
  }, [selectedAssessmentId, studentInfo]);

  const goBack = useCallback(() => {
    if (screen === 'subjects') { updateParams({ class: null, subject: null, assessment: null, screen: 'classes' }); return; }
    if (screen === 'assessments') { updateParams({ subject: null, assessment: null, screen: 'subjects' }); return; }
    if (screen === 'entry') { updateParams({ assessment: null, screen: 'assessments' }); return; }
    if (screen === 'mcq' || screen === 'project') { updateParams({ screen: 'entry' }); return; }
    if (screen === 'result') { updateParams({}); return; }
    if (screen === 'reports') { updateParams({ assessment: null, screen: 'assessments' }); return; }
    navigate('/');
  }, [screen, updateParams, navigate]);

  const containerClass = 'w-full flex items-center justify-center px-4 py-8';

  if (loadingClasses) {
    return (
      <div className={containerClass}>
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  switch (screen) {
    case 'classes':
      return (
        <div className={containerClass}>
          <TimedAssessmentClassesScreen classes={classes} onSelect={handleSelectClass} onBack={() => navigate('/')} />
        </div>
      );

    case 'subjects':
      return (
        <div className={containerClass}>
          <TimedAssessmentSubjectsScreen
            classNum={selectedClass}
            subjects={subjects}
            isLoading={loadingSubjects}
            onSelect={handleSelectSubject}
            onBack={goBack}
          />
        </div>
      );

    case 'assessments':
      return (
        <div className={containerClass}>
          <TimedAssessmentCardsScreen
            classNum={selectedClass}
            subject={selectedSubject}
            assessments={assessments}
            isLoading={loadingAssessments}
            onSelect={handleSelectAssessment}
            onReports={handleOpenReports}
            onBack={goBack}
          />
        </div>
      );

    case 'entry':
      return (
        <div className={containerClass}>
          <TimedAssessmentEntryScreen onStart={handleEntrySubmit} onBack={goBack} />
        </div>
      );

    case 'mcq':
      return (
        <div className="">
          <TimedMcqScreen
            questions={quizQuestions}
            studentInfo={studentInfo}
            assessment={assessment}
            onComplete={handleMcqComplete}
          />
        </div>
      );

    case 'project':
      return (
        <div className={containerClass}>
          <TimedProjectScreen assessment={assessment} onComplete={handleProjectComplete} onBack={goBack} />
        </div>
      );

    case 'reports':
      return (
        <div className={containerClass}>
          <TimedAssessmentReportsScreen
            assessmentId={selectedAssessmentId}
            assessment={assessment}
            reportData={reportData}
            onBack={goBack}
          />
        </div>
      );

    case 'result':
      return (
        <div className={containerClass}>
          <TimedAssessmentResultScreen
            questions={quizQuestions}
            answers={answers}
            studentInfo={studentInfo}
            assessment={assessment}
            results={results}
            timeTaken={timeTaken}
            projectResult={projectResult}
            onRestart={() => { updateParams({}); }}
          />
        </div>
      );

    default:
      return <div className={containerClass}><EmptyState /></div>;
  }
};

export default TimedAssessmentScreen;
