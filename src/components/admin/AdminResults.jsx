import { useState, useEffect, useMemo, useCallback } from 'react';
import { subjectLabel } from '../../utils/format';
import { useAuth } from '../../auth/contexts/AuthContext';
import { getGrade } from '../../utils/scoring';
import { ROLES } from '../../auth/types/roles';
import { auditService, AUDIT_ACTIONS } from '../../auth/services/auditService';
import CustomSelect from '../CustomSelect';
import DataTable from '../DataTable';
import ResultsAnalytics from './ResultsAnalytics';

const buildRow = (d) => {
  const r = d.results || {};
  const hasResult = r.totalMarks != null;
  const qTotal = (r.correctCount || 0) + (r.wrongCount || 0) + (r.skippedCount || 0);
  let total;
  if (hasResult) total = r.totalMarks;
  else total = qTotal || d.totalMarks || d.total || 0;
  let score;
  if (hasResult) score = r.totalEarned ?? r.correctCount ?? r.score ?? d.marks ?? d.score ?? 0;
  else score = r.correctCount ?? r.score ?? d.marks ?? d.score ?? 0;
  const percentage = r.percentage != null ? parseFloat(r.percentage) : (total > 0 ? (score / total) * 100 : 0);
  const grade = r.grade || (total > 0 ? getGrade(percentage.toFixed(2)) : '-');
  return { score, total, percentage, grade };
};

