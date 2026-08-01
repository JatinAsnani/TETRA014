export default function ChatBubble({ role, message, action, data }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-primary text-white rounded-br-md' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
      }`}>
        {!isUser && <p className="text-xs font-medium text-primary mb-1">TallAI</p>}
        <p className="text-sm whitespace-pre-wrap">{message}</p>
        {action && data && !isUser && (
          <ActionCard action={action} data={data} />
        )}
      </div>
    </div>
  )
}

function ActionCard({ action, data }) {
  if (data.error) return <p className="text-red-600 text-xs mt-2">{data.error}</p>
  return (
    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs border border-gray-100">
      {action === 'create_invoice' && data.invoice_number && (
        <p>Invoice #{data.invoice_number} — ₹{Number(data.total_amount).toLocaleString('en-IN')}</p>
      )}
      {action === 'record_payment' && (
        <p>Payment ₹{Number(data.amount).toLocaleString('en-IN')} from {data.customer}</p>
      )}
      {action === 'check_outstanding' && (
        <p>{data.party_name}: ₹{Number(data.outstanding).toLocaleString('en-IN')}</p>
      )}
      {action === 'get_report' && data.net_profit !== undefined && (
        <p>Sales: ₹{Number(data.total_sales).toLocaleString('en-IN')} | Profit: ₹{Number(data.net_profit).toLocaleString('en-IN')}</p>
      )}
      {action === 'get_gst_summary' && (
        <p>GST Liability: ₹{Number(data.net_gst_liability).toLocaleString('en-IN')}</p>
      )}
    </div>
  )
}

export { ActionCard }
