import { useState, useEffect, useRef } from 'react'
import PageWrapper from '../components/layout/PageWrapper'
import ChatBubble from '../components/chat/ChatBubble'
import SuggestionChips from '../components/chat/SuggestionChips'
import TypingIndicator from '../components/chat/TypingIndicator'
import api from '../api/axios'
import toast from 'react-hot-toast'

const QUICK_ACTIONS = [
  { label: 'New Invoice', query: 'Create invoice for Raj Traders 50 bags cement at 380 rupees 18% GST' },
  { label: 'Record Payment', query: 'Record payment of 5000 from Raj Traders' },
  { label: 'Check Outstanding', query: 'Raj Traders ka outstanding kya hai?' },
  { label: "Today's Sales", query: 'Show me this month sales report' },
  { label: 'Add Expense', query: 'Add expense 2000 rent today' },
  { label: 'GST Summary', query: 'Show GST summary for this month' },
]

const FOLLOW_UPS = {
  create_invoice: ['Send invoice to customer', 'Record partial payment', 'Create another invoice'],
  record_payment: ['Check remaining outstanding', 'Show payment history', 'Create new invoice'],
  check_outstanding: ['Send payment reminder', 'Record payment', 'Show all outstanding'],
  get_report: ['Show GST summary', 'Check outstanding', 'Add expense'],
  default: ['Show outstanding receivable', 'Create invoice', 'GST summary this month'],
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/chat/history').then(res => {
      setMessages(res.data.map(h => ({
        role: h.role,
        message: h.message,
        action: h.action_taken,
      })))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    if (!text.trim()) return
    setInput('')
    setSuggestions([])
    setMessages(m => [...m, { role: 'user', message: text }])
    setLoading(true)
    try {
      const res = await api.post('/chat', { message: text })
      const { reply, action, data } = res.data
      setMessages(m => [...m, { role: 'assistant', message: reply, action, data }])
      setSuggestions(FOLLOW_UPS[action] || FOLLOW_UPS.default)
    } catch (err) {
      toast.error('Failed to send message')
      setMessages(m => [...m, { role: 'assistant', message: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice input not supported in this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.onresult = (e) => setInput(e.results[0][0].transcript)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    setListening(true)
    recognition.start()
  }

  return (
    <PageWrapper title="AI Chat">
      <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100vh-140px)]">
        <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 md:w-56 shrink-0">
          <p className="hidden md:block text-xs font-medium text-gray-500 uppercase">Quick Actions</p>
          {QUICK_ACTIONS.map(a => (
            <button
              key={a.label}
              onClick={() => sendMessage(a.query)}
              className="whitespace-nowrap md:w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-4">🤖</p>
                <p className="font-medium text-gray-600">Ask TallAI anything</p>
                <p className="text-sm mt-1">Try: "Raj Traders ka kitna baaki hai?" or "Create invoice for 50 cement bags"</p>
              </div>
            )}
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} message={m.message} action={m.action} data={m.data} />
            ))}
            {loading && <TypingIndicator />}
            {suggestions.length > 0 && !loading && (
              <SuggestionChips suggestions={suggestions} onSelect={sendMessage} />
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-200 p-4 flex gap-2">
            <button
              onClick={startVoice}
              className={`px-3 py-2 rounded-lg border ${listening ? 'bg-red-100 border-red-300' : 'border-gray-300 hover:bg-gray-50'}`}
              title="Voice input"
            >
              🎤
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Type in English or Hindi..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
