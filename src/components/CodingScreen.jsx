import { useState, useEffect, useRef, useCallback } from 'react';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
const INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/';

async function initPyodide() {
  if (window.__pyodide) return window.__pyodide;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PYODIDE_URL;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load Pyodide'));
    document.head.appendChild(s);
  });
  const pyodide = await window.loadPyodide({ indexURL: INDEX_URL });
  window.__pyodide = pyodide;
  return pyodide;
}

const LineNumbers = ({ lines }) => (
  <div className="select-none text-right pr-3 py-3 text-gray-500 text-sm leading-6 font-mono bg-[#1e1e1e] border-r border-gray-700/30 shrink-0" style={{ minWidth: '3rem' }}>
    {Array.from({ length: lines }, (_, i) => (
      <div key={i}>{i + 1}</div>
    ))}
  </div>
);

export default function CodingScreen({ config, studentInfo, onComplete }) {
  const coding = config?.coding || {};
  const { problemStatement = '', examples = '', starterCode = '', functionName = 'solution', testCases = [] } = coding;

  const [code, setCode] = useState(starterCode || '# Write your Python code here');
  const [pyReady, setPyReady] = useState(false);
  const [pyError, setPyError] = useState(null);
  const [loadingPy, setLoadingPy] = useState(true);
  const [output, setOutput] = useState('');
  const [testResults, setTestResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outputTab, setOutputTab] = useState('output');
  const [leftWidth, setLeftWidth] = useState(50);
  const [horizDragging, setHorizDragging] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [vertDragging, setVertDragging] = useState(false);
  const containerRef = useRef(null);
  const rightPanelRef = useRef(null);
  const pyRef = useRef(null);
  const editorRef = useRef(null);
  const gutterRef = useRef(null);

  const handleHorizMouseDown = useCallback((e) => {
    e.preventDefault();
    setHorizDragging(true);
  }, []);

  const handleVertMouseDown = useCallback((e) => {
    e.preventDefault();
    setVertDragging(true);
  }, []);

  useEffect(() => {
    if (!horizDragging) return;
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let pct = ((e.clientX - rect.left) / rect.width) * 100;
      if (pct < 20) pct = 20;
      if (pct > 80) pct = 80;
      setLeftWidth(pct);
    };
    const handleMouseUp = () => setHorizDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [horizDragging]);

  useEffect(() => {
    if (horizDragging) document.body.style.cursor = 'col-resize';
    else if (!vertDragging) document.body.style.cursor = '';
  }, [horizDragging]);

  useEffect(() => {
    if (!vertDragging) return;
    const handleMouseMove = (e) => {
      if (!rightPanelRef.current) return;
      const rect = rightPanelRef.current.getBoundingClientRect();
      let h = rect.bottom - e.clientY;
      if (h < 80) h = 80;
      if (h > rect.height - 80) h = rect.height - 80;
      setConsoleHeight(h);
    };
    const handleMouseUp = () => setVertDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [vertDragging]);

  useEffect(() => {
    if (vertDragging) document.body.style.cursor = 'row-resize';
    else if (!horizDragging) document.body.style.cursor = '';
  }, [vertDragging]);

  const lineCount = code.split('\n').length;

  useEffect(() => {
    initPyodide()
      .then((py) => {
        pyRef.current = py;
        setPyReady(true);
        setLoadingPy(false);
      })
      .catch((err) => {
        setPyError(err.message);
        setLoadingPy(false);
      });
  }, []);

  const syncScroll = () => {
    if (gutterRef.current && editorRef.current) {
      gutterRef.current.scrollTop = editorRef.current.scrollTop;
    }
  };

  const executeUserCode = useCallback(async () => {
    if (!pyRef.current) return null;
    pyRef.current.globals.clear();

    let stdout = '';
    let stderr = '';
    pyRef.current.setStdout({ batched: (t) => { stdout += t + '\n'; }, isatty: false });
    pyRef.current.setStderr({ batched: (t) => { stderr += t + '\n'; }, isatty: false });

    const result = await pyRef.current.runPythonAsync(code);
    const out = stdout || stderr || String(result ?? '');
    return out.trim();
  }, [code]);

  const runAllTests = useCallback(async () => {
    if (!pyRef.current) return [];
    pyRef.current.globals.clear();

    let stdout = '';
    let stderr = '';
    pyRef.current.setStdout({ batched: (t) => { stdout += t + '\n'; }, isatty: false });
    pyRef.current.setStderr({ batched: (t) => { stderr += t + '\n'; }, isatty: false });

    await pyRef.current.runPythonAsync(code);

    const results = [];
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      try {
        const args = tc.input || [];
        const fn = pyRef.current.globals.get(functionName);
        if (!fn) throw new Error(`Function '${functionName}' not defined`);
        const result = fn(...args);
        const expected = tc.expected;
        const passed = String(result) === String(expected);
        const resultStr = result !== undefined && result !== null ? String(result) : 'None';
        results.push({ index: i, passed, result: resultStr, expected: String(expected), error: null });
      } catch (err) {
        results.push({ index: i, passed: false, result: null, expected: String(tc.expected), error: err.message });
      }
    }
    return results;
  }, [code, testCases, functionName]);

  const runCode = useCallback(async () => {
    if (!pyRef.current) return;
    setRunning(true);
    setOutputTab('output');
    setTestResults(null);
    setOutput('Running...');
    try {
      const out = await executeUserCode();
      setOutput(out || 'Code executed successfully.');
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
    setRunning(false);
  }, [executeUserCode]);

  const runTests = useCallback(async () => {
    if (!pyRef.current || !testCases.length) return;
    setRunning(true);
    setOutputTab('test');
    setOutput('Running tests...');
    setTestResults(null);
    try {
      const results = await runAllTests();
      setTestResults(results);
      const passed = results.filter(r => r.passed).length;
      setOutput(`Tests: ${passed}/${results.length} passed`);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
    setRunning(false);
  }, [runAllTests, testCases]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { db } = await import('../firebase');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const examKey = `${config.examType}_${config.classNum}_${config.subject}`;
      await addDoc(collection(db, 'submissions'), {
        type: 'coding',
        examKey,
        examType: config.examType,
        subject: config.subject,
        title: config.examTitle,
        assessmentId: config.id || '',
        student: {
          userId: studentInfo?.userId || null,
          name: studentInfo?.name || `${studentInfo?.firstName || ''} ${studentInfo?.lastName || ''}`.trim() || 'Unknown',
          rollNumber: studentInfo?.rollNumber || '',
        },
        code,
        testResults: testResults || [],
        score: testResults ? testResults.filter(r => r.passed).length : 0,
        total: testCases.length,
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      setOutput(`Submit error: ${err.message}`);
    }
    setSubmitting(false);
  };

  if (submitted) {
    const passed = testResults ? testResults.filter(r => r.passed).length : 0;
    return (
      <div className="fixed inset-0 z-50 bg-[#1a1a2e] flex items-center justify-center p-4">
        <div className="bg-[#282843] border border-white/10 rounded-xl w-full max-w-lg text-center p-8">
          <div className="text-6xl mb-4">{passed === testCases.length ? '🎉' : '📋'}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Submission Received</h2>
          <p className="text-gray-400 mb-6">Your coding assessment has been submitted.</p>
          <div className="p-4 rounded-lg bg-white/5 mb-6">
            <p className="text-lg font-bold text-white">{passed}/{testCases.length}</p>
            <p className="text-sm text-gray-400">Test cases passed</p>
          </div>
          <button onClick={onComplete} className="px-6 py-3 rounded-lg font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-all">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const passedCount = testResults ? testResults.filter(r => r.passed).length : 0;
  const totalTests = testResults ? testResults.length : testCases.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-[#282843] border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">{config?.examTitle || 'Coding Assessment'}</span>
          <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">{config?.subject}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSubmit} disabled={submitting || running} className="px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 transition-all">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>

      {/* Main split */}
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        {/* Left panel - Problem */}
        <div className="min-w-0 overflow-y-auto bg-[#1e1e36]" style={{ width: `${leftWidth}%` }}>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Problem</span>
            </div>
            <h3 className="text-base font-semibold text-white mb-3">{config?.examTitle || 'Untitled'}</h3>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{problemStatement}</p>
            {examples && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Examples</p>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono bg-black/30 rounded-lg p-4 border border-white/5">{examples}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Horizontal draggable divider */}
        <div
          onMouseDown={handleHorizMouseDown}
          className="w-1 shrink-0 bg-white/5 hover:bg-blue-500 cursor-col-resize transition-colors relative z-10"
        />

        {/* Right panel - Editor + Console */}
        <div ref={rightPanelRef} className="flex-1 flex flex-col min-w-0">
          {/* Editor */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#282843] border-b border-white/10 shrink-0">
              <span className="text-xs text-gray-400 font-mono">solution.py</span>
              <span className={`text-xs ${loadingPy ? 'text-yellow-400' : pyError ? 'text-red-400' : 'text-emerald-400'}`}>
                {loadingPy ? 'loading...' : pyError ? 'error' : 'Python 3'}
              </span>
            </div>
            <div className="flex flex-1 bg-[#1e1e1e]">
              <LineNumbers lines={lineCount} />
              <textarea
                ref={editorRef}
                onScroll={syncScroll}
                value={code}
                onChange={e => setCode(e.target.value)}
                className="flex-1 p-3 text-sm leading-6 font-mono text-gray-100 bg-transparent outline-none resize-none border-none"
                style={{ tabSize: 4 }}
                spellCheck={false}
              />
            </div>
          </div>

          {/* Vertical draggable divider */}
          <div
            onMouseDown={handleVertMouseDown}
            className="h-1 shrink-0 bg-white/5 hover:bg-blue-500 cursor-row-resize transition-colors relative z-10"
          />

          {/* Console */}
          <div className="shrink-0 bg-[#1e1e1e]" style={{ height: consoleHeight }}>
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#282843] border-b border-white/10">
              <div className="flex items-center gap-4">
                <button onClick={() => setOutputTab('output')} className={`text-xs font-medium transition-colors ${outputTab === 'output' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>Console</button>
                {testResults && (
                  <button onClick={() => setOutputTab('test')} className={`text-xs font-medium transition-colors ${outputTab === 'test' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    Test Results ({passedCount}/{totalTests})
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={runCode} disabled={running || !pyReady || loadingPy} className="px-3 py-1 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 transition-all">
                  {running ? 'Running...' : '▶ Run'}
                </button>
                <button onClick={runTests} disabled={running || !pyReady || loadingPy || !testCases.length} className="px-3 py-1 rounded text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-40 transition-all">
                  Run Tests
                </button>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(100% - 34px)' }}>
              {outputTab === 'output' && (
                <pre className="p-4 text-sm font-mono text-gray-200 min-h-[80px] whitespace-pre-wrap">
                  {loadingPy ? 'Initializing Python runtime...' : pyError ? `⚠ ${pyError}` : output || 'Click Run or Run Tests to see output'}
                </pre>
              )}
              {outputTab === 'test' && testResults && (
                <div>
                  <div className="divide-y divide-white/5">
                    {testResults.map((tr, i) => (
                      <div key={i} className={`px-4 py-2 flex items-center gap-3 text-sm ${tr.passed ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${tr.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {tr.passed ? '✓' : '✗'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-300">Test {i + 1}</p>
                          <p className="text-xs text-gray-500 font-mono truncate">
                            {tr.error ? `Error: ${tr.error}` : `Got ${tr.result}, expected ${tr.expected}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 bg-white/5 text-center border-t border-white/5">
                    <span className="text-sm font-bold text-white">{passedCount}/{totalTests} passed</span>
                  </div>
                </div>
              )}
              {outputTab === 'test' && !testResults && (
                <pre className="p-4 text-sm font-mono text-gray-500 min-h-[80px] whitespace-pre-wrap">Click Run Tests to see results</pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
