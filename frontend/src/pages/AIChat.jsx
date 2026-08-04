import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar.jsx';
import { useChat } from '../hooks/useChat';

export default function AIChat() {
  const { messages, sendMessage, isTyping } = useChat();
  const [draft, setDraft] = useState('');
  const navigate = useNavigate();

  async function send() {
    if (!draft.trim()) return;
    await sendMessage(draft);
    setDraft('');
  }

  return (
    <section className="view" id="view-chat">
      <Topbar title="AI Chat" />
      <div className="chat-layout">
        <div>
          <div className="qa-label">Quick Actions</div>
          <button className="qa-btn" onClick={() => sendMessage('Create new sales invoice')}>New Invoice</button>
          <button className="qa-btn" onClick={() => sendMessage('Record payment')}>Record Payment</button>
          <button className="qa-btn" onClick={() => sendMessage('Summarize top overdue accounts')}>Check Outstanding</button>
          <button className="qa-btn" onClick={() => sendMessage("Show today's sales")}>Today's Sales</button>
          <button className="qa-btn" onClick={() => sendMessage('Add expense rent 1500')}>Add Expense</button>
          <button className="qa-btn" onClick={() => sendMessage('Check GSTR-3B tax summary for August')}>GST Summary</button>
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
          {isTyping && (
            <div className="msg-row">
              <div className="msg-ai">
                <div className="who">FRIDAY</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chatbot-primary-color)', display: 'inline-block' }}></span>
                  FRIDAY is checking accounting database...
                </div>
              </div>
            </div>
          )}
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
