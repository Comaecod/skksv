import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CustomSelect from '../CustomSelect';
import DataTable from '../DataTable';
import ConfirmModal from '../ConfirmModal';
import { counsellingService } from '../../services/counsellingService';
import {
  SESSION_TYPE_LABELS, CONCERN_LEVEL_LABELS, CONCERN_STYLES,
  formatDate, exportSessions, Chip,
} from './counsellingUI';

const TYPE_OPTIONS = Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => ({ value, label }));
const CONCERN_FILTER_OPTIONS = ['none', 'low', 'medium', 'high'].map((v) => ({ value: v, label: CONCERN_LEVEL_LABELS[v] }));
const CLASS_FILTER_OPTIONS = ['4', '5', '6', '7', '8', '9', '10'].map((v) => ({ value: v, label: `Class ${v}` }));

export default function CounsellingSessionsList() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [concernFilter, setConcernFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const [showDetailedConfirm, setShowDetailedConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      setSessions(await counsellingService.getAllSessions());
      setError('');
    } catch (err) {
      setError(err.message || 'Could not load sessions');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const months = useMemo(() => {
    const set = new Set();
    sessions.forEach((s) => { if (s.date) set.add(s.date.slice(0, 7)); });
    return [...set].sort().reverse().map((m) => {
      const [y, mm] = m.split('-');
      const name = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(mm) - 1];
      return { value: m, label: `${name} ${y}` };
    });
  }, [sessions]);

  const sections = useMemo(() => {
    if (!classFilter) return [];
    return [...new Set(sessions.filter((s) => (s.student?.studentClass || '') === classFilter && s.student?.section).map((s) => s.student.section))].sort();
  }, [sessions, classFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = sessions.filter((s) => {
      if (classFilter && (s.student?.studentClass || '') !== classFilter) return false;
      if (sectionFilter && (s.student?.section || '') !== sectionFilter) return false;
      if (typeFilter && s.sessionType !== typeFilter) return false;
      if (concernFilter && s.concernLevel !== concernFilter) return false;
      if (monthFilter && (s.date || '').slice(0, 7) !== monthFilter) return false;
      if (q && !`${s.student?.name || ''} ${s.student?.userId || ''}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    const val = (r) => {
      if (sortKey === 'date') return r.date || '';
      if (sortKey === 'name') return r.student?.name || '';
      if (sortKey === 'concern') return ['none', 'low', 'medium', 'high'].indexOf(r.concernLevel || 'none');
      if (sortKey === 'type') return SESSION_TYPE_LABELS[r.sessionType] || '';
      return '';
    };
    return [...rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      if (va === vb) return (r.date || '').localeCompare(b.date || '') * dir; // eslint-disable-line no-nested-ternary
      return typeof va === 'number' ? (va - vb) * dir : String(va).localeCompare(String(vb)) * dir;
    });
  }, [sessions, search, classFilter, sectionFilter, typeFilter, concernFilter, monthFilter, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const doExport = async (detailed) => {
    setExporting(true);
    try {
      await exportSessions(filtered, detailed);
    } catch (err) {
      setError(err.message || 'Export failed');
    }
    setExporting(false);
    setShowDetailedConfirm(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await counsellingService.deleteSession(showDeleteConfirm.id, { uid: '', name: '' });
      setShowDeleteConfirm(null);
      loadSessions();
    } catch (err) {
      setError(err.message || 'Could not delete session');
    }
    setDeleting(false);
  };

  return (
    <div className="animate-slideUp space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Counselling Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filtered.length} session{filtered.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => doExport(false)} disabled={exporting || filtered.length === 0} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50">
            {exporting ? 'Exporting...' : '⬇ Export Standard'}
          </button>
          <button onClick={() => setShowDetailedConfirm(true)} disabled={filtered.length === 0} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-50">
            ⬇ Export Detailed
          </button>
          <Link to="/dashboard/counselling/sessions/new" className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">+ New Session</Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-all"
        />
        <CustomSelect value={classFilter} onChange={(v) => { setClassFilter(v); setSectionFilter(''); }} options={[{ value: '', label: 'All Classes' }, ...CLASS_FILTER_OPTIONS]} className="min-w-[130px]" />
        <CustomSelect value={sectionFilter} onChange={setSectionFilter} options={[{ value: '', label: 'All Sections' }, ...sections.map((s) => ({ value: s, label: `Section ${s}` }))]} className="min-w-[130px]" disabled={!classFilter} />
        <CustomSelect value={typeFilter} onChange={setTypeFilter} options={[{ value: '', label: 'All Types' }, ...TYPE_OPTIONS]} className="min-w-[150px]" />
        <CustomSelect value={concernFilter} onChange={setConcernFilter} options={[{ value: '', label: 'All Concern Levels' }, ...CONCERN_FILTER_OPTIONS]} className="min-w-[160px]" />
        <CustomSelect value={monthFilter} onChange={setMonthFilter} options={[{ value: '', label: 'All Months' }, ...months]} className="min-w-[130px]" />
      </div>

      <DataTable
        columns={[
          {
            key: 'date', label: 'Date', sortable: true,
            render: (s) => <span className="text-gray-900 dark:text-white font-medium">{formatDate(s.date)}</span>,
          },
          {
            key: 'name', label: 'Student', sortable: true,
            render: (s) => (
              <div>
                <span className="text-gray-900 dark:text-white font-medium">{s.student?.name || '—'}</span>
                <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">· Class {s.student?.studentClass || s.classNum || '—'}{s.student?.section ? `-${s.student.section}` : ''}</span>
              </div>
            ),
          },
          {
            key: 'type', label: 'Type', sortable: true,
            render: (s) => <span className="text-gray-600 dark:text-gray-300">{SESSION_TYPE_LABELS[s.sessionType] || s.sessionType || '—'}</span>,
          },
          {
            key: 'concern', label: 'Concern', sortable: true,
            render: (s) => (
              <div className="flex items-center gap-2">
                <Chip label={CONCERN_LEVEL_LABELS[s.concernLevel] || 'none'} className={CONCERN_STYLES[s.concernLevel] || CONCERN_STYLES.none} />
                {s.safeguards?.flag && <span title="Safeguarding flag">🚩</span>}
              </div>
            ),
          },
          {
            key: 'areas', label: 'Areas',
            render: (s) => <span className="text-gray-500 dark:text-gray-400 text-xs">{(s.concernCategories || []).slice(0, 2).join(', ') || '—'}</span>,
          },
          {
            key: 'followUp', label: 'Follow-up',
            render: (s) => s.followUp?.required ? (
              <div>
                <span className="text-gray-700 dark:text-gray-300 text-sm">{formatDate(s.followUp.date)}</span>
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${s.followUp.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>{s.followUp.status === 'completed' ? 'done' : 'pending'}</span>
              </div>
            ) : <span className="text-gray-400 dark:text-gray-500 text-sm">—</span>,
          },
          {
            key: 'actions', label: 'Actions', className: 'text-right',
            render: (s) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => navigate(`/dashboard/counselling/student/${s.student?.userId}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/20 transition-all">Profile</button>
                <button onClick={() => navigate(`/dashboard/counselling/sessions/edit/${s.id}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all">Edit</button>
                <button onClick={() => setShowDeleteConfirm(s)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-500/20 transition-all">Delete</button>
              </div>
            ),
          },
        ]}
        data={filtered}
        loading={loading}
        loadingMessage="Loading counselling records..."
        emptyMessage="No sessions match the current filters"
        rowKey="id"
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={handleSort}
      />

      <ConfirmModal
        isOpen={showDetailedConfirm}
        onClose={() => setShowDetailedConfirm(false)}
        onConfirm={() => doExport(true)}
        isLoading={exporting}
        title="Export detailed report?"
        description="The detailed export includes main concern, observations, action taken and recommendations. Please make sure student data is shared with authorised staff only."
        confirmText="Yes, export"
        confirmLoadingText="Exporting..."
        variant="primary"
      />

      <ConfirmModal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Delete this session?"
        description={`This will permanently delete the counselling record for ${showDeleteConfirm?.student?.name || 'this student'} on ${showDeleteConfirm ? formatDate(showDeleteConfirm.date) : ''}. This action cannot be undone.`}
        confirmText="Delete record"
        confirmLoadingText="Deleting..."
        variant="danger"
      />
    </div>
  );
}