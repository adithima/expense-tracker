import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { validatePassword, runValidation } from '../utils/validators';

/**
 * Login Page
 * Accepts either an email address OR a username in a single field.
 * Backend figures out which one was entered.
 */
const Login = () => {
  const { login, authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateIdentifier = (val) => (!val || !val.trim() ? 'Enter your email or username' : '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = runValidation(formData, {
      identifier: validateIdentifier,
      password: validatePassword,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await login(formData.identifier, formData.password);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #7f77dd 0%, #d4537e 55%, #ef9f27 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '40px 34px',
          borderRadius: '20px',
          backgroundColor: '#ffffff',
          boxShadow: '0 20px 60px rgba(83, 74, 183, 0.35)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #7f77dd, #d4537e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <FiTrendingUp size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#26215c' }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: '#5f5e5a', marginTop: '4px' }}>
            Log in to manage your finances
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier" style={{ color: '#26215c', fontWeight: 600 }}>
              Email or Username
            </label>
            <div style={{ position: 'relative' }}>
              <FiUser
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }}
              />
              <input
                id="identifier"
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="you@example.com or username"
                className={`form-input ${errors.identifier ? 'input-error' : ''}`}
                style={{
                  paddingLeft: '40px',
                  borderRadius: '12px',
                  border: '2px solid #eeedfe',
                }}
                autoComplete="username"
              />
            </div>
            {errors.identifier && <p className="form-error">{errors.identifier}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ color: '#26215c', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                style={{
                  paddingLeft: '40px',
                  paddingRight: '40px',
                  borderRadius: '12px',
                  border: '2px solid #eeedfe',
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={authLoading}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #7f77dd, #d4537e)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '15px',
              cursor: authLoading ? 'default' : 'pointer',
              opacity: authLoading ? 0.7 : 1,
            }}
          >
            {authLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#5f5e5a', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#d4537e', fontWeight: 700 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;