import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ui/ProtectedRoute'
import Navbar from './components/Navbar.jsx'
import FloatingChat from './components/FloatingChat.jsx'

import Dashboard from './pages/Dashboard.jsx'
import AIChat from './pages/AIChat.jsx'
import Invoices from './pages/Invoices.jsx'
import InvoiceDetail from './pages/InvoiceDetail.jsx'
import ScanExtract from './pages/ScanExtract.jsx'
import Reconciliation from './pages/Reconciliation.jsx'
import AuditTrail from './pages/AuditTrail.jsx'
import Expenses from './pages/Expenses.jsx'
import Customers from './pages/Customers.jsx'
import CustomerDetail from './pages/CustomerDetail.jsx'
import Vendors from './pages/Vendors.jsx'
import Payments from './pages/Payments.jsx'
import Ledger from './pages/Ledger.jsx'
import Stock from './pages/Stock.jsx'
import Reports from './pages/Reports.jsx'
import GST from './pages/GST.jsx'
import Settings from './pages/Settings.jsx'
import TeamManagement from './pages/TeamManagement.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  // Stable Theme Initialization
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'dark'
    document.documentElement.setAttribute('data-theme', savedTheme)

    function updateThemeColors() {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light'
      
      const primaryColor = isLight ? '#0284C7' : '#06B6D4'
      const effectsColor = isLight ? 'rgba(2, 132, 199, 0.14)' : 'rgba(6, 182, 212, 0.15)'
      const chatbotColor = isLight ? '#0D9488' : '#14B8A6'

      document.documentElement.style.setProperty('--primary-color', primaryColor)
      document.documentElement.style.setProperty('--effects-color', effectsColor)
      document.documentElement.style.setProperty('--chatbot-primary-color', chatbotColor)
    }

    updateThemeColors()

    const observer = new MutationObserver(() => updateThemeColors())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => observer.disconnect()
  }, [])

  return (
    <div className={`shell ${isAuthPage ? 'login-active-shell' : ''}`}>
      {!isAuthPage && <Navbar />}
      <div className={`main ${isAuthPage ? 'login-main-container' : ''}`}>
        <div className={`content ${isAuthPage ? 'login-content-container' : ''}`}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
            <Route path="/invoices/:id" element={<ProtectedRoute><InvoiceDetail /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><ScanExtract /></ProtectedRoute>} />
            <Route path="/recon" element={<ProtectedRoute><Reconciliation /></ProtectedRoute>} />
            <Route path="/audit" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute><CustomerDetail /></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute><Vendors /></ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
            <Route path="/ledger" element={<ProtectedRoute><Ledger /></ProtectedRoute>} />
            <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/gst" element={<ProtectedRoute><GST /></ProtectedRoute>} />
            <Route path="/organization" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
      
      <Toaster position="top-right" />

      {/* Floating Chat Assistant */}
      {!isAuthPage && <FloatingChat />}
    </div>
  )
}

