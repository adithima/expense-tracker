import { useState, useEffect } from 'react';

/**
 * useDebounce
 * Delays updating the returned value until the input value has stopped
 * changing for the specified delay period. Used to avoid firing an API
 * request on every single keystroke in the transaction search box.
 *
 * @param {*} value - The value to debounce (e.g. search input text)
 * @param {number} delay - Delay in milliseconds (default 400ms)
 * @returns {*} the debounced value
 */
const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: if value changes again before delay finishes,
    // cancel the pending timer and start a new one.
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;