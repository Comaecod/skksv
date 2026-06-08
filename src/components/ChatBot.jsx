import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getAIResponse } from '../services/sankaraAI';
import { useSankara } from '../context/SankaraContext';

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const MinusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SparkleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z" />
    <circle cx="19" cy="5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

const pageNameMap = {
  '/': 'Home',
  '/assessments': 'Assessments',
  '/holiday-homework': 'Holiday Homework',
  '/people': 'Staff Directory',
  '/gallery': 'Gallery',
  '/contact': 'Contact',
  '/feedback': 'Feedback',
  '/reports': 'Reports',
  '/timed-assessments': 'Timed Assessments',
};

function getPageName(pathname) {
  const match = Object.entries(pageNameMap).find(([path]) => pathname.startsWith(path));
  return match ? match[1] : '';
}

const WELCOME_MESSAGE = {
  role: 'bot',
  text: 'Namaskaram! \u{1F64F} I\'m **Sankara**, your AI assistant. I can help you with school info, navigating the app, taking assessments, and more. What would you like to know?',
};

function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 py-1">
      <div className="flex items-center gap-2 px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'var(--overlay)', color: 'var(--text-secondary)' }}>
        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--accent)', animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const { isSankaraVisible } = useSankara();

  const currentPage = getPageName(location.pathname);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    try {
      const history = messages
        .filter(m => m.role !== 'system')
        .slice(-10)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));

      const res = await getAIResponse(text, { currentPage, history });
      setMessages(prev => [...prev, { role: 'bot', text: res.text, source: res.source }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, currentPage]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isSankaraVisible) return null;

  return (
    <>
      <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40 flex flex-col items-start">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mb-3 w-[calc(100vw-2rem)] sm:w-[380px] max-w-[420px]"
              style={{
                height: 'min(500px, calc(100vh - 180px))',
                background: 'var(--bg-card)',
                border: '1px solid var(--glass-border)',
                borderRadius: '1.25rem',
                boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
                backdropFilter: 'blur(20px)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
                style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, var(--accent), #764ba2)', color: 'white' }}>
                    <SparkleIcon />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sankara AI</div>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{currentPage ? `Help for ${currentPage}` : 'Online'}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:opacity-70"
                  style={{ color: 'var(--text-muted)' }}
                  aria-label="Minimize chat"
                >
                  <MinusIcon />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2" style={{ scrollBehavior: 'smooth' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-2xl rounded-tr-sm text-white'
                          : 'rounded-2xl rounded-tl-sm'
                      }`}
                      style={
                        msg.role === 'user'
                          ? { background: 'var(--accent)' }
                          : { background: 'var(--overlay)', color: 'var(--text-primary)' }
                      }
                    >
                      {renderMessageText(msg.text)}
                    </div>
                  </div>
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border outline-none transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                    aria-label="Type your message"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: 'var(--accent)', color: 'white' }}
                    aria-label="Send message"
                  >
                    <SendIcon />
                  </button>
                </div>
                <div className="text-[10px] text-center mt-1.5" style={{ color: 'var(--text-muted)' }}>
                  Powered by Sankara AI
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(prev => !prev)}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all shrink-0 relative"
          style={{ background: 'linear-gradient(135deg, var(--accent), #764ba2)', color: 'white' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={isOpen ? 'Close chat' : 'Open Sankara AI chat'}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <CloseIcon />
              </motion.span>
            ) : (
              <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <SparkleIcon />
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!isOpen && !isLoading && messages.length <= 1 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-gray-900"
              />
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </>
  );
}

function renderMessageText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default ChatBot;
