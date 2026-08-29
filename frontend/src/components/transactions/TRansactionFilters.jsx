import React from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Groceries', 'Transportation', 'Housing', 'Utilities',
  'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Travel', 'Other',
];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'];

// Combined, de-duplicated list for the category filter dropdown
// (filter applies regardless of type, so we show all possible categories).
const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])].sort();

/**
 * Search + Filter bar for the Transactions page.
 * Fully controlled component - all state lives in the parent (Transactions.jsx)
 * so filter changes can trigger a refetch there.
 *
 * @param {Object} filters - { search, type, category, startDate, endDate }
 * @param {function} onFilterChange - (key, value) => void
 * @param {function} onClearFilters
 */
const TransactionFilters = ({ filters, onFilterChange, onClearFilters }) => {
  const hasActiveFilters =
    filters.search || filters.type || filters.category || filters.startDate || filters.endDate;

  return (
    <div className="card" style={{ padding: '18px', marginBottom: '20px' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
          alignItems: 'end',
        }}
      >
        {/* Search */}
        <div>
          <label className="form-label">Search</label>
          <div style={{ position: 'relative' }}>
            <FiSearch
              size={15}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Search category or note..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Type */}
        <div>
          <label className="form-label">Type</label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
            className="form-select"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="form-label">Category</label>
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="form-select"
          >
            <option value="">All Categories</option>
            {ALL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="form-label">From Date</label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="form-input"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="form-input"
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="btn btn-outline btn-sm"
            style={{ height: '42px' }}
          >
            <FiX size={14} /> Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default TransactionFilters;