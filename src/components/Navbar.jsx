import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const navClass = ({ isActive }) => 'dropdown-link' + (isActive ? ' active' : '');

export default function Navbar() {
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');

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

  return (
    <header className="topnav">
      {/* Row 1: Highlighted Logo & User Profile Header */}
      <div className="topnav-top">
        <div className="topnav-top-inner">
          <div className="topnav-brand">
            <div className="topnav-logo-badge" title="FRIDAy AI System">
              <img src="/logo.png" alt="FRIDAy Logo" className="topnav-logo-img" />
            </div>
            <div className="topnav-brand-info">
              <div className="topnav-sub">
                <span className="sparkle-icon">✨</span> AI Financial Accounting &amp; Risk Scanner
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* 2-Way Theme Switcher (Sun ☀️ <-> Moon 🌙) Left of Username */}
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

            {/* Quick Access Cat Login Page Link */}
            <NavLink
              to="/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                background: 'var(--effects-color)',
                border: '1.5px solid var(--primary-color)',
                color: 'var(--primary-color)',
                fontSize: 12.5,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 2px 8px var(--effects-color)',
              }}
              title="Go to Cat Green Screen Login Page"
            >
              <span>🐱</span> Cat Login Page
            </NavLink>

            {/* User Profile Pill & Dropdown */}
            <div className="user-profile-dropdown">
              <div className="profile-pill">
                <div className="profile-avatar">SG</div>
                <div className="profile-info">
                  <span className="profile-name">Sharma General Store</span>
                  <span className="profile-role">Store Admin</span>
                </div>
                <span className="profile-arrow">▾</span>
              </div>

              {/* Hover Dropdown Menu */}
              <div className="profile-dropdown-menu">
                <div className="profile-header">
                  <div className="header-avatar">SG</div>
                  <div>
                    <div className="header-name">Sharma General Store</div>
                    <div className="header-email">admin@sharmastore.com</div>
                  </div>
                </div>

                <NavLink to="/settings" className="profile-menu-item">
                  <span className="ic">⚙️</span> Store Settings
                </NavLink>
                
                <a className="profile-menu-item logout" onClick={() => alert('Logged out successfully.')}>
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
