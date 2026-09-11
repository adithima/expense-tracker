import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiAtSign, FiLock, FiEye, FiEyeOff, FiTrendingUp } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  runValidation,
} from '../utils/validators';

const validateUsername = (val) => {
  if (!val) return ''; // optional field, empty is fine
  if (val.length < 3) return 'Username must be at least 3 characters';
  if (val.length > 20) return 'Username cannot exceed 20 characters';
  if (!/^[a-z0-9_]+$/i.test(val)) return 'Only letters, numbers, and underscores allowed';
  return '';
};

/**
 * Register Page
 * Email is required. Username is optional — an alternative way
 * to log in later, alongside email.
 */
const Register = () => {
  const { register, authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = runValidation(formData, {
      name: validateName,
      email: validateEmail,
      username: validateUsername,
      password: validatePassword,
      confirmPassword: (val) => validateConfirmPassword(formData.password, val),
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.username || undefined
    );
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
          maxWidth: '440px',
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#26215c' }}>Create your account</h1>
          <p style={{ fontSize: '14px', color: '#5f5e5a', marginTop: '4px' }}>
            Start tracking your finances today
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name" style={{ color: '#26215c', fontWeight: 600 }}>
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <FiUser size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }} />
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px', borderRadius: '12px', border: '2px solid #eeedfe' }}
                autoComplete="name"
              />
            </div>
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email" style={{ color: '#26215c', fontWeight: 600 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <FiMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }} />
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px', borderRadius: '12px', border: '2px solid #eeedfe' }}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="username" style={{ color: '#26215c', fontWeight: 600 }}>
              Username <span style={{ fontWeight: 400, color: '#888780' }}>(optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <FiAtSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }} />
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a username to log in with too"
                className={`form-input ${errors.username ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px', borderRadius: '12px', border: '2px solid #eeedfe' }}
                autoComplete="off"
              />
            </div>
            {errors.username && <p className="form-error">{errors.username}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password" style={{ color: '#26215c', fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px', paddingRight: '40px', borderRadius: '12px', border: '2px solid #eeedfe' }}
                autoComplete="new-password"
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword" style={{ color: '#26215c', fontWeight: 600 }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <FiLock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#a09ae0' }} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                style={{ paddingLeft: '40px', borderRadius: '12px', border: '2px solid #eeedfe' }}
                autoComplete="new-password"
              />
            </div>
            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
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
            {authLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '14px', color: '#5f5e5a', marginTop: '24px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#d4537e', fontWeight: 700 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;