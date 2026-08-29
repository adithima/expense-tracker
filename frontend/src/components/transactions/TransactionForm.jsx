import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import * as transactionAPI from '../../api/transactionAPI';
import {
  validateCategory,
  validateAmount,
  validateDate,
  validateDescription,
  runValidation,
} from '../../utils/validators';
import { formatDateForInput } from '../../utils/formatters';

// Predefined category lists, split by transaction type.
// Kept in the component (rather than fetched from a "Categories" API/collection)
// to keep the project scope focused, while still fully satisfying the
// "Categories" feature requirement.
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];
const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transportation', 'Housing', 'Utilities',
  'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Travel', 'Other',
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
];

/**
 * TransactionForm
 * Used for both creating a new transaction and editing an existing one,
 * rendered inside a Modal by the parent Transactions page.
 *
 * @param {Object} initialData - existing transaction (edit mode) or null (create mode)
 * @param {function} onSuccess - called after successful save, with the transaction data
 * @param {function} onCancel - called when the form is cancelled
 */
const TransactionForm = ({ initialData, onSuccess, onCancel }) => {
  const isEditMode = Boolean(initialData);

  const [formData, setFormData] = useState({
    type: initialData?.type || 'expense',
    category: initialData?.category || '',
    amount: initialData?.amount || '',
    description: initialData?.description || '',
    date: initialData ? formatDateForInput(initialData.date) : formatDateForInput(new Date()),
    paymentMethod: initialData?.paymentMethod || 'cash',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Reset category if the transaction type changes and the current
  // category doesn't belong to the newly selected type's list.
  useEffect(() => {
    const validCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (formData.category && !validCategories.includes(formData.category)) {
      setFormData((prev) => ({ ...prev, category: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleTypeToggle = (type) => {
    setFormData((prev) => ({ ...prev, type }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = runValidation(formData, {
      category: validateCategory,
      amount: validateAmount,
      date: validateDate,
      description: validateDescription,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      let response;
      if (isEditMode) {
        response = await transactionAPI.updateTransaction(initialData._id, payload);
      } else {
        response = await transactionAPI.createTransaction(payload);
      }

      toast.success(response.message);
      onSuccess(response.transaction);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save transaction';
      const validationErrs = error.response?.data?.errors;
      if (validationErrs && validationErrs.length > 0) {
        validationErrs.forEach((err) => toast.error(err.message));
      } else {
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Type Toggle */}
      <div className="form-group">
        <label className="form-label">Transaction Type</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => handleTypeToggle('expense')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${formData.type === 'expense' ? 'var(--color-danger)' : 'var(--color-border)'}`,
              backgroundColor: formData.type === 'expense' ? 'var(--color-danger-light)' : 'transparent',
              color: formData.type === 'expense' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all var(--transition-fast)',
            }}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => handleTypeToggle('income')}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              border: `1.5px solid ${formData.type === 'income' ? 'var(--color-success)' : 'var(--color-border)'}`,
              backgroundColor: formData.type === 'income' ? 'var(--color-success-light)' : 'transparent',
              color: formData.type === 'income' ? 'var(--color-success)' : 'var(--color-text-secondary)',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all var(--transition-fast)',
            }}
          >
            Income
          </button>
        </div>
      </div>

      {/* Amount */}
      <div className="form-group">
        <label className="form-label" htmlFor="amount">Amount</label>
        <input
          id="amount"
          type="number"
          name="amount"
          step="0.01"
          min="0.01"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          className={`form-input ${errors.amount ? 'input-error' : ''}`}
        />
        {errors.amount && <p className="form-error">{errors.amount}</p>}
      </div>

      {/* Category */}
      <div className="form-group">
        <label className="form-label" htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className={`form-select ${errors.category ? 'input-error' : ''}`}
        >
          <option value="">Select a category</option>
          {categoryOptions.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        {errors.category && <p className="form-error">{errors.category}</p>}
      </div>

      {/* Date */}
      <div className="form-group">
        <label className="form-label" htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          max={formatDateForInput(new Date())}
          className={`form-input ${errors.date ? 'input-error' : ''}`}
        />
        {errors.date && <p className="form-error">{errors.date}</p>}
      </div>

      {/* Payment Method */}
      <div className="form-group">
        <label className="form-label" htmlFor="paymentMethod">Payment Method</label>
        <select
          id="paymentMethod"
          name="paymentMethod"
          value={formData.paymentMethod}
          onChange={handleChange}
          className="form-select"
        >
          {PAYMENT_METHODS.map((pm) => (
            <option key={pm.value} value={pm.value}>{pm.label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label" htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Add a note..."
          rows={3}
          maxLength={200}
          className={`form-textarea ${errors.description ? 'input-error' : ''}`}
          style={{ resize: 'vertical' }}
        />
        {errors.description && <p className="form-error">{errors.description}</p>}
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : isEditMode ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;