import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/formatError'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', business_name: '' })
  const [loading, setLoading] = useState(false)
  const [showGoogleFallback, setShowGoogleFallback] = useState(false)
  const [googleEmailInput, setGoogleEmailInput] = useState('')
  const { user, register, googleLogin } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

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
        setLoading(true)
        await googleLogin(response.credential)
        toast.success('Welcome to FRIDAY!')
        navigate('/')
      } catch (err) {
        setShowGoogleFallback(true)
        toast.error(getErrorMessage(err, 'Google authentication failed. Use direct Google email connect below.'))
      } finally {
        setLoading(false)
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
          const btnElem = document.getElementById('googleSignUpBtn')
          if (btnElem) {
            btnElem.innerHTML = ''
            window.google.accounts.id.renderButton(btnElem, {
              theme: 'outline',
              size: 'large',
              width: '100%',
              text: 'signup_with'
            })
          }
        } catch (e) {
          console.warn('GSI render note:', e)
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
      console.warn('Google GSI script could not be loaded directly due to network filter or adblock')
      setShowGoogleFallback(true)
    }
    document.body.appendChild(script)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to FRIDAY!')
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleDirectGoogleLogin = async (e) => {
    e.preventDefault()
    if (!googleEmailInput.trim()) return
    setLoading(true)
    try {
      await googleLogin({ email: googleEmailInput.trim(), name: googleEmailInput.split('@')[0] })
      toast.success('Signed in with Google!')
      navigate('/')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Google login failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--bg)',
        boxSizing: 'border-box',
      }}
    >
      {/* Theme Switcher Toggle (Top Right) */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 20,
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

      {/* Main Glassmorphic Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'var(--card-bg)',
          border: '2px solid var(--primary-color)',
          borderRadius: 24,
          padding: '24px 24px',
          boxShadow: 'none',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 10,
          color: 'var(--text)',
          boxSizing: 'border-box',
        }}
      >
        {/* Header with FRIDAY Logo */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px 0',
              marginBottom: 8,
            }}
          >
            <img src="/logo.png" alt="FRIDAY AI Logo" className="topnav-logo-img" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
            Create Account
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-soft)', margin: 0 }}>
            Join FRIDAY AI Accounting &amp; Risk Scanner
          </p>
        </div>

        {/* Google Sign Up Container */}
        <div style={{ marginBottom: 12 }}>
          <div id="googleSignUpBtn" style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 40 }}></div>
        </div>

        {/* Divider */}
        <div style={{ position: 'relative', margin: '12px 0' }}>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)' }}></div>
          </div>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span style={{ background: 'var(--card-bg)', padding: '0 8px', color: 'var(--text-soft)', fontWeight: 700 }}>or register with details</span>
          </div>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Full Name', req: true },
            { key: 'email', label: 'Email Address', type: 'email', placeholder: 'Email Address', req: true },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Password', req: true },
            { key: 'business_name', label: 'Business / Store Name (Optional)', type: 'text', placeholder: 'Business / Store Name', req: false },
          ].map(field => (
            <div key={field.key}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
                {field.label}
              </label>
              <input
                type={field.type}
                autoComplete={field.type === 'password' ? 'new-password' : 'off'}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                required={field.req}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'var(--page)',
                  border: '1.5px solid var(--border-subtle)',
                  color: 'var(--text)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: 10,
              border: 'none',
              background: 'var(--primary-color)',
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 900,
              cursor: loading ? 'wait' : 'pointer',
              marginTop: 4,
              boxShadow: 'none',
              transition: 'all 0.25s ease',
            }}
          >
            {loading ? 'Creating Account...' : 'Register & Start →'}
          </button>
        </form>

        {/* Login Link */}
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-soft)', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
