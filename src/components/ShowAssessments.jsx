import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMasterKey } from '../utils/auth';

const CATEGORY_ICONS = {
  'Slip Test': '📝',
  'Unit Test 1': '📖',
  'Unit Test 2': '📖',
  'Term 1': '📚',
  'Term 2': '📚',
  'Bridge Course': '🌉',
  'Timed Assessment': '⏱️',
  'Holiday Homework': '🏖️'
};

const TYPE_COLORS = {
  'Slip Test': 'border-blue-500/30 bg-blue-500/5',
  'Unit Test 1': 'border-green-500/30 bg-green-500/5',
  'Unit Test 2': 'border-teal-500/30 bg-teal-500/5',
  'Term 1': 'border-purple-500/30 bg-purple-500/5',
  'Term 2': 'border-fuchsia-500/30 bg-fuchsia-500/5',
  'Bridge Course': 'border-amber-500/30 bg-amber-500/5',
  'Timed Assessment': 'border-cyan-500/30 bg-cyan-500/5',
  'Holiday Homework': 'border-rose-500/30 bg-rose-500/5'
};

const ShowAssessments = ({ skipInitialAuth } = {}) => {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(skipInitialAuth || false);
  const [passwordError, setPasswordError] = useState(false);

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [editMode, setEditMode] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

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
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      setAssessments(items);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (skipInitialAuth) {
      fetchAll();
    }
  }, [skipInitialAuth, fetchAll]);

  const grouped = getAllGrouped();

  function getAllGrouped() {
    const all = assessments.map(e => ({ ...e, category: e.examType || 'Unknown' }));
    const grouped = {};
    all.forEach(item => {
      const cat = item.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });
    Object.keys(grouped).forEach(k => grouped[k].sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))));
    return grouped;
  }

  const categories = Object.keys(grouped).sort();

  const filtered = activeCategory === 'all'
    ? Object.entries(grouped)
    : [[activeCategory, grouped[activeCategory] || []]];

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

  const handleEdit = (item) => {
    setEditMode(item.id);
    setEditContent(JSON.stringify(item, null, 2));
    setExpandedId(item.id);
  };

  const handleSaveEdit = async (item) => {
    setSaving(true);
    try {
      const parsed = JSON.parse(editContent);
      const { db } = await import('../firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'examConfigs', item.id), parsed);
      setStatus(`Updated "${parsed.title || item.id}"`);
      setEditMode(null);
      fetchAll();
    } catch (err) {
      setStatus(`Save failed: ${err.message}`);
    }
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditContent('');
  };

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
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card p-8 text-center w-full max-w-md">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading assessments...</p>
        </div>
      </div>
    );
  }

  const totalCount = categories.reduce((sum, c) => sum + grouped[c].length, 0);

  return (
    <div className="w-full px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="glass-card p-6 sm:p-8 animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">All Assessments</h2>
            <p className="text-gray-500 dark:text-gray-400">{totalCount} assessments across {categories.length} categories</p>
          </div>

          {status && (
            <div className={`mb-6 p-4 rounded-xl text-sm ${status.startsWith('Deleted') || status.startsWith('Save failed') || status.startsWith('Delete failed') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-green-500/10 border border-green-500/20 text-green-400'}`}>
              {status}
              <button className="ml-3 text-xs underline" onClick={() => setStatus('')}>Dismiss</button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="flex-1">
              <input type="text" className="w-full px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-primary/50 text-sm" placeholder="Search assessments..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === 'all' ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'}`} onClick={() => setActiveCategory('all')}>All ({totalCount})</button>
              {categories.map(cat => (
                <button key={cat} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeCategory === cat ? 'bg-primary text-white' : 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'}`} onClick={() => setActiveCategory(cat)}>
                  {CATEGORY_ICONS[cat] || '📋'} {cat} ({grouped[cat].length})
                </button>
              ))}
              <button className="px-3 py-2 rounded-xl text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30" onClick={() => navigate('/dashboard/assessments/new')}>+ New</button>
              <button className="px-3 py-2 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30" onClick={fetchAll}>🔄 Refresh</button>
            </div>
          </div>

          {filtered.length === 0 || filtered.every(([, items]) => items.length === 0) ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-gray-500 dark:text-gray-400">No assessments found</p>
            </div>
          ) : (
            <div className="space-y-8">
              {filtered.map(([category, items]) => {
                if (!items || items.length === 0) return null;
                const filteredItems = searchQuery
                  ? items.filter(i =>
                      (i.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (i.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                      String(i.classNum || '').includes(searchQuery)
                    )
                  : items;
                if (filteredItems.length === 0) return null;

                return (
                  <div key={category}>
                    <div className={`p-4 rounded-xl border mb-4 ${TYPE_COLORS[category] || 'border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{CATEGORY_ICONS[category] || '📋'}</span>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{category}</h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{filteredItems.length} assessment{filteredItems.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {filteredItems.map(item => {
                        const isExpanded = expandedId === item.id;
                        const isEditing = editMode === item.id;
                        const isConfirmingDelete = confirmDelete === item.id;
                        const key = item.id;

                        return (
                          <div key={key} className="rounded-xl border border-gray-200 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden transition-all">
                            <div className="p-4">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 dark:text-white">{item.title || item.id}</div>
                                  <div className="flex gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                    {item.subject && <span>{item.subject}</span>}
                                    {item.teacher && <span>Teacher: {item.teacher}</span>}
                                    {item.examType && (
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${item.examType === 'Timed Assessment' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                        {item.examType === 'Timed Assessment' ? '⏱️ Timed' : '📋 Standard'}
                                      </span>
                                    )}
                                    {item.assessmentFormat && (
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                                        item.assessmentFormat === 'mcq' ? 'bg-purple-500/20 text-purple-400' :
                                        item.assessmentFormat === 'project' ? 'bg-orange-500/20 text-orange-400' :
                                        'bg-green-500/20 text-green-400'
                                      }`}>
                                        {item.assessmentFormat === 'mcq' ? 'MCQ' : item.assessmentFormat === 'project' ? 'Project' : 'Coding'}
                                      </span>
                                    )}
                                    {item.enabled === false && (
                                      <span className="text-red-400 font-medium">Disabled</span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 text-sm" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                                    {isExpanded ? '▲' : '▼'}
                                  </button>
                                  <button className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 text-sm" onClick={() => handleEdit(item)}>✏️</button>
                                  <button className={`p-2 rounded-lg text-sm ${isConfirmingDelete ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-red-500/20 text-red-400'}`} onClick={() => handleDelete(item)}>
                                    {isConfirmingDelete ? '⚠️' : '🗑️'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {isExpanded && !isEditing && (
                              <div className="border-t border-gray-200 dark:border-white/10 p-4">
                                <pre className="text-xs text-gray-900 dark:text-white font-mono overflow-auto max-h-96 whitespace-pre-wrap bg-black/10 dark:bg-white/5 rounded-lg p-3">{JSON.stringify(item, null, 2)}</pre>
                              </div>
                            )}

                            {isEditing && (
                              <div className="border-t border-gray-200 dark:border-white/10 p-4">
                                <textarea className="w-full h-64 px-4 py-3 rounded-xl bg-black/10 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono text-xs resize-none outline-none focus:border-primary/50" value={editContent} onChange={e => setEditContent(e.target.value)} />
                                <div className="flex gap-3 mt-3">
                                  <button className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 disabled:opacity-50" onClick={() => handleSaveEdit(item)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                                  <button className="px-4 py-2 rounded-xl text-sm font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20" onClick={cancelEdit}>Cancel</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <button className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={() => navigate(skipInitialAuth ? '/dashboard' : '/')}>← Back to Home</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowAssessments;
