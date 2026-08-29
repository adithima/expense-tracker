import React, { useEffect } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Reusable Modal component.
 * Used for the Add/Edit Transaction form and delete confirmation dialogs.
 *
 * @param {boolean} isOpen - controls visibility
 * @param {function} onClose - called when the modal should close (backdrop click, X button, Escape key)
 * @param {string} title - modal header title
 * @param {React.ReactNode} children - modal body content
 * @param {string} maxWidth - optional max-width override (e.g. '500px')
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = '480px' }) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);

    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 17, 23, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div
          className="flex-between"
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: '50%',
              color: 'var(--color-text-secondary)',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <FiX size={20} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>{children}</div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(16px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default Modal;