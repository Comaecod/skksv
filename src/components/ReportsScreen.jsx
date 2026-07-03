import { useState, useMemo, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/contexts/AuthContext';
import { validateTeacherKey } from '../utils/auth';
import { downloadReportAsExcel } from '../utils/excelExport';
import { getSubmissionsForAssessment } from '../services/timedAssessmentService';

const ReportsScreen = ({ config: propConfig, assessmentId: propAssessmentId, assessment: propAssessment, onBack: propOnBack }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = propConfig || location.state?.config;
  const assessmentId = propAssessmentId || location.state?.assessmentId || '';
  const assessment = propAssessment || location.state?.assessment || null;
  const onBack = propOnBack || (() => navigate(-1));
  
  const [secretKey, setSecretKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noData, setNoData] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });
  const { user } = useAuth();

  const hasSecretKey = config?.teacherSecretKey?.length > 0 || config?.preassessmentsecretkey?.length > 0;
  const title = assessment?.title || config?.examTitle || location.state?.assessment?.title || '';

  // Auto-unlock if the logged-in user created this assessment
  useEffect(() => {
    const creatorId = config?.createdBy || assessment?.createdBy;
    if (creatorId && user && creatorId === user.uid) {
      setIsUnlocked(true);
      fetchReportData();
    }
  }, [config, assessment, user]);

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (validateTeacherKey(secretKey, config || assessment)) {
      setIsUnlocked(true);
      setKeyError(false);
      fetchReportData();
    } else {
      setKeyError(true);
    }
  };

  const handleKeyChange = (e) => {
    setSecretKey(e.target.value);
    if (keyError) setKeyError(false);
  };

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setNoData(false);
    try {
      if (assessmentId) {
        const data = await getSubmissionsForAssessment(assessmentId);
        setReportData(data);
        if (data.length === 0) setNoData(true);
      } else if (config) {
        const { db } = await import('../firebase');
        const { collection, getDocs, query, where } = await import('firebase/firestore');
        const q = query(
          collection(db, 'submissions'),
          where('classNum', '==', config.className || config.classNum),
          where('title', '==', config.examTitle || config.title),
          where('teacher', '==', config.teacher),
          where('type', 'in', ['mcq', 'project'])
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const student = d.student || d.studentInfo || {};
          const results = d.results || {};
          return {
            id: doc.id,
            type: d.type || 'mcq',
            name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
            rollNumber: String(student.rollNumber || ''),
            correct: results.correctCount || 0,
            wrong: results.wrongCount || 0,
            skipped: results.skippedCount || 0,
            marks: results.totalEarned || 0,
            percentage: parseFloat(results.percentage) || 0,
            grade: results.grade || '-',
            score: d.score || 0,
            total: d.total || 0,
            topic: d.projectData?.topic || d.topic || '',
            fileUrl: d.fileUrl || '',
            submittedAt: d.submittedAt,
            submittedTime: d.submittedAt?.toDate?.()?.toLocaleString() || '-',
          };
        });
        setReportData(data);
        if (data.length === 0) setNoData(true);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReportData([]);
      setNoData(true);
    }
    setLoading(false);
  }, [config, assessmentId]);

  const handleExportExcel = () => {
    if (sortedData.length === 0) return;
    downloadReportAsExcel(sortedData, config || { examTitle: title, classNum: reportData[0]?.classNum || '', subject: reportData[0]?.subject || '', teacher: '' });
  };

  const sortedData = useMemo(() => {
    if (!reportData.length) return [];
    return [...reportData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (typeof aVal === 'string') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      const aTime = aVal?.getTime?.() || Number(aVal) || 0;
      const bTime = bVal?.getTime?.() || Number(bVal) || 0;
      return sortConfig.direction === 'asc' ? aTime - bTime : bTime - aTime;
    });
  }, [reportData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const SortIcon = ({ columnKey }) => (
    <span className="opacity-50 ml-1">{sortConfig.key === columnKey ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
  );

  const isMcq = sortedData.length > 0 && sortedData[0].type !== 'coding' && (sortedData[0].type === 'mcq' || sortedData[0].correct !== undefined);

  if (config && !hasSecretKey && !assessmentId) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card w-full max-w-md animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reports</h2>
            <p className="text-gray-500 dark:text-gray-400">Teacher secret key not configured</p>
          </div>
          <div className="text-center">
            <button className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="w-full flex items-center justify-center px-4 py-8">
        <div className="glass-card w-full max-w-md animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {assessmentId ? 'Assessment Reports' : 'Teacher Reports'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {assessmentId ? `Enter teacher key to view reports` : 'Enter teacher secret key to view reports'}
            </p>
            {title && <p className="text-sm text-gray-400 mt-2">{title}</p>}
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-4">
            {assessmentId && !config && (
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 outline-none border-gray-200 dark:border-white/10 focus:border-primary/50"
                placeholder="Assessment ID"
                value={assessmentId}
                disabled
              />
            )}
            <input
              type="password"
              className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none ${keyError ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`}
              placeholder="Enter teacher secret key"
              value={secretKey}
              onChange={handleKeyChange}
              autoFocus
            />
            {keyError && (
              <p className="text-red-400 text-sm">⚠️ Incorrect secret key</p>
            )}
            <button type="submit" className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">
              View Reports 🔓
            </button>
            <button type="button" className="w-full px-6 py-3 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20" onClick={onBack}>
              ← Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl">
        <div className="glass-card animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {title || (config ? `${config.examType} - Class ${config.classNum}` : 'Reports')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {config ? `${config.subject} | ${config.teacher}` : (reportData[0]?.subject || '')}
            </p>
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
                  <button className="px-4 py-2 rounded-xl font-medium bg-green-100 dark:bg-green-600/30 border border-green-300 dark:border-green-600/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600/40 flex items-center gap-2" onClick={handleExportExcel}>
                    📥 Export Excel
                  </button>
                  <button className="px-4 py-2 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 flex items-center gap-2" onClick={fetchReportData}>
                    🔄 Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl bg-gray-100 dark:bg-black/20">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('name')}>Name <SortIcon columnKey="name" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('rollNumber')}>Roll No <SortIcon columnKey="rollNumber" /></th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                      {isMcq ? (
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
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            row.type === 'coding' ? 'bg-green-500/20 text-green-400' :
                            row.type === 'project' || !isMcq ? 'bg-orange-500/20 text-orange-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {row.type === 'coding' ? 'Coding' : row.type === 'project' || !isMcq ? 'Project' : 'MCQ'}
                          </span>
                        </td>
                        {isMcq ? (
                          <>
                            <td className="px-4 py-3 text-sm text-green-400">{row.correct || 0}</td>
                            <td className="px-4 py-3 text-sm text-red-400">{row.wrong || 0}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{row.marks?.toFixed?.(1) || row.marks || 0}</td>
                            <td className="px-4 py-3 text-sm">{row.percentage || 0}%</td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{row.topic || '-'}</td>
                            <td className="px-4 py-3 text-sm">{row.fileUrl ? <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View File</a> : '-'}</td>
                          </>
                        )}
                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{row.submittedTime || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          <div className="text-center mt-8">
            <button className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={onBack}>
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsScreen;