import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiLock, FiTrash2, FiSave, FiEye, FiEyeOff, FiBell, FiCalendar, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as userAPI from '../api/userAPI';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  runValidation,
} from '../utils/validators';
import ConfirmDialog from '../components/common/ConfirmDialog';

const CURRENCIES = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
];

/**
 * Profile Page
 * Sections: Account Stats (member since / transactions logged),
 * Edit Profile (name/email/currency), Notification Preferences
 * (budget alerts toggle), Change Password, and Delete Account.
 */
const Profile = () => {
  const { user, updateUserInContext, logout } = useAuth();

  // ---------- Account Stats Section ----------
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await userAPI.getAccountStats();
        setStats(data);
      } catch (error) {
        // Silent — stats are a nice-to-have, not critical to the page
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const memberSinceLabel = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;

  // ---------- Profile Info Section ----------
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currency: user?.currency || 'INR',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errors = runValidation(profileData, {
      name: validateName,
      email: validateEmail,
    });
    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      return;
    }

    setSavingProfile(true);
    try {
      const data = await userAPI.updateProfile(profileData);
      updateUserInContext(data.user);
      toast.success(data.message || 'Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- Notification Preferences Section ----------
  const [budgetAlertsEnabled, setBudgetAlertsEnabled] = useState(
    user?.budgetAlertsEnabled !== false
  );
  const [savingPreference, setSavingPreference] = useState(false);

  const handleToggleBudgetAlerts = async () => {
    const next = !budgetAlertsEnabled;
    setBudgetAlertsEnabled(next); // optimistic update
    setSavingPreference(true);
    try {
      const data = await userAPI.updateProfile({ budgetAlertsEnabled: next });
      updateUserInContext(data.user);
      toast.success(next ? 'Budget alerts turned on' : 'Budget alerts turned off');
    } catch (error) {
      setBudgetAlertsEnabled(!next); // revert on failure
      toast.error(error.response?.data?.message || 'Failed to update preference');
    } finally {
      setSavingPreference(false);
    }
  };

  // ---------- Change Password Section ----------
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errors = runValidation(passwordData, {
      currentPassword: (val) => (!val ? 'Current password is required' : ''),
      newPassword: validatePassword,
      confirmNewPassword: (val) => validateConfirmPassword(passwordData.newPassword, val),
    });
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setSavingPassword(true);
    try {
      const data = await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(data.message || 'Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  // ---------- Delete Account Section ----------
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await userAPI.deleteAccount();
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : parts[0][0].toUpperCase();
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '4px' }}>My Profile</h1>
      <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
        Manage your account settings and preferences
      </p>

      {/* Avatar + Name Header + Stats */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="flex" style={{ alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(user?.name)}
          </div>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 700 }}>{user?.name}</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{user?.email}</p>
          </div>
        </div>

        {(memberSinceLabel || !statsLoading) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '18px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            {memberSinceLabel && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCalendar size={14} color="var(--color-text-secondary)" />
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Member since <strong style={{ color: 'var(--color-text-primary)' }}>{memberSinceLabel}</strong>
                </span>
              </div>
            )}
            {!statsLoading && stats && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiList size={14} color="var(--color-text-secondary)" />
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-text-primary)' }}>{stats.transactionCount}</strong> transaction{stats.transactionCount === 1 ? '' : 's'} logged
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>Profile Information</h3>
        <form onSubmit={handleProfileSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              className={`form-input ${profileErrors.name ? 'input-error' : ''}`}
            />
            {profileErrors.name && <p className="form-error">{profileErrors.name}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              className={`form-input ${profileErrors.email ? 'input-error' : ''}`}
            />
            {profileErrors.email && <p className="form-error">{profileErrors.email}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="currency">Preferred Currency</label>
            <select
              id="currency"
              name="currency"
              value={profileData.currency}
              onChange={handleProfileChange}
              className="form-select"
            >
              {CURRENCIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            <FiSave size={15} /> {savingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>Notification Preferences</h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Control which in-app alerts you receive via the bell icon.
        </p>

        <div className="flex-between" style={{ gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiBell size={16} color="var(--color-text-secondary)" />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600 }}>Budget alerts</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Get notified when you're close to or over a budget limit
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            onClick={handleToggleBudgetAlerts}
            disabled={savingPreference}
            role="switch"
            aria-checked={budgetAlertsEnabled}
            title={budgetAlertsEnabled ? 'Turn off budget alerts' : 'Turn on budget alerts'}
            style={{
              flexShrink: 0,
              width: 44,
              height: 24,
              borderRadius: '999px',
              position: 'relative',
              backgroundColor: budgetAlertsEnabled ? 'var(--color-primary)' : 'var(--color-border)',
              opacity: savingPreference ? 0.6 : 1,
              transition: 'background-color 0.15s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: budgetAlertsEnabled ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.15s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Change Password */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '18px' }}>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="currentPassword">Current Password</label>
            <input
              id="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              className={`form-input ${passwordErrors.currentPassword ? 'input-error' : ''}`}
              autoComplete="current-password"
            />
            {passwordErrors.currentPassword && <p className="form-error">{passwordErrors.currentPassword}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="newPassword">New Password</label>
            <input
              id="newPassword"
              type={showPasswords ? 'text' : 'password'}
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              className={`form-input ${passwordErrors.newPassword ? 'input-error' : ''}`}
              autoComplete="new-password"
            />
            {passwordErrors.newPassword && <p className="form-error">{passwordErrors.newPassword}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmNewPassword">Confirm New Password</label>
            <input
              id="confirmNewPassword"
              type={showPasswords ? 'text' : 'password'}
              name="confirmNewPassword"
              value={passwordData.confirmNewPassword}
              onChange={handlePasswordChange}
              className={`form-input ${passwordErrors.confirmNewPassword ? 'input-error' : ''}`}
              autoComplete="new-password"
            />
            {passwordErrors.confirmNewPassword && <p className="form-error">{passwordErrors.confirmNewPassword}</p>}
          </div>

          <label className="flex" style={{ alignItems: 'center', gap: '8px', marginBottom: '18px', fontSize: '13px', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={showPasswords} onChange={() => setShowPasswords((prev) => !prev)} />
            {showPasswords ? <FiEyeOff size={14} /> : <FiEye size={14} />} Show passwords
          </label>

          <button type="submit" className="btn btn-primary" disabled={savingPassword}>
            <FiLock size={15} /> {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="card" style={{ border: '1px solid var(--color-danger)' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-danger)' }}>
          Danger Zone
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Permanently delete your account and all associated transaction data. This action cannot be undone.
        </p>
        <button className="btn btn-danger" onClick={() => setShowDeleteConfirm(true)}>
          <FiTrash2 size={15} /> Delete My Account
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        isLoading={deletingAccount}
        title="Delete Account"
        message="Are you absolutely sure? This will permanently delete your account and all your transactions. This action cannot be undone."
        confirmText="Delete Account"
      />
    </div>
  );
};

export default Profile;