function DetailModal({ submission, onClose, onSaved, readOnly }) {
  const [scoreInput, setScoreInput] = useState(submission.score ?? 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  const { type } = submission;
  const isProject = type === 'project' || (type === 'timed' && submission._raw?.assessmentType === 'project');

  const totalMarks = Number(submission._raw?.totalMarks ?? submission._raw?.results?.totalMarks ?? submission.total ?? 0) || 0;
  const clamped = isProject ? Math.max(0, Math.min(totalMarks, Number(scoreInput) || 0)) : 0;
  const livePercentage = totalMarks > 0 ? ((clamped / totalMarks) * 100).toFixed(2) : '0.00';
  const liveGrade = totalMarks > 0 ? getGrade(livePercentage) : '-';

  const displayScore = isProject ? clamped : submission.score;
  const displayTotal = isProject ? totalMarks : submission.total;
  const displayPercentage = isProject ? livePercentage : submission.percentage;
  const displayGrade = isProject ? liveGrade : submission.grade;

  const handleSaveScore = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { db } = await import('../../firebase');
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const results = {
        type: 'project',
        totalMarks,
        totalEarned: clamped,
        percentage: livePercentage,
        grade: liveGrade,
        correctCount: 0,
        wrongCount: 0,
        skippedCount: 0,
      };
      await updateDoc(doc(db, 'submissions', submission.id), {
        score: clamped,
        totalMarks,
        marks: clamped,
        percentage: livePercentage,
        grade: liveGrade,
        results,
        gradedAt: serverTimestamp(),
      });
      setSaved(true);
      onSaved?.();
      onClose();
    } catch (err) {
      setSaveError(err.message || 'Failed to save score');
    }
    setSaving(false);
  };

  if (!submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-[#1e1e38] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-[#1e1e38] border-b border-gray-200 dark:border-white/10 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{submission.examTitle}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {submission.className && `Class ${submission.className}`}{submission.subject ? ` — ${submission.subject}` : ''}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                type === 'quiz' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                type === 'coding' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>{type.toUpperCase()}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4 text-sm">
            <div><span className="text-gray-500 dark:text-gray-400">Student:</span> <span className="text-gray-900 dark:text-white font-medium">{submission.studentName}</span> {submission.guest && <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">No-Login</span>}</div>
            <div><span className="text-gray-500 dark:text-gray-400">Date:</span> <span className="text-gray-900 dark:text-white">{submission.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span></div>
            {submission.invigilator && <div><span className="text-gray-500 dark:text-gray-400">Invigilator:</span> <span className="text-gray-900 dark:text-white">{submission.invigilator}</span></div>}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-100 dark:bg-[#282843] rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${displayPercentage >= 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {Number(displayPercentage).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Percentage</p>
            </div>
            <div className="bg-gray-100 dark:bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{displayScore}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Score</p>
            </div>
            <div className="bg-gray-100 dark:bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{displayTotal}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total</p>
            </div>
            <div className="bg-gray-100 dark:bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{displayGrade !== '-' ? displayGrade : '—'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Grade</p>
            </div>
          </div>

          {isProject && (
            <>
              <div className="bg-gray-100 dark:bg-[#282843] rounded-xl p-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">📁 Project Details</h4>
                {submission._raw.topic && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">Topic:</span> {submission._raw.topic}</p>}
                {submission._raw.description && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">Description:</span> {submission._raw.description}</p>}
                {submission._raw.fileUrl ? (
                  <div>
                    <a href={submission._raw.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-all">
                      📎 View Attached File{submission._raw.fileName ? ` — ${submission._raw.fileName}` : ''}
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No file attached</p>
                )}
              </div>

              <div className="bg-gray-100 dark:bg-[#282843] rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">🎯 Grade Project</h4>
                {readOnly ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Your project score: <span className="font-semibold text-gray-900 dark:text-white">{displayScore}/{displayTotal}</span>
                  </p>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-wrap">
                      <label className="text-sm text-gray-600 dark:text-gray-300">Score</label>
                      <input
                        type="number"
                        min="0"
                        max={totalMarks}
                        step="0.5"
                        value={scoreInput}
                        onChange={e => { setScoreInput(e.target.value); setSaved(false); }}
                        className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-[#1e1e38] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm outline-none focus:border-primary/50"
                      />
                      <span className="text-sm text-gray-500 dark:text-gray-400">/ {totalMarks}</span>
                      {isProject && totalMarks === 0 && <span className="text-xs text-red-400">No total marks set for this assessment</span>}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Percentage: <span className={`font-semibold ${livePercentage >= 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{livePercentage}%</span>
                      {' '}| Grade: <span className="font-semibold text-gray-900 dark:text-white">{liveGrade}</span>
                    </p>
                    {saved && <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ Score saved</p>}
                    {saveError && <p className="text-sm text-red-500">⚠️ {saveError}</p>}
                    <button
                      onClick={handleSaveScore}
                      disabled={saving || (isProject && totalMarks === 0)}
                      className="px-5 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all disabled:opacity-40"
                    >
                      {saving ? 'Saving...' : 'Save Score'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {type === 'coding' && submission._raw?.code && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Code Submitted</h4>
                <pre className="bg-gray-100 dark:bg-[#0d0d1f] rounded-xl p-4 text-sm text-gray-700 dark:text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap max-h-80 overflow-y-auto border border-gray-200 dark:border-white/5">{submission._raw.code}</pre>
              </div>
              {submission._raw.testResults?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Test Results ({submission.score}/{submission._raw.testResults.length} passed)</h4>
                  <div className="space-y-2">
                    {submission._raw.testResults.map((tr, i) => (
                      <div key={i} className={`rounded-xl p-3 flex items-center gap-3 border ${tr.passed ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20'}`}>
                        <span className={`text-lg ${tr.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{tr.passed ? '✓' : '✗'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-900 dark:text-white truncate">{tr.name || `Test Case ${i + 1}`}</p>
                          {tr.input !== undefined && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Input: {String(tr.input).substring(0, 120)}</p>}
                          {tr.expected !== undefined && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Expected: {String(tr.expected).substring(0, 120)}</p>}
                          {tr.output !== undefined && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Output: {String(tr.output).substring(0, 120)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const FORMAT_OPTIONS = [
  { value: 'all', label: 'All Formats' },
  { value: 'mcq', label: 'MCQ' },
  { value: 'coding', label: 'Coding' },
  { value: 'project', label: 'Project' },
];

export default function AdminResults() {
  const { userProfile } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [weakFilter, setWeakFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const isStudentView = userProfile?.role === ROLES.STUDENT;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const { db } = await import('../../firebase');
      const { collection, getDocs, query, orderBy, where } = await import('firebase/firestore');

      const snap = isStudentView && userProfile?.id
        ? await getDocs(query(
            collection(db, 'submissions'),
            where('student.userId', '==', userProfile.id)
          ))
        : await getDocs(query(collection(db, 'submissions'), orderBy('submittedAt', 'desc')));

      const out = [];
      const userCache = new Map();

      for (const docSnap of snap.docs) {
        const d = docSnap.data();
        const student = d.student || d.studentInfo || {};
        const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
        const type = d.type || 'mcq';
        const { score, total, percentage, grade } = buildRow(d);

        let isWeak = d.studentIsWeak === true || student.isWeak === true || d.student?.isWeak === true || d.isWeak === true;
        if (isWeak !== true && student.userId && !d.guest) {
          if (userCache.has(student.userId)) {
            isWeak = userCache.get(student.userId) === true;
          } else {
            try {
              const { userService } = await import('../../auth/services/userService');
              const profile = await userService.getUserById(student.userId);
              const weak = profile?.isWeak === true;
              userCache.set(student.userId, weak);
              isWeak = weak;
            } catch {}
          }
        } else if (isWeak !== true && userCache.has(student.userId)) {
          isWeak = userCache.get(student.userId) === true;
        }
        out.push({
          id: docSnap.id,
          type,
          _raw: d,
          studentName,
          guest: d.guest === true || !student.userId,
          className: d.classNum || d.examKey?.split('_')[1] || '',
          subject: subjectLabel(d.subject) || d.subject || '',
          examTitle: d.title || (type === 'coding' ? 'Coding Assessment' : 'Untitled'),
          examType: d.examType || '',
          invigilator: d.invigilator || '',
          createdBy: d.createdBy || '',
          score,
          total,
          percentage,
          grade,
          timestamp: d.submittedAt?.toDate?.() || new Date(0),
          isWeak,
        });
      }

      setResults(out);
    } catch (err) {
      console.error('Error fetching results:', err);
    }
    setLoading(false);
  }, [isStudentView, userProfile?.id]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filterOptions = useMemo(() => {
    const classes = new Set();
    const subjects = new Set();
    results.forEach(r => {
      if (r.className) classes.add(r.className);
      if (r.subject) subjects.add(r.subject);
    });
    return {
      classes: [...classes].sort(),
      subjects: [...subjects].sort(),
    };
  }, [results]);

  const handleExport = async () => {
    const XLSX = await import('xlsx');
    const rows = filtered.map(r => ({
      Student: r.studentName,
      Login: r.guest ? 'No-Login' : 'Logged-in',
      Weak: r.isWeak ? 'Yes' : 'No',
      Class: r.className,
      Subject: r.subject,
      Invigilator: r.invigilator,
      Exam: r.examTitle,
      Type: r.type.toUpperCase(),
      Score: `${r.score}/${r.total}`,
      Percentage: r.percentage.toFixed(1),
      Grade: r.grade,
      Date: r.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    const f = `Results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, f);
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = async (r) => {
    if (confirmDelete !== r.id) {
      setConfirmDelete(r.id);
      return;
    }
    setConfirmDelete(null);
    try {
      const { db } = await import('../../firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'submissions', r.id));
      auditService.log(AUDIT_ACTIONS.RESULT_DELETED, userProfile?.id, { submissionId: r.id, studentName: r.studentName, title: r.examTitle, subject: r.subject, classNum: r.className, type: r.type });
      if (selected?.id === r.id) setSelected(null);
      fetchAll();
    } catch (err) {
      console.error('Error deleting result:', err);
    }
  };

  const filtered = useMemo(() => {
    let data = results.filter(r => {
      const role = userProfile?.role;
      if (role === ROLES.STAFF && !(userProfile?.roleSubtype === 'principal') && userProfile?.id && r.createdBy && r.createdBy !== userProfile.id) {
        // keep existing behavior permissive unless explicitly creator check needed; don't block
      }
      if (classFilter !== 'all' && r.className !== classFilter) return false;
      if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false;
      if (formatFilter !== 'all' && r.type !== formatFilter) return false;
      if (sourceFilter === 'guest' && !r.guest) return false;
      if (sourceFilter === 'member' && r.guest) return false;
      if (weakFilter === 'weak' && r.isWeak !== true) return false;
      if (weakFilter === 'nonweak' && r.isWeak === true) return false;
      if (dateFrom && r.timestamp < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && r.timestamp > new Date(`${dateTo}T23:59:59.999`)) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return r.studentName.toLowerCase().includes(q)
        || r.examTitle.toLowerCase().includes(q)
        || r.subject.toLowerCase().includes(q)
        || r.className.toLowerCase().includes(q);
    });

    data.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === 'timestamp') {
        va = va.getTime?.() || 0;
        vb = vb.getTime?.() || 0;
      } else if (sortKey === 'className') {
        va = String(va).padStart(10, '0');
        vb = String(vb).padStart(10, '0');
      } else {
        va = typeof va === 'string' ? va.toLowerCase() : va;
        vb = typeof vb === 'string' ? vb.toLowerCase() : vb;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [results, search, classFilter, subjectFilter, formatFilter, sourceFilter, weakFilter, dateFrom, dateTo, sortKey, sortDir, userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{isStudentView ? 'My Results' : 'All Results'}</h2>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by student, exam, subject, class..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          {!isStudentView && (
            <CustomSelect value={classFilter} onChange={setClassFilter}
              options={[{ value: 'all', label: 'All Classes' }, ...filterOptions.classes.map(c => ({ value: c, label: `Class ${c}` }))]}
              className="min-w-[140px]" />
          )}
          <CustomSelect value={subjectFilter} onChange={setSubjectFilter}
            options={[{ value: 'all', label: 'All Subjects' }, ...filterOptions.subjects.map(s => ({ value: s, label: s }))]}
            className="min-w-[140px]" />
          <CustomSelect value={formatFilter} onChange={setFormatFilter}
            options={FORMAT_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
            className="min-w-[130px]" />
          {!isStudentView && (
            <CustomSelect value={sourceFilter} onChange={setSourceFilter}
              options={[
                { value: 'all', label: 'All Sources' },
                { value: 'member', label: 'Logged-in' },
                { value: 'guest', label: 'No-Login' },
              ]}
              className="min-w-[130px]" />
          )}
          {!isStudentView && (
            <CustomSelect value={weakFilter} onChange={setWeakFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'weak', label: 'Weak' },
                { value: 'nonweak', label: 'Non-Weak' },
              ]}
              className="min-w-[120px]" />
          )}
          {!isStudentView && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={e => setDateFrom(e.target.value)}
                title="From date"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
              <span className="text-gray-400 text-sm">→</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={e => setDateTo(e.target.value)}
                title="To date"
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all"
              />
              {(dateFrom || dateTo) && (
                <button onClick={() => { setDateFrom(''); setDateTo(''); }}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                  Clear
                </button>
              )}
            </div>
          )}
          <button onClick={handleExport} disabled={filtered.length === 0}
            className="px-4 py-2.5 rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
            Export Excel
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-[#282843] rounded-xl border border-gray-200 dark:border-white/10">
          <div className="text-4xl mb-3">{results.length === 0 ? '\uD83D\uDCED' : '\uD83D\uDD0D'}</div>
          <p className="text-gray-500 dark:text-gray-400">{results.length === 0 ? 'No results found in database.' : 'No results match your filters.'}</p>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: 'studentName', label: 'Student', sortable: true, cellClassName: 'text-gray-900 dark:text-white font-medium', render: (r) => (
              <div className="flex items-center gap-2 flex-wrap">
                <span>{r.studentName}</span>
                {r.isWeak && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">Weak</span>
                )}
                {r.guest && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300">No-Login</span>
                )}
              </div>
            ) },
            { key: 'className', label: 'Class', sortable: true, render: (r) => r.className },
            { key: 'subject', label: 'Subject', sortable: true, render: (r) => r.subject },
            { key: 'type', label: 'Type', sortable: true, render: (r) => (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.type === 'mcq' || r.type === 'quiz' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : r.type === 'coding' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'}`}>
                {r.type === 'mcq' || r.type === 'quiz' ? 'MCQ' : r.type === 'coding' ? 'CODING' : 'PROJECT'}
              </span>
            )},
            { key: 'invigilator', label: 'Invigilator', sortable: true, render: (r) => <span className="text-xs text-gray-500 dark:text-gray-400">{r.invigilator || '—'}</span> },
            { key: 'score', label: 'Score', sortable: true, render: (r) => `${r.score}/${r.total}` },
            { key: 'percentage', label: '%', sortable: true, render: (r) => <span className={`font-semibold ${r.percentage >= 40 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{r.percentage.toFixed(1)}%</span> },
            { key: 'timestamp', label: 'Date', sortable: true, render: (r) => <span className="text-xs text-gray-400 dark:text-gray-500">{r.timestamp.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')}</span> },
            ...(userProfile?.role === ROLES.SUPER_ADMIN ? [{
              key: 'actions', label: 'Actions', render: (r) => {
                const isConfirming = confirmDelete === r.id;
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${isConfirming ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 animate-pulse' : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20'}`}
                  >
                    {isConfirming ? 'Confirm?' : 'Delete'}
                  </button>
                );
              },
            }] : []),
          ]}
          data={filtered}
          rowKey={(r) => `${r.type}-${r.id}`}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onRowClick={(r) => setSelected(r)}
        />
      )}

      {filtered.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white dark:bg-[#282843] border border-gray-200 dark:border-white/10 overflow-hidden">
          <button
            onClick={() => setShowAnalysis(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <span>📊 Analysis <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 ml-1">({filtered.length} submission{filtered.length === 1 ? '' : 's'})</span></span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showAnalysis ? '' : '-rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showAnalysis && (
            <div className="border-t border-gray-200 dark:border-white/10 p-4">
              <ResultsAnalytics rows={filtered} />
            </div>
          )}
        </div>
      )}

      {selected && <DetailModal submission={selected} onClose={() => setSelected(null)} onSaved={fetchAll} readOnly={isStudentView} />}
    </div>
  );
}
