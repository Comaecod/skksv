import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../auth/contexts/AuthContext';
import {
  ResponsiveContainer,
  ComposedChart, Bar, Line,
  BarChart,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { counsellingService, monthKey } from '../../services/counsellingService';
import {
  SESSION_TYPE_LABELS, CONCERN_LEVEL_LABELS, CONCERN_STYLES,
  useChartTheme, formatDate, buildMonthlySeries, buildClassConcernData,
  buildCategoryDistribution, buildCoverage, studentsDue, pendingFollowUps,
  StatCard, SectionCard, Chip, EmptyState, PALETTE,
} from './counsellingUI';
import ConfirmModal from '../ConfirmModal';

const ChartTooltip = ({ tooltip }) => {
  const { tooltipBg, tooltipBorder, tooltipText } = tooltip;
  return (
    ({ active, payload, label }) => {
      if (!active || !payload?.length) return null;
      return (
        <div className="px-3 py-2 rounded-lg text-xs border" style={{ background: tooltipBg, borderColor: tooltipBorder, color: tooltipText }}>
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((p, i) => (
            <p key={i} className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color || p.payload?.fill || PALETTE[i % PALETTE.length] }} />
              {p.name}: <span className="font-semibold">{p.value}{p.name === 'Avg. concern' ? '%' : ''}</span>
            </p>
          ))}
        </div>
      );
    }
  );
};

