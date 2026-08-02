import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';

const initialMessages = [
  { from: 'user', text: 'Create invoice for Raj Traders 50 bags cement at 380 rupees 18% GST' },
  { from: 'ai', text: "Done! Invoice #INV-0031 Raj Traders ke liye create ho gaya, total ₹22,420." },
  { from: 'user', text: 'aaa' },
  { from: 'ai', text: "I'm sorry, I didn't understand that. Could you please rephrase your request?" },
];

export default function AIChat() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();

  function send() {
    if (!draft.trim()) return;
    setMessages((prev) => [...prev, { from: 'user', text: draft }]);
    setDraft('');
  }

  return (
    <section className="view" id="view-chat">
      <Topbar title="AI Chat" />
      <div className="chat-layout">
        <div>
          <div className="qa-label">Quick Actions</div>
          <button className="qa-btn">New Invoice</button>
          <button className="qa-btn">Record Payment</button>
          <button className="qa-btn">Check Outstanding</button>
          <button className="qa-btn">Today's Sales</button>
          <button className="qa-btn">Add Expense</button>
          <button className="qa-btn">GST Summary</button>
          <button
            className="qa-btn"
            style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}
            onClick={() => navigate('/scan')}
          >
            🔍 Scan an invoice
          </button>
        </div>
        <div className="chat-pane">
          {messages.map((m, i) => (
            <div className={'msg-row' + (m.from === 'user' ? ' user' : '')} key={i}>
              {m.from === 'user' ? (
                <div className="msg-user">{m.text}</div>
              ) : (
                <div className="msg-ai"><div className="who">FRIDAY</div>{m.text}</div>
              )}
            </div>
          ))}
          <div className="chat-input-row">
            <input
              type="text"
              placeholder="Type in English or Hindi..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn" onClick={send}>Send</button>
          </div>
        </div>
      </div>
    </section>
  );
}
