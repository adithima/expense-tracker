import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatCurrency } from './formatters';

/**
 * Exports an array of transactions to a CSV file and triggers a download.
 * Built with plain JS (Blob + anchor tag) rather than a library,
 * since CSV generation is simple enough not to need a dependency.
 */
export const exportToCSV = (transactions, filename = 'transactions.csv') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  const headers = ['Date', 'Type', 'Category', 'Description', 'Payment Method', 'Amount'];

  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.type,
    t.category,
    // Escape double quotes and wrap in quotes to safely handle commas in text fields
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.paymentMethod || 'other',
    t.amount,
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

  // Prepend BOM so Excel correctly detects UTF-8 encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exports an array of transactions to a formatted PDF report,
 * including a summary section (total income/expense/balance) at the top.
 */
export const exportToPDF = (transactions, summary, currency = 'INR', filename = 'transactions.pdf') => {
  if (!transactions || transactions.length === 0) {
    throw new Error('No transactions to export');
  }

  const doc = new jsPDF();

  // ---------- Title ----------
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Expense Tracker Report', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${formatDate(new Date())}`, 14, 27);

  // ---------- Summary Section ----------
  let summaryY = 38;
  if (summary) {
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Income: ${formatCurrency(summary.totalIncome, currency)}`, 14, summaryY);
    doc.text(`Total Expense: ${formatCurrency(summary.totalExpense, currency)}`, 14, summaryY + 7);
    doc.text(`Current Balance: ${formatCurrency(summary.balance, currency)}`, 14, summaryY + 14);
    summaryY += 24;
  }

  // ---------- Transactions Table ----------
  const tableColumns = ['Date', 'Type', 'Category', 'Description', 'Payment', 'Amount'];
  const tableRows = transactions.map((t) => [
    formatDate(t.date),
    t.type === 'income' ? 'Income' : 'Expense',
    t.category,
    t.description || '-',
    (t.paymentMethod || 'other').replace('_', ' '),
    formatCurrency(t.amount, currency),
  ]);

  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: summaryY,
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] }, // matches --color-primary
    styles: { fontSize: 9, cellPadding: 4 },
    columnStyles: {
      5: { halign: 'right' },
    },
  });

  doc.save(filename);
};