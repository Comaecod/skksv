import { useTheme } from '../../context/ThemeContext';
import { CATEGORY_LABELS, computeSessionScore, monthKey, monthLabel, SESSION_TYPES } from '../../services/counsellingService';

export const SESSION_TYPE_LABELS = {
  [SESSION_TYPES.MONTHLY_CHECKIN]: 'Monthly Check-in',
  [SESSION_TYPES.INDIVIDUAL]: 'Individual Session',
  [SESSION_TYPES.GROUP]: 'Group Session',
  [SESSION_TYPES.PARENT_DISCUSSION]: 'Parent Discussion',
};

export const CONCERN_LEVEL_LABELS = {
  none: 'Needs No Action',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const CONCERN_LEVEL_ORDER = ['none', 'low', 'medium', 'high'];

export const CONCERN_STYLES = {
  none: 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10',
  low: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  medium: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  high: 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20',
};

export const CATEGORY_COLORS = {
  emotional: '#8b5cf6',
  academic: '#06b6d4',
  social: '#f59e0b',
  physical: '#10b981',
  family: '#f43f5e',
  behavioral: '#6366f1',
  general: '#94a3b8',
};

export const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#94a3b8'];

export const useChartTheme = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  return {
    dark,
    grid: dark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
    tick: dark ? '#9ca3af' : '#6b7280',
    axis: dark ? 'rgba(255,255,255,0.6)' : '#374151',
    tooltipBg: dark ? '#1e1e38' : '#ffffff',
    tooltipBorder: dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
    tooltipText: dark ? '#ffffff' : '#111827',
  };
};

