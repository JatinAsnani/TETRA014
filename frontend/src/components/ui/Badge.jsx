const styles = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
  pending: 'bg-amber-100 text-amber-700',
}

export default function Badge({ status, children }) {
  const s = (status || '').toLowerCase()
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${styles[s] || 'bg-gray-100 text-gray-700'}`}>
      {children || status}
    </span>
  )
}
