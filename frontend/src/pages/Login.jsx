import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import GreenScreenCat from '../components/GreenScreenCat.jsx'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/formatError'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [showGoogleFallback, setShowGoogleFallback] = useState(false)
  const [googleEmailInput, setGoogleEmailInput] = useState('')

  const { login, googleLogin } = useAuth()
  const navigate = useNavigate()

  // Validation Error State for Cat reaction
  const [catVideo, setCatVideo] = useState('/cat_login.mp4')
  const [bubbleText, setBubbleText] = useState('Aaja login karle')
  const [isError, setIsError] = useState(false)

  // Theme State & Toggle
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-toggling')
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
    setTimeout(() => {
      document.documentElement.classList.remove('theme-toggling')
    }, 100)
  }

  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "51956503353-novh10hungdgk568emmrmf0g4be6obl8.apps.googleusercontent.com"

    const handleCredentialResponse = async (response) => {
      try {
        setIsLoading(true)
        await googleLogin(response.credential)
        setCatVideo('/cat_happy.mp4')
        setBubbleText('Welcome to FRIDAY! 🥳🎉')
        setIsSuccess(true)
        toast.success('Welcome to FRIDAY!')
        setTimeout(() => navigate('/'), 1200)
      } catch (err) {
        setShowGoogleFallback(true)
        toast.error(getErrorMessage(err, 'Google auth failed. Try direct Google email connection.'))
      } finally {
        setIsLoading(false)
      }
    }

    const initGsi = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleCredentialResponse,
            use_fedcm_for_prompt: false,
            auto_select: false,
          })
          const btnElem = document.getElementById('googleSignInBtn')
          if (btnElem) {
            btnElem.innerHTML = ''
            window.google.accounts.id.renderButton(btnElem, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'continue_with'
            })
          }
        } catch (e) {
          setShowGoogleFallback(true)
        }
      }
    }

    if (document.getElementById('google-jssdk')) {
      initGsi()
      return
    }

    const script = document.createElement('script')
    script.id = 'google-jssdk'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initGsi
    script.onerror = () => {
      setShowGoogleFallback(true)
    }
    document.body.appendChild(script)
  }, [])

  async function validateAndLogin(e) {
    e?.preventDefault()
    setIsError(false)

    // 1. Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim() || !emailRegex.test(email)) {
      setCatVideo('/cat_wrong.mp4')
      setBubbleText('Invalid Email Address! 😿')
      setIsError(true)
      return
    }

    // 2. Password validation
    if (!password || password.length < 3) {
      setCatVideo('/cat_wrong.mp4')
      setBubbleText('Please enter password! 😿')
      setIsError(true)
      return
    }

    if (password === 'wrong') {
      setCatVideo('/cat_wrong.mp4')
      setBubbleText('Wrong Password! Try again 😿')
      setIsError(true)
      return
    }

    // Attempt Login
    setIsLoading(true)
    try {
      if (login) {
        await login(email, password)
      }
      setCatVideo('/cat_happy.mp4')
      setBubbleText('Yay! Login Successful! 🥳🎉')
      setIsSuccess(true)
      toast.success('Welcome to FRIDAY!')
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setCatVideo('/cat_wrong.mp4')
      setBubbleText('Login Failed! 😿 Check credentials')
      setIsError(true)
      toast.error(getErrorMessage(err, 'Invalid login credentials'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDirectGoogleLogin = async (e) => {
    e.preventDefault()
    if (!googleEmailInput.trim()) return
    setIsLoading(true)
    try {
      await googleLogin({ email: googleEmailInput.trim(), name: googleEmailInput.split('@')[0] })
      setCatVideo('/cat_happy.mp4')
      setBubbleText('Signed in with Google! 🥳🎉')
      setIsSuccess(true)
      toast.success('Signed in with Google!')
      setTimeout(() => navigate('/'), 1200)
    } catch (err) {
      setCatVideo('/cat_wrong.mp4')
      setBubbleText('Google Login Failed 😿')
      setIsError(true)
      toast.error(getErrorMessage(err, 'Google login failed'))
    } finally {
      setIsLoading(false)
    }
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
      {/* Theme Switcher Toggle (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          right: 24,
          zIndex: 30,
        }}
      >
        <div
          className={`theme-toggle-switch ${theme}`}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <span className={`switch-icon sun ${theme === 'light' ? 'active' : ''}`}>☀️</span>
          <div className="switch-track">
            <div className="switch-thumb" />
          </div>
          <span className={`switch-icon moon ${theme === 'dark' ? 'active' : ''}`}>🌙</span>
        </div>
      </div>

      {/* Main Stage Container */}
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

          {/* Real-time Green Screen Cat Canvas */}
          <GreenScreenCat videoSrc={catVideo} width={540} height={540} />

          {/* Animated Progress Bar on Login Success */}
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
                    animation: 'loadingProgress 1.6s ease-in-out forwards',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Glassmorphic Login Box */}
        {!isSuccess && (
          <div
            style={{
              width: '100%',
              maxWidth: 450,
              background: 'var(--card-bg)',
              border: `2px solid ${isError ? '#EF4444' : 'var(--primary-color)'}`,
              borderRadius: 24,
              padding: '32px 28px',
              boxShadow: 'none',
              backdropFilter: 'blur(20px)',
              position: 'relative',
              zIndex: 12,
              color: 'var(--text)',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '12px 22px',
                  borderRadius: 18,
                  background: 'var(--effects-color)',
                  border: '1.5px solid var(--primary-color)',
                  marginBottom: 12,
                }}
              >
                <img src="/logo.png" alt="FRIDAY AI Logo" className="topnav-logo-img" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                Welcome to FRIDAY
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-soft)', margin: 0 }}>
                AI Accounting &amp; Risk Scanner
              </p>
            </div>

            {/* Google Sign In Container */}
            <div style={{ marginBottom: 16 }}>
              <div id="googleSignInBtn" style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 44 }}></div>
            </div>


            {/* Form */}
            <form onSubmit={validateAndLogin} autoComplete="off">
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 5 }}>
                  Email Address
                </label>
                <input
                  type="text"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (isError) {
                      setIsError(false)
                      setBubbleText('Aaja login karle')
                    }
                  }}
                  placeholder="Email Address"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: 'var(--page)',
                    border: `1.5px solid ${isError ? '#EF4444' : 'var(--border-subtle)'}`,
                    color: 'var(--text)',
                    fontSize: 13.5,
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                    Password
                  </label>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (isError) {
                        setIsError(false)
                        setBubbleText('Aaja login karle')
                      }
                    }}
                    placeholder="Password"
                    style={{
                      width: '100%',
                      padding: '10px 38px 10px 12px',
                      borderRadius: 10,
                      background: 'var(--page)',
                      border: `1.5px solid ${isError ? '#EF4444' : 'var(--border-subtle)'}`,
                      color: 'var(--text)',
                      fontSize: 13.5,
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
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-soft)',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isSuccess}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  border: 'none',
                  background: isSuccess ? '#10B981' : 'var(--primary-color)',
                  color: '#FFFFFF',
                  fontSize: 14.5,
                  fontWeight: 900,
                  cursor: isLoading ? 'wait' : 'pointer',
                  boxShadow: 'none',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                    Signing in...
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

            {/* Register Link */}
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <p style={{ fontSize: 12.5, color: 'var(--text-soft)', margin: 0 }}>
                Don't have an account?{' '}
                <Link to="/register" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>
                  Register here
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
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
  )
}
