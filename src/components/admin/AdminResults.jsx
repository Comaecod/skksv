import { useState, useEffect, useMemo } from 'react';

function DetailModal({ submission, onClose }) {
  if (!submission) return null;

  const { type } = submission;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-[#1e1e38] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#1e1e38] border-b border-white/10 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{submission.examTitle}</h3>
            <p className="text-sm text-gray-400">
              {submission.className && `Class ${submission.className}`}{submission.subject ? ` — ${submission.subject}` : ''}
              {submission.examType ? ` — ${submission.examType}` : ''}
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                type === 'quiz' ? 'bg-emerald-500/20 text-emerald-300' :
                type === 'coding' ? 'bg-blue-500/20 text-blue-300' :
                'bg-amber-500/20 text-amber-300'
              }`}>{type.toUpperCase()}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4 text-sm">
            <div><span className="text-gray-400">Student:</span> <span className="text-white font-medium">{submission.studentName}</span></div>
            <div><span className="text-gray-400">Roll:</span> <span className="text-white">{submission.rollNumber}</span></div>
            <div><span className="text-gray-400">Date:</span> <span className="text-white">{submission.timestamp.toLocaleDateString()}</span></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className={`text-2xl font-bold ${submission.percentage >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                {submission.percentage.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">Percentage</p>
            </div>
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{submission.score}</p>
              <p className="text-xs text-gray-400 mt-1">Score</p>
            </div>
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{submission.total}</p>
              <p className="text-xs text-gray-400 mt-1">Total</p>
            </div>
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{submission.grade !== '-' ? submission.grade : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">Grade</p>
            </div>
          </div>

          {type === 'coding' && submission._raw?.code && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Code Submitted</h4>
                <pre className="bg-[#0d0d1f] rounded-xl p-4 text-sm text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap max-h-80 overflow-y-auto border border-white/5">{submission._raw.code}</pre>
              </div>
              {submission._raw.testResults?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Test Results ({submission.score}/{submission._raw.testResults.length} passed)</h4>
                  <div className="space-y-2">
                    {submission._raw.testResults.map((tr, i) => (
                      <div key={i} className={`rounded-xl p-3 flex items-center gap-3 border ${tr.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <span className={`text-lg ${tr.passed ? 'text-emerald-400' : 'text-red-400'}`}>{tr.passed ? '✓' : '✗'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{tr.name || `Test Case ${i + 1}`}</p>
                          {tr.input !== undefined && <p className="text-xs text-gray-400 truncate">Input: {String(tr.input).substring(0, 120)}</p>}
                          {tr.expected !== undefined && <p className="text-xs text-gray-400 truncate">Expected: {String(tr.expected).substring(0, 120)}</p>}
                          {tr.output !== undefined && <p className="text-xs text-gray-400 truncate">Output: {String(tr.output).substring(0, 120)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {type === 'timed' && submission._raw?.assessmentType === 'project' && (
            <div className="bg-[#282843] rounded-xl p-4 space-y-2">
              <h4 className="text-sm font-semibold text-white">Project Details</h4>
              {submission._raw.topic && <p className="text-sm text-gray-300"><span className="text-gray-400">Topic:</span> {submission._raw.topic}</p>}
              {submission._raw.description && <p className="text-sm text-gray-300"><span className="text-gray-400">Description:</span> {submission._raw.description}</p>}
              {submission._raw.fileUrl && (
                <a href={submission._raw.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-primary hover:underline mt-2">
                  View Attached File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SortIcon({ active, direction }) {
  return (
    <span className="inline-block ml-1 text-[10px]">
      {active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}
    </span>
  );
}

const SORTABLE_COLUMNS = [
  { key: 'studentName', label: 'Student' },
  { key: 'rollNumber', label: 'Roll No' },
  { key: 'className', label: 'Class' },
  { key: 'subject', label: 'Subject' },
  { key: 'examTitle', label: 'Exam' },
  { key: 'examType', label: 'Type' },
  { key: 'score', label: 'Score' },
  { key: 'percentage', label: '%' },
  { key: 'timestamp', label: 'Date' },
];

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [examTypeFilter, setExamTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDir, setSortDir] = useState('desc');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const { db } = await import('../../firebase');
        const { collection, getDocs, query, orderBy } = await import('firebase/firestore');

        const snap = await getDocs(query(collection(db, 'submissions'), orderBy('submittedAt', 'desc')));

        const out = [];

        snap.docs.forEach(doc => {
          const d = doc.data();
          const student = d.student || d.studentInfo || {};
          const studentName = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A';
          const rollNumber = String(student.rollNumber || '');
          const type = d.type || 'mcq';

          if (type === 'coding') {
            out.push({
              id: doc.id,
              type: 'coding',
              _raw: d,
              studentName,
              rollNumber,
              className: d.classNum || d.examKey?.split('_')[1] || '',
              subject: d.subject || '',
              examTitle: d.title || 'Coding Assessment',
              examType: d.examType || '',
              score: d.score || 0,
              total: d.total || 0,
              percentage: d.total > 0 ? ((d.score || 0) / d.total) * 100 : 0,
              grade: '-',
              timestamp: d.submittedAt?.toDate?.() || new Date(0),
            });
          } else {
            const results = d.results || {};
            out.push({
              id: doc.id,
              type,
              _raw: d,
              studentName,
              rollNumber,
              className: d.classNum || '',
              subject: d.subject || '',
              examTitle: d.title || 'Untitled',
              examType: d.examType || '',
              score: results.correctCount || results.score || 0,
              total: (results.correctCount || 0) + (results.wrongCount || 0) + (results.skippedCount || 0) || results.total || 0,
              percentage: parseFloat(results.percentage) || 0,
              grade: results.grade || '-',
              timestamp: d.submittedAt?.toDate?.() || new Date(0),
            });
          }
        });

        setResults(out);
      } catch (err) {
        console.error('Error fetching results:', err);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filterOptions = useMemo(() => {
    const classes = new Set();
    const subjects = new Set();
    const examTypes = new Set();
    results.forEach(r => {
      if (r.className) classes.add(r.className);
      if (r.subject) subjects.add(r.subject);
      if (r.examType) examTypes.add(r.examType);
    });
    return {
      classes: [...classes].sort(),
      subjects: [...subjects].sort(),
      examTypes: [...examTypes].sort(),
    };
  }, [results]);

  const handleExport = async () => {
    const { default: XLSX } = await import('xlsx');
    const rows = filtered.map(r => ({
      Student: r.studentName,
      'Roll No': r.rollNumber,
      Class: r.className,
      Subject: r.subject,
      Exam: r.examTitle,
      Type: r.type.toUpperCase(),
      Score: `${r.score}/${r.total}`,
      Percentage: r.percentage.toFixed(1),
      Grade: r.grade,
      Date: r.timestamp.toLocaleDateString(),
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

  const filtered = useMemo(() => {
    let data = results.filter(r => {
      if (classFilter !== 'all' && r.className !== classFilter) return false;
      if (subjectFilter !== 'all' && r.subject !== subjectFilter) return false;
      if (examTypeFilter !== 'all' && r.examType !== examTypeFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return r.studentName.toLowerCase().includes(q)
        || r.examTitle.toLowerCase().includes(q)
        || r.subject.toLowerCase().includes(q)
        || r.className.toLowerCase().includes(q)
        || r.examType.toLowerCase().includes(q)
        || r.rollNumber.includes(q);
    });

    data.sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (sortKey === 'timestamp') {
        va = va.getTime?.() || 0;
        vb = vb.getTime?.() || 0;
      } else if (sortKey === 'className' || sortKey === 'rollNumber') {
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
  }, [results, search, classFilter, subjectFilter, examTypeFilter, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">All Results</h2>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search by student, exam, subject, class..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#282843] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#282843] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50">
            <option value="all">All Classes</option>
            {filterOptions.classes.map(c => <option key={c} value={c}>Class {c}</option>)}
          </select>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#282843] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50">
            <option value="all">All Subjects</option>
            {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={examTypeFilter} onChange={e => setExamTypeFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-[#282843] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50">
            <option value="all">All Exam Types</option>
            {filterOptions.examTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button onClick={handleExport} disabled={filtered.length === 0}
            className="px-4 py-2.5 rounded-xl bg-primary/20 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
            Export Excel
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#282843] rounded-xl border border-white/10">
          <div className="text-4xl mb-3">{results.length === 0 ? '📭' : '🔍'}</div>
          <p className="text-gray-400">{results.length === 0 ? 'No results found in database.' : 'No results match your filters.'}</p>
        </div>
      ) : (
        <div className="bg-[#282843] rounded-xl border border-white/10 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-gray-400 uppercase tracking-wider">
                {SORTABLE_COLUMNS.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-3 font-semibold select-none cursor-pointer hover:text-white transition-colors ${sortKey === col.key ? 'text-primary' : ''}`}
                  >
                    {col.label}
                    <SortIcon active={sortKey === col.key} direction={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr
                  key={`${r.type}-${r.id}`}
                  onClick={() => setSelected(r)}
                  className="border-b border-white/5 hover:bg-white/5 text-sm text-gray-300 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-white font-medium">{r.studentName}</td>
                  <td className="px-4 py-3">{r.rollNumber}</td>
                  <td className="px-4 py-3">{r.className}</td>
                  <td className="px-4 py-3">{r.subject}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={r.examTitle}>{r.examTitle}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      r.type === 'quiz' ? 'bg-emerald-500/20 text-emerald-300' :
                      r.type === 'coding' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {r.type === 'quiz' ? 'QUIZ' : r.type === 'coding' ? 'CODING' : 'TIMED'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.score}/{r.total}</td>
                  <td className={`px-4 py-3 font-semibold ${r.percentage >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>{r.percentage.toFixed(1)}%</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{r.timestamp.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <DetailModal submission={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
