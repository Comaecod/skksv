import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/contexts/AuthContext';

const FILTER_KEYS = ['All', 'Timed Assessment', 'Unit Test', 'Mid Term', 'Final Exam', 'Weekly Test', 'Holiday Homework'];
const SUBJECTS = ['All', 'Computers', 'English', 'Hindi', 'Maths', 'Science', 'Social', 'Telugu', 'GK', 'General'];

export default function StudentResults() {
  const { userProfile: authUser } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examTypeFilter, setExamTypeFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });

  const userId = authUser?.id || authUser?.uid;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetchResults = async () => {
      try {
        const { db } = await import('../firebase');
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const snapshot = await getDocs(query(
          collection(db, 'submissions'),
          where('student.userId', '==', userId)
        ));

        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const student = d.student || d.studentInfo || {};
          const r = d.results || {};
          return {
            id: doc.id,
            type: d.type || 'mcq',
            examType: d.examType || '',
            subject: d.subject || '',
            classNum: d.classNum || '',
            title: d.title || 'Untitled',
            teacher: d.teacher || '',
            assessmentId: d.assessmentId || '',
            name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '',
            rollNumber: String(student.rollNumber || ''),
            correct: r.correctCount || 0,
            wrong: r.wrongCount || 0,
            skipped: r.skippedCount || 0,
            totalMarks: r.totalMarks || 0,
            marks: r.totalEarned || 0,
            percentage: parseFloat(r.percentage) || 0,
            grade: r.grade || '-',
            timeTaken: d.timeTaken || 0,
            submittedAt: d.submittedAt,
          };
        });

        data.sort((a, b) => {
          const ta = a.submittedAt?.toDate?.() || new Date(0);
          const tb = b.submittedAt?.toDate?.() || new Date(0);
          return tb - ta;
        });
        setResults(data);
      } catch (err) {
        console.error('Error fetching results:', err);
      }
      setLoading(false);
    };
    fetchResults();
  }, [userId]);

  const filtered = useMemo(() => {
    let items = [...results];
    if (examTypeFilter !== 'All') items = items.filter(r => r.examType === examTypeFilter);
    if (subjectFilter !== 'All') items = items.filter(r => r.subject === subjectFilter);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        r.examType.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (sortConfig.key === 'submittedAt') {
        const ta = aVal?.toDate?.() || new Date(0);
        const tb = bVal?.toDate?.() || new Date(0);
        return sortConfig.direction === 'asc' ? ta - tb : tb - ta;
      }
      return sortConfig.direction === 'asc' ? (aVal || 0) - (bVal || 0) : (bVal || 0) - (aVal || 0);
    });
    return items;
  }, [results, examTypeFilter, subjectFilter, search, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ columnKey }) => (
    <span className="opacity-50 ml-1">{sortConfig.key === columnKey ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  const subjects = useMemo(() => {
    const set = new Set(results.map(r => r.subject).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [results]);

  const examTypes = useMemo(() => {
    const set = new Set(results.map(r => r.examType).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [results]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-white mb-4">My Results</h2>
        <div className="text-center py-16 bg-[#282843] rounded-xl border border-white/10">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 mb-2">No results yet</p>
          <p className="text-sm text-gray-500">Complete an assessment to see your results here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">My Results</h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search by title, subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#282843] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-sm">&times;</button>
          )}
        </div>
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#282843] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
        >
          {subjects.map(s => <option key={s} value={s}>{s === 'All' ? 'All Subjects' : s}</option>)}
        </select>
        <select
          value={examTypeFilter}
          onChange={e => setExamTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-[#282843] border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
        >
          {examTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#282843] rounded-xl border border-white/10">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-400">No results match your filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-[#1e1e38] border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>Title <SortIcon columnKey="title" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('subject')}>Subject <SortIcon columnKey="subject" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('examType')}>Type <SortIcon columnKey="examType" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('correct')}>Correct <SortIcon columnKey="correct" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('wrong')}>Wrong <SortIcon columnKey="wrong" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('marks')}>Marks <SortIcon columnKey="marks" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('percentage')}>% <SortIcon columnKey="percentage" /></th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">Grade</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white" onClick={() => handleSort('submittedAt')}>Submitted <SortIcon columnKey="submittedAt" /></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => {
                const ts = row.submittedAt?.toDate?.() || new Date(0);
                const isCoding = row.type === 'coding';
                return (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3 text-sm text-white">{row.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{row.subject || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isCoding ? 'bg-blue-500/20 text-blue-300' :
                        row.examType === 'Timed Assessment' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>{row.examType || (isCoding ? 'Coding' : 'MCQ')}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{row.classNum || '-'}</td>
                    <td className="px-4 py-3 text-sm text-emerald-400">{row.correct}</td>
                    <td className="px-4 py-3 text-sm text-red-400">{row.wrong}</td>
                    <td className="px-4 py-3 text-sm text-white">{row.marks?.toFixed?.(1) || row.marks || 0}/{row.totalMarks || '-'}</td>
                    <td className="px-4 py-3 text-sm"><span className={row.percentage >= 40 ? 'text-emerald-400' : 'text-red-400'}>{row.percentage}%</span></td>
                    <td className="px-4 py-3 text-sm text-gray-400">{row.grade || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ts.toLocaleDateString()} {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