export default function CounsellingDashboard({ onNavigate }) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const tooltip = useChartTheme();
  const [sessions, setSessions] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmFollowUp, setConfirmFollowUp] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [showAllDue, setShowAllDue] = useState(false);

  const currentMonthKey = monthKey(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ss, st] = await Promise.all([counsellingService.getAllSessions(), counsellingService.getStudents()]);
        setSessions(ss);
        setStudents(st);
      } catch (err) {
        setError(err.message || 'Could not load counselling data');
      }
      setLoading(false);
    };
    load();
  }, []);

  const monthly = useMemo(() => buildMonthlySeries(sessions), [sessions]);
  const byClass = useMemo(() => buildClassConcernData(sessions), [sessions]);
  const categories = useMemo(() => buildCategoryDistribution(sessions), [sessions]);
  const coverage = useMemo(() => buildCoverage(sessions, students, currentMonthKey), [sessions, students, currentMonthKey]);
  const due = useMemo(() => studentsDue(sessions, students, currentMonthKey), [sessions, students, currentMonthKey]);
  const followUps = useMemo(() => pendingFollowUps(sessions), [sessions]);

  const openHigh = sessions.filter((s) => (s.concernLevel === 'high' || s.safeguards?.flag) && s.followUp?.required && s.followUp?.status !== 'completed');
  const stats = {
    totalSessions: sessions.length,
    studentsCounselled: new Set(sessions.map((s) => s.student?.userId).filter(Boolean)).size,
    openHigh: openHigh.length,
    dueFollowUps: followUps.length,
    monthSessions: sessions.filter((s) => monthKey(s.date) === currentMonthKey).length,
  };

  const handleMarkFollowUp = async () => {
    setFollowUpLoading(true);
    try {
      await counsellingService.markFollowUpCompleted(confirmFollowUp.id, { uid: userProfile?.id || user?.uid || '' });
      setSessions((prev) => prev.map((s) => (s.id === confirmFollowUp.id ? { ...s, followUp: { ...s.followUp, status: 'completed', completedAt: new Date().toISOString().slice(0, 10) } } : s)));
      setConfirmFollowUp(null);
    } catch (err) {
      setError(err.message || 'Could not mark follow-up as completed');
    }
    setFollowUpLoading(false);
  };

  const startCheckin = (studentId) => navigate(`/dashboard/counselling/sessions/new?studentId=${studentId}&type=monthly-checkin`);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const coverageChart = coverage.rows.map((r) => ({ name: r.name, Coverage: r.coverage, fill: '#6366f1' }));

  return (
    <div className="animate-slideUp space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Wellbeing & Counselling</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Confidential wellbeing check-ins, records, follow-ups and analytics</p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/counselling/sessions" className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            View Records
          </Link>
          <Link to="/dashboard/counselling/question-bank" className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
            Question Bank
          </Link>
          <Link to="/dashboard/counselling/sessions/new" className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">
            + New Session
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon="📓" label="Total Sessions" value={stats.totalSessions} sub={`${stats.monthSessions} this month`} />
        <StatCard icon="🎓" label="Students Counselled" value={stats.studentsCounselled} sub="Unique students to date" accent="#10b981" />
        <StatCard icon="🚩" label="Open High Concern" value={stats.openHigh} sub="High priority / safeguarding pending" accent="#f43f5e" />
        <StatCard icon="⏰" label="Follow-ups Due" value={stats.dueFollowUps} sub="Awaiting completion" accent="#f59e0b" />
        <StatCard icon="📈" label={`Coverage · ${currentMonthKey.slice(5)}`} value={`${coverage.coverage}%`} sub={`${coverage.counselled} of ${coverage.total} students`} accent="#06b6d4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Monthly Activity" subtitle="Sessions and average concern score (lower is better)">
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tooltip.grid} />
              <XAxis dataKey="name" tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={ChartTooltip({ tooltip })} />
              <Bar dataKey="sessions" name="Sessions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="avgConcern" name="Avg. concern" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </ComposedChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Concern Level by Class" subtitle="Distribution across classes">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byClass} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tooltip.grid} />
              <XAxis dataKey="name" tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={ChartTooltip({ tooltip })} />
              <Bar dataKey="none" name="No action" stackId="a" fill="#94a3b8" />
              <Bar dataKey="low" name="Low" stackId="a" fill="#10b981" />
              <Bar dataKey="medium" name="Medium" stackId="a" fill="#f59e0b" />
              <Bar dataKey="high" name="High" stackId="a" fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Monthly Coverage by Class" subtitle={`Students with a session in ${formatDate(`${currentMonthKey}-01`).slice(4)}`}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={coverageChart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tooltip.grid} />
              <XAxis dataKey="name" tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tooltip.tick, fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip content={ChartTooltip({ tooltip })} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="Coverage" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Concern Areas" subtitle="Frequency by wellbeing area">
          {categories.length === 0 ? (
            <EmptyState icon="🧭" title="No categories recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categories} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {categories.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={ChartTooltip({ tooltip })} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard
          title="Students Due — Monthly Check-in"
          subtitle={`${due.length} student${due.length === 1 ? '' : 's'} not counselled this month`}
          actions={
            <button onClick={() => setShowAllDue(!showAllDue)} className="text-xs font-medium text-primary dark:text-primary-light hover:underline">
              {showAllDue ? 'Show fewer' : `Show all (${due.length})`}
            </button>
          }
        >
          {due.length === 0 ? (
            <EmptyState icon="🎉" title="All caught up" message="Every student has had a session this month." />
          ) : (
            <div className="space-y-1">
              {(showAllDue ? due : due.slice(0, 8)).map((st) => (
                <div key={st.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{st.displayName || '—'}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Class {st.studentClass}{st.section ? ` · Section ${st.section}` : ''}</p>
                  </div>
                  <button onClick={() => startCheckin(st.id)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary dark:text-primary-light hover:bg-primary/20 transition-all">
                    Start Check-in
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Pending Follow-ups" subtitle="Follow-ups due or not yet completed" actions={<button onClick={() => navigate('/dashboard/counselling/sessions')} className="text-xs font-medium text-primary dark:text-primary-light hover:underline">View all records</button>}>
          {followUps.length === 0 ? (
            <EmptyState icon="✅" title="No pending follow-ups" message="Great — no follow-ups are outstanding." />
          ) : (
            <div className="space-y-1">
              {followUps.slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-black/5 dark:bg-white/5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.student?.name || '—'}</p>
                      <Chip label={CONCERN_LEVEL_LABELS[s.concernLevel] || 'none'} className={CONCERN_STYLES[s.concernLevel] || CONCERN_STYLES.none} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {SESSION_TYPE_LABELS[s.sessionType] || s.sessionType} · due {formatDate(s.followUp?.date)} · Class {s.student?.studentClass || ''}
                    </p>
                  </div>
                  <button onClick={() => setConfirmFollowUp(s)} className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 transition-all">
                    Mark Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <ConfirmModal
        isOpen={!!confirmFollowUp}
        onClose={() => setConfirmFollowUp(null)}
        onConfirm={handleMarkFollowUp}
        isLoading={followUpLoading}
        title="Mark follow-up completed?"
        description={`${confirmFollowUp?.student?.name || 'This student'}'s follow-up due ${confirmFollowUp ? formatDate(confirmFollowUp.followUp?.date) : ''} will be marked as done.`}
        confirmText="Complete"
        variant="success"
        confirmLoadingText="Saving..."
      />
    </div>
  );
}