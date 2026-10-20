import { useState } from 'react';
import * as aiAPI from '../../api/aiAPI';

const AskBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai', text: string }
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const userMessage = { role: 'user', text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setLoading(true);

    try {
      const data = await aiAPI.askAboutSpending(question);
      setMessages((prev) => [...prev, { role: 'ai', text: data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'ai', text: 'Could not get an answer right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--color-primary-dark, #1b2a4a)',
          color: '#fff',
          border: 'none',
          borderRadius: '9px',
          padding: '11px 18px',
          fontSize: '14px',
          fontWeight: 700,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ✨ AI Assistant
      </button>

      {isOpen && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            zIndex: 31,
            width: '340px',
            maxHeight: '480px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: 0,
          }}
        >
          <div
            style={{
              background: 'var(--color-primary-dark, #1b2a4a)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '14px' }}>Kharchup AI</span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close AI assistant"
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-bg-secondary, #eef1f7)', maxHeight: '340px' }}>
            {messages.length === 0 && (
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Ask me about your spending, budgets, or how to save more.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? 'var(--color-success-light, #e3f6ea)' : '#fff',
                  border: m.role === 'ai' ? '1px solid var(--color-border)' : 'none',
                  padding: '9px 13px',
                  borderRadius: '12px',
                  fontSize: '13px',
                }}
              >
                {m.text}
              </div>
            ))}
            {loading && <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Thinking...</p>}
          </div>

          <form onSubmit={handleAsk} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderTop: '1px solid var(--color-border)' }}>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your message..."
              style={{ flex: 1, border: '1px solid var(--color-border)', borderRadius: '999px', padding: '9px 14px', fontSize: '13px', outline: 'none' }}
            />
            <button type="submit" disabled={loading} style={{ background: 'var(--color-primary-dark, #1b2a4a)', color: '#fff', border: 'none', borderRadius: '999px', width: '36px', height: '36px', cursor: 'pointer' }}>
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AskBar;