import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../utils/formatters';
import EmptyState from '../common/EmptyState';
import { FiPieChart } from 'react-icons/fi';

ChartJS.register(ArcElement, Tooltip, Legend);

// A pleasant, distinguishable color palette for pie chart segments
const CHART_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#84cc16', '#06b6d4',
];

/**
 * Pie chart showing expense breakdown by category.
 * @param {Array} data - [{ _id: 'Category Name', total: 1234 }, ...]
 * @param {string} currency
 */
const CategoryPieChart = ({ data, currency }) => {
  const { isDark } = useTheme();

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={FiPieChart}
        title="No expense data yet"
        message="Add some expenses to see your spending breakdown by category."
      />
    );
  }

  const chartData = {
    labels: data.map((item) => item._id),
    datasets: [
      {
        data: data.map((item) => item.total),
        backgroundColor: data.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: isDark ? '#1a1d2b' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: isDark ? '#a8adc0' : '#5c6178',
          padding: 14,
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return ` ${formatCurrency(value, currency)} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '300px', position: 'relative' }}>
      <Pie data={chartData} options={options} />
    </div>
  );
};

export default CategoryPieChart;