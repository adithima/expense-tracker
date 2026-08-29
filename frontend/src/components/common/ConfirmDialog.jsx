import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import Modal from './Modal';

/**
 * Reusable confirmation dialog, built on top of the generic Modal.
 * Used for destructive actions like deleting a transaction or account.
 *
 * @param {boolean} isOpen
 * @param {function} onClose - called when user cancels
 * @param {function} onConfirm - called when user confirms the action
 * @param {string} title
 * @param {string} message
 * @param {boolean} isLoading - shows a loading state on the confirm button
 * @param {string} confirmText
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  isLoading = false,
  confirmText = 'Delete',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="400px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiAlertTriangle color="var(--color-danger)" size={20} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: 1.6, paddingTop: '8px' }}>
            {message}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Deleting...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
