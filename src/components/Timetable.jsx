const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const Timetable = ({ timetable, subject }) => {
  if (!timetable?.periods) return null;

  const totalPeriods = timetable.periods.reduce((sum, p) => {
    return sum + DAY_KEYS.reduce((daySum, dk) => daySum + (p[dk] ? 1 : 0), 0);
  }, 0);

  return (
    <div>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-primary/10">
            <th className="px-1.5 py-2 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-white/10 whitespace-nowrap">Per</th>
            <th className="px-1.5 py-2 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-white/10 whitespace-nowrap">Time</th>
            {DAYS.map(d => (
              <th key={d} className="px-1.5 py-2 text-center font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-white/10 whitespace-nowrap">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timetable.periods.map((p, i) => (
            <tr key={i} className="border-b border-gray-100 dark:border-white/5 last:border-0">
              <td className="px-1.5 py-1.5 text-gray-500 dark:text-gray-400 font-medium text-center whitespace-nowrap">{i + 1}</td>
              <td className="px-1.5 py-1.5 text-gray-500 dark:text-gray-400 text-center whitespace-nowrap">{p.time}</td>
              {DAY_KEYS.map(dk => {
                const cell = p[dk];
                const display = Array.isArray(cell) ? cell[0] : (cell || '-');
                const subjectLabel = Array.isArray(cell) ? cell[1] || '' : '';
                return (
                  <td key={dk} className="px-1.5 py-1.5 text-center whitespace-nowrap">
                    <span className="text-gray-900 dark:text-white font-medium">{display === '-' ? '-' : display}</span>
                    {subjectLabel && (
                      <span className="block text-[9px] text-gray-400 dark:text-gray-500 leading-tight">{subjectLabel}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
        Total periods/week: <span className="font-semibold">{totalPeriods}</span>
      </div>
    </div>
  );
};

export default Timetable;
