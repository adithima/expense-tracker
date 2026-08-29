import React from 'react';

/**
 * Dashboard summary stat card (Total Income / Total Expense / Current Balance).
 *
 * @param {string} title
 * @param {string} value - pre-formatted currency string
 * @param {React.ComponentType} icon - react-icons component
 * @param {string} accentColor - CSS variable string, e.g. 'var(--color-success)'
 * @param {string} accentBg - CSS variable string for the icon's background
 */
const StatCard = ({ title, value, icon: Icon, accentColor, accentBg }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="flex-between">
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            backgroundColor: accentBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={19} color={accentColor} />
        </div>
      </div>
      <p style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
        {value}
      </p>
    </div>
  );
};

export default StatCard;