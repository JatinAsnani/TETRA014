import { useState, useEffect } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import Modal from '../components/ui/Modal'
import PaymentForm from '../components/forms/PaymentForm'
import { formatCurrency } from '../utils/formatCurrency'
import { formatDate } from '../utils/formatDate'
import api from '../api/axios'
import toast from 'react-hot-toast'

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [outstanding, setOutstanding] = useState([])
  const [showForm, setShowForm] = useState(false)

  const fetch = () => {
    api.get('/payments').then(res => setPayments(res.data))
    api.get('/payments/outstanding').then(res => setOutstanding(res.data))
  }
  useEffect(() => { fetch() }, [])

  const handleCreate = async (data) => {
    await api.post('/payments', data)
    toast.success('Payment recorded')
    setShowForm(false)
    fetch()
  }

  return (
    <PageWrapper title="Payments">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-sm font-medium text-gray-500 uppercase mb-4">Outstanding</h3>
          {outstanding.map(c => (
            <div key={c.id} className="flex justify-between py-2 border-b text-sm">
              <span>{c.name}</span>
              <span className="font-mono text-red-600">{formatCurrency(c.outstanding)}</span>
            </div>
          ))}
          <button onClick={() => setShowForm(true)} className="w-full mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm">Record Payment</button>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="bg-gray-50">
                <tr>{['Date', 'Customer', 'Amount', 'Mode'].map(h => <th key={h} className="px-4 py-3 text-left text-xs uppercase text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3">{p.customer?.name}</td>
                    <td className="px-4 py-3 font-mono text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 capitalize">{p.payment_mode?.replace('_', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Record Payment">
        <PaymentForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
      </Modal>
    </PageWrapper>
  )
}
