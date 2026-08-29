import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiTarget } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as budgetAPI from '../api/budgetAPI';
import BudgetProgressCard from '../components/budgets/BudgetProgressCard';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

const CATEGORY_OPTIONS = [
  'Shopping', 'Travel', 'Food & Dining', 'Healthcare', 'Bills',
  'Entertainment', 'Groceries', 'Transport', 'Rent', 'Other',
];
// NOTE: Transaction.category is free-text, not an enum — this list is
// just a convenience starting set for the dropdown. Swap in a real
// getDistinctCategories() call (see working notes) once that helper
// exists, so it reflects the categories the user has actually used.

const emptyForm = {
  isOverall: false,
  category: CATEGORY_OPTIONS[0],
  limitAmount: '',
  period: 'monthly',
  startDate: '',
  endDate: '',
  alertThreshold: 80,
};

const Budgets = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await budgetAPI.getBudgets(true); // active only
      setBudgets(data.budgets || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateBudget = async (e) => {
    e.preventDefault();

    if (!form.isOverall && !form.category) {
      toast.error('Please select a category, or choose Overall Budget');
      return;
    }
    if (!form.limitAmount || Number(form.limitAmount) <= 0) {
      toast.error('Enter a limit amount greater than 0');
      return;
    }
    if (form.period === 'custom' && (!form.startDate || !form.endDate)) {
      toast.error('Custom period needs both a start and end date');
      return;
    }

    setSubmitting(true);
    try {
      await budgetAPI.createBudget({
        isOverall: form.isOverall,
        category: form.isOverall ? undefined : form.category,
        limitAmount: Number(form.limitAmount),
        period: form.period,
        startDate: form.period === 'custom' ? form.startDate : undefined,
        endDate: form.period === 'custom' ? form.endDate : undefined,
        alertThreshold: Number(form.alertThreshold),
      });
      toast.success('Budget created');
      setIsModalOpen(false);
      setForm(emptyForm);
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (budgetId, nextIsActive) => {
    try {
      await budgetAPI.updateBudget(budgetId, { isActive: nextIsActive });
      toast.success(nextIsActive ? 'Budget resumed' : 'Budget paused');
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update budget');
    }
  };

  const handleDelete = async (budgetId) => {
    if (!window.confirm('Delete this budget? This cannot be undone.')) return;
    try {
      await budgetAPI.deleteBudget(budgetId);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete budget');
    }
  };

  if (loading) {
    return <Spinner fullPage size="lg" />;
  }

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Budgets</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Set spending limits and get notified before you go over.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FiPlus size={16} /> New Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={FiTarget}
          title="No budgets yet"
          message="Create a budget to track spending against a limit, with alerts when you're getting close."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setIsModalOpen(true)}>
              <FiPlus size={14} /> New Budget
            </button>
          }
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '18px',
          }}
        >
          {budgets.map((b) => (
            <BudgetProgressCard
              key={b.budgetId}
              budget={b}
              currency={currency}
              isActive={true}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Budget">
        <form onSubmit={handleCreateBudget} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
            <input
              type="checkbox"
              checked={form.isOverall}
              onChange={(e) => handleFormChange('isOverall', e.target.checked)}
            />
            Overall budget (across all categories)
          </label>

          {!form.isOverall && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Category
              </label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Limit Amount ({currency})
            </label>
            <input
              type="number"
              className="input"
              min="0.01"
              step="0.01"
              value={form.limitAmount}
              onChange={(e) => handleFormChange('limitAmount', e.target.value)}
              placeholder="e.g. 5000"
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Period
            </label>
            <select
              className="input"
              value={form.period}
              onChange={(e) => handleFormChange('period', e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {form.period === 'custom' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => handleFormChange('startDate', e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.endDate}
                  onChange={(e) => handleFormChange('endDate', e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
              Alert me at {form.alertThreshold}% spent
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={form.alertThreshold}
              onChange={(e) => handleFormChange('alertThreshold', e.target.value)}
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;