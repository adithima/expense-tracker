import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(null);

/**
 * ThemeProvider
 * Manages dark/light mode state for the entire app.
 * Persists the user's preference in localStorage and applies it
 * via a data-theme attribute on the <html> element, which our
 * CSS variables in index.css respond to automatically.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Initialize from localStorage if available, otherwise
    // respect the user's OS-level preference, defaulting to light.
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) return storedTheme;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

/**
 * Custom hook for consuming ThemeContext.
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};