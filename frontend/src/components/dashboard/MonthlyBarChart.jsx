import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import { FiBarChart2 } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * Bar chart comparing income vs expense across months.
 * @param {Array} data - [{ month: 'Feb 2026', income: 5000, expense: 3200 }, ...]
 *   Pass a single-item array to show just one month (e.g. Dashboard).
 * @param {string} currency
 * @param {string} [highlightMonth] - if set, matches against each item's
 *   `month` label and renders that tick bold + accent-colored. Used by
 *   Calendar's All-Time Overview to make the current month stand out
 *   among the multi-month view. Omit for no highlighting (Dashboard's
 *   single-month view doesn't need it).
 */
const MonthlyBarChart = ({ data, currency, highlightMonth }) => {
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={FiBarChart2}
        title="No transaction history yet"
        message="Add income and expenses over time to see your monthly trends here."
      />
    );
  }

  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#a8adc0' : '#5c6178';
  const highlightColor = isDark ? '#818cf8' : '#6366f1';

  const chartData = {
    labels: data.map((item) => item.month),
    datasets: [
      {
        label: 'Income',
        data: data.map((item) => item.income || 0),
        backgroundColor: isDark ? '#34d399' : '#10b981',
        borderRadius: 6,
        maxBarThickness: 32,
      },
      {
        label: 'Expense',
        data: data.map((item) => item.expense || 0),
        backgroundColor: isDark ? '#f87171' : '#ef4444',
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw, currency)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: (context) => {
            // Scriptable option: Chart.js calls this per-tick, so we can
            // pick the color individually based on which month it is.
            const label = data[context.index]?.month;
            return label === highlightMonth ? highlightColor : textColor;
          },
          font: (context) => {
            const label = data[context.index]?.month;
            return label === highlightMonth
              ? { size: 12, weight: 'bold' }
              : { size: 12 };
          },
        },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: textColor,
          font: { size: 11 },
          callback: (value) => formatCurrency(value, currency).replace(/\.00$/, ''),
        },
      },
    },
  };

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default MonthlyBarChart;