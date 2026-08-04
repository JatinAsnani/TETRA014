import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../hooks/useChat';

// Small Realistic ₹500 Indian Banknote
function RealINR500PhotoNote({ width = 64, height = 30 }) {
  return (
    <div
      style={{
        position: 'relative',
        width,
        height,
        borderRadius: 1,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        border: '0.4px solid rgba(0,0,0,0.15)',
        background: 'transparent',
      }}
    >
      <img
        src="/inr500_real.png"
        alt="Real ₹500 Note"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
      {/* 3D Paper Sheen Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(115deg, rgba(255,255,255,0.4) 0%, transparent 45%, rgba(0,0,0,0.2) 75%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

// 3D Cute AI Robot Character - Dynamic Theme Color Transition & Waist Tucked Behind Button
function RobotSitting3DCartoon() {
  return (
    <svg width="72" height="78" viewBox="0 0 120 130" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))' }}>
      <defs>
        <linearGradient id="botMetal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#E2E8F0" />
          <stop offset="85%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
      </defs>

      {/* Antenna Head Light */}
      <line x1="60" y1="8" x2="60" y2="24" stroke="var(--chatbot-primary-color)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="60" cy="7" r="5" fill="var(--chatbot-primary-color)" style={{ filter: 'drop-shadow(0 0 8px var(--chatbot-primary-color))' }} />

      {/* Robot Head */}
      <rect x="30" y="22" width="60" height="42" rx="16" fill="url(#botMetal)" stroke="#64748B" strokeWidth="1.5" />
      {/* Ears */}
      <rect x="22" y="32" width="8" height="20" rx="4" fill="var(--chatbot-primary-color)" />
      <rect x="90" y="32" width="8" height="20" rx="4" fill="var(--chatbot-primary-color)" />

      {/* Visor Screen */}
      <rect x="38" y="30" width="44" height="26" rx="10" fill="#0A0E17" stroke="var(--chatbot-primary-color)" strokeWidth="1.2" />
      {/* Glowing Visor Light bound to theme transition */}
      <rect x="42" y="34" width="36" height="18" rx="8" fill="var(--chatbot-primary-color)" opacity="0.9" />
      {/* Glowing Cute Robot Eyes */}
      <circle cx="52" cy="43" r="3.5" fill="#FFFFFF" />
      <circle cx="68" cy="43" r="3.5" fill="#FFFFFF" />

      {/* Neck */}
      <rect x="52" y="64" width="16" height="8" rx="3" fill="#475569" />

      {/* Robot Torso Body */}
      <rect x="34" y="70" width="52" height="38" rx="14" fill="url(#botMetal)" stroke="#64748B" strokeWidth="1.5" />
      {/* Core Glowing Chest Emblem bound to theme transition */}
      <circle cx="60" cy="88" r="8" fill="var(--chatbot-primary-color)" stroke="#FFFFFF" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 8px var(--chatbot-primary-color))' }} />

      {/* Robot Arms resting on top edge */}
      <path d="M 34 76 Q 18 84 26 96" fill="none" stroke="var(--chatbot-primary-color)" strokeWidth="6" strokeLinecap="round" />
      <path d="M 86 76 Q 102 84 94 96" fill="none" stroke="var(--chatbot-primary-color)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="26" cy="96" r="4" fill="url(#botMetal)" />
      <circle cx="94" cy="96" r="4" fill="url(#botMetal)" />

      {/* Robot Waist & Lower Base (Positioned behind launcher button) */}
      <path d="M 18 106 Q 60 96 102 106 Q 90 126 60 128 Q 30 126 18 106 Z" fill="var(--chatbot-primary-color)" stroke="#0284C7" strokeWidth="1" />
      <circle cx="36" cy="116" r="6" fill="url(#botMetal)" />
      <circle cx="84" cy="116" r="6" fill="url(#botMetal)" />
    </svg>
  );
}

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { messages, sendMessage, isTyping, clearMessages } = useChat();
  const [draft, setDraft] = useState('');
  const [cashParticles, setCashParticles] = useState([]);
  
  // Track system theme (Light Mode vs Dark Mode)
  const [isLightMode, setIsLightMode] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'light'
  );

  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.getAttribute('data-theme') === 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowGuide(false);
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Small Real ₹500 Note Flying Physics: Launch up, fall down under gravity, fade out
  function triggerCashExplosion(direction = 'out') {
    const newParticles = Array.from({ length: 26 }).map((_, i) => ({
      id: Date.now() + '-' + i + '-' + Math.random(),
      tx: (Math.random() * -280 - 20) + 'px',
      peakY: (Math.random() * -280 - 120) + 'px',
      dropY: (Math.random() * 90 + 160) + 'px',
      rotX: (Math.random() * 280 - 140) + 'deg',
      rotY: (Math.random() * 280 - 140) + 'deg',
      rotZ: (Math.random() * 720 - 360) + 'deg',
      scale: (Math.random() * 0.35 + 0.8),
      duration: (1.25 + Math.random() * 0.5) + 's',
      direction,
    }));
    setCashParticles(newParticles);
    setTimeout(() => {
      setCashParticles([]);
    }, 1750);
  }

  function handleToggle() {
    const nextState = !isOpen;
    setShowGuide(false);
    triggerCashExplosion(nextState ? 'out' : 'in');
    setIsOpen(nextState);
  }

  function handleClose() {
    triggerCashExplosion('in');
    setIsOpen(false);
  }

  async function send(textToSend) {
    const text = textToSend || draft;
    if (!text.trim()) return;
    await sendMessage(text);
    setDraft('');
  }

  function handleClear() {
    clearMessages();
  }

  const windowWidth = isExpanded 
    ? 'min(880px, calc(100vw - 32px))' 
    : 'min(620px, calc(100vw - 32px))';

  const windowHeight = isExpanded 
    ? 'calc(100vh - 96px)' 
    : 'min(580px, calc(100vh - 110px))';

  // Dynamic Chatbot Styling bound directly to CSS Custom Property --chatbot-primary-color
  const chatBg = isLightMode ? '#FFFFFF' : '#0F172A';
  const textColor = isLightMode ? '#0F172A' : '#FFFFFF';
  const headerBg = isLightMode ? 'var(--chatbot-primary-color)' : '#0F172A';
  const bodyBg = isLightMode ? '#F0FDF4' : '#0A0E17';
  const aiBubbleBg = isLightMode ? '#FFFFFF' : '#1E293B';
  const aiBubbleText = isLightMode ? '#0F172A' : '#F8FAFC';
  const aiBubbleBorder = '1.5px solid var(--chatbot-primary-color)';
  const inputBg = isLightMode ? '#E0F2FE' : '#1E293B';
  const inputText = isLightMode ? '#0F172A' : '#FFFFFF';

  // Black Border Track with Crisp Rotating White Laser Line
  const borderBeamConic = 'conic-gradient(from 0deg, transparent 0%, #FFFFFF 12%, #FFFFFF 20%, transparent 42%)';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        fontFamily: 'Inter, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      {/* Small Real ₹500 Note 3D Gravity Flying Container */}
      {cashParticles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            bottom: 30,
            right: 30,
            pointerEvents: 'none',
            zIndex: 2500,
            perspective: 900,
            animation: `${p.direction === 'in' ? 'cashGravityIn' : 'cashGravityOut'} ${p.duration} cubic-bezier(0.25, 1, 0.5, 1) forwards`,
            '--tx': p.tx,
            '--peakY': p.peakY,
            '--dropY': p.dropY,
            '--rotX': p.rotX,
            '--rotY': p.rotY,
            '--rotZ': p.rotZ,
          }}
        >
          <RealINR500PhotoNote width={Math.round(64 * p.scale)} height={Math.round(30 * p.scale)} />
        </div>
      ))}

      {/* Onboarding Guide Callout Popup */}
      {showGuide && !isOpen && (
        <div
          className="chatbot-guide-callout"
          style={{
            position: 'absolute',
            bottom: 68,
            right: 0,
            width: 320,
            background: isLightMode ? '#FFFFFF' : '#0D1424',
            border: '1.5px solid var(--chatbot-primary-color)',
            borderRadius: 16,
            padding: '14px 16px',
            boxShadow: isLightMode ? 'none' : '0 16px 40px rgba(0,0,0,0.4)',
            color: isLightMode ? '#0F172A' : '#F8FAFC',
            zIndex: 1001,
            animation: 'slideUp 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--chatbot-primary-color)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🤖</span> Meet FRIDAY AI Assistant!
            </div>
            <button
              onClick={() => setShowGuide(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isLightMode ? '#64748B' : '#94A3B8',
                fontSize: 14,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>

          <p style={{ fontSize: 12.5, color: isLightMode ? '#475569' : '#CBD5E1', lineHeight: 1.4, margin: '0 0 12px' }}>
            Your AI Co-Pilot is located right here in the bottom right corner! Click to create invoices, check tax summaries, or audit ledgers.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => {
                triggerCashExplosion('out');
                setShowGuide(false);
                setIsOpen(true);
              }}
              style={{
                background: 'var(--chatbot-primary-color)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: 'none',
              }}
            >
              Try FRIDAY AI Now 👇
            </button>
            
            <span
              onClick={() => setShowGuide(false)}
              style={{ fontSize: 11.5, color: isLightMode ? '#64748B' : '#94A3B8', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Got it!
            </span>
          </div>

          {/* Pointer Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: -8,
              right: 48,
              width: 14,
              height: 14,
              background: isLightMode ? '#FFFFFF' : '#0D1424',
              borderRight: '1.5px solid var(--chatbot-primary-color)',
              borderBottom: '1.5px solid var(--chatbot-primary-color)',
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      )}

      {/* Chatbot Studio Window */}
      {isOpen && (
        <div
          style={{
            width: windowWidth,
            height: windowHeight,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 96px)',
            borderRadius: 18,
            background: chatBg,
            border: '2px solid var(--chatbot-primary-color)',
            boxShadow: isLightMode ? 'none' : '0 24px 60px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            marginBottom: 12,
            animation: 'slideUp 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
            color: textColor,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 20px',
              background: headerBg,
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img
                src="/logo.png"
                alt="FRIDAY Logo"
                style={{
                  height: 28,
                  width: 'auto',
                  objectFit: 'contain',
                  background: 'transparent',
                  filter: isLightMode ? 'brightness(0) invert(1)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
                }}
              />
            </div>

            {/* Window Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={handleClear}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
                title="Clear Chat History"
              >
                Clear
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#FFFFFF',
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
                title={isExpanded ? 'Shrink Window' : 'Maximize Window'}
              >
                {isExpanded ? 'Shrink' : 'Expand'}
              </button>
              <button
                onClick={handleClose}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  color: '#F87171',
                  fontSize: 14,
                  padding: '5px 11px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
                title="Close Chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Action Chips */}
          <div
            style={{
              padding: '10px 18px',
              background: isLightMode ? '#E0F2FE' : '#0F172A',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => send('Create new sales invoice')}
              style={{
                background: isLightMode ? '#FFFFFF' : '#1E293B',
                border: '1.5px solid var(--chatbot-primary-color)',
                color: 'var(--chatbot-primary-color)',
                borderRadius: 20,
                padding: '5px 13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📄 New Invoice
            </button>
            <button
              onClick={() => send('Check GSTR-3B tax summary for August')}
              style={{
                background: isLightMode ? '#FFFFFF' : '#1E293B',
                border: '1.5px solid var(--chatbot-primary-color)',
                color: 'var(--chatbot-primary-color)',
                borderRadius: 20,
                padding: '5px 13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📕 Tax Summary
            </button>
            <button
              onClick={() => send('Summarize top overdue accounts')}
              style={{
                background: isLightMode ? '#FFFFFF' : '#1E293B',
                border: '1.5px solid var(--chatbot-primary-color)',
                color: 'var(--chatbot-primary-color)',
                borderRadius: 20,
                padding: '5px 13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚠️ Overdue Accounts
            </button>
            <button
              onClick={() => {
                handleClose();
                navigate('/scan');
              }}
              style={{
                background: 'var(--chatbot-primary-color)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: 20,
                padding: '5px 13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔍 Scan Invoices →
            </button>
            <button
              onClick={() => send('Calculate Net Profit for current quarter')}
              style={{
                background: isLightMode ? '#FFFFFF' : '#1E293B',
                border: '1.5px solid var(--chatbot-primary-color)',
                color: 'var(--chatbot-primary-color)',
                borderRadius: 20,
                padding: '5px 13px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              📊 Profit Breakdown
            </button>
          </div>

          {/* Conversation Body */}
          <div
            style={{
              flex: 1,
              padding: '20px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              background: bodyBg,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '12px 16px',
                    borderRadius: m.from === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: m.from === 'user' ? 'var(--chatbot-primary-color)' : aiBubbleBg,
                    color: m.from === 'user' ? '#FFFFFF' : aiBubbleText,
                    fontWeight: 600,
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    border: m.from === 'user' ? '1px solid var(--chatbot-primary-color)' : aiBubbleBorder,
                    boxShadow: isLightMode ? 'none' : '0 4px 16px rgba(0,0,0,0.15)',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '14px 14px 14px 2px',
                    background: aiBubbleBg,
                    color: isLightMode ? '#0F172A' : '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    border: aiBubbleBorder,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isLightMode ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--chatbot-primary-color)', display: 'inline-block' }}></span>
                  FRIDAY is checking accounting database...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div
            style={{
              padding: '14px 18px',
              background: headerBg,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              gap: 10,
            }}
          >
            <input
              type="text"
              autoComplete="off"
              placeholder="Ask FRIDAY AI..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              style={{
                flex: 1,
                background: inputBg,
                border: '1.5px solid var(--chatbot-primary-color)',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13.5,
                fontWeight: 600,
                color: inputText,
                outline: 'none',
              }}
            />
            <button
              onClick={() => send()}
              style={{
                background: 'var(--chatbot-primary-color)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontWeight: 800,
                fontSize: 13.5,
                cursor: 'pointer',
                boxShadow: isLightMode ? 'none' : '0 2px 10px rgba(0,0,0,0.2)',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}



      {/* 3D AI Robot - Lower Waist Tucked BEHIND Button (zIndex: 1) */}
      {!isOpen && (
        <div
          style={{
            position: 'absolute',
            top: -46,
            right: 28,
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={handleToggle}
          title="Click to talk with FRIDAY AI!"
        >
          {/* Speech Bubble "Hi, Mujhse pucho" */}
          <div
            style={{
              position: 'absolute',
              top: -24,
              right: -14,
              whiteSpace: 'nowrap',
              background: isLightMode ? '#0F172A' : '#FFFFFF',
              color: isLightMode ? '#FFFFFF' : '#0F172A',
              fontSize: 11.5,
              fontWeight: 800,
              padding: '4px 11px',
              borderRadius: 14,
              boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              zIndex: 1003,
            }}
          >
            <span>💬</span> Hi, Mujhse pucho
            <div
              style={{
                position: 'absolute',
                bottom: -5,
                left: 18,
                width: 8,
                height: 8,
                background: isLightMode ? '#0F172A' : '#FFFFFF',
                transform: 'rotate(45deg)',
              }}
            />
          </div>

          <RobotSitting3DCartoon />
        </div>
      )}

      {/* Solid Black Border Track with Crisp Rotating White Laser Line (zIndex: 2, masks robot waist) */}
      <div
        className="evalyze-border-beam-wrapper"
        style={{
          position: 'relative',
          zIndex: 2, // Placed ABOVE robot waist so robot lower body is masked behind the button!
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: 40,
          padding: '4px',
          background: '#0A0E17',
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 255, 255, 0.25)',
        }}
      >
        {/* Rotating Crisp White Laser Line */}
        <div
          style={{
            position: 'absolute',
            top: '-100%',
            left: '-100%',
            width: '300%',
            height: '300%',
            background: borderBeamConic,
            animation: 'evalyzeBorderBeam 3s linear infinite',
            zIndex: 0,
            pointerEvents: 'none',
            filter: 'drop-shadow(0 0 6px #FFFFFF)',
          }}
        />

        {/* Launcher Pill Button Content */}
        <button
          onClick={handleToggle}
          className="chatbot-floating-pill"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 20px 8px 12px',
            background: 'var(--chatbot-primary-color)',
            border: 'none',
            borderRadius: 34,
            cursor: 'pointer',
            outline: 'none',
          }}
          title="Chat with FRIDAY AI Assistant"
        >
          {/* Circular Bot Avatar Badge */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#FFFFFF',
              color: 'var(--chatbot-primary-color)',
              fontSize: 20,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.25)',
            }}
          >
            {isOpen ? '✕' : '🤖'}
            {!isOpen && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 1,
                  right: -1,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '2px solid #FFFFFF',
                  boxShadow: '0 0 8px #10B981',
                }}
              />
            )}
          </div>

          {/* Chatbot Text */}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.25 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isOpen ? 'Close Chatbot' : 'Ask FRIDAY AI'}
              {!isOpen && (
                <span style={{ fontSize: 9.5, background: 'rgba(255, 255, 255, 0.25)', color: '#FFFFFF', padding: '1px 7px', borderRadius: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  LIVE
                </span>
              )}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255, 255, 255, 0.95)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              {isOpen ? '✕ Click to hide' : '💬 Online • Click to Chat'}
            </span>
          </div>
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Evalyze.ai Border Beam Outline Pulse */
        @keyframes evalyzeBorderBeam {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Small Real ₹500 Note Flying Outward Gravity Explosion */
        @keyframes cashGravityOut {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0.2) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
          30% {
            opacity: 1;
            transform: translate(calc(var(--tx) * 0.5), var(--peakY)) scale(1.2) rotateX(calc(var(--rotX) * 0.5)) rotateY(calc(var(--rotY) * 0.5)) rotateZ(calc(var(--rotZ) * 0.5));
          }
          75% {
            opacity: 0.85;
            transform: translate(var(--tx), calc(var(--peakY) + 60px)) scale(1.0) rotateX(var(--rotX)) rotateY(var(--rotY)) rotateZ(var(--rotZ));
          }
          100% {
            opacity: 0;
            transform: translate(calc(var(--tx) * 1.15), var(--dropY)) scale(0.3) rotateX(calc(var(--rotX) * 1.5)) rotateY(calc(var(--rotY) * 1.5)) rotateZ(calc(var(--rotZ) * 1.5));
          }
        }

        /* Vacuum Suction Close Animation */
        @keyframes cashGravityIn {
          0% {
            opacity: 0;
            transform: translate(calc(var(--tx) * 1.15), var(--dropY)) scale(0.3) rotateX(calc(var(--rotX) * 1.5)) rotateY(calc(var(--rotY) * 1.5)) rotateZ(calc(var(--rotZ) * 1.5));
          }
          30% {
            opacity: 1;
            transform: translate(var(--tx), var(--peakY)) scale(1.1) rotateX(var(--rotX)) rotateY(var(--rotY)) rotateZ(var(--rotZ));
          }
          100% {
            opacity: 0;
            transform: translate(0, 0) scale(0.15) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
          }
        }
      `}</style>
    </div>
  );
}
