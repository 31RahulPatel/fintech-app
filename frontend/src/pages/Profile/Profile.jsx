import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiShield, 
  FiCreditCard, FiEdit2, FiCamera, FiLock, FiBell, FiTrash2,
  FiMapPin, FiGlobe, FiFileText, FiSettings, FiSave, FiLoader,
  FiCheck, FiAlertCircle
} from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import './Profile.css';

const Profile = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, updateUser, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read initial tab from query param
  const tabFromUrl = searchParams.get('tab');
  const validTabs = ['profile', 'security', 'billing', 'notifications', 'settings'];
  const initialTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'profile';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    website: ''
  });

  const [subscription, setSubscription] = useState(null);
  const [preferences, setPreferences] = useState({
    notifications: { email: true, push: true },
    newsletter: false,
    theme: 'light'
  });

  // Password change state
  const [passwordSent, setPasswordSent] = useState(false);

  // Delete account confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <FiUser /> },
    { id: 'security', label: 'Security', icon: <FiShield /> },
    { id: 'billing', label: 'Billing', icon: <FiCreditCard /> },
    { id: 'notifications', label: 'Notifications', icon: <FiBell /> },
    { id: 'settings', label: 'Settings', icon: <FiSettings /> }
  ];

  const showFeedback = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: '', message: '' }), 4000);
  }, []);

  // ─── Load Profile Data ────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, prefsRes, subRes] = await Promise.allSettled([
          api.get('/users/profile'),
          api.get('/users/preferences'),
          api.get('/users/subscription')
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.data.user) {
          const u = profileRes.value.data.user;
          setFormData({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            phone: u.phone || '',
            bio: u.bio || '',
            location: u.location || '',
            website: u.website || ''
          });
        }

        if (prefsRes.status === 'fulfilled' && prefsRes.value.data.preferences) {
          setPreferences(prefsRes.value.data.preferences);
        }

        if (subRes.status === 'fulfilled' && subRes.value.data.subscription) {
          setSubscription(subRes.value.data.subscription);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Sync tab changes to URL
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'profile') {
      setSearchParams({});
    } else {
      setSearchParams({ tab: tabId });
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ─── Save Profile ─────────────────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { firstName, lastName, phone, bio, location, website } = formData;
      const res = await api.put('/users/profile', { firstName, lastName, phone, bio, location, website });
      if (res.data.user) {
        updateUser(res.data.user);
      }
      setIsEditing(false);
      showFeedback('success', 'Profile updated successfully!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // ─── Change Password (triggers forgot-password email) ─────
  const handleChangePassword = async () => {
    try {
      await api.post('/auth/forgot-password', { email: formData.email || user?.email });
      setPasswordSent(true);
      showFeedback('success', 'Password reset link sent to your email!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to send reset link');
    }
  };

  // ─── Delete Account ───────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      await api.delete('/users/account');
      showFeedback('success', 'Account deleted. Redirecting...');
      setTimeout(() => {
        logout();
        navigate('/');
      }, 1500);
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to delete account');
      setDeleteConfirm(false);
    }
  };

  // ─── Notification Preferences ─────────────────────────────
  const handleNotificationToggle = async (key) => {
    const updated = { ...preferences };
    if (key === 'email' || key === 'push') {
      updated.notifications = { ...updated.notifications, [key]: !updated.notifications[key] };
    } else if (key === 'newsletter') {
      updated.newsletter = !updated.newsletter;
    }
    setPreferences(updated);

    try {
      await api.put('/users/preferences', {
        notifications: updated.notifications,
        newsletter: updated.newsletter
      });
      showFeedback('success', 'Preferences saved');
    } catch (err) {
      showFeedback('error', 'Failed to save preferences');
    }
  };

  // ─── Theme Toggle (Settings) ──────────────────────────────
  const handleThemeToggle = async () => {
    toggleTheme();
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    try {
      await api.put('/users/preferences', { theme: newTheme });
    } catch (err) {
      // Theme toggle works locally even if backend fails
    }
  };

  // ─── Upgrade Subscription ─────────────────────────────────
  const handleUpgrade = async () => {
    try {
      const res = await api.post('/users/subscription/upgrade', { plan: 'premium' });
      setSubscription(res.data.subscription);
      showFeedback('success', 'Upgraded to Premium!');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to upgrade');
    }
  };

  const handleCancelSub = async () => {
    try {
      await api.post('/users/subscription/cancel');
      setSubscription(prev => ({ ...prev, isActive: false, type: 'free' }));
      showFeedback('success', 'Subscription cancelled');
    } catch (err) {
      showFeedback('error', err.response?.data?.error || 'Failed to cancel subscription');
    }
  };

  const displayName = formData.firstName 
    ? `${formData.firstName} ${formData.lastName}`.trim() 
    : user?.email || 'User';

  const isPremium = subscription?.isActive || user?.role === 'premium';

  if (loading) {
    return (
      <div className={`profile-page ${theme === 'dark' ? 'profile-dark' : ''}`}>
        <div className="profile-loading">
          <FiLoader className="spin" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`profile-page ${theme === 'dark' ? 'profile-dark' : ''}`}>
      {/* Feedback Toast */}
      {feedback.message && (
        <div className={`profile-toast ${feedback.type}`}>
          {feedback.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          {feedback.message}
        </div>
      )}

      <div className="profile-header">
        <div className="profile-header-content">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>Account Settings</h1>
            <p>Manage your profile and preferences</p>
          </motion.div>
        </div>
      </div>

      <div className="profile-container">
        <aside className="profile-sidebar">
          <div className="user-card">
            <div className="user-avatar">
              <div className="avatar-initials">
                {formData.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <button className="change-avatar" title="Change photo">
                <FiCamera />
              </button>
            </div>
            <h3>{displayName}</h3>
            <p>{formData.email}</p>
            <span className={`plan-badge ${isPremium ? 'premium' : ''}`}>
              {isPremium ? 'Premium' : 'Free Plan'}
            </span>
          </div>

          <nav className="profile-nav">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="profile-content">
          {/* ─── Profile Tab ──────────────────────── */}
          {activeTab === 'profile' && (
            <motion.div 
              className="content-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="section-header">
                <h2>Personal Information</h2>
                <button 
                  className="edit-btn"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <FiEdit2 /> {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label><FiUser /> First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="form-group">
                  <label><FiUser /> Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="form-group">
                  <label><FiMail /> Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    title="Email cannot be changed"
                  />
                </div>
                <div className="form-group">
                  <label><FiPhone /> Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div className="form-group">
                  <label><FiMapPin /> Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="City, Country"
                  />
                </div>
                <div className="form-group">
                  <label><FiGlobe /> Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="form-group full-width">
                  <label><FiFileText /> Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="form-actions">
                  <button 
                    className="save-btn" 
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? <><FiLoader className="spin" /> Saving...</> : <><FiSave /> Save Changes</>}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Security Tab ─────────────────────── */}
          {activeTab === 'security' && (
            <motion.div 
              className="content-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="section-header">
                <h2>Security Settings</h2>
              </div>

              <div className="security-options">
                <div className="security-item">
                  <div className="security-info">
                    <FiLock />
                    <div>
                      <h4>Change Password</h4>
                      <p>
                        {passwordSent 
                          ? 'Reset link sent! Check your email.' 
                          : 'We\'ll send a password reset link to your email'}
                      </p>
                    </div>
                  </div>
                  <button 
                    className="action-link" 
                    onClick={handleChangePassword}
                    disabled={passwordSent}
                  >
                    {passwordSent ? 'Sent ✓' : 'Reset'}
                  </button>
                </div>
                <div className="security-item">
                  <div className="security-info">
                    <FiShield />
                    <div>
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="security-item danger">
                  <div className="security-info">
                    <FiTrash2 />
                    <div>
                      <h4>Delete Account</h4>
                      <p>
                        {deleteConfirm 
                          ? 'Are you sure? This action cannot be undone. Click again to confirm.' 
                          : 'Permanently delete your account and all data'}
                      </p>
                    </div>
                  </div>
                  <button 
                    className={`action-link danger ${deleteConfirm ? 'confirm-delete' : ''}`}
                    onClick={handleDeleteAccount}
                  >
                    {deleteConfirm ? 'Confirm Delete' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Billing Tab ──────────────────────── */}
          {activeTab === 'billing' && (
            <motion.div 
              className="content-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="section-header">
                <h2>Billing & Subscription</h2>
              </div>

              <div className="billing-card">
                <div className="current-plan">
                  <span className="plan-label">Current Plan</span>
                  <h3>{isPremium ? 'Premium' : 'Free'}</h3>
                  <p>{isPremium ? '₹999/year' : 'Limited features'}</p>
                  {subscription?.endDate && isPremium && (
                    <p style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.25rem' }}>
                      Valid until {new Date(subscription.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {!isPremium ? (
                  <button className="upgrade-btn" onClick={handleUpgrade}>Upgrade to Premium</button>
                ) : (
                  <button className="upgrade-btn" onClick={handleCancelSub} style={{ background: '#fee2e2', color: '#ef4444' }}>
                    Cancel Plan
                  </button>
                )}
              </div>

              <div className="billing-features">
                <h4>Premium Features</h4>
                <ul className="features-list">
                  <li><FiCheck className="feature-icon" /> Unlimited AI chatbot queries</li>
                  <li><FiCheck className="feature-icon" /> Advanced calculators</li>
                  <li><FiCheck className="feature-icon" /> Real-time market alerts</li>
                  <li><FiCheck className="feature-icon" /> Priority support</li>
                  <li><FiCheck className="feature-icon" /> Ad-free experience</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* ─── Notifications Tab ────────────────── */}
          {activeTab === 'notifications' && (
            <motion.div 
              className="content-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="section-header">
                <h2>Notification Preferences</h2>
              </div>

              <div className="notification-options">
                <div className="notification-item">
                  <div>
                    <h4>Email Notifications</h4>
                    <p>Receive updates and alerts via email</p>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.notifications?.email ?? true}
                      onChange={() => handleNotificationToggle('email')} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Push Notifications</h4>
                    <p>Get push alerts for important updates</p>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.notifications?.push ?? true}
                      onChange={() => handleNotificationToggle('push')} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                <div className="notification-item">
                  <div>
                    <h4>Newsletter</h4>
                    <p>Weekly digest of market news and insights</p>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.newsletter ?? false}
                      onChange={() => handleNotificationToggle('newsletter')} 
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── Settings Tab ─────────────────────── */}
          {activeTab === 'settings' && (
            <motion.div 
              className="content-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="section-header">
                <h2>General Settings</h2>
              </div>

              <div className="settings-options">
                <div className="settings-item">
                  <div className="settings-info">
                    {theme === 'dark' ? <FiSettings /> : <FiSettings />}
                    <div>
                      <h4>Dark Mode</h4>
                      <p>Switch between light and dark theme</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={theme === 'dark'} 
                      onChange={handleThemeToggle}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-info">
                    <FiMail />
                    <div>
                      <h4>Marketing Emails</h4>
                      <p>Receive promotional offers and updates</p>
                    </div>
                  </div>
                  <label className="toggle">
                    <input 
                      type="checkbox" 
                      checked={preferences.newsletter ?? false}
                      onChange={() => handleNotificationToggle('newsletter')}
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="settings-item">
                  <div className="settings-info">
                    <FiUser />
                    <div>
                      <h4>Account Information</h4>
                      <p>Role: {user?.role || 'user'} · Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="action-link" onClick={() => handleTabChange('profile')}>
                    Edit Profile
                  </button>
                </div>

                <div className="settings-item">
                  <div className="settings-info">
                    <FiShield />
                    <div>
                      <h4>Privacy & Security</h4>
                      <p>Manage password and security settings</p>
                    </div>
                  </div>
                  <button className="action-link" onClick={() => handleTabChange('security')}>
                    Manage
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Profile;
