import React from 'react';
import { FiInbox } from 'react-icons/fi';

/**
 * Reusable "empty state" placeholder shown when a list has no data
 * (e.g. no transactions yet, or no results match the current filters).
 *
 * @param {React.ComponentType} icon - react-icons component (defaults to FiInbox)
 * @param {string} title
 * @param {string} message
 * @param {React.ReactNode} action - optional button/element (e.g. "Add Transaction")
 */
const EmptyState = ({ icon: Icon = FiInbox, title = 'No data found', message, action }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--color-text-secondary)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Icon size={28} color="var(--color-primary)" />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
        {title}
      </h3>
      {message && (
        <p style={{ fontSize: '14px', maxWidth: '320px', lineHeight: 1.6, marginBottom: action ? '20px' : 0 }}>
          {message}
        </p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;