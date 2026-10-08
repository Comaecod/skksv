import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/contexts/AuthContext';
import CustomSelect from '../CustomSelect';
import ConfirmModal from '../ConfirmModal';
import DataTable from '../DataTable';
import { counsellingService, buildOptionScores, CATEGORY_LABELS } from '../../services/counsellingService';
import { Chip } from './counsellingUI';

const TYPE_LABELS = { rating: 'Scale (Never→Always)', frequency: 'Frequency', yesno: 'Yes / No', mcq: 'Multiple choice', text: 'Open text' };
const TYPE_OPTIONS = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));
const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }));
const CLASS_OPTIONS = ['4', '5', '6', '7', '8', '9', '10'].map((v) => ({ value: v, label: `Class ${v}` }));
const RESIDENCE_OPTIONS = [
  { value: 'general', label: 'Everyone (Day Scholar + Hostel)' },
  { value: 'hostel', label: 'Hostel students only' },
];

const defaultQuestion = () => ({
  question: '',
  category: 'general',
  classMin: '4',
  classMax: '10',
  type: 'rating',
  reverse: false,
  core: false,
  followup: false,
  safeguard: false,
  residence: 'general',
  guidance: '',
  options: buildOptionScores('rating'),
});

const FormField = ({ label, children }) => (
  <div>
    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

export default function QuestionBankManager() {
  const { user, userProfile } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultQuestion());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const actorName = userProfile?.displayName || user?.email || 'Staff';
  const actorUid = userProfile?.id || user?.uid || '';

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const qs = await counsellingService.getQuestions();
      setQuestions(qs);
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load questions');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const visible = useMemo(() => questions, [questions]);

  const resetForm = () => {
    setForm(defaultQuestion());
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      type,
      options: type === 'mcq' ? [
        { label: 'Very well', value: 'very-well', score: 0 },
        { label: 'Okay', value: 'okay', score: 25 },
        { label: 'Struggling', value: 'struggling', score: 100 },
      ] : buildOptionScores(type === 'frequency' ? 'frequency' : type),
    }));
  };

  const updateMcqOption = (i, field, value) => {
    const valueIsLabel = field === 'label';
    setForm((prev) => {
      const opts = prev.options.map((o, idx) => (idx === i ? { ...o, [field]: valueIsLabel ? value : Number(value) } : o));
      return { ...prev, options: opts };
    });
  };

  const addMcqOption = () => setForm((prev) => ({ ...prev, options: [...prev.options, { label: '', value: `opt-${Date.now()}`, score: 50 }] }));
  const removeMcqOption = (i) => setForm((prev) => ({ ...prev, options: prev.options.filter((_, idx) => idx !== i) }));

  const handleSave = async () => {
    setError('');
    if (!form.question.trim()) { setError('Question text is required.'); return; }
    if (Number(form.classMin) > Number(form.classMax)) { setError('Minimum class cannot be greater than maximum class.'); return; }
    if (form.type === 'mcq' && form.options.some((o) => !o.label.trim())) { setError('Every multiple-choice option needs a label.'); return; }
    if (form.type === 'mcq' && form.options.length < 2) { setError('Multiple-choice questions need at least two options.'); return; }

    setSaving(true);
    try {
      const payload = {
        question: form.question.trim(),
        category: form.category,
        classRange: { min: Number(form.classMin), max: Number(form.classMax) },
        type: form.type,
        reverse: !!form.reverse,
        core: !!form.core,
        followup: !!form.followup,
        safeguard: !!form.safeguard,
        residence: ['general', 'hostel'].includes(form.residence) ? form.residence : 'general',
        guidance: form.guidance?.trim() || '',
      };
      if (form.type !== 'text') payload.options = form.options.map((o, i) => ({ label: o.label, value: String(o.value || `opt-${i + 1}`), score: Number(o.score) || 0 }));

      if (editingId) {
        await counsellingService.updateQuestion(editingId, payload, { uid: actorUid, name: actorName });
      } else {
        await counsellingService.createQuestion(payload, { uid: actorUid, name: actorName });
      }
      resetForm();
      loadQuestions();
    } catch (err) {
      setError(err.message || 'Could not save question');
    }
    setSaving(false);
  };

  const handleToggleActive = async (q) => {
    await counsellingService.updateQuestion(q.id, { active: q.active === false }, { uid: actorUid, name: actorName });
    loadQuestions();
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await counsellingService.deleteQuestion(deleteTarget.id, { uid: actorUid, name: actorName });
      setDeleteTarget(null);
      loadQuestions();
    } catch (err) {
      setError(err.message || 'Could not disable question');
    }
    setDeleteLoading(false);
  };

  const moveQuestion = async (index, delta) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= visible.length) return;
    const a = visible[index];
    const b = visible[nextIndex];
    await Promise.all([
      counsellingService.updateQuestion(a.id, { order: nextIndex }, { uid: actorUid, name: actorName }),
      counsellingService.updateQuestion(b.id, { order: index }, { uid: actorUid, name: actorName }),
    ]);
    loadQuestions();
  };

  const startEdit = (q) => {
    setEditingId(q.id);
    setForm({
      question: q.question || '',
      category: q.category || 'general',
      classMin: String(q.classRange?.min ?? 4),
      classMax: String(q.classRange?.max ?? 10),
      type: q.type || 'rating',
      reverse: !!q.reverse,
      core: !!q.core,
      followup: !!q.followup,
      safeguard: !!q.safeguard,
      residence: q.residence === 'hostel' ? 'hostel' : 'general',
      guidance: q.guidance || '',
      options: q.options?.length ? q.options.map((o) => ({ ...o })) : buildOptionScores(q.type),
    });
    setShowForm(true);
    setError('');
  };

  return (
    <div className="animate-slideUp space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Wellbeing Question Bank</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {visible.filter((q) => q.active !== false).length} active questions · asked by class (4–10)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(defaultQuestion()); setError(''); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">
            {showForm && !editingId ? 'Cancel' : '+ Add Question'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843] p-5 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{editingId ? 'Edit Question' : 'New Question'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-3">
              <FormField label="Question Text *">
                <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Child-friendly question, e.g. 'I feel happy most days.'" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm" />
              </FormField>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <FormField label="Guidance for staff (shown only here, never to students)">
                <textarea value={form.guidance} onChange={(e) => setForm({ ...form, guidance: e.target.value })} placeholder="Why this question matters and what to watch for..." rows={2} className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 transition-all text-sm resize-y" />
              </FormField>
            </div>
            <FormField label="Category">
              <CustomSelect value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORY_OPTIONS} className="w-full" />
            </FormField>
            <FormField label="Question Type">
              <CustomSelect value={form.type} onChange={handleTypeChange} options={TYPE_OPTIONS} className="w-full" />
            </FormField>
            <FormField label="Min Class">
              <CustomSelect value={form.classMin} onChange={(v) => setForm({ ...form, classMin: v })} options={CLASS_OPTIONS} className="w-full" />
            </FormField>
            <FormField label="Max Class">
              <CustomSelect value={form.classMax} onChange={(v) => setForm({ ...form, classMax: v })} options={CLASS_OPTIONS} className="w-full" />
            </FormField>
            <FormField label="Residence">
              <CustomSelect value={form.residence} onChange={(v) => setForm({ ...form, residence: v })} options={RESIDENCE_OPTIONS} className="w-full" />
            </FormField>
          </div>

          {form.type !== 'text' && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Options (scored 0–100, higher = more concern)</p>
              <div className="space-y-2">
                {form.options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={o.label}
                      onChange={(e) => updateMcqOption(i, 'label', e.target.value)}
                      disabled={form.type !== 'mcq'}
                      placeholder="Option label"
                      className={`flex-1 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none text-sm ${form.type !== 'mcq' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    <input
                      type="number"
                      value={o.score}
                      onChange={(e) => updateMcqOption(i, 'score', e.target.value)}
                      disabled={form.type !== 'mcq'}
                      min={0}
                      max={100}
                      className={`w-24 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none text-sm ${form.type !== 'mcq' ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {form.type === 'mcq' && (
                      <button type="button" onClick={() => removeMcqOption(i)} className="text-rose-500 hover:text-rose-600 px-2">✕</button>
                    )}
                  </div>
                ))}
                {form.type === 'mcq' && (
                  <button type="button" onClick={addMcqOption} className="text-sm text-primary dark:text-primary-light hover:underline">+ Add option</button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-6 pt-2 border-t border-gray-200 dark:border-white/10">
            {form.type !== 'text' && (
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.reverse} onChange={(e) => setForm({ ...form, reverse: e.target.checked })} className="rounded accent-[var(--accent)]" />
                Reverse score (high answer = less concern)
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.core} onChange={(e) => setForm({ ...form, core: e.target.checked })} className="rounded accent-[var(--accent)]" />
              Core (always in monthly check-in)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.followup} onChange={(e) => setForm({ ...form, followup: e.target.checked })} className="rounded accent-[var(--accent)]" />
              Suggest follow-up on "Yes"
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.safeguard} onChange={(e) => setForm({ ...form, safeguard: e.target.checked })} className="rounded accent-[#ef4444]" />
              Safeguarding question
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update Question' : 'Add Question'}
            </button>
            <button onClick={resetForm} className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Cancel</button>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          {
            key: 'question', label: 'Question',
            render: (q) => (
              <div>
                <span className="text-gray-900 dark:text-white font-medium">{q.question}</span>
                {q.guidance && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-2xl">{q.guidance}</p>}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <Chip label={CATEGORY_LABELS[q.category] || q.category} className="bg-primary/10 text-primary dark:text-primary-light border-primary/20" />
                  {q.residence === 'hostel' && <Chip label="Hostel" className="bg-violet-100 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20" />}
                  {q.core && <Chip label="Core" className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20" />}
                  {q.followup && <Chip label="Follow-up" className="bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20" />}
                  {q.safeguard && <Chip label="Safeguard" className="bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20" />}
                  {q.active === false && <Chip label="Disabled" className="bg-gray-100 dark:bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10" />}
                </div>
              </div>
            ),
          },
          { key: 'class', label: 'Classes', render: (q) => <span className="text-gray-600 dark:text-gray-300">{q.classRange?.min}–{q.classRange?.max}</span> },
          { key: 'type', label: 'Type', render: (q) => <span className="text-gray-600 dark:text-gray-300">{TYPE_LABELS[q.type] || q.type}</span> },
          {
            key: 'actions', label: 'Actions', className: 'text-right',
            render: (q) => {
              const i = visible.findIndex((x) => x.id === q.id);
              return (
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => moveQuestion(i, -1)} disabled={i <= 0} className="px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all disabled:opacity-30">↑</button>
                  <button onClick={() => moveQuestion(i, 1)} disabled={i === visible.length - 1} className="px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all disabled:opacity-30">↓</button>
                  <button onClick={() => startEdit(q)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all">Edit</button>
                  <button onClick={() => handleToggleActive(q)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${q.active === false ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-500/20'}`}>
                    {q.active === false ? 'Enable' : 'Disable'}
                  </button>
                  <button onClick={() => setDeleteTarget(q)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-all">Delete</button>
                </div>
              );
            },
          },
        ]}
        data={visible}
        loading={loading}
        loadingMessage="Loading question bank..."
        emptyMessage="Question bank is empty — seed it by running: npm run seed:counselling (or add a question above)."
        rowKey="id"
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Disable this question?"
        description="The question will be hidden from future check-ins. Existing responses are kept."
        confirmText="Disable"
        confirmLoadingText="Disabling..."
        variant="danger"
      />
    </div>
  );
}