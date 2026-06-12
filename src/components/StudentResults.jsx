import { useState, useEffect } from 'react';
import { useAuth } from '../auth/contexts/AuthContext';

function DetailModal({ result, onClose }) {
  if (!result) return null;
  const isCoding = result.type === 'coding';
  const ts = result.timestamp?.toDate?.() || new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-[#1e1e38] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#1e1e38] border-b border-white/10 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">{result.examTitle || 'Untitled'}</h3>
            <p className="text-sm text-gray-400">
              {result.className && `Class ${result.className}`}{result.subject ? ` — ${result.subject}` : ''}
              {result.examType ? ` — ${result.examType}` : ''}
              {isCoding && ' — CODING'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xl leading-none">&times;</button>
        </div>

        <div className="p-5 space-y-5">
          {/* Score summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{result.results?.percentage?.toFixed(1) || '0'}%</p>
              <p className="text-xs text-gray-400 mt-1">Percentage</p>
            </div>
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{result.results?.correctCount || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Correct</p>
            </div>
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-red-400">{result.results?.wrongCount || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Wrong</p>
            </div>
            <div className="bg-[#282843] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-400">{result.results?.skippedCount || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Skipped</p>
            </div>
          </div>

          <div className="text-xs text-gray-500 text-center">
            Submitted: {ts.toLocaleDateString()} {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {result.results?.grade && <span> &middot; Grade: {result.results.grade}</span>}
          </div>

          {/* Coding detail */}
          {isCoding && result._raw?.code && (
            <>
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">Code Submitted</h4>
                <pre className="bg-[#0d0d1f] rounded-xl p-4 text-sm text-gray-300 overflow-x-auto font-mono whitespace-pre-wrap max-h-80 overflow-y-auto border border-white/5">{result._raw.code}</pre>
              </div>
              {result._raw.testResults?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-white mb-2">Test Results ({result.results?.correctCount || 0}/{result._raw.testResults.length} passed)</h4>
                  <div className="space-y-2">
                    {result._raw.testResults.map((tr, i) => (
                      <div key={i} className={`rounded-xl p-3 flex items-center gap-3 border ${tr.passed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <span className={`text-lg ${tr.passed ? 'text-emerald-400' : 'text-red-400'}`}>{tr.passed ? '✓' : '✗'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{tr.name || `Test Case ${i + 1}`}</p>
                          {tr.input !== undefined && <p className="text-xs text-gray-400 truncate">Input: {String(tr.input).substring(0, 80)}</p>}
                          {tr.expected !== undefined && <p className="text-xs text-gray-400 truncate">Expected: {String(tr.expected).substring(0, 80)}</p>}
                          {tr.output !== undefined && <p className="text-xs text-gray-400 truncate">Output: {String(tr.output).substring(0, 80)}</p>}
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

export default function StudentResults() {
  const { userProfile: authUser } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const userId = authUser?.id || authUser?.uid;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const fetchResults = async () => {
      try {
        const { db } = await import('../firebase');
        const { collection, getDocs, query, where, orderBy } = await import('firebase/firestore');

        const quizQ = query(
          collection(db, 'quizResults'),
          where('userId', '==', userId),
          orderBy('timestamp', 'desc')
        );
        const [quizSnap, codingSnap] = await Promise.all([
          getDocs(quizQ),
          getDocs(query(
            collection(db, 'submissions'),
            where('type', '==', 'coding'),
            where('student.userId', '==', userId),
            orderBy('submittedAt', 'desc')
          ))
        ]);

        const quizData = quizSnap.docs.map(doc => ({
          id: doc.id,
          type: 'quiz',
          ...doc.data()
        }));
        const codingData = codingSnap.docs.map(doc => {
          const d = doc.data();
          const score = d.score || 0;
          const total = d.total || 0;
          return {
            id: doc.id,
            type: 'coding',
            _raw: d,
            userId: d.student?.userId,
            examTitle: d.title || 'Coding Assessment',
            className: d.examKey?.split('_')[1] || '',
            subject: d.subject || '',
            examType: d.examType || '',
            timestamp: d.submittedAt,
            results: {
              percentage: total > 0 ? (score / total) * 100 : 0,
              correctCount: score,
              wrongCount: total - score,
              skippedCount: 0,
              grade: '',
            },
          };
        });

        const merged = [...quizData, ...codingData].sort((a, b) => {
          const ta = a.timestamp?.toDate?.() || new Date(0);
          const tb = b.timestamp?.toDate?.() || new Date(0);
          return tb - ta;
        });
        setResults(merged);
      } catch (err) {
        console.error('Error fetching results:', err);
      }
      setLoading(false);
    };
    fetchResults();
  }, [userId]);

  const filtered = results.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.examTitle || '').toLowerCase().includes(q)
      || (r.subject || '').toLowerCase().includes(q)
      || (r.examType || '').toLowerCase().includes(q)
      || (r.className || '').toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-white mb-4">My Results</h2>

      {results.length > 0 && (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by title, subject, exam type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#282843] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-all text-sm">&times;</button>
          )}
        </div>
      )}

      {results.length === 0 ? (
        <div className="text-center py-16 bg-[#282843] rounded-xl border border-white/10">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400 mb-2">No results yet</p>
          <p className="text-sm text-gray-500">Complete an assessment to see your results here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#282843] rounded-xl border border-white/10">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-400">No results match your search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const ts = r.timestamp?.toDate?.() || new Date();
            const isCoding = r.type === 'coding';
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => setSelected(r)}
                className="w-full text-left bg-[#282843] border border-white/10 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-primary/40 hover:bg-[#2e2e4a] transition-all cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{r.examTitle || 'Untitled'}</p>
                    {isCoding && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium shrink-0">CODING</span>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.className && `Class ${r.className}`}{r.subject ? ` — ${r.subject}` : ''}
                    {r.examType ? ` — ${r.examType}` : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{ts.toLocaleDateString()} {ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-lg font-bold ${(r.results?.percentage || 0) >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {r.results?.percentage?.toFixed(1) || '0'}%
                  </p>
                  <p className="text-xs text-gray-400">{r.results?.correctCount || 0}/{r.results?.correctCount + r.results?.wrongCount + r.results?.skippedCount || 0} correct</p>
                  {r.results?.grade && <p className="text-xs text-gray-500 mt-0.5">Grade: {r.results.grade}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && <DetailModal result={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
