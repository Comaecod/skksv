import { useState } from 'react';
import { formatName } from '../utils/format';
import { getPerformanceMessage, getGradeInfo } from '../utils/scoring';
import { SCHOOL_CONFIG } from '../config/schoolConfig';

const CertificateCard = ({ studentInfo, assessment, results }) => {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const teacherName = assessment?.teacher || SCHOOL_CONFIG.computerTeacher?.name || 'Venkata Vishnu';
  const gradeInfo = getGradeInfo(results.percentage);
  const subject = assessment?.subject || 'General';
  const title = assessment?.title || 'Assessment';

  return (
    <div className="relative rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.4)_0%,transparent_50%)]" />

      <div className="relative p-6 sm:p-10">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-1 shadow-2xl">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-4xl">🎓</span>
            </div>
          </div>
        </div>

        <p className="text-center text-purple-200 text-xs font-semibold tracking-[0.3em] uppercase mb-1">
          {SCHOOL_CONFIG.name}
        </p>

        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
          <span className="text-2xl">🏆</span>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
        </div>

        <h3 className="text-center text-purple-200 font-bold text-lg tracking-[0.5em] uppercase mb-6">
          Certificate of Achievement
        </h3>

        <p className="text-center text-slate-400 text-sm mb-2">This is to certify that</p>

        <div className="text-center mb-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
            {studentInfo ? `${formatName(studentInfo.firstName)} ${formatName(studentInfo.lastName)}` : 'Student'}
          </h2>
        </div>

        <p className="text-center text-slate-400 text-sm mb-6">
          Class {assessment?.classNum || 'N/A'} • Roll No: {studentInfo?.rollNumber || '-'}
        </p>

        <p className="text-center text-slate-400 text-sm mb-3">has successfully completed</p>

        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl blur opacity-50" />
          <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-xl py-4 px-6 text-center border border-white/10">
            <span className="text-white font-bold text-lg tracking-wide">{title}</span>
            <p className="text-slate-400 text-sm mt-1">Subject: {subject}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-6">
          <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r shadow-lg font-bold text-xl text-white ${gradeInfo.color.replace('text-', 'from-').replace('-400', '-300 via-')} ${gradeInfo.color.replace('text-', 'to-').replace('-400', '-400')}`}>
            {results.grade}
          </div>
          <div className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold">
            {results.totalEarned.toFixed(1)} / {results.totalMarks}
          </div>
          <div className="px-6 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold">
            {results.percentage}%
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mb-6">Awarded on {date}</p>

        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-white/10">
          <div className="text-center">
            <div className="w-24 mx-auto h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-2" />
            <p className="text-white font-medium text-sm">{teacherName}</p>
            <p className="text-purple-300 text-xs">Subject Teacher</p>
          </div>
          <div className="text-center">
            <div className="w-24 mx-auto h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-2" />
            <p className="text-white font-medium text-sm">{SCHOOL_CONFIG.principal.name}</p>
            <p className="text-purple-300 text-xs">Principal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimedAssessmentResultScreen = ({ questions, answers, studentInfo, assessment, results, timeTaken, projectResult, onRestart }) => {
  const isMcq = assessment?.assessmentType === 'mcq' && results;
  const [showCertificate, setShowCertificate] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '-';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (!isMcq) {
    return (
      <div className="w-full max-w-lg animate-slideUp">
        <div className="glass-card text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-2">{assessment?.title || 'Timed Assessment'}</p>
          {studentInfo && (
            <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-6">
              <p className="font-semibold text-gray-900 dark:text-white">{formatName(studentInfo.firstName)} {formatName(studentInfo.lastName)}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Roll: {studentInfo.rollNumber}</p>
            </div>
          )}
          <p className="text-gray-500 dark:text-gray-400 mb-6">Your project has been submitted for review.</p>
          <button className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={onRestart}>Back to Assessments 🏠</button>
        </div>
      </div>
    );
  }

  const performance = getPerformanceMessage(results.percentage);

  return (
    <div className="w-full max-w-3xl animate-slideUp">
      <div className="glass-card">
        <div className="text-center mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {performance.emoji} {assessment.title} Complete {performance.emoji}
          </h2>
        </div>

        {studentInfo && (
          <div className="p-4 sm:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {formatName(studentInfo.firstName)} {formatName(studentInfo.lastName)}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Roll Number: {studentInfo.rollNumber}</p>
          </div>
        )}

        <div className="text-center mb-4">
          <div className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white">
            {results.totalEarned.toFixed(1)}
            <span className="text-2xl sm:text-3xl text-gray-500 dark:text-gray-400">/{results.totalMarks}</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white">{results.percentage}% {performance.emoji}</span>
        </div>

        <div className="text-center mb-4">
          <span className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-xl sm:text-2xl font-bold text-white">{results.grade}</span>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 mb-4">{performance.message}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-400">{results.correctCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">✅ Correct</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-400">{results.wrongCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">❌ Wrong</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400">{results.skippedCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⏭️ Skipped</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-400">{formatTime(timeTaken)}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">⏱️ Time</div>
          </div>
        </div>

        {/* Question Analysis - always visible, no key required */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">📊 Question Analysis</h3>
          <div className="overflow-x-auto rounded-xl bg-gray-100 dark:bg-black/20">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10">
                  <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-12">#</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Question</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-32">Correct</th>
                  <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-32">Your Answer</th>
                  <th className="px-3 sm:px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 w-12">Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => {
                  const result = results.questionResults[index];
                  const correctIdx = Array.isArray(question.isCorrect) ? question.isCorrect : [question.isCorrect];
                  const correctText = correctIdx.map(i => question.options[i]?.text).filter(Boolean).join(', ') || '-';

                  const studentIdx = answers[question.id];
                  let studentText = '-';
                  let statusIcon = '⏭️';
                  let statusLabel = 'Skipped';
                  let statusClass = 'text-yellow-400';

                  if (studentIdx !== undefined) {
                    const idx = Array.isArray(studentIdx) ? studentIdx : [studentIdx];
                    if (idx.length > 0) {
                      studentText = idx.map(i => question.options[i]?.text).filter(Boolean).join(', ') || '-';
                      statusClass = result.isCorrect ? 'text-green-400' : 'text-red-400';
                      statusIcon = result.isCorrect ? '✅' : '❌';
                      statusLabel = result.isCorrect ? 'Correct' : 'Wrong';
                    }
                  }

                  const truncated = question.text.length > 40 ? question.text.substring(0, 40) + '...' : question.text;

                  return (
                    <tr key={question.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                      <td className="px-3 sm:px-4 py-3 text-sm">Q{question.questionNumber}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm" title={question.text}>{truncated}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm text-green-400">{correctText}</td>
                      <td className={`px-3 sm:px-4 py-3 text-sm ${statusClass}`}>{studentText}</td>
                      <td className="px-3 sm:px-4 py-3 text-center" aria-label={statusLabel}>{statusIcon}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Certificate toggle */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => setShowCertificate(!showCertificate)}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-medium hover:opacity-90 flex items-center justify-center gap-2"
          >
            <span>🎓</span>
            <span>{showCertificate ? 'Hide Certificate' : 'Show Certificate'}</span>
            <span className={`transition-transform ${showCertificate ? 'rotate-180' : ''}`}>▼</span>
          </button>
          {showCertificate && (
            <div className="mt-4 animate-fadeIn">
              <CertificateCard studentInfo={studentInfo} assessment={assessment} results={results} />
            </div>
          )}
        </div>

        <div className="text-center">
          <button className="px-6 sm:px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90" onClick={onRestart}>
            Back to Assessments 🏠
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimedAssessmentResultScreen;
