import { useState } from 'react';
import { FiMessageSquare } from 'react-icons/fi';
import * as aiAPI from '../../api/aiAPI';

const AskBar = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    try {
      const data = await aiAPI.askAboutSpending(question);
      setAnswer(data.answer);
    } catch {
      setAnswer('Could not get an answer right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <form onSubmit={handleAsk} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FiMessageSquare size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your spending..."
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', background: 'transparent' }}
        />
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading}>
          {loading ? '...' : 'Ask'}
        </button>
      </form>
      {answer && (
        <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {answer}
        </p>
      )}
    </div>
  );
};

export default AskBar;