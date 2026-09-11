import React, { createContext, useState, useEffect, useContext } from 'react';
import toast from 'react-hot-toast';
import * as authAPI from '../api/authAPI';

const AuthContext = createContext(null);

/**
 * AuthProvider
 * Manages global authentication state: current user, loading state,
 * and exposes login/register/logout functions to the entire app.
 * Also verifies any existing token on initial app load.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while verifying existing session on load
  const [authLoading, setAuthLoading] = useState(false); // true during login/register submit

  // On initial app load, check if a token exists in localStorage
  // and, if so, verify it's still valid by fetching the current user.
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const data = await authAPI.getCurrentUser();
          setUser(data.user);
        } catch (error) {
          // Token invalid/expired - clear stale data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // username is optional - existing callers that don't pass it
  // (e.g. any old code still calling register(name, email, password))
  // keep working exactly as before.
  const register = async (name, email, password, username) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.registerUser({ name, email, password, username });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message || 'Account created successfully!');
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Registration failed. Please try again.';
      const validationErrors = error.response?.data?.errors;
      if (validationErrors && validationErrors.length > 0) {
        validationErrors.forEach((err) => toast.error(err.message));
      } else {
        toast.error(message);
      }
      return { success: false, message };
    } finally {
      setAuthLoading(false);
    }
  };

  // Renamed param to `identifier` since it now accepts EITHER an email
  // or a username - the backend figures out which one was entered.
  const login = async (identifier, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.loginUser({ identifier, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message || 'Logged in successfully!');
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, message };
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUserInContext = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    authLoading,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    updateUserInContext,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook for consuming AuthContext.
 * Throws a clear error if used outside of AuthProvider,
 * which makes misuse easy to catch during development.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};