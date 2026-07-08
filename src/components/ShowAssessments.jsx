import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMasterKey } from '../utils/auth';
import { subjectLabel } from '../utils/format';
import { useAuth } from '../auth/contexts/AuthContext';

const FORMAT_LABELS = { mcq: 'MCQ', project: 'Project', coding: 'Coding' };
const FORMAT_COLORS = { mcq: 'bg-purple-500/20 text-purple-400', project: 'bg-orange-500/20 text-orange-400', coding: 'bg-green-500/20 text-green-400' };

function SortIcon({ active, direction }) {
  return <span className="inline-block ml-1 text-[10px]">{active ? (direction === 'asc' ? '▲' : '▼') : '⇅'}</span>;
}

const SORTABLE_COLUMNS = [
  { key: 'title', label: 'Title' },
  { key: 'subject', label: 'Subject' },
  { key: 'classNum', label: 'Class' },
  { key: 'assessmentFormat', label: 'Format' },
  { key: 'teacher', label: 'Teacher' },
  { key: 'enabled', label: 'Status' },
];

const ShowAssessments = ({ skipInitialAuth } = {}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(skipInitialAuth || false);
  const [passwordError, setPasswordError] = useState(false);

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [status, setStatus] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (isMasterKey(password)) {
      setIsAuthorized(true);
      setPasswordError(false);
      fetchAll();
    } else {
      setPasswordError(true);
    }
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs } = await import('firebase/firestore');
      const snap = await getDocs(collection(db, 'examConfigs'));
      setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (skipInitialAuth) fetchAll();
  }, [skipInitialAuth, fetchAll]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleDelete = async (item) => {
    if (confirmDelete !== item.id) { setConfirmDelete(item.id); return; }
    setConfirmDelete(null);
    try {
      const { db } = await import('../firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'examConfigs', item.id));
      setStatus(`Deleted "${item.title || item.id}"`);
      fetchAll();
    } catch (err) {
      setStatus(`Delete failed: ${err.message}`);
    }
  };

  const handleEdit = (item) => navigate(`/dashboard/assessments/edit/${item.id}`);

  const filtered = [...assessments]
    .filter(item => {
      if (userProfile && userProfile.role !== 'super_admin' && userProfile.role !== 'admin') {
        if (item.createdBy !== userProfile.id) return false;
      }
      if (!search) return true;
      const q = search.toLowerCase();
      return (item.title || '').toLowerCase().includes(q)
        || String(item.subject || '').toLowerCase().includes(q)
        || String(item.classNum || '').includes(q)
        || (item.teacher || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey];
      if (sortKey === 'classNum') { va = String(va || '').padStart(10, '0'); vb = String(vb || '').padStart(10, '0'); }
      else if (sortKey === 'subject') { va = subjectLabel(va) || ''; vb = subjectLabel(vb) || ''; }
      else if (sortKey === 'enabled') { va = va === false ? 0 : 1; vb = vb === false ? 0 : 1; }
      else { va = String(va || '').toLowerCase(); vb = String(vb || '').toLowerCase(); }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  if (!isAuthorized) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card w-full max-w-md animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Access</h2>
            <p className="text-gray-500 dark:text-gray-400">Enter admin password to manage assessments</p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input type="password" className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none ${passwordError ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`} placeholder="Enter admin password" value={password} onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(false); }} autoFocus />
            {passwordError && <p className="text-red-400 text-sm">⚠️ Incorrect password</p>}
            <button type="submit" className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">View Assessments 🔓</button>
            <button type="button" className="w-full px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20" onClick={() => navigate('/')}>← Back to Home</button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">All Assessments</h2>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30" onClick={() => navigate('/dashboard/assessments/new')}>+ New</button>
          <button className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30" onClick={fetchAll}>🔄 Refresh</button>
        </div>
      </div>

      {status && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${status.startsWith('Deleted') || status.startsWith('Delete failed') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
          {status} <button className="ml-3 text-xs underline" onClick={() => setStatus('')}>Dismiss</button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search assessments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#282843] border border-white/10 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
        />
        <span className="text-sm text-gray-400 self-center whitespace-nowrap">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#282843] rounded-xl border border-white/10">
          <div className="text-4xl mb-3">{assessments.length === 0 ? '📭' : '🔍'}</div>
          <p className="text-gray-400">{assessments.length === 0 ? 'No assessments found in database.' : 'No assessments match your filters.'}</p>
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
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isConfirming = confirmDelete === item.id;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/5 text-sm text-gray-300 cursor-pointer transition-colors"
                    onClick={() => navigate('/dashboard/assessments/view/' + item.id)}
                  >
                    <td className="px-4 py-3 text-white font-medium max-w-[240px] truncate" title={item.title}>{item.title || item.id}</td>
                    <td className="px-4 py-3">{subjectLabel(item.subject)}</td>
                    <td className="px-4 py-3">{item.classNum || '—'}</td>
                    <td className="px-4 py-3">
                      {item.assessmentFormat && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${FORMAT_COLORS[item.assessmentFormat] || 'bg-gray-500/20 text-gray-400'}`}>
                          {FORMAT_LABELS[item.assessmentFormat] || item.assessmentFormat}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.teacher || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${item.enabled === false ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {item.enabled === false ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30" onClick={(e) => { e.stopPropagation(); handleEdit(item); }}>Edit</button>
                        <button className={`px-2 py-1 rounded-lg text-xs font-medium ${isConfirming ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`} onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
                          {isConfirming ? 'Confirm?' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ShowAssessments;
