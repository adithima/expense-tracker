import React from 'react';

/**
 * Reusable loading spinner.
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} fullPage - if true, centers the spinner in a full-viewport-height container
 */
const Spinner = ({ size = 'md', fullPage = false }) => {
  const sizeMap = {
    sm: 18,
    md: 32,
    lg: 48,
  };

  const dimension = sizeMap[size] || sizeMap.md;

  const spinner = (
    <div
      style={{
        width: dimension,
        height: dimension,
        border: `${Math.max(2, dimension / 10)}px solid var(--color-border)`,
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          width: '100%',
        }}
      >
        {spinner}
        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <>
      {spinner}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
};

export default Spinner;