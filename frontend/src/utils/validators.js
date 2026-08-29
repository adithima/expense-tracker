/**
 * Client-side form validation utilities.
 * These provide instant feedback in the UI before a request is even sent
 * to the backend, which remains the authoritative validation layer.
 */

export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email is required';
  const emailRegex = /^[\w.-]+@([\w-]+\.)+[\w-]{2,4}$/;
  if (!emailRegex.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return '';
};

export const validateName = (name) => {
  if (!name || !name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters long';
  if (name.trim().length > 50) return 'Name cannot exceed 50 characters';
  return '';
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
};

export const validateAmount = (amount) => {
  if (amount === '' || amount === null || amount === undefined) {
    return 'Amount is required';
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return 'Amount must be a valid number';
  if (numAmount <= 0) return 'Amount must be greater than 0';
  return '';
};

export const validateCategory = (category) => {
  if (!category || !category.trim()) return 'Category is required';
  return '';
};

export const validateDate = (date) => {
  if (!date) return 'Date is required';
  const selectedDate = new Date(date);
  if (isNaN(selectedDate.getTime())) return 'Please enter a valid date';
  return '';
};

export const validateDescription = (description) => {
  if (description && description.length > 200) {
    return 'Description cannot exceed 200 characters';
  }
  return '';
};

/**
 * Runs a set of field validators and returns an object mapping
 * field names to error messages (only for fields that failed).
 * @param {Object} fields - e.g. { name: 'John', email: 'x@x.com' }
 * @param {Object} validatorMap - e.g. { name: validateName, email: validateEmail }
 * @returns {Object} errors object, empty if all valid
 */
export const runValidation = (fields, validatorMap) => {
  const errors = {};
  Object.keys(validatorMap).forEach((field) => {
    const error = validatorMap[field](fields[field]);
    if (error) errors[field] = error;
  });
  return errors;
};