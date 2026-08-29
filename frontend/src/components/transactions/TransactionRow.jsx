import React from 'react';
import { FiEdit2, FiTrash2, FiArrowUpCircle, FiArrowDownCircle } from 'react-icons/fi';
import { formatCurrency, formatDate, truncateText, capitalize } from '../../utils/formatters';

/**
 * Single transaction row, used in both the Transactions page table
 * and the Recent Transactions widget on the Dashboard (via `compact` prop).
 *
 * @param {Object} transaction
 * @param {string} currency
 * @param {function} onEdit
 * @param {function} onDelete
 * @param {boolean} compact - simplified layout for dashboard widget (no actions)
 */
const TransactionRow = ({ transaction, currency, onEdit, onDelete, compact = false }) => {
  const isIncome = transaction.type === 'income';

  return (
    <div
      className="flex-between"
      style={{
        padding: compact ? '12px 0' : '14px 4px',
        borderBottom: '1px solid var(--color-border)',
        gap: '12px',
      }}
    >
      <div className="flex" style={{ alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
        <div
          style={{
            flexShrink: 0,
            width: 38,
            height: 38,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isIncome ? 'var(--color-success-light)' : 'var(--color-danger-light)',
          }}
        >
          {isIncome ? (
            <FiArrowUpCircle color="var(--color-success)" size={18} />
          ) : (
            <FiArrowDownCircle color="var(--color-danger)" size={18} />
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
            {transaction.category}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            {formatDate(transaction.date)}
            {transaction.description && ` · ${truncateText(transaction.description, 30)}`}
            {!compact && transaction.paymentMethod && ` · ${capitalize(transaction.paymentMethod.replace('_', ' '))}`}
          </p>
        </div>
      </div>

      <div className="flex" style={{ alignItems: 'center', gap: '14px', flexShrink: 0 }}>
        <span
          style={{
            fontSize: compact ? '14px' : '15px',
            fontWeight: 700,
            color: isIncome ? 'var(--color-income)' : 'var(--color-expense)',
            whiteSpace: 'nowrap',
          }}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount, currency)}
        </span>

        {!compact && (
          <div className="flex" style={{ gap: '4px' }}>
            <button
              onClick={() => onEdit(transaction)}
              aria-label="Edit transaction"
              className="row-action-btn"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <FiEdit2 size={15} />
            </button>
            <button
              onClick={() => onDelete(transaction)}
              aria-label="Delete transaction"
              className="row-action-btn"
              style={{
                padding: '6px',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-danger)',
              }}
            >
              <FiTrash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <style>
        {`
          .row-action-btn:hover {
            background-color: var(--color-surface-hover);
          }
        `}
      </style>
    </div>
  );
};

export default TransactionRow;
