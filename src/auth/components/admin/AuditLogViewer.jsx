import { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';
import CustomSelect from '../../../components/CustomSelect';
import DataTable from '../../../components/DataTable';

function DetailModal({ log, onClose }) {
  if (!log) return null;
  const m = log.metadata || {};
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-white dark:bg-[#1e1e38] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-[#1e1e38] border-b border-gray-200 dark:border-white/10 p-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{log.action.replace(/_/g, ' ')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{log.userEmail || log.userId || 'Unknown'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all text-xl leading-none">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
              <span className="text-sm text-gray-500 dark:text-gray-400">Action</span>
              <span className="text-sm text-gray-900 dark:text-white font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
              <span className="text-sm text-gray-500 dark:text-gray-400">Timestamp</span>
              <span className="text-sm text-gray-900 dark:text-white">{log.timestamp?.toDate?.().toLocaleString() || new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
              <span className="text-sm text-gray-500 dark:text-gray-400">Performed By</span>
              <span className="text-sm text-gray-900 dark:text-white">{log.userEmail || log.userId || '—'}</span>
            </div>
            {m.targetEmail && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Target Email</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.targetEmail}</span>
              </div>
            )}
            {m.targetName && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Student Name</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.targetName}</span>
              </div>
            )}
            {m.studentName && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Student Name</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.studentName}</span>
              </div>
            )}
            {m.title && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Assessment</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.title}</span>
              </div>
            )}
            {m.subject && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Subject</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.subject}</span>
              </div>
            )}
            {m.classNum && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Class</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.classNum}</span>
              </div>
            )}
            {m.targetRole && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Role</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">{m.targetRole}</span>
              </div>
            )}
            {m.type && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Submission Type</span>
                <span className="text-sm text-gray-900 dark:text-white uppercase">{m.type}</span>
              </div>
            )}
            {m.method && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Method</span>
                <span className="text-sm text-gray-900 dark:text-white">{m.method}</span>
              </div>
            )}
            {m.assessmentId && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Assessment ID</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono text-xs">{m.assessmentId}</span>
              </div>
            )}
            {m.targetId && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Target ID</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono text-xs">{m.targetId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const allLogs = await auditService.getLogs({ limit: 200 });
      setLogs(allLogs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (dateFrom || dateTo) {
      const ts = log.timestamp?.toDate?.() || new Date(log.timestamp);
      if (dateFrom && ts < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setDate(end.getDate() + 1);
        if (ts >= end) return false;
      }
    }
    return true;
  });

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    if (ts?.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  };

  const logColumns = [
    { key: 'timestamp', label: 'Timestamp', render: (log) => <span className="text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatTimestamp(log.timestamp)}</span> },
    { key: 'action', label: 'Action', render: (log) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">{log.action}</span> },
    { key: 'user', label: 'User', render: (log) => <span className="text-gray-900 dark:text-white">{log.userEmail || log.userId || '—'}</span> },
  ];

  return (
    <div className="animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            System activity and change tracking
          </p>
        </div>
        <button onClick={loadLogs} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">Refresh</button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <CustomSelect
          value={actionFilter}
          onChange={setActionFilter}
          options={[
            { value: '', label: 'All Actions' },
            ...uniqueActions.map((a) => ({ value: a, label: a })),
          ]}
          className="min-w-[160px]"
        />
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">From</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">To</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-[#282843] border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary/50 transition-all" />
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 self-center whitespace-nowrap">{filteredLogs.length} result{filteredLogs.length !== 1 ? 's' : ''}</span>
      </div>

      <DataTable
        columns={logColumns}
        data={filteredLogs}
        loading={loading}
        loadingMessage="Loading logs..."
        emptyMessage="No logs found"
        rowKey="id"
        onRowClick={(log) => setSelectedLog(log)}
      />

      {selectedLog && <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </div>
  );
}
