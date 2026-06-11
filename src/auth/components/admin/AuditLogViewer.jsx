import { useState, useEffect } from 'react';
import { auditService } from '../../services/auditService';

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

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

  const filteredLogs = actionFilter
    ? logs.filter((log) => log.action === actionFilter)
    : logs;

  const uniqueActions = [...new Set(logs.map((log) => log.action))];

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    if (ts?.toDate) return ts.toDate().toLocaleString();
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="animate-slideUp">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            System activity and change tracking
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white outline-none focus:border-primary/50 transition-all text-sm"
        >
          <option value="">All Actions</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>{action}</option>
          ))}
        </select>
        <button
          onClick={loadLogs}
          className="px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
        >
          Refresh
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary dark:text-primary-light">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <span className="text-gray-900 dark:text-white">
                          {log.metadata?.userEmail || log.userEmail || log.userId || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {log.metadata?.targetEmail || log.metadata?.targetRole || JSON.stringify(log.metadata).slice(0, 80) || '—'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
