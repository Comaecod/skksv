import { useState, useMemo, useEffect, useRef } from 'react';
import { calculateTotalScore, getPerformanceMessage, getGradeInfo } from '../utils/scoring';
import { formatName } from '../utils/format';
import { saveQuizResult } from '../services/firebaseService';
import { validateAnswerReveal } from '../utils/auth';
import { SCHOOL_CONFIG, GRADING_SYSTEM } from '../config/schoolConfig';

const CertificateCard = ({ studentInfo, config, results }) => {
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const teacherName = config.teacher || SCHOOL_CONFIG.computerTeacher?.name || 'Venkata Vishnu';
  const gradeInfo = getGradeInfo(results.percentage);
  
  return (
    <div className="relative rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900"></div>
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.4)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.4)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(236,72,153,0.2)_0%,transparent_70%)]"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0ibm9uZSIvPgo8cGF0aCBkPSJNMzAgMEwzMCA2MCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMEwzMCAzMCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
      
      <div className="relative p-6 sm:p-10">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"></div>
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-violet-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-amber-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-1 shadow-2xl">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-4xl sm:text-5xl">🎓</span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-purple-200 text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase mb-1">
          {config.schoolName || SCHOOL_CONFIG.name}
        </p>
        
        <div className="flex items-center justify-center gap-4 mb-2">
          <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
          <span className="text-2xl sm:text-3xl">🏆</span>
          <div className="h-px w-16 sm:w-24 bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
        </div>
        
        <h3 className="text-center text-purple-200 font-bold text-lg sm:text-xl tracking-[0.5em] uppercase mb-6">
          Certificate of Achievement
        </h3>
        
        <p className="text-center text-slate-400 text-sm mb-2">This is to certify that</p>
        
        <div className="text-center mb-2">
          <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent inline-block">
            {studentInfo ? `${formatName(studentInfo.firstName)} ${formatName(studentInfo.lastName)}` : 'Student'}
          </h2>
        </div>
        
        <p className="text-center text-slate-400 text-sm mb-6">
          Student of Class {config.classNum || 'N/A'} • Roll No: {studentInfo?.rollNumber || '-'}
        </p>
        
        <p className="text-center text-slate-400 text-sm mb-3">has successfully completed</p>
        
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 rounded-2xl blur opacity-50"></div>
          <div className="relative bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-xl py-4 px-6 text-center border border-white/10">
            <span className="text-white font-bold text-lg sm:text-xl tracking-wide">
              {config.examTitle}
            </span>
            <p className="text-slate-400 text-sm mt-1">Subject: {config.subject || 'General'}</p>
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mb-6">
          <div className={`px-6 py-3 rounded-2xl bg-gradient-to-r ${gradeInfo.color.replace('text-', 'from-').replace('-400', '-300 via-')} ${gradeInfo.color.replace('text-', 'to-').replace('-400', '-400')} shadow-lg font-bold text-xl text-white`}>
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
            <div className="relative inline-block mb-2">
              <div className="hidden font-serif italic text-purple-300 text-2xl absolute -bottom-2 left-1/2 -translate-x-1/2">{teacherName?.charAt(0)}</div>
            </div>
            <div className="w-24 mx-auto h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-2"></div>
            <p className="text-white font-medium text-sm">{teacherName}</p>
            <p className="text-purple-300 text-xs">Subject Teacher</p>
          </div>
          
          <div className="text-center">
            <div className="relative inline-block mb-2">
              <div className="hidden font-serif italic text-purple-300 text-2xl absolute -bottom-2 left-1/2 -translate-x-1/2">P</div>
            </div>
            <div className="w-24 mx-auto h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent mb-2"></div>
            <p className="text-white font-medium text-sm">{SCHOOL_CONFIG.principal.name}</p>
            <p className="text-purple-300 text-xs">Principal</p>
          </div>
        </div>
        
        <div className="flex justify-center mt-6 gap-2">
          <span className="text-purple-400">✨</span>
          <span className="text-purple-400 text-xs tracking-widest">SKKSV SCHOLAR</span>
          <span className="text-purple-400">✨</span>
        </div>
      </div>
    </div>
  );
};

