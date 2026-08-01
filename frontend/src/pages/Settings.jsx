import { useState } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function Settings() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    business_name: user?.business_name || '',
    business_address: user?.business_address || '',
    gstin: user?.gstin || '',
    phone: user?.phone || '',
    financial_year: user?.financial_year || '2024-25',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await updateProfile(form)
      toast.success('Profile updated')
    } catch {
      toast.error('Update failed')
    }
  }

  return (
    <PageWrapper title="Settings">
      <div className="max-w-lg bg-white rounded-xl border p-6">
        <h3 className="font-semibold mb-4">Business Profile</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {['name', 'business_name', 'phone', 'gstin', 'financial_year'].map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field.replace('_', ' ')}</label>
              <input value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className="w-full border rounded-lg px-3 py-2" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
            <textarea value={form.business_address} onChange={e => setForm(f => ({ ...f, business_address: e.target.value }))} rows={3} className="w-full border rounded-lg px-3 py-2" />
          </div>
          <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-sm">Save Changes</button>
        </form>
      </div>
    </PageWrapper>
  )
}
