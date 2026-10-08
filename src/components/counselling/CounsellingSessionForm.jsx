import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import CustomSelect from '../CustomSelect';
import {
  counsellingService,
  todayKey,
  monthKey,
  computeSessionScore,
  normalizeResponses,
  CATEGORY_LABELS,
  SESSION_TYPES,
} from '../../services/counsellingService';
import SearchableSelect from './SearchableSelect';
import {
  SESSION_TYPE_LABELS, CONCERN_LEVEL_LABELS, CONCERN_STYLES, Chip, formatDate,
} from './counsellingUI';

const CLASS_OPTIONS = [
  { value: '4', label: 'Class 4' },
  { value: '5', label: 'Class 5' },
  { value: '6', label: 'Class 6' },
  { value: '7', label: 'Class 7' },
  { value: '8', label: 'Class 8' },
  { value: '9', label: 'Class 9' },
  { value: '10', label: 'Class 10' },
];

const RESIDENCE_OPTIONS = [
  { value: '1', label: 'Day Scholar' },
  { value: '2', label: 'Veda Hostel' },
  { value: '3', label: 'General Hostel' },
];

const RESIDENCE_LABELS = {
  '1': 'Day Scholar',
  '2': 'Veda Hostel',
  '3': 'General Hostel',
};

const SESSION_TYPE_OPTIONS = Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const CONCERN_LEVEL_OPTIONS = [
  { value: 'none', label: 'Needs No Action' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const STEPS = [
  { key: 'student', label: 'Student & Session' },
  { key: 'questions', label: 'Questionnaire' },
  { key: 'concern', label: 'Concern & Notes' },
  { key: 'review', label: 'Follow-up & Save' },
];

const defaultFollowUpDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const emptyForm = () => ({
  classFilter: '',
  sectionFilter: '',
  studentId: '',
  residence: '',
  date: todayKey(),
  sessionType: SESSION_TYPES.MONTHLY_CHECKIN,
  responses: {},
  concernLevel: 'none',
  concernCategories: [],
  notes: { mainConcern: '', observations: '', actionTaken: '', recommendation: '' },
  followUp: { required: false, date: defaultFollowUpDate() },
  escalation: { channel: 'none', details: '', parentContacted: false, parentContactStatus: '', externalReferral: '' },
  safeguards: { flag: false, selfHarm: false, immediateRisk: false },
  recordDuplicate: false,
});

const QuestionInput = ({ question, value, onChange }) => {
  if (question.type === 'rating' || question.type === 'frequency') {
    const opts = question.options || [];
    return (
      <div className="flex flex-wrap gap-2">
        {opts.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value, '')}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${value === o.value ? 'bg-primary/10 text-primary dark:text-primary-light border-primary/40' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-primary/40'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  if (question.type === 'yesno') {
    return (
      <div className="flex gap-2">
        {question.options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value, '')}
            className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${value === o.value ? 'bg-primary/10 text-primary dark:text-primary-light border-primary/40' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-primary/40'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }
  if (question.type === 'mcq') {
    return (
      <div className="space-y-1.5">
        {question.options.map((o) => (
          <label key={o.value} className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all text-sm ${value === o.value ? 'bg-primary/10 text-primary dark:text-primary-light border-primary/40' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'}`}>
            <input type="radio" name={`q-${question.id}`} checked={value === o.value} onChange={() => onChange(o.value, '')} className="accent-[var(--accent)]" />
            {o.label}
          </label>
        ))}
      </div>
    );
  }
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange('', e.target.value)}
      placeholder="Write anything the student shares (optional)..."
      rows={2}
      className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm"
    />
  );
};

export default function CounsellingSessionForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [students, setStudents] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState('');
  const [editing, setEditing] = useState(false);
  const [concernTouched, setConcernTouched] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const actorName = userProfile?.displayName || userProfile?.name || user?.email || 'Staff';
  const actorUid = userProfile?.id || user?.uid || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [st, ss, qs] = await Promise.all([
          counsellingService.getStudents(),
          counsellingService.getAllSessions(),
          counsellingService.getQuestions(),
        ]);
        setStudents(st);
        setQuestions(qs);
        setSessions(ss);

        if (id) {
          const existing = await counsellingService.getSessionById(id);
          if (existing) {
            setEditing(true);
            const qMap = {};
            qs.forEach((q) => { qMap[q.id] = q; });
            const studentId = existing.student?.userId || '';
            const student = st.find((s) => s.id === studentId);
            const responses = {};
            (existing.responses || []).forEach((r) => {
              responses[r.questionId] = { value: r.value ?? '', text: r.text || '', ...(qMap[r.questionId] || {}) };
            });
            setForm({
              classFilter: existing.student?.studentClass || '',
              sectionFilter: existing.student?.section || '',
              studentId,
              residence: existing.residence || student?.dayScholarOrHostel || '1',
              date: existing.date || todayKey(),
              sessionType: existing.sessionType || SESSION_TYPES.MONTHLY_CHECKIN,
              responses,
              concernLevel: existing.concernLevel || 'none',
              concernCategories: existing.concernCategories || [],
              notes: { ...emptyForm().notes, ...(existing.notes || {}) },
              followUp: { ...emptyForm().followUp, ...(existing.followUp || {}) },
              escalation: { ...emptyForm().escalation, ...(existing.escalation || {}) },
              safeguards: { ...emptyForm().safeguards, ...(existing.safeguards || {}) },
              recordDuplicate: true,
            });
            setConcernTouched(true);
          }
        } else {
          const studentId = searchParams.get('studentId') || '';
          const sessionType = searchParams.get('type') || SESSION_TYPES.MONTHLY_CHECKIN;
          const prefilled = st.find((s) => s.id === studentId);
          setForm((prev) => ({
            ...prev,
            studentId,
            residence: prefilled?.dayScholarOrHostel || prev.residence,
            sessionType: SESSION_TYPE_LABELS[sessionType] ? sessionType : SESSION_TYPES.MONTHLY_CHECKIN,
          }));
        }
      } catch (err) {
        setFormError(err.message || 'Could not load counselling setup');
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const selectedStudent = useMemo(() => students.find((s) => s.id === form.studentId) || null, [students, form.studentId]);
  const classNum = selectedStudent?.studentClass || form.classFilter || '';

  useEffect(() => {
    if (form.studentId && selectedStudent && !form.classFilter) {
      setForm((prev) => {
        const next = { ...prev };
        if (!next.classFilter) next.classFilter = selectedStudent.studentClass || '';
        if (next.sectionFilter === '' && selectedStudent.section) next.sectionFilter = selectedStudent.section || '';
        if (!next.residence && selectedStudent.dayScholarOrHostel) next.residence = selectedStudent.dayScholarOrHostel;
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.studentId, selectedStudent]);

  useEffect(() => {
    if (form.date && form.studentId && !editing) {
      setForm((prev) => ({ ...prev, recordDuplicate: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.studentId, form.date, editing]);

  const duplicateWarning = useMemo(() => {
    if (!form.studentId || !form.date || form.sessionType !== SESSION_TYPES.MONTHLY_CHECKIN) return null;
    const mk = monthKey(form.date);
    return sessions.find((s) => s.student?.userId === form.studentId && monthKey(s.date) === mk && s.id !== id) || null;
  }, [form.studentId, form.date, form.sessionType, sessions, id]);

  const applicableQuestions = useMemo(() => {
    if (!classNum) return questions;
    const cls = Number(classNum);
    const hostel = ['2', '3'].includes(form.residence);
    return questions
      .filter((q) => q.active !== false && q.classRange && cls >= q.classRange.min && cls <= q.classRange.max && (q.residence !== 'hostel' || hostel))
      .sort((a, b) => ((Number(!!b.core) - Number(!!a.core))) || (a.order ?? 0) - (b.order ?? 0));
  }, [questions, classNum, form.residence]);

  const requiredQuestions = useMemo(() => applicableQuestions.filter((q) => q.type !== 'text'), [applicableQuestions]);
  const answeredRequired = requiredQuestions.filter((q) => form.responses[q.id]?.value !== undefined && form.responses[q.id]?.value !== '').length;

  const setResponse = (question, value, text) => {
    setForm((prev) => ({
      ...prev,
      responses: {
        ...prev.responses,
        [question.id]: { value, text, ...question },
      },
    }));
    if (question.safeguard && String(value) === 'yes') {
      setForm((prev) => ({ ...prev, safeguards: { ...prev.safeguards, flag: true, selfHarm: true } }));
    }
  };

  const stepsValid = [
    () => form.studentId && form.date && form.sessionType,
    () => answeredRequired === requiredQuestions.length,
    () => true,
    () => true,
  ];

  const tryNext = () => {
    setFormError('');
    if (!stepsValid[step]()) {
      setFormError(step === 0 ? 'Please choose a student, date and session type before continuing.' : 'Please answer all required questions before continuing.');
      return;
    }
    if (step === 1 && !concernTouched) {
      const responses = normalizeResponses(Object.values(form.responses).filter((r) => r && r.question));
      const score = computeSessionScore(responses);
      if (score != null) {
        const suggested = score >= 70 ? 'high' : score >= 40 ? 'medium' : score >= 15 ? 'low' : 'none';
        setForm((prev) => ({ ...prev, concernLevel: suggested }));
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      concernCategories: prev.concernCategories.includes(cat) ? prev.concernCategories.filter((c) => c !== cat) : [...prev.concernCategories, cat],
    }));
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.studentId || !form.date || !form.sessionType) {
      setFormError('Missing student, date or session type.');
      return;
    }
    if (form.sessionType === SESSION_TYPES.MONTHLY_CHECKIN && duplicateWarning && !form.recordDuplicate) {
      setStep(0);
      setFormError('This student already has a monthly check-in this month. Tick "Record anyway" to proceed.');
      return;
    }
    if (requiredQuestions.some((q) => !form.responses[q.id]?.value)) {
      setStep(1);
      setFormError('Please answer all required questions.');
      return;
    }
    if (form.followUp.required && !form.followUp.date) {
      setStep(3);
      setFormError('Please set a follow-up date.');
      return;
    }
    if (form.safeguards.flag && form.concernLevel !== 'high' && window.confirm('A safeguarding flag is set but concern level is not High. Save anyway?')) {
      // intentional fallthrough
    }

    setSaving(true);
    try {
      const responses = normalizeResponses(Object.values(form.responses).filter((r) => r && r.question));
      const concernScore = computeSessionScore(responses);
      const payload = {
        student: selectedStudent
          ? { userId: selectedStudent.id, name: selectedStudent.displayName || '', studentClass: selectedStudent.studentClass || '', section: selectedStudent.section || '' }
          : { userId: '', name: '', studentClass: '', section: '' },
        date: form.date,
        sessionType: form.sessionType,
        residence: form.residence || selectedStudent?.dayScholarOrHostel || '1',
        concernLevel: form.concernLevel,
        concernCategories: form.concernCategories,
        concernScore,
        responses,
        notes: { mainConcern: (form.notes.mainConcern || '').trim(), observations: (form.notes.observations || '').trim(), actionTaken: (form.notes.actionTaken || '').trim(), recommendation: (form.notes.recommendation || '').trim() },
        followUp: {
          required: !!form.followUp.required,
          date: form.followUp.required ? form.followUp.date : '',
          status: editing && form.followUp.status === 'completed' ? 'completed' : form.followUp.required ? 'pending' : '',
          completedAt: editing && form.followUp.completedAt ? form.followUp.completedAt : '',
          completedBy: editing && form.followUp.completedBy ? form.followUp.completedBy : '',
        },
        escalation: {
          channel: form.escalation.channel || 'none',
          details: (form.escalation.details || '').trim(),
          parentContacted: !!form.escalation.parentContacted,
          parentContactStatus: (form.escalation.parentContactStatus || '').trim(),
          externalReferral: (form.escalation.externalReferral || '').trim(),
        },
        safeguards: {
          flag: !!form.safeguards.flag,
          selfHarm: !!form.safeguards.selfHarm,
          immediateRisk: !!form.safeguards.immediateRisk,
        },
        createdByName: editing ? undefined : actorName,
        createdBy: editing ? undefined : actorUid,
      };

      if (editing) {
        await counsellingService.updateSession(id, payload, { uid: actorUid, name: actorName });
      } else {
        await counsellingService.createSession(payload, { uid: actorUid, name: actorName });
      }
      navigate('/dashboard/counselling');
    } catch (err) {
      setFormError(err.message || 'Could not save session');
    }
    setSaving(false);
  };

  const studentOptions = useMemo(() => {
    if (!form.classFilter) return [];
    return students
      .filter((s) => s.studentClass === form.classFilter && (form.sectionFilter ? s.section === form.sectionFilter : true))
      .map((s) => ({
        value: s.id,
        label: `${s.displayName || s.email || s.id}${RESIDENCE_LABELS[s.dayScholarOrHostel] ? ` · ${RESIDENCE_LABELS[s.dayScholarOrHostel]}` : ''}`,
        searchText: `${s.displayName || ''} ${s.email || ''} ${s.admissionNo || ''} ${s.section || ''} ${RESIDENCE_LABELS[s.dayScholarOrHostel] || ''}`,
      }));
  }, [students, form.classFilter, form.sectionFilter]);

  const sections = useMemo(() => {
    if (!form.classFilter) return [];
    return [...new Set(students.filter((s) => s.studentClass === form.classFilter && s.section).map((s) => s.section))].sort();
  }, [students, form.classFilter]);

  const selectedStudentSection = selectedStudent?.section || '';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const score = computeSessionScore(normalizeResponses(Object.values(form.responses).filter((r) => r && r.question)));

  return (
    <div className="animate-slideUp space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{editing ? 'Edit Counselling Session' : 'New Counselling Session'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Confidential wellbeing check-in and counselling record</p>
        </div>
        <button onClick={() => navigate('/dashboard/counselling')} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
          ← Cancel
        </button>
      </div>

      {formError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <p className="text-rose-600 dark:text-rose-400 text-sm">{formError}</p>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'todo';
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setStep(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${state === 'current' ? 'bg-primary/10 text-primary dark:text-primary-light border-primary/40' : state === 'done' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-white dark:bg-[#282843] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-current/10">{state === 'done' ? '✓' : i + 1}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {step === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Class *</label>
              <CustomSelect
                value={form.classFilter}
                onChange={(val) => setForm((prev) => ({ ...prev, classFilter: val, sectionFilter: '', studentId: '' }))}
                options={[{ value: '', label: 'Select class' }, ...CLASS_OPTIONS]}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Section</label>
              <CustomSelect
                value={form.sectionFilter}
                onChange={(val) => setForm((prev) => ({ ...prev, sectionFilter: val, studentId: '' }))}
                options={[{ value: '', label: 'All sections' }, ...sections.map((s) => ({ value: s, label: `Section ${s}` }))]}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Student *</label>
              <SearchableSelect
                value={form.studentId}
                onChange={(val) => setForm((prev) => ({ ...prev, studentId: val }))}
                options={studentOptions}
                disabled={!form.classFilter}
                placeholder={form.classFilter ? 'Search student by name or admission no...' : 'Select a class first'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Session Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Session Type *</label>
              <CustomSelect value={form.sessionType} onChange={(val) => setForm((prev) => ({ ...prev, sessionType: val }))} options={SESSION_TYPE_OPTIONS} className="w-full" />
            </div>
          </div>

          {selectedStudent && (
            <div className="rounded-xl bg-black/5 dark:bg-white/5 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg shrink-0">🎓</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedStudent.displayName || selectedStudent.email}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Class {selectedStudent.studentClass}{selectedStudent.section ? ` · Section ${selectedStudent.section}` : ''}{selectedStudent.admissionNo ? ` · ${selectedStudent.admissionNo}` : ''}
                  {RESIDENCE_LABELS[selectedStudent.dayScholarOrHostel] ? ` · ${RESIDENCE_LABELS[selectedStudent.dayScholarOrHostel]}` : ''}
                </p>
              </div>
            </div>
          )}

          {duplicateWarning && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-lg">⚠️</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    This student already has a monthly check-in for {`${form.date.slice(8, 10)} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][Number(form.date.slice(5, 7)) - 1]} ${form.date.slice(0, 4)}`}.
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Yesterday: {duplicateWarning.student?.name} · {formatDate(duplicateWarning.date)} · {duplicateWarning.id}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 mt-3 text-sm text-amber-800 dark:text-amber-300 cursor-pointer">
                <input type="checkbox" checked={form.recordDuplicate} onChange={(e) => setForm((prev) => ({ ...prev, recordDuplicate: e.target.checked }))} className="rounded accent-[#d97706]" />
                Yes, record this check-in anyway
              </label>
            </div>
          )}

          {form.sessionType !== 'monthly-checkin' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Tip: for group sessions, record the group in the notes below; the main student field captures the primary student.</p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843] p-5 space-y-3">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Wellbeing Questionnaire</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {selectedStudent?.displayName || 'Student'} · Class {classNum || '—'} · {answeredRequired}/{requiredQuestions.length} answered
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-48">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Residence</label>
                <CustomSelect value={form.residence || '1'} onChange={(val) => setForm((prev) => ({ ...prev, residence: val }))} options={RESIDENCE_OPTIONS} className="w-full" />
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{Math.round((answeredRequired / (requiredQuestions.length || 1)) * 100)}%</span>
            </div>
          </div>

          {applicableQuestions.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No questions yet. Seed the question bank by running <code className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 text-xs">npm run seed:counselling</code>, then reload.</p>
          ) : (
            <ol className="space-y-3">
              {applicableQuestions.map((q, idx) => (
                <li key={q.id} className="rounded-xl bg-black/5 dark:bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {idx + 1}. {q.question}
                      {q.type !== 'text' && (
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider ${form.responses[q.id]?.value ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                          {form.responses[q.id]?.value ? 'answered' : 'required'}
                        </span>
                      )}
                    </p>
                    <Chip label={CATEGORY_LABELS[q.category] || q.category} className="bg-primary/10 text-primary dark:text-primary-light border-primary/20 shrink-0" />
                  </div>
                  <QuestionInput question={q} value={form.responses[q.id]?.value ?? ''} onChange={(value, text) => setResponse(q, value, text)} />
                  {q.core && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Core check-in question</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Concern Assessment</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Auto-computed score: <span className="font-semibold">{score == null ? '—' : `${score}%`}</span></p>
              </div>
              <CustomSelect
                value={form.concernLevel}
                onChange={(val) => { setConcernTouched(true); setForm((prev) => ({ ...prev, concernLevel: val })); }}
                options={CONCERN_LEVEL_OPTIONS}
                className="w-48"
              />
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Concern Areas</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.concernCategories.includes(cat) ? 'bg-primary/10 text-primary dark:text-primary-light border-primary/40' : 'bg-black/5 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'}`}
                  >
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Main Concern</label>
                <textarea value={form.notes.mainConcern} onChange={(e) => setForm((prev) => ({ ...prev, notes: { ...prev.notes, mainConcern: e.target.value } }))} rows={3} placeholder="One or two lines describing the main concern..." className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Observations</label>
                <textarea value={form.notes.observations} onChange={(e) => setForm((prev) => ({ ...prev, notes: { ...prev.notes, observations: e.target.value } }))} rows={3} placeholder="What was observed during the session..." className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Action Taken</label>
                <textarea value={form.notes.actionTaken} onChange={(e) => setForm((prev) => ({ ...prev, notes: { ...prev.notes, actionTaken: e.target.value } }))} rows={3} placeholder="Actions or support provided..." className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Recommendation</label>
                <textarea value={form.notes.recommendation} onChange={(e) => setForm((prev) => ({ ...prev, notes: { ...prev.notes, recommendation: e.target.value } }))} rows={3} placeholder="Recommended follow-up or support..." className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-4">
              <p className="text-sm font-semibold text-rose-800 dark:text-rose-300">Safeguarding</p>
              <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5 mb-3">Marked with care — this flags a session for immediate priority attention.</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-rose-800 dark:text-rose-300 cursor-pointer">
                  <input type="checkbox" checked={form.safeguards.flag} onChange={(e) => setForm((prev) => ({ ...prev, safeguards: { ...prev.safeguards, flag: e.target.checked } }))} className="rounded accent-[#ef4444]" />
                  This session needs safeguarding attention
                </label>
                <label className="flex items-center gap-2 text-sm text-rose-800 dark:text-rose-300 cursor-pointer">
                  <input type="checkbox" checked={form.safeguards.selfHarm} onChange={(e) => setForm((prev) => ({ ...prev, safeguards: { ...prev.safeguards, selfHarm: e.target.checked } }))} className="rounded accent-[#ef4444]" />
                  Self-harm risk indicated
                </label>
                <label className="flex items-center gap-2 text-sm text-rose-800 dark:text-rose-300 cursor-pointer">
                  <input type="checkbox" checked={form.safeguards.immediateRisk} onChange={(e) => setForm((prev) => ({ ...prev, safeguards: { ...prev.safeguards, immediateRisk: e.target.checked } }))} className="rounded accent-[#ef4444]" />
                  Immediate risk — urgent attention required
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843] p-5 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Follow-up</h2>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.followUp.required} onChange={(e) => setForm((prev) => ({ ...prev, followUp: { ...prev.followUp, required: e.target.checked } }))} className="rounded accent-[var(--accent)]" />
              Follow-up required
            </label>
            {form.followUp.required && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Follow-up By *</label>
                  <input type="date" value={form.followUp.date} onChange={(e) => setForm((prev) => ({ ...prev, followUp: { ...prev.followUp, date: e.target.value } }))} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 transition-all text-sm" />
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Escalation & Parent Contact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Escalation Channel</label>
                  <CustomSelect
                    value={form.escalation.channel || 'none'}
                    onChange={(val) => setForm((prev) => ({ ...prev, escalation: { ...prev.escalation, channel: val } }))}
                    options={[
                      { value: 'none', label: 'No escalation' },
                      { value: 'principal', label: 'Principal' },
                      { value: 'parent', label: 'Parent / Guardian' },
                      { value: 'external', label: 'External referral' },
                    ]}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Parent / Guardian Contacted</label>
                  <CustomSelect
                    value={form.escalation.parentContacted ? 'yes' : 'no'}
                    onChange={(val) => setForm((prev) => ({ ...prev, escalation: { ...prev.escalation, parentContacted: val === 'yes' } }))}
                    options={[{ value: 'no', label: 'Not contacted' }, { value: 'yes', label: 'Contacted' }]}
                    className="w-full"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">Escalation Details</label>
                  <textarea value={form.escalation.details} onChange={(e) => setForm((prev) => ({ ...prev, escalation: { ...prev.escalation, details: e.target.value } }))} rows={2} placeholder="Who was informed, when, and any response..." className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">External Referral</label>
                  <input type="text" value={form.escalation.externalReferral} onChange={(e) => setForm((prev) => ({ ...prev, escalation: { ...prev.escalation, externalReferral: e.target.value } }))} placeholder="e.g. counsellor, doctor, child helpline" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 pt-4">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Review</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm">
                <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Student:</span> {selectedStudent?.displayName || '—'} · Class {classNum || '—'}{selectedStudentSection ? `-${selectedStudentSection}` : ''}</p>
                <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Date:</span> {formatDate(form.date)}</p>
                <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Type:</span> {SESSION_TYPE_LABELS[form.sessionType] || form.sessionType}</p>
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="text-gray-400 dark:text-gray-500">Concern:</span>{' '}
                  <Chip label={CONCERN_LEVEL_LABELS[form.concernLevel] || 'none'} className={CONCERN_STYLES[form.concernLevel] || CONCERN_STYLES.none} />
                  {' '}{score != null && <span className="text-gray-400 dark:text-gray-500">· {score}%</span>}
                </p>
                <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Areas:</span> {form.concernCategories.length ? form.concernCategories.map((c) => CATEGORY_LABELS[c] || c).join(', ') : '—'}</p>
                <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Follow-up:</span> {form.followUp.required ? `${formatDate(form.followUp.date)}` : '—'}</p>
                <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Escalation:</span> {form.escalation.channel === 'none' ? '—' : form.escalation.channel}{form.escalation.parentContacted ? ' · parent informed' : ''}{form.safeguards.flag ? ' · ⚠ safeguarding' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50">
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={tryNext} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">
            Continue →
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all disabled:opacity-50">
            {saving ? 'Saving...' : editing ? 'Update Session' : 'Save Session'}
          </button>
        )}
      </div>
    </div>
  );
}