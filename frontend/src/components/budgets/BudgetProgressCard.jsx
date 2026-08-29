import React from 'react';
import { FiTrash2, FiPause, FiPlay, FiAlertTriangle } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';

/**
 * Shows a single budget's live progress: category/overall label,
 * spent vs limit, a color-coded progress bar, and quick actions
 * (pause/resume, delete). Color shifts from green -> amber -> red
 * as percentUsed climbs, matching the same visual language as the
 * Calendar heatmap's spend-intensity colors.
 *
 * @param {Object} budget - status object as returned by getBudgets()/
 *   getBudgetStatus(): { budgetId, category, isOverall, period,
 *   limitAmount, spent, remaining, percentUsed, alertThreshold,
 *   thresholdCrossed, limitExceeded }
 * @param {string} currency
 * @param {Function} onToggleActive - (budgetId, nextIsActive) => void
 * @param {Function} onDelete - (budgetId) => void
 * @param {boolean} [isActive=true] - whether this budget is currently active
 */
const BudgetProgressCard = ({ budget, currency, onToggleActive, onDelete, isActive = true }) => {
  const {
    budgetId,
    category,
    isOverall,
    period,
    limitAmount,
    spent,
    remaining,
    percentUsed,
    limitExceeded,
    thresholdCrossed,
  } = budget;

  const label = isOverall ? 'Overall Budget' : category;

  const barColor = limitExceeded
    ? 'var(--color-danger)'
    : thresholdCrossed
    ? 'var(--color-warning, #f59e0b)'
    : 'var(--color-success)';

  // Cap the visual bar at 100% even if spending has gone over —
  // the exact overage is already shown numerically below the bar,
  // no need for the bar itself to overflow its container.
  const barWidth = Math.min(percentUsed, 100);

  const periodLabel = period === 'monthly' ? 'This month' : period === 'weekly' ? 'This week' : 'Custom period';

  return (
    <div className="card" style={{ padding: '18px', opacity: isActive ? 1 : 0.6 }}>
      <div className="flex-between" style={{ marginBottom: '10px', gap: '8px' }}>
        <div>
          <p style={{ fontSize: '15px', fontWeight: 700 }}>{label}</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{periodLabel}</p>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onToggleActive(budgetId, !isActive)}
            title={isActive ? 'Pause this budget' : 'Resume this budget'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
            }}
          >
            {isActive ? <FiPause size={14} /> : <FiPlay size={14} />}
          </button>
          <button
            onClick={() => onDelete(budgetId)}
            title="Delete this budget"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', color: 'var(--color-danger)',
            }}
          >
            <FiTrash2 size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '10px',
          borderRadius: '999px',
          backgroundColor: 'var(--color-surface-hover)',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        <div
          style={{
            width: `${barWidth}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      <div className="flex-between" style={{ marginBottom: '4px' }}>
        <span style={{ fontSize: '13px', fontWeight: 700 }}>
          {formatCurrency(spent, currency)} <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)' }}>of {formatCurrency(limitAmount, currency)}</span>
        </span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: barColor }}>
          {percentUsed}%
        </span>
      </div>

      <p style={{ fontSize: '12px', color: remaining < 0 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
        {remaining >= 0
          ? `${formatCurrency(remaining, currency)} remaining`
          : `${formatCurrency(Math.abs(remaining), currency)} over budget`}
      </p>

      {(thresholdCrossed || limitExceeded) && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            marginTop: '10px', padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: limitExceeded ? 'var(--color-danger-light)' : '#fef3e2',
            color: limitExceeded ? 'var(--color-danger)' : '#b45309',
            fontSize: '12px', fontWeight: 600,
          }}
        >
          <FiAlertTriangle size={13} />
          {limitExceeded ? 'Budget exceeded' : 'Approaching limit'}
        </div>
      )}
    </div>
  );
};

export default BudgetProgressCard;