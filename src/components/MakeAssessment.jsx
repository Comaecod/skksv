import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { isMasterKey } from '../utils/auth';
import { createAssessment, updateAssessment, getAssessmentById } from '../services/timedAssessmentService';
import CustomSelect from './CustomSelect';
import ScrollableArea from './ui/ScrollableArea';
import { resolveSubjectValue } from '../utils/format';
import { SUBJECTS } from '../config/schoolConfig';
import { parseQuestions, questionsToMarkdown, parseSections, sectionsToMarkdown } from '../utils/questionParser';

const ASSESSMENT_TYPES = [
  'Slip Test',
  'Unit Test 1',
  'Unit Test 2',
  'Term 1',
  'Term 2',
  'Bridge Course',
  'Timed Assessment',
  'Holiday Homework'
];

const TYPE_DESCRIPTIONS = {
  'Slip Test': 'Short quick assessment tests with MCQs',
  'Unit Test 1': 'First unit evaluation exam',
  'Unit Test 2': 'Second unit evaluation exam',
  'Term 1': 'First term examination',
  'Term 2': 'Second term examination',
  'Bridge Course': 'Foundation course assessment',
  'Timed Assessment': 'Time-bound MCQ tests or project submissions with start/end windows',
  'Holiday Homework': 'Holiday homework projects and assignments'
};

const DEFAULT_QUESTIONS = `[
  {
    "id": 1,
    "text": "Sample single-correct question with image hint?",
    "type": "single",
    "marks": 2,
    "image": "https://via.placeholder.com/400x200/FFE4B5/000000?text=Question+Image+Hint",
    "explanation": "This explains why the correct answer is right and the others are wrong. Teachers can provide detailed feedback here.",
    "options": [
      { "text": "Correct Answer" },
      { "text": "Wrong Option" },
      { "text": "Wrong Option" },
      { "text": "Wrong Option" }
    ],
    "isCorrect": 0
  },
  {
    "id": 2,
    "text": "Sample multiple-correct question (select all that apply)?",
    "type": "multiple",
    "marks": 3,
    "explanation": "For multiple-correct questions, isCorrect should be an array of correct option indices.",
    "options": [
      { "text": "Correct Answer 1" },
      { "text": "Correct Answer 2" },
      { "text": "Wrong Option" },
      { "text": "Wrong Option" }
    ],
    "isCorrect": [0, 1]
  }
]`;

const DEFAULT_QUESTIONS_MD = `## Sample single-correct question with image hint?
- Correct Answer *
- Wrong Option
- Wrong Option
- Wrong Option
marks: 2
image: https://via.placeholder.com/400x200/FFE4B5/000000?text=Question+Image+Hint
explanation: This explains why the correct answer is right and the others are wrong.

## Sample multiple-correct question (select all that apply)?
- Correct Answer 1 *
- Correct Answer 2 *
- Wrong Option
- Wrong Option
marks: 3
explanation: For multiple-correct questions, mark multiple options with *.`;

const DEFAULT_SECTIONS_MD = `Q1-Q5, pick 3, 1 mark each`;

