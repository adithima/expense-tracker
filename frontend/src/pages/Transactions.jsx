import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiDownload, FiFileText, FiChevronLeft, FiChevronRight, FiInbox } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as transactionAPI from '../api/transactionAPI';
import useDebounce from '../hooks/useDebounce';
import TransactionForm from '../components/transactions/TransactionForm';
import TransactionRow from '../components/transactions/TransactionRow';
import TransactionFilters from '../components/transactions/TransactionFilters';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

const DEFAULT_FILTERS = { search: '', type: '', category: '', startDate: '', endDate: '' };
const PAGE_LIMIT = 10;

/**
 * Transactions Page
 * Full transaction management: list with pagination, search, filters,
 * add/edit (via modal + shared TransactionForm), delete (with confirmation),
 * and export to CSV/PDF.
 */
const Transactions = () => {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 400);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        search: debouncedSearch || undefined,
        type: filters.type || undefined,
        category: filters.category || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page,
        limit: PAGE_LIMIT,
      };
      const data = await transactionAPI.getTransactions(params);
      setTransactions(data.transactions);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters.type, filters.category, filters.startDate, filters.endDate, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Reset to page 1 whenever any filter changes (avoids landing on an empty page)
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.type, filters.category, filters.startDate, filters.endDate]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const handleDeleteClick = (transaction) => {
    setDeleteTarget(transaction);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await transactionAPI.deleteTransaction(deleteTarget._id);
      toast.success('Transaction deleted successfully');
      setDeleteTarget(null);
      // If we deleted the last item on a page beyond page 1, step back a page
      if (transactions.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        fetchTransactions();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete transaction');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export fetches ALL matching transactions (not just the current page)
  // by requesting a very high limit, so exports are complete, not paginated.
  const fetchAllMatchingForExport = async () => {
    const params = {
      search: debouncedSearch || undefined,
      type: filters.type || undefined,
      category: filters.category || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      page: 1,
      limit: 10000,
    };
    const data = await transactionAPI.getTransactions(params);
    return data.transactions;
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const allTransactions = await fetchAllMatchingForExport();
      if (allTransactions.length === 0) {
        toast.error('No transactions to export');
        return;
      }
      exportToCSV(allTransactions, `transactions_${Date.now()}.csv`);
      toast.success('CSV exported successfully');
    } catch (error) {
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const allTransactions = await fetchAllMatchingForExport();
      if (allTransactions.length === 0) {
        toast.error('No transactions to export');
        return;
      }
      const summaryData = await transactionAPI.getSummary();
      exportToPDF(allTransactions, summaryData, currency, `transactions_${Date.now()}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="flex-between" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Transactions</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {totalCount} transaction{totalCount !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex" style={{ gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExportCSV} disabled={isExporting}>
            <FiDownload size={14} /> CSV
          </button>
          <button className="btn btn-outline btn-sm" onClick={handleExportPDF} disabled={isExporting}>
            <FiFileText size={14} /> PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleAddClick}>
            <FiPlus size={14} /> Add Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* Transactions List */}
      <div className="card" style={{ padding: '20px' }}>
        {loading ? (
          <Spinner fullPage />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={FiInbox}
            title="No transactions found"
            message="Try adjusting your filters, or add a new transaction to get started."
            action={
              <button className="btn btn-primary btn-sm" onClick={handleAddClick}>
                <FiPlus size={14} /> Add Transaction
              </button>
            }
          />
        ) : (
          <>
            <div>
              {transactions.map((t) => (
                <TransactionRow
                  key={t._id}
                  transaction={t}
                  currency={currency}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex-between" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Page {page} of {totalPages}
                </span>
                <div className="flex" style={{ gap: '8px' }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    <FiChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
      >
        <TransactionForm
          initialData={editingTransaction}
          onSuccess={handleFormSuccess}
          onCancel={() => setIsFormModalOpen(false)}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Delete Transaction"
        message={`Are you sure you want to delete this ${deleteTarget?.type} of ${deleteTarget?.amount ? '' : ''}"${deleteTarget?.category}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default Transactions;