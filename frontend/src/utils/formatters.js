/**
 * Formatting utilities used throughout the app for displaying
 * currency, dates, and other values consistently.
 */

/**
 * Formats a number as currency based on the user's selected currency code.
 * Defaults to INR if no currency is provided.
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const numAmount = Number(amount) || 0;

  const currencyLocaleMap = {
    INR: 'en-IN',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
  };

  const locale = currencyLocaleMap[currency] || 'en-IN';

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 2,
    }).format(numAmount);
  } catch (error) {
    // Fallback if an unsupported currency code is somehow stored
    return `${currency} ${numAmount.toFixed(2)}`;
  }
};

/**
 * Formats a date string/object into a readable format, e.g. "24 Jul 2026"
 */
export const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Formats a date into the yyyy-MM-dd format required by <input type="date" />
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
};

/**
 * Formats a date into a relative "time ago" string for recent transactions,
 * e.g. "2 hours ago", "Yesterday", "3 days ago"
 */
export const formatRelativeDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
};

/**
 * Capitalizes the first letter of a string (e.g. "income" -> "Income")
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncates long text with an ellipsis, useful for descriptions in tables.
 */
export const truncateText = (text, maxLength = 40) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};