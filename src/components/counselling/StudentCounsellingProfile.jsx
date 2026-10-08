import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { userService } from '../../auth/services/userService';
import { counsellingService, computeSessionScore, CATEGORY_LABELS } from '../../services/counsellingService';
import {
  SESSION_TYPE_LABELS, CONCERN_LEVEL_LABELS, CONCERN_STYLES,
  useChartTheme, formatDate, CATEGORY_COLORS, Chip, EmptyState, StatCard, SectionCard,
} from './counsellingUI';

const RESIDENCE_LABELS = { '1': 'Day Scholar', '2': 'Veda Hostel', '3': 'General Hostel' };

export default function StudentCounsellingProfile() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const tooltip = useChartTheme();

  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [profile, ss] = await Promise.all([userService.getUserById(studentId), counsellingService.getSessionsForStudent(studentId)]);
        setStudent(profile);
        setSessions(ss);
      } catch (err) {
        setError(err.message || 'Could not load student profile');
      }
      setLoading(false);
    };
    load();
  }, [studentId]);

  const categoryDist = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => (s.concernCategories || []).forEach((c) => {
      const label = CATEGORY_LABELS[c] || c;
      map.set(label, (map.get(label) || 0) + 1);
    }));
    return [...map.entries()].map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] || '#94a3b8' })).sort((a, b) => b.value - a.value);
  }, [sessions]);

  const trend = useMemo(
    () => [...sessions].sort((a, b) => String(a.date).localeCompare(String(b.date))).map((s, i) => ({
      name: formatDate(s.date).slice(0, 6),
      score: computeSessionScore(s.responses),
      i,
    })),
    [sessions]
  );

  const last = sessions[0] || null;
  const openFollowUps = sessions.filter((s) => s.followUp?.required && s.followUp?.status !== 'completed');
  const safeguarding = sessions.filter((s) => s.safeguards?.flag);
  const latestScore = last ? computeSessionScore(last.responses) : null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-3">🤷</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student not found</h2>
          <Link to="/dashboard/counselling" className="text-sm text-primary dark:text-primary-light hover:underline mt-1 inline-block">← Back to Counselling</Link>
        </div>
      </div>
    );
  }

  const points = trend.filter((t) => t.score != null);

  return (
    <div className="animate-slideUp space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link to="/dashboard/counselling" className="text-sm text-primary dark:text-primary-light hover:underline">← Counselling</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{student.displayName || student.email}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Class {student.studentClass || '—'}{student.section ? ` · Section ${student.section}` : ''}
            {student.admissionNo ? ` · Admn ${student.admissionNo}` : ''}
            {student.dayScholarOrHostel ? ` · ${RESIDENCE_LABELS[student.dayScholarOrHostel] || '—'}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/counselling/sessions/new?studentId=${student.id}&type=monthly-checkin`} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90 transition-all">+ Start Check-in</Link>
          <Link to="/dashboard/counselling/sessions" className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-all">All Records</Link>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
          <p className="text-rose-600 dark:text-rose-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon="📓" label="Sessions" value={sessions.length} sub={`Last: ${last ? formatDate(last.date) : '—'}`} />
        <StatCard icon="📈" label="Latest Concern" value={last ? CONCERN_LEVEL_LABELS[last.concernLevel] || 'none' : '—'} sub={latestScore != null ? `Score ${latestScore}%` : 'No score yet'} accent={last?.concernLevel === 'high' || last?.concernLevel === 'medium' ? '#f59e0b' : '#10b981'} />
        <StatCard icon="⏰" label="Open Follow-ups" value={openFollowUps.length} sub="Pending completion" accent="#f59e0b" />
        <StatCard icon="🚩" label="Safeguard Flags" value={safeguarding.length} sub={safeguarding.length ? 'See history below' : 'None flagged'} accent="#f43f5e" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Wellbeing Trend" subtitle="Concern score across sessions — lower is better">
          {points.length === 0 ? (
            <EmptyState icon="📊" title="No trend yet" message="Once sessions are recorded, the trend will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={tooltip.grid} />
                <XAxis dataKey="name" tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: tooltip.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                  <div className="px-3 py-2 rounded-lg text-xs border" style={{ background: tooltip.tooltipBg, borderColor: tooltip.tooltipBorder, color: tooltip.tooltipText }}>
                    <span className="font-semibold">{label}: {payload[0].value}%</span>
                  </div>
                ) : null} />
                <Line type="monotone" dataKey="score" name="Concern" connectNulls stroke="#f43f5e" strokeWidth={2} dot={{ r: 4, fill: '#f43f5e' }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Concern Areas" subtitle="Areas identified across sessions">
          {categoryDist.length === 0 ? (
            <EmptyState icon="🧭" title="No areas yet" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={categoryDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {categoryDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="px-3 py-2 rounded-lg text-xs border" style={{ background: tooltip.tooltipBg, borderColor: tooltip.tooltipBorder, color: tooltip.tooltipText }}>
                    {payload[0].name}: <span className="font-semibold">{payload[0].value}</span>
                  </div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SectionCard>
      </div>

      {student.fathersName && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {student.fathersName && <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Father:</span> {student.fathersName}{student.fatherContact ? ` · ${student.fatherContact}` : ''}</p>}
          {student.mothersName && <p className="text-gray-600 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Mother:</span> {student.mothersName}{student.motherContact ? ` · ${student.motherContact}` : ''}</p>}
          {student.address && <p className="text-gray-600 dark:text-gray-300 col-span-2"><span className="text-gray-400 dark:text-gray-500">Address:</span> {student.address}</p>}
        </div>
      )}

      <SectionCard title="Session History" subtitle={`${sessions.length} record${sessions.length === 1 ? '' : 's'} · click to expand`}>
        {sessions.length === 0 ? (
          <EmptyState icon="🗂️" title="No sessions yet" message="Start this student's first wellbeing check-in." />
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const open = expanded === s.id;
              return (
                <div key={s.id} className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : s.id)}
                    className="w-full flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-3 text-left bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(s.date)}</span>
                    <Chip label={SESSION_TYPE_LABELS[s.sessionType] || s.sessionType} className="bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20" />
                    <Chip label={CONCERN_LEVEL_LABELS[s.concernLevel] || 'none'} className={CONCERN_STYLES[s.concernLevel] || CONCERN_STYLES.none} />
                    {computeSessionScore(s.responses) != null && <span className="text-xs text-gray-500 dark:text-gray-400">{computeSessionScore(s.responses)}%</span>}
                    {s.safeguards?.flag && <span title="Safeguarding flag">🚩</span>}
                    {s.followUp?.required && (
                      <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${s.followUp.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'}`}>
                        Follow-up {s.followUp.status === 'completed' ? `done ${formatDate(s.followUp.completedAt)}` : 'by ' + formatDate(s.followUp.date)}
                      </span>
                    )}
                    <span className="text-gray-400 dark:text-gray-500 text-xs">{open ? '▲' : '▼'}</span>
                  </button>
                  {open && (
                    <div className="px-4 py-4 space-y-3 text-sm">
                      <button onClick={() => navigate(`/dashboard/counselling/sessions/edit/${s.id}`)} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/30 transition-all">Edit this record</button>
                      {(s.concernCategories || []).length > 0 && (
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Areas:</span> {s.concernCategories.map((c) => CATEGORY_LABELS[c] || c).join(', ')}</p>
                      )}
                      {s.notes?.mainConcern && <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Main concern:</span> {s.notes.mainConcern}</p>}
                      {s.notes?.observations && <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Observations:</span> {s.notes.observations}</p>}
                      {s.notes?.actionTaken && <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Action taken:</span> {s.notes.actionTaken}</p>}
                      {s.notes?.recommendation && <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Recommendation:</span> {s.notes.recommendation}</p>}
                      {s.escalation?.channel && s.escalation.channel !== 'none' && (
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-400 dark:text-gray-500">Escalated via:</span> {s.escalation.channel}{s.escalation.parentContacted ? ' · parent/guardian informed' : ''}{s.escalation.details ? ` · ${s.escalation.details}` : ''}</p>
                      )}
                      {(s.responses || []).length > 0 && (
                        <details>
                          <summary className="cursor-pointer text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">Show questionnaire responses ({s.responses.length})</summary>
                          <ul className="mt-2 space-y-1 list-disc pl-5 text-gray-600 dark:text-gray-300">
                            {s.responses.map((r, i) => (
                              <li key={i} className="text-xs">
                                <span className="text-gray-400 dark:text-gray-500">{r.question}</span>
                                {r.type === 'text' ? (r.text ? ` — "${r.text}"` : '') : ` → ${r.numericValue != null ? `${r.numericValue}%` : ''}`}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}