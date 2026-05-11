import { useState, useMemo, useCallback } from 'react';
import { isMasterKey } from '../utils/auth';
import { getSubmissionsForAssessment, getAssessmentById } from '../services/timedAssessmentService';
import { downloadReportAsExcel } from '../utils/excelExport';

const TimedAssessmentReportsScreen = ({ assessmentId: propId, assessment: propAssessment, reportData: propData, onBack: propOnBack }) => {
  const isEmbedded = !!propId;

  const [assessmentId, setAssessmentId] = useState(propId || '');
  const [secretKey, setSecretKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [reportData, setReportData] = useState(propData || []);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [assessmentTitle, setAssessmentTitle] = useState(propAssessment?.title || '');
  const [sortConfig, setSortConfig] = useState({ key: 'submittedAt', direction: 'desc' });

  const handleKeySubmit = async (e) => {
    e.preventDefault();
    const key = secretKey.trim();
    if (isMasterKey(key)) {
      setIsUnlocked(true);
      setKeyError(false);
      fetchReports();
      return;
    }
    try {
      const asm = propAssessment || await getAssessmentById(assessmentId.trim());
      if (asm && (key === asm.teacherSecretKey || key === asm.preassessmentsecretkey)) {
        setIsUnlocked(true);
        setKeyError(false);
        if (asm.title) setAssessmentTitle(asm.title);
        fetchReports();
      } else {
        setKeyError(true);
      }
    } catch {
      setKeyError(true);
    }
  };

  const fetchReports = useCallback(async () => {
    if (!assessmentId.trim()) return;
    setLoading(true);
    setNoData(false);
    try {
      const data = await getSubmissionsForAssessment(assessmentId.trim());
      setReportData(data);
      if (data.length === 0) setNoData(true);
    } catch {
      setReportData([]);
      setNoData(true);
    }
    setLoading(false);
  }, [assessmentId]);

  const sortedData = useMemo(() => {
    if (!reportData.length) return [];
    return [...reportData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (sortConfig.key === 'submittedAt') {
        const aTime = aVal?.getTime?.() || 0;
        const bTime = bVal?.getTime?.() || 0;
        return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
      }
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [reportData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleExportExcel = () => {
    if (sortedData.length === 0) return;
    const config = { examTitle: reportData[0]?.title || assessmentTitle || 'Timed Assessment', classNum: reportData[0]?.classNum || '', subject: reportData[0]?.subject || '', teacher: '' };
    downloadReportAsExcel(sortedData, config);
  };

  const SortIcon = ({ columnKey }) => (
    <span className="ml-1">{sortConfig.key === columnKey ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  if (!isUnlocked) {
    const title = assessmentTitle || 'Timed Assessment';
    return (
      <div className="glass-card w-full max-w-md animate-slideUp">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isEmbedded ? title : 'Timed Assessment Reports'}</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isEmbedded ? `Enter teacher key to view reports for "${title}"` : 'Enter assessment ID + teacher key to view reports'}
          </p>
        </div>
        <form onSubmit={handleKeySubmit} className="space-y-4">
          {!isEmbedded && (
            <input type="text" className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none border-gray-200 dark:border-white/10 focus:border-primary/50" placeholder="Assessment Document ID" value={assessmentId} onChange={e => setAssessmentId(e.target.value)} autoFocus />
          )}
          <input type="password" className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none ${keyError ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`} placeholder="Teacher Secret Key" value={secretKey} onChange={e => { setSecretKey(e.target.value); if (keyError) setKeyError(false); }} />
          {keyError && <p className="text-red-400 text-sm">⚠️ Incorrect key or assessment not found</p>}
          <button type="submit" className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">View Reports 🔓</button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl animate-slideUp">
      <div className="glass-card">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Timed Assessment Reports</h2>
          <p className="text-gray-500 dark:text-gray-400">Assessment: {assessmentTitle || reportData[0]?.title || assessmentId}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
          </div>
        ) : noData ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No submissions found for this assessment.</p>
          </div>
        ) : sortedData.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-green-500/20 border border-green-500/30 text-green-400">
                <span>👥</span><span>Total Submissions: {sortedData.length}</span>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-xl font-medium bg-green-100 dark:bg-green-600/30 border border-green-300 dark:border-green-600/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600/40 flex items-center gap-2" onClick={handleExportExcel}>📥 Export Excel</button>
                <button className="px-4 py-2 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 flex items-center gap-2" onClick={fetchReports}>🔄 Refresh</button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl bg-gray-100 dark:bg-black/20">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('name')}>Name <SortIcon columnKey="name" /></th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('rollNumber')}>Roll No <SortIcon columnKey="rollNumber" /></th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                    {sortedData[0]?.assessmentType === 'mcq' ? (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('correct')}>Correct <SortIcon columnKey="correct" /></th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('wrong')}>Wrong <SortIcon columnKey="wrong" /></th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('marks')}>Marks <SortIcon columnKey="marks" /></th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('percentage')}>% <SortIcon columnKey="percentage" /></th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Topic</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">File</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('submittedAt')}>Submitted <SortIcon columnKey="submittedAt" /></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedData.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{row.rollNumber}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${row.assessmentType === 'mcq' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {row.assessmentType === 'mcq' ? 'MCQ' : 'Project'}
                        </span>
                      </td>
                      {row.assessmentType === 'mcq' ? (
                        <>
                          <td className="px-4 py-3 text-sm text-green-400">{row.results?.correctCount || 0}</td>
                          <td className="px-4 py-3 text-sm text-red-400">{row.results?.wrongCount || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.results?.totalEarned?.toFixed?.(1) || row.results?.totalEarned || 0}/{row.results?.totalMarks || 0}</td>
                          <td className="px-4 py-3 text-sm">{row.results?.percentage || 0}%</td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{row.topic || '-'}</td>
                          <td className="px-4 py-3 text-sm">{row.fileUrl ? <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View File</a> : '-'}</td>
                        </>
                      )}
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{row.submittedTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        <div className="text-center mt-8">
          <button className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={propOnBack || (() => window.history.back())}>← Back</button>
        </div>
      </div>
    </div>
  );
};

export default TimedAssessmentReportsScreen;