const MakeAssessment = ({ skipInitialAuth } = {}) => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(skipInitialAuth || false);
  const [passwordError, setPasswordError] = useState(false);
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [formMode, setFormMode] = useState('form');

  const CLASS_OPTIONS = [
    { value: '4', label: 'Class 4' },
    { value: '5', label: 'Class 5' }, { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' }, { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' }, { value: '10', label: 'Class 10' },
  ];

  const [assessmentType, setAssessmentType] = useState('Timed Assessment');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(15);
  const [classNum, setClassNum] = useState('4');
  const { userProfile } = useAuth();
  const [teacher, setTeacher] = useState(userProfile?.displayName || 'Unknown');
  const [invigilator, setInvigilator] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);

  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [wrongAnswerPenaltyFraction, setWrongAnswerPenaltyFraction] = useState(0);
  const [preassessmentSecretKey, setPreassessmentSecretKey] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const [assessmentFormat, setAssessmentFormat] = useState('mcq');
  const [allowFileUpload, setAllowFileUpload] = useState(true);
  const [allowedFileTypes, setAllowedFileTypes] = useState('pdf, docx, jpg, png');
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(10);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [holidayType, setHolidayType] = useState('Summer Vacation');

  const [problemStatement, setProblemStatement] = useState('');
  const [codingExamples, setCodingExamples] = useState('');
  const [starterCode, setStarterCode] = useState(`def solution():\n    # Write your code here\n    pass\n\nprint(solution())`);
  const [functionName, setFunctionName] = useState('solution');
  const [testCasesJson, setTestCasesJson] = useState('[]');

  const [questionsJson, setQuestionsJson] = useState(DEFAULT_QUESTIONS);
  const [questionsMd, setQuestionsMd] = useState(DEFAULT_QUESTIONS_MD);
  const [questionMode, setQuestionMode] = useState('simple');
  const [sectionsJson, setSectionsJson] = useState('[]');
  const [sectionsMd, setSectionsMd] = useState('');
  const [jsonContent, setJsonContent] = useState('');

  const [showJsonPreview, setShowJsonPreview] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    if (!id) return;
    (async () => {
      setStatus('Loading assessment...');
      try {
        const data = await getAssessmentById(id);
        if (!data) { setStatus('Error: Assessment not found'); return; }
        setAssessmentType(data.examType || 'Timed Assessment');
        setTitle(data.title || '');
        setSubject(resolveSubjectValue(data.subject));
        setClassNum(data.classNum || '4');
        setTeacher(data.teacher || '');
        setInvigilator(data.invigilator || '');
        setDescription(data.description || '');
        setEnabled(data.enabled !== false);
        setStartDateTime(formatTimestamp(data.startDateTime));
        setEndDateTime(formatTimestamp(data.endDateTime));
        setTimeLimitMinutes(data.timeLimitMinutes ?? 30);
        setTotalQuestions(data.totalQuestions ?? 10);
        setWrongAnswerPenaltyFraction(data.wrongAnswerPenaltyFraction ?? 0);
        setPreassessmentSecretKey(data.preassessmentsecretkey || '');
        setSecretKey(data.secretKey || '');
        setAssessmentFormat(data.assessmentFormat || 'mcq');
        setAllowFileUpload(data.allowFileUpload ?? true);
        setAllowedFileTypes((data.allowedFileTypes || ['pdf', 'docx', 'jpg', 'png']).join(', '));
        setMaxFileSizeMB(data.maxFileSizeMB ?? 10);
        setProjectTitle(data.projectTitle || '');
        setProjectDescription(data.projectDescription || '');
        setHolidayType(data.holidayType || 'Summer Vacation');
        setProblemStatement(data.coding?.problemStatement || '');
        setCodingExamples(data.coding?.examples || '');
        setStarterCode(data.coding?.starterCode || '');
        setFunctionName(data.coding?.functionName || 'solution');
        setTestCasesJson(JSON.stringify(data.coding?.testCases || [], null, 2));
        setQuestionsJson(JSON.stringify(data.questions || [], null, 2));
        setQuestionsMd(questionsToMarkdown(data.questions || []));
        setSectionsJson(JSON.stringify(data.sections || [], null, 2));
        setSectionsMd(sectionsToMarkdown(data.sections || []));
        setJsonContent(JSON.stringify(data.content || {}, null, 2));
        setStatus('');
      } catch (err) {
        setStatus(`Error loading assessment: ${err.message}`);
      }
    })();
  }, [id]);

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    let d;
    if (typeof ts.toDate === 'function') {
      d = ts.toDate();
    } else if (ts instanceof Date) {
      d = ts;
    } else {
      d = new Date(ts);
    }
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isTimed = assessmentType === 'Timed Assessment';
  const isHoliday = assessmentType === 'Holiday Homework';
  const isProject = assessmentFormat === 'project';
  const isCoding = assessmentFormat === 'coding';

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (isMasterKey(password)) {
      setIsAuthorized(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const loadSample = async () => {
    setStatus('Loading sample...');
    try {
      let sample;
      if (assessmentType === 'Timed Assessment') {
        const mod = await import('../data/Exams/Timed Assessments/Class 4/Computers/timed-assessment-sample.json');
        sample = mod.default;
      } else if (!isHoliday) {
        const mod = await import('../data/Exams/Coding/add-two-numbers.json');
        sample = mod.default;
      } else {
        setStatus(`Sample for "${assessmentType}" - paste your JSON or use form fields`);
        return;
      }
      setTitle(sample.title || '');
      setSubject(resolveSubjectValue(sample.subject));
      setClassNum(sample.classNum || '4');
      setTeacher(sample.teacher || '');
      setDescription(sample.description || '');
      setStartDateTime(formatDateForInput(sample.startDateTime));
      setEndDateTime(formatDateForInput(sample.endDateTime));
      setTimeLimitMinutes(sample.timeLimitMinutes || 30);
      setTotalQuestions(sample.totalQuestions || 10);
      setWrongAnswerPenaltyFraction(sample.wrongAnswerPenaltyFraction ?? 0);
      setAssessmentFormat(sample.assessmentFormat || 'mcq');
      setQuestionsJson(JSON.stringify(sample.questions || [], null, 2));
      setQuestionsMd(questionsToMarkdown(sample.questions || []));
      setSectionsJson(JSON.stringify(sample.sections || [], null, 2));
      setSectionsMd(sectionsToMarkdown(sample.sections || []));
      setProblemStatement(sample.coding?.problemStatement || '');
      setCodingExamples(sample.coding?.examples || '');
      setStarterCode(sample.coding?.starterCode || '');
      setFunctionName(sample.coding?.functionName || 'solution');
      setTestCasesJson(JSON.stringify(sample.coding?.testCases || [], null, 2));
      setJsonContent(JSON.stringify(sample, null, 2));
      setStatus(`Sample loaded for ${assessmentType}`);
    } catch (err) {
      setStatus(`Error loading sample: ${err.message}`);
    }
  };

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const buildPayload = () => {
    const questions = questionMode === 'simple' ? parseQuestions(questionsMd) : tryParseJson(questionsJson, []);
    const sections = questionMode === 'simple' ? parseSections(sectionsMd) : tryParseJson(sectionsJson, []);
    const hasValidSections = sections.length > 0 && sections.every(s => s.range && s.count && s.marks != null);
    return {
      examType: assessmentType,
      subject,
      classNum,
      title,
      teacher,
      invigilator: invigilator || teacher,
      enabled,
      totalQuestions: hasValidSections ? sections.reduce((sum, s) => sum + Number(s.count), 0) : questions.length,
      totalMarks: hasValidSections ? sections.reduce((sum, s) => sum + Number(s.count) * Number(s.marks), 0) : questions.reduce((sum, q) => sum + (Number(q.marks) || 1), 0),
      wrongAnswerPenaltyFraction: Number(wrongAnswerPenaltyFraction),
      assessmentFormat,
      createdBy: userProfile?.id || null,
      timeLimitMinutes: Number(timeLimitMinutes),
      description,
      startDateTime: startDateTime ? new Date(startDateTime).toISOString() : '',
      endDateTime: endDateTime ? new Date(endDateTime).toISOString() : '',
      preassessmentsecretkey: preassessmentSecretKey,
      secretKey,
      holidayType,
      sections,
      questions,
      content: tryParseJson(jsonContent, {}),
      allowFileUpload,
      allowedFileTypes: allowedFileTypes.split(',').map(s => s.trim()).filter(Boolean),
      maxFileSizeMB: Number(maxFileSizeMB),
      projectTitle,
      projectDescription,
      studentInputs: { topic: true, description: true },
      coding: isCoding ? {
        problemStatement,
        examples: codingExamples,
        starterCode,
        functionName,
        testCases: tryParseJson(testCasesJson, [])
      } : null,
    };
  };

  const tryParseJson = (str, fallback) => {
    try { return JSON.parse(str); } catch { return fallback; }
  };

  const validateForm = () => {
    if (!title.trim()) return 'Title is required';
    if (subject == null || subject === '') return 'Subject is required';
    if (!classNum) return 'Class is required';

    if (isTimed) {
      if (!startDateTime) return 'Start date/time is required for timed assessments';
      if (!endDateTime) return 'End date/time is required for timed assessments';
      if (new Date(endDateTime) <= new Date(startDateTime)) return 'End time must be after start time';
    }

    if (isCoding) {
      if (!problemStatement.trim()) return 'Problem statement is required';
      if (!functionName.trim()) return 'Function name is required';
      try {
        const tcs = JSON.parse(testCasesJson);
        if (!Array.isArray(tcs) || tcs.length === 0) return 'At least one test case is required';
      } catch {
        return 'Invalid test cases JSON format';
      }
    } else if (!isHoliday) {
      if (timeLimitMinutes < 0) return 'Time limit cannot be negative';
      if (Number(totalQuestions) < 1) return 'At least 1 question required';
      if (questionMode === 'simple') {
        const parsed = parseQuestions(questionsMd);
        if (parsed.length === 0) return 'At least one question is required';
      } else {
        try {
          const qs = JSON.parse(questionsJson);
          if (!Array.isArray(qs) || qs.length === 0) return 'At least one question is required';
        } catch {
          return 'Invalid questions JSON format';
        }
      }
    }
    return null;
  };

  const clearForm = () => {
    setTitle('');
    setSubject(15);
    setClassNum('');
    setTeacher('Venkata Vishnu');
    setInvigilator('');
    setDescription('');
    setEnabled(true);
    setStartDateTime('');
    setEndDateTime('');
    setTimeLimitMinutes(30);
    setTotalQuestions(10);
    setWrongAnswerPenaltyFraction(0);
    setPreassessmentSecretKey('');
    setSecretKey('');
    setAssessmentFormat('mcq');
    setAllowFileUpload(true);
    setAllowedFileTypes('pdf, docx, jpg, png');
    setMaxFileSizeMB(10);
    setProjectTitle('');
    setProjectDescription('');
    setHolidayType('Summer Vacation');
    setProblemStatement('');
    setCodingExamples('');
    setStarterCode(`def solution():\n    # Write your code here\n    pass\n\nprint(solution())`);
    setFunctionName('solution');
    setTestCasesJson('[]');
    setQuestionsJson(DEFAULT_QUESTIONS);
    setQuestionsMd(DEFAULT_QUESTIONS_MD);
    setQuestionMode('simple');
    setSectionsJson('[]');
    setSectionsMd('');
    setJsonContent('');
  };

  const handleCreate = async () => {
    const error = validateForm();
    if (error) { setStatus(`Error: ${error}`); return; }

    setCreating(true);
    setStatus(isEditing ? 'Updating assessment...' : 'Creating assessment...');
    try {
      const payload = buildPayload();
      if (isEditing) {
        await updateAssessment(id, payload);
        setDialog({ show: true, type: 'success', message: `"${title}" updated successfully!` });
      } else {
        const newId = await createAssessment(payload);
        setDialog({ show: true, type: 'success', message: `"${title}" created successfully!`, id: newId });
        clearForm();
      }
    } catch (err) {
      setDialog({ show: true, type: 'error', message: `Failed to ${isEditing ? 'update' : 'create'}: ${err.message}` });
    }
    setCreating(false);
  };

  if (!isAuthorized) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card w-full max-w-md animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Access</h2>
            <p className="text-gray-500 dark:text-gray-400">Enter password to create assessments</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input type="password" className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none ${passwordError ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`} placeholder="Enter admin password" value={password} onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(false); }} autoFocus />
            {passwordError && <p className="text-red-400 text-sm">⚠️ Incorrect password</p>}
            <button type="submit" className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">Authorize 🔓</button>
<button type="button" className="w-full px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20" onClick={() => navigate(skipInitialAuth ? '/dashboard' : '/')}>← Back to Home</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-start justify-center px-4 py-8">
      <div className="glass-card w-full max-w-4xl animate-slideUp">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">{isEditing ? '✏️' : '📝'}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isEditing ? 'Edit Assessment' : 'Create Assessment'}</h2>
          <p className="text-gray-500 dark:text-gray-400">{isEditing ? 'Modify assessment details and save changes' : 'Configure and publish a new assessment'}</p>
        </div>

        <div className="flex gap-3 mb-8 justify-center flex-wrap">
          <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formMode === 'form' ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'}`} onClick={() => setFormMode('form')}>Form</button>
          <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formMode === 'json' ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'}`} onClick={() => setFormMode('json')}>Raw JSON</button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Assessment Type</label>
          <CustomSelect
            value={assessmentType}
            onChange={setAssessmentType}
            options={ASSESSMENT_TYPES.map(t => ({ value: t, label: `${t} — ${TYPE_DESCRIPTIONS[t]}` }))}
          />
        </div>

        {formMode === 'json' ? (
          <>
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-all" onClick={() => fileInputRef.current?.click()}>
                <div className="text-3xl mb-2">📄</div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload a JSON file</p>
                <input ref={fileInputRef} type="file" accept=".json" onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = ev => {
                    try { JSON.parse(ev.target.result); setJsonContent(ev.target.result); setStatus('JSON loaded'); }
                    catch { setStatus('Error: Invalid JSON'); }
                  };
                  reader.readAsText(file);
                }} className="hidden" />
              </div>
            </div>
            <div className="mb-6">
              <textarea className="w-full h-80 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-sm resize-none" placeholder="Paste your assessment JSON here..." value={jsonContent} onChange={e => setJsonContent(e.target.value)} />
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📋 Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Title *</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" placeholder="e.g. Computer Basics Test" value={title} onChange={e => setTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Subject *</label>
                  <CustomSelect
                    value={subject}
                    onChange={setSubject}
                    options={SUBJECTS.map(s => ({ value: s.value, label: s.label }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Class *</label>
                  <CustomSelect value={classNum} onChange={setClassNum} options={CLASS_OPTIONS} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Teacher</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm cursor-not-allowed opacity-70" value={teacher} disabled />
                </div>
                {!isHoliday && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Description</label>
                    <textarea className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm resize-none" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            {!isHoliday && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📋 Format</h3>
                <div className="flex gap-3 flex-wrap">
                  <button type="button" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${assessmentFormat === 'mcq' ? 'bg-purple-500/30 text-purple-400 border border-purple-500/50' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white border border-transparent'}`} onClick={() => setAssessmentFormat('mcq')}>MCQ Test</button>
                  <button type="button" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${assessmentFormat === 'project' ? 'bg-orange-500/30 text-orange-400 border border-orange-500/50' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white border border-transparent'}`} onClick={() => setAssessmentFormat('project')}>Project</button>
                  <button type="button" className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${assessmentFormat === 'coding' ? 'bg-green-500/30 text-green-400 border border-green-500/50' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white border border-transparent'}`} onClick={() => setAssessmentFormat('coding')}>Coding</button>
                </div>
              </div>
            )}

            {isTimed && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">⏱️ Time Window (Timed Assessment)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Start Date & Time *</label>
                    <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={startDateTime} onChange={e => setStartDateTime(e.target.value)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assessment becomes visible after this time</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">End Date & Time *</label>
                    <input type="datetime-local" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={endDateTime} onChange={e => setEndDateTime(e.target.value)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Assessment expires and disappears after this time</p>
                  </div>
                </div>
              </div>
            )}

            {!isHoliday && assessmentFormat === 'mcq' && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🎯 Scoring & Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Time Limit (minutes)</label>
                    <input type="number" min="0" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(Number(e.target.value))} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 = no limit</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Negative Marking (%)</label>
                    <input type="number" min="0" max="100" step="25" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={wrongAnswerPenaltyFraction * 100} onChange={e => setWrongAnswerPenaltyFraction(Number(e.target.value) / 100)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{wrongAnswerPenaltyFraction * 100}% deducted for wrong answers</p>
                  </div>
                </div>
              </div>
            )}

            {!isHoliday && (assessmentFormat === 'mcq' || assessmentFormat === 'coding') && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🔑 Access Keys</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Pre-Assessment Key</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" placeholder="Required before quiz starts" value={preassessmentSecretKey} onChange={e => setPreassessmentSecretKey(e.target.value)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">(Not used in Timed Assessments)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Answer Reveal Key</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" placeholder="To view correct answers" value={secretKey} onChange={e => setSecretKey(e.target.value)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">(Not required in Timed Assessments)</p>
                  </div>

                </div>
              </div>
            )}

            {!isHoliday && isProject && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📁 Project Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Project Title</label>
                    <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Project Description</label>
                    <textarea className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm resize-none" rows={2} value={projectDescription} onChange={e => setProjectDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                      <input type="checkbox" checked={allowFileUpload} onChange={e => setAllowFileUpload(e.target.checked)} className="rounded" />
                      Allow File Upload
                    </label>
                  </div>
                  {allowFileUpload && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Allowed File Types</label>
                        <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" value={allowedFileTypes} onChange={e => setAllowedFileTypes(e.target.value)} />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Comma-separated (e.g. pdf, docx, jpg)</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Max File Size (MB)</label>
                        <input type="number" min="1" max="100" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={maxFileSizeMB} onChange={e => setMaxFileSizeMB(Number(e.target.value))} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!isHoliday && isCoding && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">💻 Coding Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Problem Statement *</label>
                    <textarea className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm resize-none" rows={3} placeholder="Describe the coding problem..." value={problemStatement} onChange={e => setProblemStatement(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Examples</label>
                    <textarea className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm resize-none font-mono" rows={3} placeholder={`Input: a=2, b=3 → Output: 5\nInput: a=10, b=20 → Output: 30`} value={codingExamples} onChange={e => setCodingExamples(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Function Name *</label>
                      <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-sm" placeholder="e.g. add" value={functionName} onChange={e => setFunctionName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Test Cases</label>
                      <input type="number" min="1" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={totalQuestions} onChange={e => setTotalQuestions(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Time Limit (minutes)</label>
                    <input type="number" min="0" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={timeLimitMinutes} onChange={e => setTimeLimitMinutes(Number(e.target.value))} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">0 = no limit</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Starter Code</label>
                    <textarea className="w-full h-32 px-4 py-3 rounded-xl bg-black/10 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-sm resize-none" value={starterCode} onChange={e => setStarterCode(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Test Cases (JSON) *</label>
                    <textarea className="w-full h-32 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-xs resize-none" placeholder='[{"input": [2, 3], "expected": 5}]' value={testCasesJson} onChange={e => setTestCasesJson(e.target.value)} />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Array of objects with "input" (array of args) and "expected" values</p>
                  </div>
                </div>
              </div>
            )}

            {!isHoliday && assessmentFormat === 'mcq' && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">❓ Questions</h3>
                  <div className="flex gap-1 bg-black/10 dark:bg-white/10 rounded-lg p-0.5">
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${questionMode === 'simple' ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                      onClick={() => {
                        if (questionMode === 'json') {
                          setQuestionsMd(questionsToMarkdown(tryParseJson(questionsJson, [])));
                          setSectionsMd(sectionsToMarkdown(tryParseJson(sectionsJson, [])));
                          setQuestionMode('simple');
                        }
                      }}
                    >Simple</button>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${questionMode === 'json' ? 'bg-primary text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                      onClick={() => {
                        if (questionMode === 'simple') {
                          setQuestionsJson(JSON.stringify(parseQuestions(questionsMd), null, 2));
                          setSectionsJson(JSON.stringify(parseSections(sectionsMd), null, 2));
                          setQuestionMode('json');
                        }
                      }}
                    >JSON</button>
                  </div>
                </div>

                {questionMode === 'simple' ? (
                  <>
                    <button type="button" className="text-xs text-primary underline mb-2 inline-block" onClick={() => setShowInstructions(v => !v)}>
                      {showInstructions ? '▼ Hide formatting instructions' : '▶ View formatting instructions'}
                    </button>
                    {showInstructions && (
                      <div className="mb-3 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400 space-y-2">
                        <p className="font-semibold text-gray-700 dark:text-gray-300">Questions format:</p>
                        <pre className="bg-black/10 dark:bg-white/10 p-2 rounded text-gray-900 dark:text-white text-xs font-mono whitespace-pre-wrap">{`## What is 2+2?
- 3
- 4 *
- 5
- 6
marks: 1
image: https://example.com/diagram.png
explanation: 2+2 equals 4.`}</pre>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li><code className="text-primary">##</code> question title</li>
                          <li><code className="text-primary">-</code> option</li>
                          <li><code className="text-primary">*</code> anywhere on correct option line</li>
                          <li><code className="text-primary">marks:</code> points (default 1)</li>
                          <li><code className="text-primary">image:</code> optional image URL</li>
                          <li><code className="text-primary">explanation:</code> answer explanation</li>
                          <li>One <code className="text-primary">*</code> = single; multiple = multi-correct</li>
                          <li>No <code className="text-primary">*</code> = first option correct</li>
                        </ul>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 pt-2 border-t border-gray-200 dark:border-white/10 mt-2">Sections format:</p>
                        <pre className="bg-black/10 dark:bg-white/10 p-2 rounded text-gray-900 dark:text-white text-xs font-mono whitespace-pre-wrap">{`Q1-Q5, pick 3, 1 mark each
Q6-Q10, pick 4, 2 marks each`}</pre>
                        <ul className="list-disc pl-4 space-y-0.5">
                          <li><code className="text-primary">Q1-Q5</code> = question ID range</li>
                          <li><code className="text-primary">pick 3</code> = randomly select 3 from range</li>
                          <li><code className="text-primary">1 mark each</code> = marks per picked question</li>
                        </ul>
                      </div>
                    )}
                    <textarea
                      className="w-full h-48 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-sm resize-none scrollable-area-custom"
                      value={questionsMd}
                      onChange={e => setQuestionsMd(e.target.value)}
                      placeholder="## What is 2+2?
- 3
- 4 *
- 5
- 6
marks: 1
image: https://example.com/diagram.png
explanation: 2+2 equals 4."
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Each question needs: id, text, type (single/multiple), options array with text, isCorrect (index or array of indices)</p>
                    <textarea className="w-full h-48 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-xs resize-none scrollable-area-custom" value={questionsJson} onChange={e => setQuestionsJson(e.target.value)} />
                  </>
                )}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Sections (optional)</label>
                  {questionMode === 'simple' ? (
                    <textarea className="w-full h-20 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-xs resize-none scrollable-area-custom" value={sectionsMd} onChange={e => setSectionsMd(e.target.value)} placeholder="Q1-Q5, pick 3, 1 mark each" />
                  ) : (
                    <textarea className="w-full h-20 px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-xs resize-none scrollable-area-custom" value={sectionsJson} onChange={e => setSectionsJson(e.target.value)} />
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Divide questions into sections. Each section picks random questions from a range of question IDs.</p>
                  {questionMode === 'json' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-mono">{'Format: [{"range": [1, 5], "count": 3, "marks": 1}]'}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Add multiple lines/objects for multiple sections. Leave empty to use all questions as one section.</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Questions</label>
                        <input type="text" disabled className="w-full px-5 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold text-base" value={(() => {
                          const secs = questionMode === 'simple' ? parseSections(sectionsMd) : tryParseJson(sectionsJson, []);
                          if (secs.length > 0 && secs.every(s => s.range && s.count && s.marks != null)) {
                            return secs.reduce((sum, s) => sum + Number(s.count), 0);
                          }
                          const qs = questionMode === 'simple' ? parseQuestions(questionsMd) : tryParseJson(questionsJson, []);
                          return qs.length;
                        })()} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Total Marks</label>
                        <input type="text" disabled className="w-full px-5 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold text-base" value={(() => {
                          const secs = questionMode === 'simple' ? parseSections(sectionsMd) : tryParseJson(sectionsJson, []);
                          if (secs.length > 0 && secs.every(s => s.range && s.count && s.marks != null)) {
                            return secs.reduce((sum, s) => sum + Number(s.count) * Number(s.marks), 0);
                          }
                          const qs = questionMode === 'simple' ? parseQuestions(questionsMd) : tryParseJson(questionsJson, []);
                          return qs.reduce((sum, q) => sum + (Number(q.marks) || 1), 0);
                        })()} />
                      </div>
                    </div>
                </div>
              </div>
            )}

            {isHoliday && (
              <div className="p-5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">🏖️ Holiday Homework Config</h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Holiday Type</label>
                  <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 text-sm" value={holidayType} onChange={e => setHolidayType(e.target.value)} />
                </div>
                <textarea className="w-full h-48 px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 font-mono text-xs resize-none" placeholder="Paste full holiday homework JSON content here..." value={jsonContent} onChange={e => setJsonContent(e.target.value)} />
              </div>
            )}

            <div className="flex items-center gap-3">
              <input type="checkbox" id="showPreview" checked={showJsonPreview} onChange={e => setShowJsonPreview(e.target.checked)} className="rounded" />
              <label htmlFor="showPreview" className="text-sm text-gray-600 dark:text-gray-300">Show JSON Preview</label>
            </div>

            {showJsonPreview && (
              <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <ScrollableArea className="max-h-60">
                  <pre className="text-xs text-gray-900 dark:text-white font-mono whitespace-pre-wrap">{JSON.stringify(buildPayload(), null, 2)}</pre>
                </ScrollableArea>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center mt-8 flex-wrap">
          <button className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30" onClick={loadSample}>📥 Load Sample</button>
          <button className={`px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 disabled:opacity-50`} onClick={handleCreate} disabled={creating}>
            {creating ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Assessment' : 'Create Assessment')}
          </button>
          <button className="px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20" onClick={() => navigate(skipInitialAuth ? '/dashboard' : '/')}>← Back to Home</button>
        </div>

        {status && (
          <div className={`mt-6 p-4 rounded-xl text-sm ${status.startsWith('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : status.includes('created') ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
            {status}
          </div>
        )}

        {dialog?.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDialog(null)}>
            <div className="glass-card w-full max-w-md mx-4 animate-slideUp" onClick={e => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className={`text-5xl mb-4 ${dialog.type === 'success' ? '' : ''}`}>
                  {dialog.type === 'success' ? '✅' : '❌'}
                </div>
                <h3 className={`text-xl font-bold ${dialog.type === 'success' ? 'text-green-400' : 'text-red-400'} mb-2`}>
                  {dialog.type === 'success' ? 'Success' : 'Error'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400">{dialog.message}</p>
                {dialog.id && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Document ID: {dialog.id}</p>}
              </div>
              <button className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={() => setDialog(null)}>
                OK
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MakeAssessment;
