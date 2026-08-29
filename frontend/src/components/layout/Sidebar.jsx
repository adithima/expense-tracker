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
    gap: '8px',
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 0',
    fontSize: '18px',
    fontWeight: location.pathname === path ? 'bold' : 'normal',
  });

  const notesButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    background: 'none',
    border: 'none',
    color: '#fff',
    textDecoration: 'none',
    padding: '10px 0',
    fontSize: '18px',
    fontWeight: notesOpen ? 'bold' : 'normal',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <aside
      style={{
        width: '250px',
        background: '#1f2937',
        color: '#fff',
        padding: '20px',
        minHeight: '100vh',
      }}
    >
      <h2>Expense Tracker</h2>

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
          }}
        >
          Close
        </button>
      )}
    </aside>
  );
};

export default Sidebar;