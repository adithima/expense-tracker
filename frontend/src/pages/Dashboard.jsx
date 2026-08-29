import React, { useState, useEffect, useCallback } from 'react';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as transactionAPI from '../api/transactionAPI';
import * as budgetAPI from '../api/budgetAPI';
import StatCard from '../components/dashboard/StatCard';
import CategoryPieChart from '../components/dashboard/CategoryPieChart';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import BudgetAlertBanner from '../components/budgets/BudgetAlertBanner';
import TransactionRow from '../components/transactions/TransactionRow';
import TransactionForm from '../components/transactions/TransactionForm';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { FiInbox } from 'react-icons/fi';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Dashboard Page
 * - Budget alert banner (if any budget has crossed its threshold)
 * - Summary stat cards (Balance, Total Income, Total Expense) — CURRENT MONTH ONLY
 * - Category-wise expense pie chart — CURRENT MONTH ONLY
 * - Monthly income vs expense bar chart — CURRENT MONTH ONLY (single bar)
 * - Recent transactions list
 * - Quick "Add Transaction" action
 */
const Dashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [alertBudgets, setAlertBudgets] = useState([]);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currency = user?.currency || 'INR';

  const fetchDashboardData = useCallback(async () => {
    try {
      // allSettled: if any one call fails, the others still render
      // instead of the whole page going blank.
      const [summaryResult, monthlyStatsResult, budgetsResult] = await Promise.allSettled([
        transactionAPI.getSummary(),
        transactionAPI.getMonthlyStats(),
        budgetAPI.getBudgets(true), // active only
      ]);

      if (summaryResult.status === 'fulfilled') {
        setSummary(summaryResult.value);
      } else {
        toast.error('Failed to load charts data');
      }

      if (monthlyStatsResult.status === 'fulfilled') {
        setMonthlyStats(monthlyStatsResult.value);
      } else {
        toast.error('Failed to load monthly stats');
      }

      if (budgetsResult.status === 'fulfilled') {
        const flagged = (budgetsResult.value.budgets || []).filter(
          (b) => b.thresholdCrossed || b.limitExceeded
        );
        setAlertBudgets(flagged);
      }
      // Budget fetch failing silently is fine here — the banner just
      // won't show, no need to interrupt the whole dashboard with a toast.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTransactionAdded = () => {
    setIsModalOpen(false);
    fetchDashboardData(); // Refresh all dashboard data after adding a transaction
  };

  if (loading) {
    return <Spinner fullPage size="lg" />;
  }

  const currentMonthLabel = monthlyStats
    ? `${MONTH_NAMES[monthlyStats.month - 1]} ${monthlyStats.year}`
    : '';

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Here's an overview of your finances
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus size={16} /> Add Transaction
        </button>
      </div>

      {/* Budget Alert Banner */}
      {!bannerDismissed && (
        <BudgetAlertBanner
          budgets={alertBudgets}
          currency={currency}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      {/* Stat Cards — current month only, browse other months via Calendar */}
      <div
        className="flex-between"
        style={{ marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
          {currentMonthLabel}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          Want other months? Check the Calendar page.
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <StatCard
          title="Current Balance"
          value={formatCurrency(monthlyStats?.currentBalance || 0, currency)}
          icon={FiDollarSign}
          accentColor="var(--color-primary)"
          accentBg="var(--color-primary-light)"
        />
        <StatCard
          title="Total Income"
          value={formatCurrency(monthlyStats?.totalIncome || 0, currency)}
          icon={FiTrendingUp}
          accentColor="var(--color-success)"
          accentBg="var(--color-success-light)"
        />
        <StatCard
          title="Total Expense"
          value={formatCurrency(monthlyStats?.totalExpense || 0, currency)}
          icon={FiTrendingDown}
          accentColor="var(--color-danger)"
          accentBg="var(--color-danger-light)"
        />
      </div>

      {/* Charts — both scoped to current month only */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.4fr)',
          gap: '20px',
          marginBottom: '24px',
        }}
        className="dashboard-charts-grid"
      >
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
            Expense by Category
          </h3>
          <CategoryPieChart data={monthlyStats?.categoryBreakdown} currency={currency} />
        </div>

        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>
            Monthly Income vs Expense
          </h3>
          <MonthlyBarChart
            data={
              monthlyStats
                ? [{ month: currentMonthLabel, income: monthlyStats.totalIncome, expense: monthlyStats.totalExpense }]
                : []
            }
            currency={currency}
          />
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>
          Recent Transactions
        </h3>
        {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
          <div>
            {summary.recentTransactions.map((t) => (
              <TransactionRow key={t._id} transaction={t} currency={currency} compact />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FiInbox}
            title="No transactions yet"
            message="Start tracking your finances by adding your first transaction."
            action={
              <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
                <FiPlus size={14} /> Add Transaction
              </button>
            }
          />
        )}
      </div>

      {/* Add Transaction Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Transaction">
        <TransactionForm
          onSuccess={handleTransactionAdded}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <style>
        {`
          @media (max-width: 900px) {
            .dashboard-charts-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;