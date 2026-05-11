import { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { validateTeacherKey } from '../utils/auth';
import { downloadReportAsExcel } from '../utils/excelExport';

const ReportsScreen = ({ config: propConfig, onBack: propOnBack }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const config = propConfig || location.state?.config;
  const onBack = propOnBack || (() => navigate(-1));
  
  const [secretKey, setSecretKey] = useState('');
  const [keyError, setKeyError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'percentage', direction: 'desc' });

  const hasSecretKey = config?.teacherSecretKey?.length > 0 || config?.preassessmentsecretkey?.length > 0;

  const handleKeySubmit = (e) => {
    e.preventDefault();
    
    if (validateTeacherKey(secretKey, config)) {
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
    if (!config) return;
    
    setLoading(true);
    try {
      const { db } = await import('../firebase');
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      
      const q = query(
        collection(db, 'quizResults'),
        where('className', '==', config.className),
        where('examTitle', '==', config.examTitle),
        where('teacher', '==', config.teacher)
      );
      
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          name: `${d.studentInfo?.firstName || ''} ${d.studentInfo?.lastName || ''}`.trim(),
          rollNumber: Number(d.studentInfo?.rollNumber) || d.studentInfo?.rollNumber,
          correct: d.results?.correctCount || 0,
          wrong: d.results?.wrongCount || 0,
          skipped: d.results?.skippedCount || 0,
          marks: d.results?.totalEarned || 0,
          percentage: parseFloat(d.results?.percentage) || 0,
          grade: d.results?.grade || '-'
        };
      });
      
      setReportData(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReportData([]);
    }
    setLoading(false);
  }, [config]);

  const handleExportExcel = () => {
    if (sortedData.length === 0) return;
    downloadReportAsExcel(sortedData, config);
  };

  const sortedData = useMemo(() => {
    if (!reportData.length) return [];
    
    return [...reportData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [reportData, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="opacity-30">↕</span>;
    return <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  if (!hasSecretKey) {
    return (
      <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
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
      <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
        <div className="glass-card w-full max-w-md animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Teacher Reports</h2>
            <p className="text-gray-500 dark:text-gray-400">Enter teacher secret key to view reports</p>
          </div>

          <form onSubmit={handleKeySubmit} className="space-y-4">
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
    <div className="w-full min-h-screen pt-20 sm:pt-16 pb-20 sm:pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-4xl">
        <div className="glass-card animate-slideUp">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{config.examType} - Class {config.classNum}</h2>
            <p className="text-gray-500 dark:text-gray-400">{config.subject} | {config.teacher}</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Loading reports...</p>
            </div>
          ) : sortedData.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No reports found for this assessment.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ 
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
                  border: '1px solid rgba(16, 185, 129, 0.4)'
                }}>
                  <span>👥</span>
                  <span>Total Students Submitted: {sortedData.length}</span>
                </div>
                <div className="flex gap-3">
                  <button 
                    className="px-4 py-2 rounded-xl font-medium bg-green-100 dark:bg-green-600/30 border border-green-300 dark:border-green-600/50 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-600/40 flex items-center gap-2"
                    onClick={handleExportExcel}
                  >
                    <span>📥</span> Export Excel
                  </button>
                  <button 
                    className="px-4 py-2 rounded-xl font-medium bg-black/5 dark:bg-white/10 border border-gray-300 dark:border-white/20 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 flex items-center gap-2" 
                    onClick={fetchReportData}
                  >
                    <span>🔄</span> Refresh
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl bg-gray-100 dark:bg-black/20">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white" onClick={() => handleSort('name')}>
                        Name <SortIcon columnKey="name" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-24" onClick={() => handleSort('rollNumber')}>
                        Roll No <SortIcon columnKey="rollNumber" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" onClick={() => handleSort('correct')}>
                        Correct <SortIcon columnKey="correct" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" onClick={() => handleSort('wrong')}>
                        Wrong <SortIcon columnKey="wrong" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" onClick={() => handleSort('skipped')}>
                        Skipped <SortIcon columnKey="skipped" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" onClick={() => handleSort('marks')}>
                        Marks <SortIcon columnKey="marks" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" onClick={() => handleSort('percentage')}>
                        % <SortIcon columnKey="percentage" />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:text-gray-900 dark:hover:text-white w-20" onClick={() => handleSort('grade')}>
                        Grade <SortIcon columnKey="grade" />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedData.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-4 py-3 text-sm">{row.name}</td>
                        <td className="px-4 py-3 text-sm">{row.rollNumber}</td>
                        <td className="px-4 py-3 text-sm text-green-400">{row.correct}</td>
                        <td className="px-4 py-3 text-sm text-red-400">{row.wrong}</td>
                        <td className="px-4 py-3 text-sm text-yellow-400">{row.skipped}</td>
                        <td className="px-4 py-3 text-sm">{row.marks}</td>
                        <td className="px-4 py-3 text-sm">{row.percentage}%</td>
                        <td className="px-4 py-3 text-sm font-medium">{row.grade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

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
