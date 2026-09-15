import React, { useState } from 'react';
import { FiTrash2, FiPause, FiPlay, FiAlertTriangle, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { formatCurrency } from '../../utils/formatters';
import * as budgetAPI from '../../api/budgetAPI';
import toast from 'react-hot-toast';

/**
 * Shows a single budget's live progress: category/overall label,
 * spent vs limit, a color-coded progress bar, and quick actions
 * (pause/resume, delete). Color shifts from green -> amber -> red
 * as percentUsed climbs, matching the same visual language as the
 * Calendar heatmap's spend-intensity colors.
 *
 * Also supports stepping back through past periods (Previous/Next
 * arrows) for monthly/weekly budgets — custom-range budgets have no
 * history to navigate, so the arrows are hidden for those.
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
const BudgetProgressCard = ({ budget: liveBudget, currency, onToggleActive, onDelete, isActive = true }) => {
  const [offset, setOffset] = useState(0); // 0 = current/live period
  const [historyBudget, setHistoryBudget] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // When offset is 0, show the live data passed in via props (unchanged
  // behavior). When offset > 0, show the fetched historical snapshot instead.
  const budget = offset === 0 ? liveBudget : historyBudget;

  const canNavigateHistory = liveBudget.period !== 'custom';

  const fetchOffset = async (nextOffset) => {
    if (nextOffset === 0) {
      setOffset(0);
      setHistoryBudget(null);
      return;
    }
    setLoadingHistory(true);
    try {
      const data = await budgetAPI.getBudgetHistory(liveBudget.budgetId, nextOffset);
      setHistoryBudget(data.budget);
      setOffset(nextOffset);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load budget history');
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!budget) {
    return null;
  }

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

  const basePeriodLabel = period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'Custom period';
  const periodLabel =
    period === 'custom'
      ? 'Custom period'
      : offset === 0
      ? `This ${basePeriodLabel}`
      : offset === 1
      ? `Last ${basePeriodLabel}`
      : `${offset} ${basePeriodLabel}s ago`;

  return (
    <div className="card" style={{ padding: '18px', opacity: isActive ? 1 : 0.6 }}>
      <div className="flex-between" style={{ marginBottom: '10px', gap: '8px' }}>
         <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700 }}>{label}</p>
            {!isActive && offset === 0 && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--color-text-muted)',
                  color: '#fff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Paused
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {canNavigateHistory && (
              <button
                onClick={() => fetchOffset(offset + 1)}
                disabled={loadingHistory}
                title="View previous period"
                style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', padding: '2px' }}
              >
                <FiChevronLeft size={13} />
              </button>
            )}
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{periodLabel}</p>
            {canNavigateHistory && offset > 0 && (
              <button
                onClick={() => fetchOffset(offset - 1)}
                disabled={loadingHistory}
                title="View next period"
                style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-secondary)', padding: '2px' }}
              >
                <FiChevronRight size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Pause/Resume and Delete only make sense for the live period,
            not while viewing history — hide them when offset > 0 */}
        {offset === 0 && (
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
        )}
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
          opacity: loadingHistory ? 0.5 : 1,
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

      {(thresholdCrossed || limitExceeded) && offset === 0 && (
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