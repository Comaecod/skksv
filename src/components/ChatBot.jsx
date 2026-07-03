import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useSankara } from '../context/SankaraContext';
import { getAIResponse } from '../services/sankaraAI';
import FloatingWidget from './FloatingWidget';

const SendIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
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

function renderMessageText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function ChatBot({ isOpen, onToggle }) {
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
    if (isOpen && inputRef.current) inputRef.current.focus();
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

  const chatContent = (
    <div className="py-3 space-y-2">
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
  );

  const chatFooter = (
    <div className="p-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
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
  );

  return (
    <FloatingWidget
      position="right"
      buttonIcon={<SparkleIcon />}
      buttonLabel="Open Sankara AI chat"
      headerIcon={<SparkleIcon />}
      title="Sankara AI"
      subtitle={currentPage ? `Help for ${currentPage}` : 'Online'}
      isOpen={isOpen}
      onToggle={onToggle}
      visible={isSankaraVisible}
      footer={chatFooter}
      buttonOffset={80}
      buttonColor="linear-gradient(135deg, #6366f1, #8b5cf6)"
    >
      {chatContent}
    </FloatingWidget>
  );
}

export default ChatBot;
