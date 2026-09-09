import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login, register } from '../api'

export default function Login({ onLogin, addToast }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ full_name: '', username: '', email: '', password: '', confirm_password: '' })

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
  const BORDER = '#e2e8f0'
  const FOCUS = '#3b82f6'
  const BTN = '#64748b'
  const BTN_HOVER = '#54606f'

  const [focused, setFocused] = useState('')

  const inputStyle = (name, err) => ({
    width: '100%', padding: '15px 18px',
    borderRadius: 14, border: `2px solid ${err ? '#e53e3e' : focused === name ? FOCUS : BORDER}`,
    background: '#fff', color: INK, fontSize: 14, fontWeight: 500,
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
      {err && <p style={{ fontSize: 11, fontWeight: 600, color: '#e53e3e', marginTop: 4, marginLeft: 4 }}>{err}</p>}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Nunito', 'Baloo 2', Inter, sans-serif", background: '#f7f8fa', padding: 24,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{
          width: '100%', maxWidth: 480, background: '#fff', borderRadius: 28,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 20px 40px rgba(15,23,42,0.06)',
          padding: '44px 48px 40px',
        }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <span style={{
            fontFamily: "'Baloo 2', 'Fredoka', 'Nunito', sans-serif",
            fontSize: 30, fontWeight: 800, color: INK, letterSpacing: '-0.5px',
          }}>
            Revizen
          </span>
        </div>

        {/* Pill toggle */}
        <div style={{
          display: 'flex', background: '#eef0f3', borderRadius: 999, padding: 5,
          marginBottom: 28, position: 'relative', maxWidth: 260, marginLeft: 'auto', marginRight: 'auto',
        }}>
          {['register', 'login'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}) }}
              style={{
                flex: 1, position: 'relative', zIndex: 1, padding: '10px 0', borderRadius: 999, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700,
                color: mode === m ? INK : '#94a3b8', background: 'transparent', transition: 'color 0.2s',
              }}>
              {mode === m && (
                <motion.div layoutId="tab-bg" transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 999, background: '#fff', zIndex: -1, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }} />
              )}
              {m === 'login' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: INK, marginBottom: 22 }}>
          {mode === 'login' ? 'Sign in to your account' : 'Sign up with your email'}
        </p>

        <AnimatePresence mode="wait">
          <motion.form key={mode}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

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
                  style={{ ...inputStyle('password', errors.password), paddingRight: 46 }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                {errors.password && <p style={{ fontSize: 11, fontWeight: 600, color: '#e53e3e', marginTop: 4, marginLeft: 4 }}>{errors.password}</p>}
              </div>

              {mode === 'register' && (
                <Field name="confirm_password" type={showPass ? 'text' : 'password'}
                  placeholder="Confirm Password" autoComplete="new-password" err={errors.confirm_password} />
              )}

              <motion.button type="submit" disabled={loading}
                whileHover={{ background: BTN_HOVER }} whileTap={{ scale: 0.99 }}
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
                  background: BTN, color: '#fff', fontWeight: 700, fontSize: 15,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', marginTop: 4,
                }}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : mode === 'login' ? 'Sign in' : 'Sign up'}
              </motion.button>
            </div>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>Other options</span>
          <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        </div>

        {/* OAuth buttons (visual only — wire up if/when you add these providers) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: `1.5px solid ${BORDER}`,
            background: '#fff', color: INK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit',
          }}>
            <AppleIcon /> Continue with Apple
          </button>
          <button type="button" style={{
            width: '100%', padding: '14px 0', borderRadius: 14, border: `1.5px solid ${BORDER}`,
            background: '#fff', color: INK, fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: 'inherit',
          }}>
            <GoogleIcon /> Continue with Google
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor">
