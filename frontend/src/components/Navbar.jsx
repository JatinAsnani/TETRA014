import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navClass = ({ isActive }) => 'dropdown-link' + (isActive ? ' active' : '');

export default function Navbar() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-toggling');
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    setTimeout(() => {
      document.documentElement.classList.remove('theme-toggling');
    }, 100);
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate('/login');
  };

  const displayName = user?.business_name || user?.name || 'Sharma General Store';
  const userInitials = (displayName || 'S').slice(0, 2).toUpperCase();

  return (
    <header className="topnav">
      {/* Row 1: Highlighted Logo & User Profile Header */}
      <div className="topnav-top">
        <div className="topnav-top-inner">
          <div className="topnav-brand" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }} title="Click to refresh page">
            <div className="topnav-logo-badge" title="TallAI System">
              <img src="/logo.png" alt="TallAI Logo" className="topnav-logo-img" />
            </div>
            <div className="topnav-brand-info">
              <div className="topnav-sub">
                <span className="sparkle-icon">✨</span> Fraud Risk &amp; Invoice Discrepancy Audit Yaar
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Theme Switcher */}
            <div
              className={`theme-toggle-switch ${theme}`}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              <span className={`switch-icon sun ${theme === 'light' ? 'active' : ''}`}>☀️</span>
              <div className="switch-track">
                <div className="switch-thumb" />
              </div>
              <span className={`switch-icon moon ${theme === 'dark' ? 'active' : ''}`}>🌙</span>
            </div>



            {/* User Profile Pill & Dropdown */}
            <div className="user-profile-dropdown">
              <div className="profile-pill">
                <div className="profile-avatar">{userInitials}</div>
                <div className="profile-info">
                  <span className="profile-name">{displayName}</span>
                  <span className="profile-role">{user?.role || 'Admin'}</span>
                </div>
                <span className="profile-arrow">▾</span>
              </div>

              {/* Hover Dropdown Menu */}
              <div className="profile-dropdown-menu">
                <div className="profile-header">
                  <div className="header-avatar">{userInitials}</div>
                  <div>
                    <div className="header-name">{displayName}</div>
                    <div className="header-email">{user?.email || 'admin@tallai.com'}</div>
                  </div>
                </div>

                <NavLink to="/organization" className="profile-menu-item">
                  <span className="ic">🏢</span> Organization &amp; Team
                </NavLink>

                <NavLink to="/settings" className="profile-menu-item">
                  <span className="ic">⚙️</span> Store Settings
                </NavLink>
                
                <a className="profile-menu-item logout" onClick={handleLogout}>
                  <span className="ic">🚪</span> Logout
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Hover Category Dropdown Navbar Below Logo */}
      <nav className="topnav-bar">
        <div className="topnav-bar-inner">
          {/* Category 1: Overview */}
          <div className="nav-dropdown-item">
            <button className="category-btn">
              <span className="ic">📊</span> Overview <span className="arrow">▾</span>
            </button>
            <div className="dropdown-menu">
              <NavLink to="/" end className={navClass}>
                <span className="ic">📊</span> Dashboard Overview
              </NavLink>
              <NavLink to="/invoices" className={navClass}>
                <span className="ic">📄</span> Sales &amp; Purchase Invoices
              </NavLink>
            </div>
          </div>

          {/* Category 2: Risk Scanner */}
          <div className="nav-dropdown-item">
            <button className="category-btn">
              <span className="ic">🔍</span> Risk Scanner <span className="pill">NEW</span> <span className="arrow">▾</span>
            </button>
            <div className="dropdown-menu">
              <NavLink to="/scan" className={navClass}>
                <span className="ic">🔍</span> Scan &amp; Extract Invoices
              </NavLink>
              <NavLink to="/recon" className={navClass}>
                <span className="ic">⚖️</span> Ledger &amp; Invoice Reconciliation
              </NavLink>
              <NavLink to="/audit" className={navClass}>
                <span className="ic">🛡️</span> Risk &amp; Exception Audit Trail
              </NavLink>
            </div>
          </div>

          {/* Category 3: Books & Records */}
          <div className="nav-dropdown-item">
            <button className="category-btn">
              <span className="ic">💸</span> Books &amp; Records <span className="arrow">▾</span>
            </button>
            <div className="dropdown-menu">
              <NavLink to="/expenses" className={navClass}>
                <span className="ic">💸</span> Expense Vouchers
              </NavLink>
              <NavLink to="/customers" className={navClass}>
                <span className="ic">👥</span> Customer Accounts
              </NavLink>
              <NavLink to="/vendors" className={navClass}>
                <span className="ic">📈</span> Vendor Directory
              </NavLink>
              <NavLink to="/payments" className={navClass}>
                <span className="ic">💰</span> Payment Receipts
              </NavLink>
            </div>
          </div>

          {/* Category 4: Compliance & System */}
          <div className="nav-dropdown-item">
            <button className="category-btn">
              <span className="ic">📕</span> Compliance &amp; System <span className="arrow">▾</span>
            </button>
            <div className="dropdown-menu">
              <NavLink to="/ledger" className={navClass}>
                <span className="ic">📒</span> General Ledger
              </NavLink>
              <NavLink to="/stock" className={navClass}>
                <span className="ic">📦</span> Stock &amp; Inventory
              </NavLink>
              <NavLink to="/reports" className={navClass}>
                <span className="ic">🧮</span> Financial Reports &amp; P&amp;L
              </NavLink>
              <NavLink to="/gst" className={navClass}>
                <span className="ic">📕</span> GST Return Center
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
