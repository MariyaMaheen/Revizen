import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login, register, googleAuth } from '../api'

const GOOGLE_CLIENT_ID = '726843762663-5smu3k88ivo8so3mnu6ssn4ngpvs0m9v.apps.googleusercontent.com'

export default function Login({ onLogin, addToast }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [focused, setFocused] = useState('')
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', confirm_password: '' })
  const tokenClientRef = useRef(null)

  useEffect(() => {
    function initClient() {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        callback: async (response) => {
          if (response.error) {
            addToast('Google sign-in was cancelled or failed', 'error')
            return
          }
          setLoading(true)
          try {
            const data = await googleAuth(response.access_token)
            localStorage.setItem('revizen_token', data.token)
            localStorage.setItem('revizen_user', JSON.stringify(data.user))
            onLogin(data.user)
          } catch (err) {
            addToast(err.message, 'error')
          } finally {
            setLoading(false)
          }
        },
      })
    }

    if (window.google?.accounts?.oauth2) {
      initClient()
    } else {
      const check = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          initClient()
          clearInterval(check)
        }
      }, 200)
      return () => clearInterval(check)
    }
  }, [])

  function handleGoogleClick() {
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken()
    } else {
      addToast('Google sign-in is still loading — try again in a second', 'error')
    }
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (mode === 'register') {
      if (!form.full_name.trim()) errs.full_name = 'Full name required'
      if (!form.email.trim()) errs.email = 'Email required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
      if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    }
    if (!form.username.trim()) errs.username = 'Username required'
    if (!form.password) errs.password = 'Password required'
    if (form.password && form.password.length < 6) errs.password = 'Min 6 characters'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      let data
      if (mode === 'login') {
        data = await login(form.username, form.password)
      } else {
        data = await register(form.username, form.email, form.password, form.full_name)
      }
      localStorage.setItem('revizen_token', data.token)
      localStorage.setItem('revizen_user', JSON.stringify(data.user))
      onLogin(data.user)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const INK = '#0f172a'
  const SUBTEXT = '#64748b'
  const BORDER = '#e2e8f0'
  const FOCUS = '#3b82f6'
  const BTN = '#64748b'

  const inputStyle = (name, err) => ({
    width: '100%', padding: '14px 16px',
    borderRadius: 10, border: `1.5px solid ${err ? '#e53e3e' : focused === name ? FOCUS : BORDER}`,
    background: '#fff', color: INK, fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  })

  const Field = ({ name, placeholder, type = 'text', err, ...rest }) => (
    <div>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        onFocus={() => setFocused(name)}
        onBlur={() => setFocused('')}
        placeholder={placeholder}
        type={type}
        style={inputStyle(name, err)}
        {...rest}
      />
      {err && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, marginLeft: 2 }}>{err}</p>}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, -apple-system, sans-serif', background: '#f7f8fa', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 460, background: '#fff', borderRadius: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 12px 32px rgba(15,23,42,0.06)',
        padding: '40px 44px 36px',
      }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: INK, letterSpacing: '-0.3px' }}>
            Revizen
          </span>
        </div>

        {/* Pill toggle */}
        <div style={{
          display: 'flex', background: '#eef0f3', borderRadius: 999, padding: 4,
          marginBottom: 24, position: 'relative', maxWidth: 220, marginLeft: 'auto', marginRight: 'auto',
        }}>
          {['register', 'login'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}) }}
              style={{
                flex: 1, position: 'relative', zIndex: 1, padding: '9px 0', borderRadius: 999, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                color: mode === m ? INK : '#94a3b8', background: 'transparent',
              }}>
              {mode === m && (
                <motion.div layoutId="tab-bg" transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 999, background: '#fff', zIndex: -1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
              )}
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, fontWeight: 700, color: INK, marginBottom: 20 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Sign up with your email'}
        </p>

        <AnimatePresence mode="wait">
          <motion.form key={mode}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {mode === 'register' && (
                <Field name="full_name" placeholder="Full Name" err={errors.full_name} />
              )}

              <Field name="username" placeholder="Username" autoComplete="username" err={errors.username} />

              {mode === 'register' && (
                <Field name="email" type="email" placeholder="Email" err={errors.email} />
              )}

              <div style={{ position: 'relative' }}>
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  placeholder="Password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ ...inputStyle('password', errors.password), paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, marginLeft: 2 }}>{errors.password}</p>}
              </div>

              {mode === 'register' && (
                <Field name="confirm_password" type={showPass ? 'text' : 'password'}
                  placeholder="Confirm Password" autoComplete="new-password" err={errors.confirm_password} />
              )}

              <button type="submit" disabled={loading}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 10, border: 'none',
                  background: BTN, color: '#fff', fontWeight: 700, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', marginTop: 2,
                }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 18px' }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: SUBTEXT }}>Other options</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        {/* Google — wired to real OAuth */}
        <button type="button" onClick={handleGoogleClick} disabled={loading} style={{
          width: '100%', padding: '13px 0', borderRadius: 10, border: `1.5px solid ${BORDER}`,
          background: '#fff', color: INK, fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit',
          opacity: loading ? 0.7 : 1,
        }}>
          <GoogleIcon /> Continue with Google
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.5 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.5 34.9 26.9 36 24 36c-5.3 0-9.6-3.4-11.3-8.1l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.6 5.6C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  )
}