export const formatDate = (dateKey) => {
  if (!dateKey) return '—';
  const [y, m, d] = String(dateKey).split('-');
  if (!y || !m || !d) return dateKey;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[Number(m) - 1]} ${y}`;
};

const lastNMonthKeys = (n) => {
  const res = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    res.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return res;
};

export const buildMonthlySeries = (sessions, monthsBack = 6) => {
  const keys = lastNMonthKeys(monthsBack);
  return keys.map((key) => {
    const inMonth = sessions.filter((s) => monthKey(s.date) === key);
    const avgScores = inMonth.map((s) => computeSessionScore(s.responses)).filter((v) => v != null);
    return {
      key,
      name: monthLabel(key),
      sessions: inMonth.length,
      uniqueStudents: new Set(inMonth.map((s) => s.student?.userId).filter(Boolean)).size,
      avgConcern: avgScores.length ? Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length) : null,
    };
  });
};

export const buildClassConcernData = (sessions) => {
  const map = new Map();
  sessions.forEach((s) => {
    const cls = s.student?.studentClass || s.classNum || 'Unknown';
    const level = s.concernLevel || 'none';
    if (!map.has(cls)) map.set(cls, { name: `Class ${cls}`, none: 0, low: 0, medium: 0, high: 0 });
    map.get(cls)[level] += 1;
  });
  return [...map.entries()]
    .map(([, v]) => v)
    .sort((a, b) => Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, '')));
};

export const buildCategoryDistribution = (sessions) => {
  const map = new Map();
  sessions.forEach((s) => {
    (s.concernCategories || []).forEach((cat) => {
      const label = CATEGORY_LABELS[cat] || cat;
      map.set(label, (map.get(label) || 0) + 1);
    });
  });
  return [...map.entries()].map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || '#94a3b8' })).sort((a, b) => b.value - a.value);
};

export const buildCoverage = (sessions, students, monthKeyTarget) => {
  const target = monthKeyTarget || monthKey(new Date().toISOString().slice(0, 10));
  const counselled = new Set(sessions.filter((s) => monthKey(s.date) === target).map((s) => s.student?.userId).filter(Boolean));
  const byClass = new Map();
  students.forEach((st) => {
    const cls = String(st.studentClass || 'Unknown');
    if (!byClass.has(cls)) byClass.set(cls, { name: `Class ${cls}`, total: 0, counselled: 0 });
    byClass.get(cls).total += 1;
    if (counselled.has(st.id)) byClass.get(cls).counselled += 1;
  });
  const rows = [...byClass.values()].sort((a, b) => Number(a.name.replace(/\D/g, '')) - Number(b.name.replace(/\D/g, '')));
  rows.forEach((r) => {
    r.coverage = r.total ? Math.round((r.counselled / r.total) * 100) : 0;
  });
  const total = students.length;
  return {
    rows,
    total,
    counselled: counselled.size,
    coverage: total ? Math.round((counselled.size / total) * 100) : 0,
  };
};

export const studentsDue = (sessions, students, monthKeyTarget) => {
  const target = monthKeyTarget || monthKey(new Date().toISOString().slice(0, 10));
  const counselled = new Set(sessions.filter((s) => monthKey(s.date) === target).map((s) => s.student?.userId).filter(Boolean));
  return students
    .filter((st) => !counselled.has(st.id))
    .sort((a, b) => String(a.studentClass || '').localeCompare(String(b.studentClass || '')) || String(a.section || '').localeCompare(String(b.section || '')) || (a.displayName || '').localeCompare(b.displayName || ''));
};

export const pendingFollowUps = (sessions) =>
  sessions
    .filter((s) => s.followUp?.required && s.followUp?.status !== 'completed')
    .sort((a, b) => String(a.followUp?.date || '9999').localeCompare(String(b.followUp?.date || '9999')));

export const exportSessions = (rows, detailed) => {
  import('xlsx').then((XLSX) => {
    const header = detailed
      ? ['Date', 'Student', 'Class', 'Section', 'Session Type', 'Concern Level', 'Categories', 'Concern Score (%)', 'Main Concern', 'Observations', 'Action Taken', 'Recommendation', 'Follow-up By', 'Follow-up Status', 'Escalation', 'Escalation Details', 'Parent Contacted', 'Safeguarding', 'Created By']
      : ['Date', 'Student', 'Class', 'Section', 'Session Type', 'Concern Level', 'Categories', 'Follow-up By', 'Follow-up Status', 'Created By'];

    const rowsOut = rows.map((s) => {
      const student = s.student || {};
      const base = [
        s.date || '',
        student.name || '',
        student.studentClass || s.classNum || '',
        student.section || '',
        SESSION_TYPE_LABELS[s.sessionType] || s.sessionType || '',
        CONCERN_LEVEL_LABELS[s.concernLevel] || s.concernLevel || '',
        (s.concernCategories || []).join(', '),
      ];
      if (detailed) {
        return [
          ...base,
          computeSessionScore(s.responses) ?? '',
          s.notes?.mainConcern || '',
          s.notes?.observations || '',
          s.notes?.actionTaken || '',
          s.notes?.recommendation || '',
          s.followUp?.date || '',
          s.followUp?.status || '',
          s.escalation?.channel || 'none',
          s.escalation?.details || '',
          s.escalation?.parentContacted ? 'Yes' : 'No',
          s.safeguards?.flag ? 'Yes' : 'No',
          s.createdByName || '',
        ];
      }
      return [
        ...base,
        s.followUp?.date || '',
        s.followUp?.status || '',
        s.createdByName || '',
      ];
    });

    const worksheetData = [
      [detailed ? 'Counselling Sessions — Detailed Export' : 'Counselling Sessions'],
      [`Generated: ${new Date().toLocaleString()}`],
      [],
      header,
      ...rowsOut,
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    worksheet['!cols'] = header.map((h) => ({ wch: Math.max(12, h.length + 4) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Counselling');
    XLSX.writeFile(workbook, `Counselling_Sessions_${detailed ? 'Detailed' : 'Standard'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  });
};

export const StatCard = ({ icon, label, value, sub, accent = '#6366f1' }) => (
  <div className="p-5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843]">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: 'var(--overlay)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
    {sub && <p className="mt-2 text-xs" style={{ color: accent }}>{sub}</p>}
  </div>
);

export const SectionCard = ({ title, subtitle, actions, children, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#282843] ${className}`}>
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 flex-wrap">
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions}
    </div>
    <div className="px-5 pb-5">{children}</div>
  </div>
);

export const Chip = ({ label, className = '' }) => (
  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}>{label}</span>
);

export const EmptyState = ({ icon = '🗂️', title = 'No data yet', message }) => (
  <div className="text-center py-12">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-gray-900 dark:text-white font-semibold">{title}</h3>
    {message && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{message}</p>}
  </div>
);