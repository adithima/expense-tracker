import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiSun, FiMoon, FiChevronDown, FiUser, FiLogOut, FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as notificationAPI from '../../api/notificationAPI';

/**
 * Top navigation bar.
 * Contains: notification bell, dark/light mode toggle, and a user
 * profile dropdown menu. The sidebar toggle/logo live permanently
 * in the Sidebar component itself, not here.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch {
      // Silent
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleBellClick = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setDropdownOpen(false);

    if (opening) {
      try {
        const data = await notificationAPI.getNotifications({ limit: 10 });
        setNotifications(data.notifications || []);
      } catch {
        // Silent
      }
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      // Silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silent
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // Silent
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const timeAgo = (dateStr) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <header
      style={{
        height: 'var(--navbar-height)',
        backgroundColor: 'var(--color-bg-secondary)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="flex" style={{ alignItems: 'center', gap: '12px' }}>
        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            aria-label="Notifications"
            title="Notifications"
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              backgroundColor: notifOpen ? 'var(--color-surface-hover)' : 'transparent',
            }}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  minWidth: 16,
                  height: 16,
                  padding: '0 3px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-danger)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '320px',
                maxHeight: '420px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              <div
                className="flex-between"
                style={{ padding: '12px 14px', borderBottom: '1px solid var(--color-border)' }}
              >
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <p style={{ padding: '24px 14px', textAlign: 'center', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      style={{
                        display: 'flex',
                        gap: '8px',
                        padding: '10px 14px',
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: n.isRead ? 'transparent' : 'var(--color-primary-light)',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700 }}>{n.title}</p>
                        <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {n.message}
                        </p>
                        <div className="flex-between" style={{ marginTop: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            {timeAgo(n.createdAt)}
                          </span>
                          {n.relatedBudget && (
                            <Link
                              to="/budgets"
                              onClick={() => setNotifOpen(false)}
                              style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-primary)' }}
                            >
                              View Budget
                            </Link>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n._id)}
                            title="Mark as read"
                            style={{ color: 'var(--color-success)', padding: '2px' }}
                          >
                            <FiCheck size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotification(n._id)}
                          title="Delete"
                          style={{ color: 'var(--color-text-muted)', padding: '2px' }}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark / Light mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-surface-hover)',
            transition: 'transform var(--transition-fast)',
          }}
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        {/* User profile dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setDropdownOpen((prev) => !prev);
              setNotifOpen(false);
            }}
            className="flex"
            style={{
              alignItems: 'center',
              gap: '8px',
              padding: '6px 10px 6px 6px',
              borderRadius: '999px',
              backgroundColor: dropdownOpen ? 'var(--color-surface-hover)' : 'transparent',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: '#1b2a4a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
              }}
            >
              {getInitials(user?.name)}
            </div>
            <span
              style={{ fontSize: '14px', fontWeight: 600 }}
              className="hide-on-mobile"
            >
              {user?.name || 'User'}
            </span>
            <FiChevronDown
              size={16}
              color="var(--color-text-secondary)"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform var(--transition-fast)',
              }}
            />
          </button>

          {dropdownOpen && (
            <div
              className="card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '200px',
                padding: '8px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 200,
              }}
            >
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/profile');
                }}
                className="dropdown-item"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-text-primary)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FiUser size={16} /> My Profile
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'var(--color-danger)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-danger-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <FiLogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          @media (max-width: 900px) {
            .hide-on-mobile { display: none; }
          }
        `}
      </style>
    </header>
  );
};

export default Navbar;