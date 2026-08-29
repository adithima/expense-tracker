import React from 'react';
import { formatCurrency } from '../../utils/formatters';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Builds a flat array of calendar cells for the given month, including
 * leading `null` placeholders so the 1st lines up under the correct
 * weekday column (like a real calendar grid, not just a bare list of days).
 */
const buildMonthCells = (year, month) => {
  // month is 1-12 here; JS Date month is 0-indexed
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = firstDay.getDay(); // 0 = Sunday

  const cells = [];
  for (let i = 0; i < leadingBlanks; i++) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    cells.push({ day, dateKey });
  }
  return cells;
};

/**
 * Picks a heat color based on how this day's spend compares to the
 * highest-spend day in the month (relative intensity, not an absolute
 * scale) — so the heatmap stays meaningful whether the user spends
 * 500 or 50,000 a month.
 */
const getHeatStyle = (amount, maxAmount) => {
  if (!amount || amount <= 0 || maxAmount <= 0) {
    return { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-muted)' };
  }

  const ratio = amount / maxAmount;

  // Bucketed intensity keeps the color scale legible instead of a smooth
  // gradient, which is hard to distinguish at a glance in a small grid.
  if (ratio > 0.75) {
    return { backgroundColor: 'var(--color-danger)', color: '#fff' };
  }
  if (ratio > 0.5) {
    return { backgroundColor: 'var(--color-warning)', color: '#fff' };
  }
  if (ratio > 0.25) {
    return { backgroundColor: 'var(--color-warning-light)', color: 'var(--color-text-primary)' };
  }
  return { backgroundColor: 'var(--color-success-light)', color: 'var(--color-text-primary)' };
};

/**
 * CalendarHeatmap
 * Renders a month as a 7-column grid, color-coding each day by relative
 * expense intensity. Days that have a pinned journal note get a small
 * dot indicator. Clicking a day notifies the parent (used to open a
 * combined transactions + note view for that day).
 *
 * @param {number} year
 * @param {number} month - 1-12
 * @param {Object} days - map of 'YYYY-MM-DD' -> { income, expense, total, count } from getCalendarData
 * @param {Set<string>} notedDates - set of 'YYYY-MM-DD' strings that have a pinned note
 * @param {function} onDayClick - (dateKey, dayData) => void
 * @param {string} currency
 */
const CalendarHeatmap = ({ year, month, days = {}, notedDates = new Set(), onDayClick, currency = 'INR' }) => {
  const cells = buildMonthCells(year, month);

  const maxAmount = Object.values(days).reduce(
    (max, d) => Math.max(max, d.expense || 0),
    0
  );

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    // Capped width + centered so cells stay compact on wide screens instead
    // of stretching to fill the whole card.
    <div style={{ maxWidth: '420px', margin: '0 auto' }}>
      {/* Weekday header row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '5px',
          marginBottom: '6px',
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '5px',
        }}
      >
        {cells.map((cell, idx) => {
          if (!cell) {
            return <div key={`blank-${idx}`} />;
          }

          const dayData = days[cell.dateKey];
          const heatStyle = getHeatStyle(dayData?.expense, maxAmount);
          const hasNote = notedDates.has(cell.dateKey);
          const isToday = cell.dateKey === todayKey;

          return (
            <button
              key={cell.dateKey}
              onClick={() => onDayClick?.(cell.dateKey, dayData || null)}
              title={
                dayData
                  ? `${formatCurrency(dayData.expense || 0, currency)} spent, ${dayData.count} transaction${dayData.count === 1 ? '' : 's'}`
                  : 'No transactions'
              }
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: 'var(--radius-sm)',
                border: isToday ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: isToday ? 700 : 500,
                cursor: 'pointer',
                ...heatStyle,
              }}
            >
              {cell.day}
              {hasNote && (
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    boxShadow: '0 0 0 1.5px #fff',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend
          NOTE: the Low/Medium swatches use very pale tint colors
          (--color-success-light / --color-warning-light) which are
          nearly white and disappeared against the card's white background
          with only a thin var(--color-border) outline. Each swatch below
          gets its own slightly stronger, color-matched border instead of
          the generic border variable, so the tint is still visible even
          on light backgrounds. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Spend:</span>
        {[
          { label: 'None', bg: 'var(--color-surface-hover)', border: 'var(--color-border)' },
          { label: 'Low', bg: 'var(--color-success-light)', border: '#a3e9cd' },
          { label: 'Medium', bg: 'var(--color-warning-light)', border: '#f8d38f' },
          { label: 'High', bg: 'var(--color-warning)', border: 'var(--color-warning)' },
          { label: 'Very high', bg: 'var(--color-danger)', border: 'var(--color-danger)' },
        ].map((item) => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                border: `1.5px solid ${item.border}`,
                backgroundColor: item.bg,
              }}
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{item.label}</span>
          </span>
        ))}
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '4px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Has note</span>
        </span>
      </div>
    </div>
  );
};

export default CalendarHeatmap;