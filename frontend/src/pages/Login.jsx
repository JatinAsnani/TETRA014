import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GreenScreenCat from '../components/GreenScreenCat.jsx';

export default function Login() {
  const [email, setEmail] = useState('demo@tallai.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const auth = useAuth();
  const login = auth?.login;

  // Validation Error State for Cat reaction
  const [catVideo, setCatVideo] = useState('/cat_login.mp4');
  const [bubbleText, setBubbleText] = useState('Aaja login karle');
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();

  async function validateAndLogin(e) {
    e?.preventDefault();
    setIsError(false);

    // 1. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setCatVideo('/cat_wrong.mp4');
      setBubbleText('Invalid Email Address! 😿');
      setIsError(true);
      return;
    }

    // 2. Password length & correctness validation
    if (!password || password.length < 5) {
      setCatVideo('/cat_wrong.mp4');
      setBubbleText('Wrong Password! 😿 (Min 5 chars)');
      setIsError(true);
      return;
    }

    if (password === 'wrong') {
      setCatVideo('/cat_wrong.mp4');
      setBubbleText('Wrong Password! Try again 😿');
      setIsError(true);
      return;
    }

    // Instant Login Success & Happy Cat Celebration!
    setCatVideo('/cat_happy.mp4');
    setBubbleText('Yay! Login Successful! 🥳🎉');
    setIsSuccess(true);
    setIsLoading(true);

    if (login) {
      login(email, password).catch(() => {});
    }

    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1600);
  }

  function handleQuickFill(role) {
    setIsError(false);
    setCatVideo('/cat_login.mp4');
    setBubbleText('Aaja login karle');

    let targetEmail = 'demo@tallai.com';
    let targetPass = 'demo123';

    if (role === 'owner') {
      targetEmail = 'sharma.owner@tallai.in';
      targetPass = 'OwnerPass2026!';
    } else if (role === 'accountant') {
      targetEmail = 'accountant@sharmastore.com';
      targetPass = 'TaxAudit#8819';
    } else if (role === 'auditor') {
      targetEmail = 'auditor@gst.gov.in';
      targetPass = 'GSTN-Verify990';
    } else if (role === 'wrong-pass') {
      setEmail('admin@sharmastore.com');
      setPassword('wrong');
      setCatVideo('/cat_wrong.mp4');
      setBubbleText('Wrong Password! Try again 😿');
      setIsError(true);
      return;
    } else if (role === 'wrong-email') {
      setEmail('invalid-email-format');
      setPassword('Password123');
      setCatVideo('/cat_wrong.mp4');
      setBubbleText('Invalid Email Address! 😿');
      setIsError(true);
      return;
    }

    setEmail(targetEmail);
    setPassword(targetPass);
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
      }}
    >
      {/* Main Stage Container (Extra Large Cat Video + Speech Bubble + Login Box) */}
      <div
        style={{
          width: '100%',
          maxWidth: 1180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          position: 'relative',
          zIndex: 10,
          flexWrap: 'wrap-reverse',
        }}
      >
        {/* Real-time Chroma Key Cat Component + Speech Bubble */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 12,
          }}
        >
          {/* Dynamic Speech Bubble */}
          <div
            style={{
              background: 'var(--card-bg)',
              border: `2.5px solid ${isError ? '#EF4444' : 'var(--primary-color)'}`,
              color: 'var(--text)',
              fontSize: 16,
              fontWeight: 900,
              padding: '12px 26px',
              borderRadius: 24,
              boxShadow: 'none',
              marginBottom: 10,
              whiteSpace: 'nowrap',
              position: 'relative',
              animation: isError ? 'shakeBubble 0.4s ease-in-out' : 'bubbleBounce 2.2s ease-in-out infinite',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.3s ease',
            }}
          >
            <span style={{ fontSize: 22 }}>{isError ? '😾' : (isSuccess ? '🥳' : '🐱')}</span> {bubbleText}
            {/* Speech Pointer Arrow */}
            <div
              style={{
                position: 'absolute',
                bottom: -9,
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
                width: 14,
                height: 14,
                background: 'var(--card-bg)',
                borderRight: `2.5px solid ${isError ? '#EF4444' : 'var(--primary-color)'}`,
                borderBottom: `2.5px solid ${isError ? '#EF4444' : 'var(--primary-color)'}`,
              }}
            />
          </div>

          {/* Extra Large Real-time Green Screen Keyed-Out Cat Canvas (540px x 540px) */}
          <GreenScreenCat videoSrc={catVideo} width={540} height={540} />

          {/* Animated Progress Bar Below Cat Video on Login Success */}
          {isSuccess && (
            <div style={{ width: 360, marginTop: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary-color)', marginBottom: 8, letterSpacing: '0.04em' }}>
                REDIRECTING TO FRIDAY DASHBOARD...
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                <div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #06B6D4, #14B8A6, #10B981)',
                    borderRadius: 10,
                    animation: 'loadingProgress 2.2s ease-in-out forwards',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Glassmorphic Login Box — Hidden when login is successful */}
        {!isSuccess && (
          <div
            style={{
              width: '100%',
              maxWidth: 450,
              background: 'var(--card-bg)',
              border: `2px solid ${isError ? '#EF4444' : 'var(--primary-color)'}`,
              borderRadius: 24,
              padding: '36px 30px',
              boxShadow: 'none',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              zIndex: 12,
              color: 'var(--text)',
              transition: 'all 0.3s ease',
            }}
          >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 60,
                borderRadius: 18,
                background: 'var(--effects-color)',
                border: '1.5px solid var(--primary-color)',
                boxShadow: '0 8px 24px var(--effects-color)',
                marginBottom: 12,
              }}
            >
              <img src="/logo.png" alt="FRIDAy Logo" style={{ height: 34, width: 'auto', objectFit: 'contain' }} />
            </div>

            <h2 style={{ fontSize: 23, fontWeight: 900, color: 'var(--text)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Welcome to FRIDAy AI
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0 }}>
              Financial Accounting &amp; Risk Scanner
            </p>
          </div>

          {/* Quick Demo Fill Pills */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-soft)', marginBottom: 8 }}>
              ⚡ DEMO LOGIN / ERROR TEST CHIPS:
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleQuickFill('owner')}
                style={{
                  background: 'var(--effects-color)',
                  border: '1px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                👑 Store Owner
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('accountant')}
                style={{
                  background: 'var(--effects-color)',
                  border: '1px solid var(--primary-color)',
                  color: 'var(--primary-color)',
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 9px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                🧮 Accountant
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('wrong-pass')}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 9px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                🚨 Test Wrong Pass
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('wrong-email')}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 9px',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                🚨 Test Invalid Email
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={validateAndLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                Business Email / GSTIN ID
              </label>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (isError) {
                    setIsError(false);
                    setBubbleText('Aaja login karle');
                  }
                }}
                placeholder="admin@sharmastore.com"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: 'var(--page)',
                  border: `1.5px solid ${isError ? '#EF4444' : 'var(--border-subtle)'}`,
                  color: 'var(--text)',
                  fontSize: 14,
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset link sent!'); }} style={{ fontSize: 12, color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 700 }}>
                  Forgot?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (isError) {
                      setIsError(false);
                      setBubbleText('Aaja login karle');
                    }
                  }}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 42px 12px 14px',
                    borderRadius: 10,
                    background: 'var(--page)',
                    border: `1.5px solid ${isError ? '#EF4444' : 'var(--border-subtle)'}`,
                    color: 'var(--text)',
                    fontSize: 14,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-soft)',
                    cursor: 'pointer',
                    fontSize: 15,
                  }}
                >
                  {showPassword ? '👁️' : '🙈'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-soft)', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--primary-color)', width: 16, height: 16, cursor: 'pointer' }}
                />
                Remember this browser
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: 'none',
                background: isSuccess ? '#10B981' : 'var(--primary-color)',
                color: '#FFFFFF',
                fontSize: 15,
                fontWeight: 900,
                cursor: isLoading ? 'wait' : 'pointer',
                boxShadow: 'none',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                  Authenticating...
                </>
              ) : isSuccess ? (
                <>
                  <span>✓</span> Login Success! Redirecting...
                </>
              ) : (
                <>
                  Sign In to Dashboard →
                </>
              )}
            </button>
          </form>

          {/* Security Footer */}
          <div
            style={{
              marginTop: 22,
              paddingTop: 14,
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11.5,
              color: 'var(--text-soft)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ color: '#10B981' }}>🛡️</span> 256-Bit SSL Encrypted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
              System Online
            </span>
          </div>
        </div>
      )}
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(20px, -20px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bubbleBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes shakeBubble {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