const ResultScreen = ({ 
  questions, 
  answers, 
  studentInfo, 
  config,
  onRestart 
}) => {
  const [secretKey, setSecretKey] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [keyError, setKeyError] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const hasSaved = useRef(false);
  const keyInputRef = useRef(null);

  const hasSecretKey = config?.secretKey?.length > 0;

  const results = useMemo(() => {
    return calculateTotalScore(questions, answers, config?.wrongAnswerPenaltyFraction || 0);
  }, [questions, answers, config?.wrongAnswerPenaltyFraction]);

  const performance = getPerformanceMessage(results.percentage);

  useEffect(() => {
    if (!hasSaved.current) {
      hasSaved.current = true;
      saveQuizResult(studentInfo, config, results).catch(console.error);
    }
  }, [studentInfo, config, results]);

  const handleKeySubmit = (e) => {
    e.preventDefault();
    
    if (validateAnswerReveal(secretKey, config)) {
      setIsUnlocked(true);
      setKeyError(false);
    } else {
      setKeyError(true);
      if (keyInputRef.current) {
        keyInputRef.current.focus();
      }
    }
  };

  const handleKeyChange = (e) => {
    setSecretKey(e.target.value);
    if (keyError) setKeyError(false);
  };

  return (
    <div className="w-full max-w-3xl animate-slideUp" role="region" aria-labelledby="result-heading">
      <article className="glass-card">
        <header className="text-center mb-6 sm:mb-8">
          <h2 id="result-heading" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
            <span aria-hidden="true">{performance.emoji}</span> {config.examTitle} Complete <span aria-hidden="true">{performance.emoji}</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Please remain seated. Do not look around. <span aria-hidden="true">👀</span>
          </p>
        </header>

        {studentInfo && (
          <div className="p-4 sm:p-6 rounded-2xl bg-black/5 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {formatName(studentInfo.firstName)} {formatName(studentInfo.lastName)}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">Roll Number: {studentInfo.rollNumber}</p>
          </div>
        )}

        <div className="text-center mb-4" role="status" aria-live="polite" aria-label="Your score">
          <div className="text-5xl sm:text-6xl font-bold">
            {results.totalEarned.toFixed(1)}
            <span className="text-2xl sm:text-3xl text-gray-500 dark:text-gray-400">/{results.totalMarks}</span>
          </div>
        </div>

        <div className="text-center mb-4">
          <span className="text-2xl sm:text-3xl font-semibold" aria-label={`Percentage: ${results.percentage} percent`}>{results.percentage}% <span aria-hidden="true">{performance.emoji}</span></span>
        </div>

        <div className="text-center mb-4 sm:mb-6">
          <span className="inline-block px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-xl sm:text-2xl font-bold animate-bounce" aria-label={`Grade: ${results.grade}`}>
            {results.grade}
          </span>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">{performance.message}</p>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8" role="list" aria-label="Question statistics">
          <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center" role="listitem">
            <div className="text-2xl sm:text-3xl font-bold text-green-400" aria-label={`${results.correctCount} correct answers`}>{results.correctCount}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"><span aria-hidden="true">✅</span> Correct</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center" role="listitem">
            <div className="text-2xl sm:text-3xl font-bold text-red-400" aria-label={`${results.wrongCount} wrong answers`}>{results.wrongCount}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"><span aria-hidden="true">❌</span> Wrong</div>
          </div>
          <div className="p-3 sm:p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center" role="listitem">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-400" aria-label={`${results.skippedCount} skipped questions`}>{results.skippedCount}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400"><span aria-hidden="true">⏭️</span> Skipped</div>
          </div>
        </div>

        {hasSecretKey && !isUnlocked ? (
          <div className="text-center py-6 sm:py-8">
            <div className="text-4xl sm:text-5xl mb-4" aria-hidden="true">🔒</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Answers Hidden</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Enter the secret key to view question analysis</p>
            
            <form onSubmit={handleKeySubmit} className="max-w-sm mx-auto space-y-4">
              <div>
                <label htmlFor="secret-key" className="sr-only">Secret Key</label>
                <input
                  ref={keyInputRef}
                  id="secret-key"
                  type="password"
                  className={`w-full px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none ${keyError ? 'border-red-500' : 'border-gray-200 dark:border-white/10 focus:border-primary/50'}`}
                  placeholder="Enter secret key"
                  value={secretKey}
                  onChange={handleKeyChange}
                  autoFocus
                  aria-required="true"
                  aria-invalid={keyError ? 'true' : 'false'}
                  aria-describedby={keyError ? 'key-error' : undefined}
                />
              </div>
              {keyError && (
                <p id="key-error" className="text-red-400 text-sm" role="alert"><span aria-hidden="true">⚠️</span> Incorrect secret key</p>
              )}
              <button type="submit" className="w-full px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">
                Unlock Answers <span aria-hidden="true">🔓</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4"><span aria-hidden="true">📊</span> Question Analysis</h3>
            <div className="overflow-x-auto rounded-xl bg-gray-100 dark:bg-black/20">
              <table className="w-full min-w-[500px]">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-12" scope="col">#</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300" scope="col">Question</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-32" scope="col">Correct</th>
                    <th className="px-3 sm:px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 w-32" scope="col">Your Answer</th>
                    <th className="px-3 sm:px-4 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 w-12" scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((question, index) => {
                    const result = results.questionResults[index];
                    const correctIdx = Array.isArray(question.isCorrect) ? question.isCorrect : [question.isCorrect];
                    const correctText = correctIdx.map(i => question.options[i]?.text).filter(Boolean).join(', ') || '-';
                    
                    const studentIdx = answers[question.id];
                    let studentText = '-';
                    let statusClass = 'text-yellow-400';
                    let statusIcon = '⏭️';
                    let statusLabel = 'Skipped';
                    
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
        )}

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
              <CertificateCard 
                studentInfo={studentInfo} 
                config={config} 
                results={results} 
              />
            </div>
          )}
        </div>

        <aside className="text-center p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-4 sm:mb-6" aria-label="Study tip">
          <p className="text-sm text-gray-600 dark:text-gray-300"><span aria-hidden="true">💡</span> Review answers above to understand correct solutions. Practice makes perfect!</p>
        </aside>

        <div className="text-center">
          <button 
            className="px-6 sm:px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90"
            onClick={onRestart}
            aria-label="Return to home screen"
          >
            Back to Home <span aria-hidden="true">🏠</span>
          </button>
        </div>
      </article>
    </div>
  );
};

export default ResultScreen;
