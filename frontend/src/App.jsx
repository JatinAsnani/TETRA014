import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import FloatingChat from './components/FloatingChat.jsx';

import InvoiceRiskScanner from './pages/InvoiceRiskScanner/index.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AIChat from './pages/AIChat.jsx';
import Invoices from './pages/Invoices.jsx';
import ScanExtract from './pages/ScanExtract.jsx';
import Reconciliation from './pages/Reconciliation.jsx';
import AuditTrail from './pages/AuditTrail.jsx';
import Expenses from './pages/Expenses.jsx';
import Customers from './pages/Customers.jsx';
import Vendors from './pages/Vendors.jsx';
import Payments from './pages/Payments.jsx';
import Ledger from './pages/Ledger.jsx';
import Stock from './pages/Stock.jsx';
import Reports from './pages/Reports.jsx';
import GST from './pages/GST.jsx';
import Settings from './pages/Settings.jsx';
import Login from './pages/Login.jsx';

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  // Stable Theme Initialization
  useEffect(() => {
    function updateThemeColors() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      
      const primaryColor = isLight ? '#0284C7' : '#06B6D4';
      const effectsColor = isLight ? 'rgba(2, 132, 199, 0.14)' : 'rgba(6, 182, 212, 0.15)';
      const chatbotColor = isLight ? '#0D9488' : '#14B8A6';

      document.documentElement.style.setProperty('--primary-color', primaryColor);
      document.documentElement.style.setProperty('--effects-color', effectsColor);
      document.documentElement.style.setProperty('--chatbot-primary-color', chatbotColor);
    }

    updateThemeColors();

    const observer = new MutationObserver(() => updateThemeColors());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`shell ${isLoginPage ? 'login-active-shell' : ''}`}>
      {!isLoginPage && <Navbar />}
      <div className={`main ${isLoginPage ? 'login-main-container' : ''}`}>
        <div className={`content ${isLoginPage ? 'login-content-container' : ''}`}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoice-risk-scanner" element={<InvoiceRiskScanner />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/scan" element={<ScanExtract />} />
            <Route path="/recon" element={<Reconciliation />} />
            <Route path="/audit" element={<AuditTrail />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/ledger" element={<Ledger />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/gst" element={<GST />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>

      {/* Hide Chatbot on Login Page */}
      {!isLoginPage && <FloatingChat />}
    </div>
  );
}
