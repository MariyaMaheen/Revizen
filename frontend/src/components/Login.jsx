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

  const inp = (err) => ({
    width: '100%', padding: '10px 14px', borderRadius: 6,
    border: `1.5px solid ${err ? '#e53e3e' : '#e2e8f0'}`,
    background: '#fff', color: '#1a202c', fontSize: 14,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif', background: '#f7f9fc' }}>

      {/* Left panel */}
      <div style={{
        display: 'none', flex: 1, flexDirection: 'column', justifyContent: 'center', padding: '60px 64px',
        background: '#3b5bdb', position: 'relative', overflow: 'hidden',
      }} className="left-panel">
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#3b5bdb', fontWeight: 800, fontSize: 16 }}>R</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Revizen</span>
        </div>

        <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
          {mode === 'login' ? 'Good to see\nyou again!' : 'Start Your\nStudy Journey\nToday.'}
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 320, lineHeight: 1.6 }}>
          {mode === 'login'
            ? 'Welcome back to your personal study brain. Pick up right where you left off.'
            : 'Upload your notes, ask anything, ace every exam. Built for students who mean business.'}
        </p>

        {/* Feature pills */}
        {mode === 'register' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 40 }}>
            {['AI-powered Q&A from your notes', 'Auto-generate quizzes & flashcards', 'Instant summaries & insights'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel — form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fff' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, background: '#3b5bdb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>R</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1a202c' }}>Revizen</span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a202c', marginBottom: 4 }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 28 }}>
            {mode === 'login' ? 'Enter your credentials to continue.' : 'Fill in the details to get started.'}
          </p>

          <AnimatePresence mode="wait">
            <motion.form key={mode}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
              onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {mode === 'register' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Full Name</label>
                    <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Jane Smith" style={inp(errors.full_name)} />
                    {errors.full_name && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.full_name}</p>}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Username</label>
                  <input name="username" value={form.username} onChange={handleChange} placeholder="janesmith" autoComplete="username" style={inp(errors.username)} />
                  {errors.username && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.username}</p>}
                </div>

                {mode === 'register' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Email Address</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jane@university.edu" style={inp(errors.email)} />
                    {errors.email && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.email}</p>}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input name="password" type={showPass ? 'text' : 'password'}
                      value={form.password} onChange={handleChange} placeholder="••••••••"
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      style={{ ...inp(errors.password), paddingRight: 42 }} />
                    <button type="button" onClick={() => setShowPass(p => !p)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0, display: 'flex' }}>
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#4a5568', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                    <input name="confirm_password" type={showPass ? 'text' : 'password'}
                      value={form.confirm_password} onChange={handleChange} placeholder="••••••••"
                      autoComplete="new-password" style={inp(errors.confirm_password)} />
                    {errors.confirm_password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.confirm_password}</p>}
                  </div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '12px 0', borderRadius: 6, border: 'none',
                    background: '#3b5bdb', color: '#fff', fontWeight: 600, fontSize: 14,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit', marginTop: 4,
                  }}>
                  {loading
                    ? <><Loader2 size={15} className="animate-spin" />{mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                    : mode === 'login' ? 'Sign In' : 'Create Account'}
                </motion.button>

                <p style={{ fontSize: 13, color: '#718096', textAlign: 'center' }}>
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
                    style={{ color: '#3b5bdb', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
