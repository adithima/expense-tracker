import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight, FiFileText, FiInbox, FiDollarSign, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as transactionAPI from '../api/transactionAPI';
import { getNotes, getNoteByDate } from '../api/noteAPI';
import CalendarHeatmap from '../components/calendar/CalendarHeatMap';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Calendar Page
 * - Month-navigable spending heatmap + a monthly stat strip (Balance/
 *   Income/Expense scoped to whichever month is being viewed).
 * - An All-Time Overview section (stat cards + pie chart + bar chart),
 *   same data source as Dashboard's getSummary(), fetched once since
 *   it doesn't depend on which month is currently browsed.
 * - Days with a pinned Inkwell note are marked with a dot. Clicking a
 *   day opens a modal with that day's transactions + note together.
 */
const Calendar = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1); // 1-12

  const [calendarDays, setCalendarDays] = useState({});
  const [notedDates, setNotedDates] = useState(new Set());
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // All-time overview (independent of viewYear/viewMonth, fetched once)
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Day-detail modal state
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDayData, setSelectedDayData] = useState(null);
  const [selectedNote, setSelectedNote] = useState(null);
  const [dayTransactions, setDayTransactions] = useState([]);
  const [dayModalLoading, setDayModalLoading] = useState(false);

  // Fetch all-time overview once on mount — doesn't change when the
  // user navigates between months with the < > arrows.
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await transactionAPI.getSummary();
        setSummary(data);
      } catch (error) {
        toast.error('Failed to load all-time overview');
      } finally {
        setSummaryLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const fetchCalendarData = useCallback(async () => {
    try {
      setLoading(true);

      const [calendarResult, notesResult, statsResult] = await Promise.allSettled([
        transactionAPI.getCalendarData(viewYear, viewMonth),
        getNotes(),
        transactionAPI.getMonthlyStats(viewYear, viewMonth),
      ]);

      if (calendarResult.status === 'fulfilled') {
        setCalendarDays(calendarResult.value.days || {});
      } else {
        toast.error('Failed to load calendar data');
      }

      if (notesResult.status === 'fulfilled') {
        const monthPrefix = `${viewYear}-${String(viewMonth).padStart(2, '0')}`;
        const dated = (notesResult.value.notes || [])
          .filter((n) => n.date && n.date.startsWith(monthPrefix))
          .map((n) => n.date);
        setNotedDates(new Set(dated));
      }

      if (statsResult.status === 'fulfilled') {
        setMonthlyStats(statsResult.value);
      } else {
        setMonthlyStats(null);
        toast.error('Failed to load monthly totals');
      }
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const goToPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
  };

  const handleDayClick = async (dateKey, dayData) => {
    setSelectedDate(dateKey);
    setSelectedDayData(dayData);
    setDayModalLoading(true);
    setSelectedNote(null);
    setDayTransactions([]);

    try {
      const [noteRes, txRes] = await Promise.all([
        getNoteByDate(dateKey),
        transactionAPI.getTransactions({ startDate: dateKey, endDate: dateKey, limit: 50 }),
      ]);
      setSelectedNote(noteRes.note || null);
      setDayTransactions(txRes.transactions || []);
    } catch (error) {
      toast.error('Failed to load details for this day');
    } finally {
      setDayModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedDayData(null);
    setSelectedNote(null);
    setDayTransactions([]);
  };

  const formatSelectedDateLabel = (dateKey) => {
    if (!dateKey) return '';
    const [y, m, d] = dateKey.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Calendar</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            See daily spending at a glance, and revisit your Inkwell notes by day.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-secondary"
            onClick={goToToday}
            style={{ fontSize: '13px', padding: '8px 14px' }}
          >
            Today
          </button>
          <button
            onClick={goToPrevMonth}
            title="Previous month"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
            }}
          >
            <FiChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '15px', fontWeight: 700, minWidth: '150px', textAlign: 'center' }}>
            {MONTH_NAMES[viewMonth - 1]} {viewYear}
          </span>
          <button
            onClick={goToNextMonth}
            title="Next month"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)',
            }}
          >
            <FiChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Monthly Summary Strip — Balance / Income / Expense for viewYear/viewMonth */}
      {!loading && monthlyStats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', flexShrink: 0 }}>
              <FiDollarSign size={18} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Balance ({MONTH_NAMES[viewMonth - 1]})
              </p>
              <p style={{ fontSize: '17px', fontWeight: 700 }}>
                {formatCurrency(monthlyStats.currentBalance || 0, currency)}
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', flexShrink: 0 }}>
              <FiTrendingUp size={18} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Income ({MONTH_NAMES[viewMonth - 1]})
              </p>
              <p style={{ fontSize: '17px', fontWeight: 700 }}>
                {formatCurrency(monthlyStats.totalIncome || 0, currency)}
              </p>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', flexShrink: 0 }}>
              <FiTrendingDown size={18} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                Expense ({MONTH_NAMES[viewMonth - 1]})
              </p>
              <p style={{ fontSize: '17px', fontWeight: 700 }}>
                {formatCurrency(monthlyStats.totalExpense || 0, currency)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Heatmap Card */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        {loading ? (
          <Spinner size="lg" />
        ) : (
          <CalendarHeatmap
            year={viewYear}
            month={viewMonth}
            days={calendarDays}
            notedDates={notedDates}
            onDayClick={handleDayClick}
            currency={currency}
          />
        )}
      </div>

      {/* All-Time Overview — same data source as Dashboard (getSummary),
          independent of the month currently being browsed above. */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>All-Time Overview</h2>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          Totals across every transaction you've ever added.
        </p>
      </div>

      {summaryLoading ? (
        <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', flexShrink: 0 }}>
                <FiDollarSign size={18} />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  All-Time Balance
                </p>
                <p style={{ fontSize: '17px', fontWeight: 700 }}>
                  {formatCurrency(summary?.balance || 0, currency)}
                </p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', flexShrink: 0 }}>
                <FiTrendingUp size={18} />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  All-Time Income
                </p>
                <p style={{ fontSize: '17px', fontWeight: 700 }}>
                  {formatCurrency(summary?.totalIncome || 0, currency)}
                </p>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', flexShrink: 0 }}>
                <FiTrendingDown size={18} />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  All-Time Expense
                </p>
                <p style={{ fontSize: '17px', fontWeight: 700 }}>
                  {formatCurrency(summary?.totalExpense || 0, currency)}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.4fr)',
              gap: '20px',
              marginBottom: '24px',
            }}
            className="calendar-charts-grid"
          >
            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
                Expense by Category
              </h3>
              <CategoryPieChart data={summary?.categoryBreakdown} currency={currency} />
            </div>

            <div className="card">
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
                Monthly Income vs Expense
              </h3>
              <MonthlyBarChart data={summary?.monthlySummary} currency={currency} />
            </div>
          </div>
        </>
      )}

      {/* Day Detail Modal */}
      <Modal
        isOpen={!!selectedDate}
        onClose={closeModal}
        title={formatSelectedDateLabel(selectedDate)}
        maxWidth="480px"
      >
        <div style={{ padding: '20px' }}>
          {dayModalLoading ? (
            <Spinner />
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-surface-hover)',
                  marginBottom: '18px',
                }}
              >
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Spent
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-expense)' }}>
                    {formatCurrency(selectedDayData?.expense || 0, currency)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Earned
                  </p>
                  <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-income)' }}>
                    {formatCurrency(selectedDayData?.income || 0, currency)}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  <FiFileText size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  Inkwell Note
                </p>
                {selectedNote ? (
                  <p
                    style={{
                      fontSize: '14px',
                      color: 'var(--color-text-primary)',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#fdeef4',
                      border: '1px solid #f3aecb',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {selectedNote.content}
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                    No note pinned to this day. Open Inkwell and attach a note to it.
                  </p>
                )}
              </div>

              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                  Transactions
                </p>
                {dayTransactions.length === 0 ? (
                  <EmptyState
                    icon={FiInbox}
                    title="No transactions"
                    message="Nothing recorded for this day."
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {dayTransactions.map((tx) => (
                      <div
                        key={tx._id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '13px', fontWeight: 600 }}>{tx.category}</p>
                          {tx.description && (
                            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{tx.description}</p>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: tx.type === 'income' ? 'var(--color-income)' : 'var(--color-expense)',
                          }}
                        >
                          {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, currency)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Modal>

      <style>
        {`
          @media (max-width: 900px) {
            .calendar-charts-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Calendar;