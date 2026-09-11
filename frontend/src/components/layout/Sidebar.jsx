import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiList, FiFileText, FiCalendar, FiUser, FiTarget } from 'react-icons/fi';
import NotesWidget from '../notes/NotesWidget';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const [notesOpen, setNotesOpen] = useState(false);

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: location.pathname === path ? '#e8b94a' : '#e9ecf3',
    textDecoration: 'none',
    padding: '10px 0',
    fontSize: '15px',
    fontWeight: location.pathname === path ? 700 : 500,
  });

  const notesButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    background: 'none',
    border: 'none',
    color: notesOpen ? '#e8b94a' : '#e9ecf3',
    textDecoration: 'none',
    padding: '10px 0',
    fontSize: '15px',
    fontWeight: notesOpen ? 700 : 500,
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <aside
      style={{
        width: '250px',
        background: '#1b2a4a',
        color: '#fff',
        padding: '20px',
        minHeight: '100vh',
      }}
    >
      {/* Kharchup logo mark */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <svg width="34" height="34" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
          <rect width="140" height="140" rx="30" fill="#0f1830" />
          <rect x="30" y="75" width="16" height="46" rx="3" fill="#FFFFFF" />
          <rect x="52" y="58" width="16" height="63" rx="3" fill="#F5D68C" />
          <rect x="74" y="40" width="16" height="81" rx="3" fill="#E8B94A" />
          <path d="M44 98 L60 75 L78 88 L106 52" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M92 46 L110 49 L105 67" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }}>Kharchup</h2>
      </div>

      <nav style={{ marginTop: '30px' }}>
        <Link to="/dashboard" style={linkStyle('/dashboard')}>
          <FiGrid size={18} />
          Dashboard
        </Link>

        <Link to="/transactions" style={linkStyle('/transactions')}>
          <FiList size={18} />
          Transactions
        </Link>

        <Link to="/budgets" style={linkStyle('/budgets')}>
          <FiTarget size={18} />
          Budgets
        </Link>

        <Link to="/calendar" style={linkStyle('/calendar')}>
          <FiCalendar size={18} />
          Calendar
        </Link>

        <button onClick={() => setNotesOpen(true)} style={notesButtonStyle}>
          <FiFileText size={18} />
          Inkwell
        </button>

        <Link to="/profile" style={linkStyle('/profile')}>
          <FiUser size={18} />
          Profile
        </Link>
      </nav>

      <NotesWidget isOpen={notesOpen} onClose={() => setNotesOpen(false)} />

      {isOpen && (
        <button
          onClick={onClose}
          style={{
            marginTop: '20px',
            padding: '8px 12px',
            cursor: 'pointer',
            color: '#fff',
          }}
        >
          Close
        </button>
      )}
    </aside>
  );
};

export default Sidebar;