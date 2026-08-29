import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

/**
 * Compact banner listing budgets that have crossed their alert
 * threshold or been exceeded. Meant for Dashboard — a quick heads-up
 * without needing to visit the Budgets page. Dismissible per-session
 * (not persisted — reappears on next load if the budget is still
 * over threshold, which is intentional so it can't be permanently
 * silenced by accident).
 *
 * @param {Array} budgets - budget status objects (from getBudgets()),
 *   PRE-FILTERED by the caller to only those with thresholdCrossed
 *   or limitExceeded true. This component doesn't filter itself, so
 *   it stays simple and testable.
 * @param {string} currency
 * @param {Function} [onDismiss] - called with no args when the user
 *   closes the banner. Omit to hide the dismiss button entirely.
 */
const BudgetAlertBanner = ({ budgets, currency, onDismiss }) => {
  if (!budgets || budgets.length === 0) return null;

  const exceededCount = budgets.filter((b) => b.limitExceeded).length;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        marginBottom: '20px',
        backgroundColor: exceededCount > 0 ? 'var(--color-danger-light)' : '#fef3e2',
        border: `1px solid ${exceededCount > 0 ? 'var(--color-danger)' : '#f3c98a'}`,
      }}
    >
      <FiAlertTriangle
        size={18}
        style={{ flexShrink: 0, marginTop: '2px', color: exceededCount > 0 ? 'var(--color-danger)' : '#b45309' }}
      />

      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: exceededCount > 0 ? 'var(--color-danger)' : '#b45309' }}>
          {exceededCount > 0
            ? `${exceededCount} budget${exceededCount > 1 ? 's' : ''} exceeded`
            : 'Approaching budget limit'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {budgets.map((b) => {
            const label = b.isOverall ? 'Overall Budget' : b.category;
            return (
              <p key={b.budgetId} style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                <strong style={{ color: 'var(--color-text-primary)' }}>{label}</strong>
                {': '}
                {formatCurrency(b.spent, currency)} of {formatCurrency(b.limitAmount, currency)} ({b.percentUsed}%)
              </p>
            );
          })}
        </div>

        <Link
          to="/budgets"
          style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)', marginTop: '8px', display: 'inline-block' }}
        >
          View Budgets →
        </Link>
      </div>

      {onDismiss && (
        <button
          onClick={onDismiss}
          title="Dismiss"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)', flexShrink: 0,
          }}
        >
          <FiX size={16} />
        </button>
      )}
    </div>
  );
};

export default BudgetAlertBanner;