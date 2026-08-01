import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageWrapper from '../components/layout/PageWrapper'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import SearchBar from '../components/ui/SearchBar'
import CustomerForm from '../components/forms/CustomerForm'
import { useCustomers } from '../hooks/useCustomers'
import { formatCurrency } from '../utils/formatCurrency'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Customers() {
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const { customers, loading, refetch } = useCustomers(search)

  const handleCreate = async (data) => {
    await api.post('/customers', data)
    toast.success('Customer created')
    setShowForm(false)
    refetch()
  }

  return (
    <PageWrapper title="Customers">
      <div className="flex justify-between mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search customers..." />
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">+ Add Customer</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        {customers.length === 0 && !loading ? (
          <EmptyState title="No customers" description="Add customers to create invoices" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead className="bg-gray-50">
                <tr>{['Name', 'Phone', 'GSTIN', 'Total Business', 'Outstanding', ''].map(h => <th key={h} className="px-4 py-3 text-left text-xs uppercase text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {[...customers].sort((a, b) => b.outstanding - a.outstanding).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium"><Link to={`/customers/${c.id}`} className="text-primary">{c.name}</Link></td>
                    <td className="px-4 py-3">{c.phone || '-'}</td>
                    <td className="px-4 py-3 text-xs">{c.gstin || '-'}</td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(c.total_business)}</td>
                    <td className="px-4 py-3 font-mono text-red-600">{formatCurrency(c.outstanding)}</td>
                    <td className="px-4 py-3"><Link to={`/customers/${c.id}`} className="text-xs text-primary">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Customer">
        <CustomerForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>
    </PageWrapper>
  )
}
