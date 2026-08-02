import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Modal from '../components/ui/Modal'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../utils/formatError'

export default function TeamManagement() {
  const { user: currentUser, updateProfile } = useAuth()
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [confirmPassInput, setConfirmPassInput] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const [activeTab, setActiveTab] = useState('members') // 'members' | 'sessions' | 'hierarchy'
  const [sessions, setSessions] = useState([])
  const [hierarchy, setHierarchy] = useState([])
  const [subordinates, setSubordinates] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityMember, setActivityMember] = useState(null)
  const [activityData, setActivityData] = useState(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [activitySearch, setActivitySearch] = useState('')
  const [activityFilter, setActivityFilter] = useState('all')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  })

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  })

  const [submitting, setSubmitting] = useState(false)

  const handleViewActivity = async (member) => {
    setActivityMember(member)
    setShowActivityModal(true)
    setActivityLoading(true)
    setActivityData(null)
    try {
      const res = await api.get(`/auth/subordinates/${member.id}/activity`)
      setActivityData(res.data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch employee work log'))
    } finally {
      setActivityLoading(false)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [sessRes, hierRes, subRes] = await Promise.allSettled([
        api.get('/auth/logged-in-users'),
        api.get('/auth/hierarchy'),
        api.get('/auth/subordinates'),
      ])

      if (sessRes.status === 'fulfilled') setSessions(sessRes.value.data)
      if (hierRes.status === 'fulfilled') setHierarchy(hierRes.value.data)
      if (subRes.status === 'fulfilled') setSubordinates(subRes.value.data)
    } catch (err) {
      toast.error('Failed to load organization team data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isUnlocked) {
      fetchData()
    }
  }, [isUnlocked])

  const handleSetupOrgPass = async (e) => {
    e.preventDefault()
    if (!passInput || passInput.length < 4) {
      toast.error('Password must be at least 4 characters long')
      return
    }
    if (passInput !== confirmPassInput) {
      toast.error('Passwords do not match')
      return
    }
    setPassLoading(true)
    try {
      await api.post('/auth/org-pass/setup', { password: passInput })
      toast.success('Organization password created successfully!')
      if (updateProfile) await updateProfile({ has_org_pass: true })
      setIsUnlocked(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to set organization password')
    } finally {
      setPassLoading(false)
    }
  }

  const handleVerifyOrgPass = async (e) => {
    e.preventDefault()
    if (!passInput) {
      toast.error('Please enter the organization password')
      return
    }
    setPassLoading(true)
    try {
      await api.post('/auth/org-pass/verify', { password: passInput })
      toast.success('Organization access unlocked!')
      setIsUnlocked(true)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Incorrect organization password')
    } finally {
      setPassLoading(false)
    }
  }

  const handleAddSubordinate = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.email) {
      toast.error('Please enter employee name and email')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/auth/subordinates', formData)
      toast.success(`Employee ${formData.name} added to organization!`)
      setShowAddModal(false)
      setFormData({ name: '', email: '', password: '', role: 'staff' })
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create employee credentials'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (member) => {
    setSelectedMember(member)
    setEditFormData({
      name: member.name,
      email: member.email,
      password: '',
      role: member.role || 'staff',
    })
    setShowEditModal(true)
  }

  const handleUpdateSubordinate = async (e) => {
    e.preventDefault()
    if (!selectedMember) return
    setSubmitting(true)
    try {
      const payload = {
        name: editFormData.name,
        role: editFormData.role,
      }
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim()
      }

      await api.put(`/auth/subordinates/${selectedMember.id}`, payload)
      toast.success('Employee credentials updated successfully!')
      setShowEditModal(false)
      setSelectedMember(null)
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update employee credentials'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Are you sure you want to revoke credentials and access for ${member.name}?`)) {
      return
    }
    try {
      await api.delete(`/auth/subordinates/${member.id}`)
      toast.success(`Access revoked for ${member.name}`)
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to revoke access'))
    }
  }

  const getRoleBadge = (role) => {
    const r = (role || 'staff').toLowerCase()
    switch (r) {
      case 'admin':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">🛡️ Admin</span>
      case 'manager':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">👔 Manager</span>
      case 'accountant':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">📊 Accountant</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">👤 Staff</span>
    }
  }

  const getActionBadge = (actionType) => {
    const act = (actionType || '').toUpperCase()
    if (act.includes('INVOICE')) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">📄 Invoice</span>
    if (act.includes('EXPENSE')) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">💸 Expense</span>
    if (act.includes('PAYMENT')) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">💳 Payment</span>
    if (act.includes('STOCK')) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">📦 Stock</span>
    if (act.includes('CUSTOMER')) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">👥 Customer</span>
    if (act.includes('VENDOR')) return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">🏭 Vendor</span>
    return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200">📝 Activity</span>
  }

  const filteredMembers = subordinates.filter((sub) => {
    const term = search.toLowerCase()
    const nameStr = (sub?.name || '').toLowerCase()
    const emailStr = (sub?.email || '').toLowerCase()
    const roleStr = (sub?.role || '').toLowerCase()
    return nameStr.includes(term) || emailStr.includes(term) || roleStr.includes(term)
  })

  // Password Protection Screen
  if (!isUnlocked) {
    const hasOrgPass = currentUser?.has_org_pass
    return (
      <PageWrapper title="Organization Protection">
        <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-xl font-bold text-slate-800">
            {hasOrgPass ? 'Organization Security Passcode' : 'Create Organization Security Passcode'}
          </h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">
            {hasOrgPass
              ? 'Enter your Organization Security Password to access team details, roles, and employee creation.'
              : 'Set up an Organization Password for the first time to protect your team details and access rights.'}
          </p>

          {hasOrgPass ? (
            <form onSubmit={handleVerifyOrgPass} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="Enter Organization Password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 text-center text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passLoading}
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
              >
                {passLoading ? 'Verifying...' : 'Unlock Organization Page'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSetupOrgPass} className="space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="New Organization Password"
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Confirm Organization Password"
                  value={confirmPassInput}
                  onChange={(e) => setConfirmPassInput(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={passLoading}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {passLoading ? 'Creating...' : 'Set Password & Access Organization'}
              </button>
            </form>
          )}
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper title="Organization Details & Team Credentials">
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              <h2 className="text-xl font-bold">{currentUser?.business_name || 'Organization Environment'}</h2>
            </div>
            <p className="text-slate-300 text-xs mt-1">
              Admin manages User IDs, Passwords, and Gmail accounts. Anyone logging in with credentials works under this Organization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUnlocked(false)}
              className="px-3.5 py-2.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl transition border border-slate-700 flex items-center gap-1.5"
              title="Lock Organization Page"
            >
              🔒 Lock Page
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow flex items-center gap-2"
            >
              ➕ Create Employee Credentials (Gmail)
            </button>
          </div>
        </div>

        {/* Tab Selector & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'members'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🔑 Team Members & Roles ({subordinates.length})
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'sessions'
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Active Logged-In Sessions ({sessions.length})
            </button>
          </div>

          {activeTab === 'members' && (
            <input
              type="text"
              autoComplete="off"
              placeholder="Search Team Members"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        {/* Tab 1: Team Members Table */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading team members...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No employees found. Click "Create Employee Credentials" to add team members.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Employee Name</th>
                      <th className="px-4 py-3">Email / Gmail</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Access Level</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredMembers.map((member) => {
                        const displayName = member.name || member.email || 'Employee'
                        const initial = displayName.charAt(0).toUpperCase()
                        return (
                          <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                            <td 
                              onClick={() => handleViewActivity(member)} 
                              className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2 cursor-pointer group"
                              title="Click to view employee work & activity log"
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-700 flex items-center justify-center font-bold text-xs text-slate-700 transition">
                                {initial}
                              </div>
                              <div>
                                <div className="group-hover:text-indigo-600 group-hover:underline font-semibold flex items-center gap-1.5">
                                  {displayName}
                                  <span className="text-[11px] font-normal text-slate-400 group-hover:text-indigo-500">🔍</span>
                                </div>
                                {member.is_owner && <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">Organization Owner</span>}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{member.email}</td>
                        <td className="px-4 py-3">{getRoleBadge(member.role)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 capitalize">
                          {member.role === 'admin' && 'Full Organization Admin Access'}
                          {member.role === 'manager' && 'Sales, Purchases, Invoices & Reports'}
                          {member.role === 'accountant' && 'Ledger, GST Filings, Expenses & Reports'}
                          {member.role === 'staff' && 'Standard Invoicing & Customer Access'}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => handleViewActivity(member)}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition inline-flex items-center gap-1 shadow-sm"
                            title="Click to view work logged by this employee"
                          >
                            📋 Work Log
                          </button>
                          {!member.is_owner && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(member)}
                                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition"
                              >
                                Edit Role/Pass
                              </button>
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg transition"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Active Logged In Sessions */}
        {activeTab === 'sessions' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-800 text-base mb-4">Active Logged-In Team Sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-slate-500 text-sm">No active live sessions detected.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((sess, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{sess.name || sess.email}</p>
                        <p className="text-xs text-slate-500 font-mono">{sess.email} • Role: {sess.role || 'staff'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-700 bg-emerald-100 font-bold px-2.5 py-1 rounded-full">
                      ONLINE
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Employee Credentials Modal */}
        {showAddModal && (
          <Modal open={showAddModal} title="Create Employee Credentials (Gmail)" onClose={() => setShowAddModal(false)}>
            <form onSubmit={handleAddSubordinate} autoComplete="off" className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                <p className="font-bold">💡 Employee Gmail & Access Setup</p>
                <p>When an employee signs in using this Gmail address or password, they automatically work under <strong>{currentUser?.business_name || 'your Organization'}</strong>.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Full Name *</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Email / Gmail *</label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Password (for Password login)</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Initial Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">Leave blank to use default password FRIDAY@123. If they log in via Google Sign In with this Gmail, password is not required.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Organization Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="staff">👤 Staff (Invoices, Customers & Stock Read)</option>
                  <option value="accountant">📊 Accountant (Ledgers, GST Filings, Expenses & Invoices)</option>
                  <option value="manager">👔 Manager (Invoices, Purchases, Vendors, Reports)</option>
                  <option value="admin">🛡️ Admin (Full Access to All Features)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Employee Credentials'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Edit Employee Credentials Modal */}
        {showEditModal && selectedMember && (
          <Modal open={showEditModal} title={`Edit Credentials for ${selectedMember.name}`} onClose={() => setShowEditModal(false)}>
            <form onSubmit={handleUpdateSubordinate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Full Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty to keep unchanged"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization Role</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="staff">👤 Staff</option>
                  <option value="accountant">📊 Accountant</option>
                  <option value="manager">👔 Manager</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Update Credentials'}
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Employee Work & Activity Log Modal */}
        {showActivityModal && activityMember && (
          <Modal
            open={showActivityModal}
            title={`Work & Activity Log: ${activityMember.name || activityMember.email}`}
            onClose={() => setShowActivityModal(false)}
            wide={true}
          >
            <div className="space-y-5">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-inner">
                    {(activityMember.name || activityMember.email || 'E').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2">
                      {activityMember.name || activityMember.email}
                      {getRoleBadge(activityMember.role)}
                    </h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">{activityMember.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleViewActivity(activityMember)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5 self-start sm:self-auto"
                >
                  🔄 Refresh Log
                </button>
              </div>

              {activityLoading ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm font-medium">Fetching employee activity records...</p>
                </div>
              ) : activityData ? (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs font-semibold text-slate-500">Total Entries Logged</span>
                      <p className="text-xl font-extrabold text-slate-900 mt-1">{activityData.stats.total_actions}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Actions recorded</p>
                    </div>
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                      <span className="text-xs font-semibold text-emerald-700">Sales Invoiced</span>
                      <p className="text-xl font-extrabold text-emerald-900 mt-1">₹{(activityData.stats.total_revenue || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-emerald-600 mt-0.5">{activityData.stats.invoices_count} invoices</p>
                    </div>
                    <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                      <span className="text-xs font-semibold text-amber-700">Expenses Logged</span>
                      <p className="text-xl font-extrabold text-amber-900 mt-1">₹{(activityData.stats.total_expenses || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-amber-600 mt-0.5">{activityData.stats.expenses_count} entries</p>
                    </div>
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                      <span className="text-xs font-semibold text-blue-700">Payments Collected</span>
                      <p className="text-xl font-extrabold text-blue-900 mt-1">₹{(activityData.stats.total_payments || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[11px] text-blue-600 mt-0.5">{activityData.stats.payments_count} payments</p>
                    </div>
                  </div>

                  {/* Filter Bar & Search */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                      {[
                        { id: 'all', label: 'All Activities' },
                        { id: 'invoice', label: '📄 Invoices' },
                        { id: 'expense', label: '💸 Expenses' },
                        { id: 'payment', label: '💳 Payments' },
                        { id: 'stock', label: '📦 Stock & Other' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActivityFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                            activityFilter === tab.id
                              ? 'bg-slate-900 text-white shadow-sm'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Search Work Entries"
                      value={activitySearch}
                      onChange={(e) => setActivitySearch(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Activity Log List */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[380px] overflow-y-auto">
                    {(() => {
                      const filtered = (activityData.activities || []).filter((item) => {
                        const matchesFilter =
                          activityFilter === 'all'
                            ? true
                            : (item.entity_type || '').toLowerCase().includes(activityFilter) ||
                              (item.action_type || '').toLowerCase().includes(activityFilter)
                        const term = activitySearch.toLowerCase()
                        const matchesSearch =
                          !term ||
                          (item.description || '').toLowerCase().includes(term) ||
                          (item.action_type || '').toLowerCase().includes(term) ||
                          (item.entity_type || '').toLowerCase().includes(term)
                        return matchesFilter && matchesSearch
                      })

                      if (filtered.length === 0) {
                        return (
                          <div className="p-8 text-center text-slate-500 text-sm">
                            No work entries found for the selected filter.
                          </div>
                        )
                      }

                      return (
                        <table className="w-full text-left text-xs text-slate-600">
                          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 bg-white">
                            <tr>
                              <th className="px-3.5 py-2.5">Timestamp</th>
                              <th className="px-3.5 py-2.5">Category</th>
                              <th className="px-3.5 py-2.5">Work Done / Action Description</th>
                              <th className="px-3.5 py-2.5 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filtered.map((act) => (
                              <tr key={act.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                                  {act.created_at ? new Date(act.created_at).toLocaleString() : 'N/A'}
                                </td>
                                <td className="px-3.5 py-2.5">{getActionBadge(act.action_type)}</td>
                                <td className="px-3.5 py-2.5 font-medium text-slate-800">{act.description}</td>
                                <td className="px-3.5 py-2.5 text-right font-semibold text-slate-900">
                                  {act.amount > 0 ? (
                                    <span className={act.action_type?.includes('EXPENSE') ? 'text-amber-700 font-mono' : 'text-emerald-700 font-mono'}>
                                      ₹{act.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-mono">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )
                    })()}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">No activity data available for this employee.</div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </PageWrapper>
  )
}
