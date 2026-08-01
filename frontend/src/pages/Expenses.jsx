import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import ExpenseForm from '../components/forms/ExpenseForm'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Expenses() {
  const [expenses, setExpenses] = useState([])
  const [category, setCategory] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    setLoading(true)
    api.get('/expenses', { params: { category } }).then(res => setExpenses(res.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [category])

  const handleCreate = async (data) => {
    await api.post('/expenses', data)
    toast.success('Expense recorded')
    setShowForm(false)
    fetch()
  }

  const handleDelete = async (id) => {
    await api.delete(`/expenses/${id}`)
    toast.success('Deleted')
    fetch()
  }

  return (
    <PageWrapper title="Expenses">
      <div className="flex justify-between mb-4">
        <select value={category} onChange={e => setCategory(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {['Rent', 'Salaries', 'Electricity', 'Transport', 'Office Supplies', 'Maintenance'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm">+ Add Expense</button>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        {expenses.length === 0 && !loading ? (
          <EmptyState title="No expenses" description="Track your business expenses here" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>{['Date', 'Category', 'Description', 'Amount', 'Mode', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left text-xs uppercase text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map(e => (
                  <tr key={e.id}>
                    <td className="px-4 py-3">{formatDate(e.expense_date)}</td>
                    <td className="px-4 py-3">{e.category}</td>
                    <td className="px-4 py-3 text-gray-600">{e.description || '-'}</td>
                    <td className="px-4 py-3 font-mono">{formatCurrency(e.amount)}</td>
                    <td className="px-4 py-3 capitalize">{e.payment_mode?.replace('_', ' ')}</td>
                    <td className="px-4 py-3"><button onClick={() => handleDelete(e.id)} className="text-red-600 text-xs">Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Expense">
        <ExpenseForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>
    </PageWrapper>
  )
}
