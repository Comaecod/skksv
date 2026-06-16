import { motion } from 'framer-motion';
import CALENDAR from '../data/academicCalendar.json';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getWeekday = (dateStr) => {
  const match = dateStr.match(/(\w{3}\s+\d+,\s+\d{4})/);
  if (!match) return null;
  const d = new Date(match[1]);
  return isNaN(d.getTime()) ? null : dayNames[d.getDay()];
};

const formatDate = (dateStr) => {
  const wd = getWeekday(dateStr);
  if (!wd) return dateStr;
  if (dateStr.includes(' to ')) {
    const parts = dateStr.split(' to ');
    const endWd = getWeekday(parts[1]);
    return `${wd}, ${parts[0]} to ${endWd ? endWd + ', ' : ''}${parts[1]}`;
  }
  return `${wd}, ${dateStr}`;
};

const SectionTable = ({ title, emoji, headers, rows, colSpan }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 overflow-hidden"
  >
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-4 border-b border-gray-100 dark:border-white/5">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{emoji} {title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-r from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              {row.map((cell, j) => (
                <td key={j} className={`px-4 py-2.5 text-gray-600 dark:text-gray-300 ${j === 0 ? 'whitespace-nowrap font-medium text-gray-800 dark:text-gray-200' : ''}`}>
                  {j === 0 ? formatDate(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </motion.div>
);

const AcademicCalendar = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-secondary/80 to-primary/90" />
        <div className="absolute inset-0 bg-[url('https://www.kamakoti.org/assets/images/kamakoti/home_Adi.jpg')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">📅 Academic Calendar</h1>
            <p className="text-lg text-white/80">2026–27</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/5 p-6 sm:p-8 text-center"
        >
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            <p>📌 Calendar schedule for major activities and events for 2026–27 is provided below.</p>
            <p>📌 In the event of a change, notification will be provided in advance.</p>
            <p>📌 Participation for all events, assessments and competitions is mandatory.</p>
          </div>
        </motion.div>

        <SectionTable
          title="Special Events"
          emoji="🎉"
          headers={['Date', 'Event']}
          rows={CALENDAR.specialEvents}
        />

        <SectionTable
          title="Holiday Calendar"
          emoji="🎊"
          headers={['Date', 'Holiday']}
          rows={CALENDAR.holidays}
        />

        <SectionTable
          title="Vacation Schedule"
          emoji="🏖️"
          headers={['Duration', 'Vacation']}
          rows={CALENDAR.vacations}
        />

        <SectionTable
          title="Exam Schedule"
          emoji="📝"
          headers={['Duration', 'Exam']}
          rows={CALENDAR.exams}
        />

        <SectionTable
          title="Parent-Teacher Meetings"
          emoji="🤝"
          headers={['Date', 'PTM']}
          rows={CALENDAR.ptms}
        />

        <SectionTable
          title="List of Competitions"
          emoji="🏆"
          headers={['Date', 'Competition']}
          rows={CALENDAR.competitions}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-700/30 p-6 sm:p-8"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📚 Competitive Exams (dates will be intimated in due course)</h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            {CALENDAR.competitiveExams.map(([name, desc], i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="font-semibold text-primary whitespace-nowrap">{name}</span>
                <span>— {desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AcademicCalendar;
