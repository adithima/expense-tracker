import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiGrid, FiList, FiFileText, FiCalendar, FiUser, FiTarget, FiMenu } from 'react-icons/fi';
import NotesWidget from '../notes/NotesWidget';

const NAV_ITEMS = [
  { path: '/dashboard', icon: FiGrid, label: 'Dashboard' },
  { path: '/transactions', icon: FiList, label: 'Transactions' },
  { path: '/budgets', icon: FiTarget, label: 'Budgets' },
  { path: '/calendar', icon: FiCalendar, label: 'Calendar' },
];

const LOGO_MARK = (
  <svg width="30" height="30" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
    <rect width="140" height="140" rx="30" fill="#0f1830" />
    <rect x="30" y="75" width="16" height="46" rx="3" fill="#FFFFFF" />
    <rect x="52" y="58" width="16" height="63" rx="3" fill="#F5D68C" />
    <rect x="74" y="40" width="16" height="81" rx="3" fill="#E8B94A" />
    <path d="M44 98 L60 75 L78 88 L106 52" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M92 46 L110 49 L105 67" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const [notesOpen, setNotesOpen] = useState(false);

  const linkStyle = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : '10px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    color: location.pathname === path ? '#e8b94a' : '#e9ecf3',
    textDecoration: 'none',
    padding: '12px 0',
    fontSize: '15px',
    fontWeight: location.pathname === path ? 700 : 500,
  });

  const notesButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : '10px',
    justifyContent: collapsed ? 'center' : 'flex-start',
    width: '100%',
    background: 'none',
    border: 'none',
    color: notesOpen ? '#e8b94a' : '#e9ecf3',
    padding: '12px 0',
    fontSize: '15px',
    fontWeight: notesOpen ? 700 : 500,
    cursor: 'pointer',
    textAlign: 'left',
  };

  const sidebarWidth = collapsed ? 72 : 250;

  return (
    <aside
      style={{
        width: `${sidebarWidth}px`,
        background: '#1b2a4a',
        color: '#fff',
        padding: collapsed ? '16px 10px' : '20px',
        minHeight: '100vh',
        transition: 'width 0.2s ease, padding 0.2s ease',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {!collapsed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <button
            onClick={onToggle}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 34, height: 34, borderRadius: '8px', color: '#fff', flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <FiMenu size={20} />
          </button>
          {LOGO_MARK}
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>Kharchup</h2>
        </div>
      )}

      <nav style={{ marginTop: collapsed ? '8px' : '24px' }}>
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <Link key={path} to={path} style={linkStyle(path)} title={collapsed ? label : undefined}>
            <Icon size={18} />
            {!collapsed && label}
          </Link>
        ))}

        <button onClick={() => setNotesOpen(true)} style={notesButtonStyle} title={collapsed ? 'Inkwell' : undefined}>
          <FiFileText size={18} />
          {!collapsed && 'Inkwell'}
        </button>

        <Link to="/profile" style={linkStyle('/profile')} title={collapsed ? 'Profile' : undefined}>
          <FiUser size={18} />
          {!collapsed && 'Profile'}
        </Link>
      </nav>

      <NotesWidget isOpen={notesOpen} onClose={() => setNotesOpen(false)} sidebarWidth={sidebarWidth} />
    </aside>
  );
};

export default Sidebar;