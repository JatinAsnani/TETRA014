import { formatCurrency } from '../../utils/formatCurrency'

export default function ActionCard({ type, data, onConfirm, onEdit }) {
  if (!data) return null

  if (type === 'create_invoice' && data.preview) {
    const p = data.preview
    return (
      <div className="mt-3 p-4 bg-white border border-blue-200 rounded-xl">
        <h4 className="font-medium text-sm">Invoice Preview — {p.invoice_number || 'New'}</h4>
        <p className="text-sm text-gray-600 mt-1">Customer: {data.customer}</p>
        <p className="font-mono text-lg font-semibold mt-2">{formatCurrency(data.total_amount)}</p>
        <div className="flex gap-2 mt-3">
          {onConfirm && <button onClick={onConfirm} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg">Confirm</button>}
          {onEdit && <button onClick={onEdit} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg">Edit</button>}
        </div>
      </div>
    )
  }

  if (type === 'record_payment') {
    return (
      <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <p className="text-sm">Payment recorded: {formatCurrency(data.amount)} from {data.customer}</p>
      </div>
    )
  }

  return null
}
