import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { validatePassword, runValidation } from '../utils/validators';

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
        backgroundColor: 'var(--color-bg)',
        padding: '20px',
      }}
    >
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '36px 32px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px' }}>
          <svg width="56" height="56" viewBox="0 0 140 140" style={{ marginBottom: '14px' }}>
            <rect width="140" height="140" rx="30" fill="#1b2a4a" />
            <rect x="30" y="75" width="16" height="46" rx="3" fill="#FFFFFF" />
            <rect x="52" y="58" width="16" height="63" rx="3" fill="#F5D68C" />
            <rect x="74" y="40" width="16" height="81" rx="3" fill="#E8B94A" />
            <path d="M44 98 L60 75 L78 88 L106 52" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M92 46 L110 49 L105 67" fill="none" stroke="#FFFFFF" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 style={{ fontSize: '22px', fontWeight: 800 }}>Welcome back</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Log in to manage your finances
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">Email or Username</label>
            <div style={{ position: 'relative' }}>
              <FiUser
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              />
              <input
                id="identifier"
                type="text"
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="you@example.com or username"
                className={`form-input ${errors.identifier ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px' }}
                autoComplete="username"
              />
            </div>
            {errors.identifier && <p className="form-error">{errors.identifier}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock
                size={16}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px', paddingRight: '40px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }}
              >
                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={authLoading}
            style={{ marginTop: '8px', padding: '12px' }}
          >
            {authLoading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;