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

  const inputStyle = (err) => ({
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: `1px solid ${err ? '#e53e3e' : '#2d3748'}`,
    background: '#1a202c',
    color: '#f7fafc',
    fontSize: 14,
    outline: 'none',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 360 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
            <path d="M0 4C0 1.79 1.79 0 4 0H24C26.21 0 28 1.79 28 4V34L14 26L0 34V4Z" fill="#4F6EF7"/>
          </svg>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#f7fafc', letterSpacing: '-0.5px' }}>Revizen</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f7fafc', marginBottom: 4 }}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p style={{ fontSize: 13, color: '#718096', marginBottom: 24 }}>
          {mode === 'login' ? 'Sign in to continue studying.' : 'Start learning smarter today.'}
        </p>

        {/* Tab toggle */}
        <div style={{ display: 'flex', background: '#1a202c', borderRadius: 8, padding: 4, marginBottom: 24, border: '1px solid #2d3748' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}) }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                background: mode === m ? '#4F6EF7' : 'transparent',
                color: mode === m ? '#fff' : '#718096',
              }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form key={mode}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
            onSubmit={handleSubmit}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'register' && (
                <div>
                  <label style={{ fontSize: 12, color: '#a0aec0', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange}
                    placeholder="Jane Smith" style={inputStyle(errors.full_name)} />
                  {errors.full_name && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.full_name}</p>}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: '#a0aec0', display: 'block', marginBottom: 6 }}>Username</label>
                <input name="username" value={form.username} onChange={handleChange}
                  placeholder="janesmith" autoComplete="username" style={inputStyle(errors.username)} />
                {errors.username && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.username}</p>}
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ fontSize: 12, color: '#a0aec0', display: 'block', marginBottom: 6 }}>Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="jane@university.edu" style={inputStyle(errors.email)} />
                  {errors.email && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.email}</p>}
                </div>
              )}

              <div>
                <label style={{ fontSize: 12, color: '#a0aec0', display: 'block', marginBottom: 6 }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{ ...inputStyle(errors.password), paddingRight: 40 }} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.password}</p>}
              </div>

              {mode === 'register' && (
                <div>
                  <label style={{ fontSize: 12, color: '#a0aec0', display: 'block', marginBottom: 6 }}>Confirm Password</label>
                  <input name="confirm_password" type={showPass ? 'text' : 'password'}
                    value={form.confirm_password} onChange={handleChange} placeholder="••••••••"
                    autoComplete="new-password" style={inputStyle(errors.confirm_password)} />
                  {errors.confirm_password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 4 }}>{errors.confirm_password}</p>}
                </div>
              )}

              <motion.button type="submit" disabled={loading}
                whileHover={{ opacity: 0.92 }} whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%', padding: '11px 0', borderRadius: 8, border: 'none',
                  background: '#4F6EF7', color: '#fff', fontWeight: 600, fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 4,
                }}>
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />{mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                  : mode === 'login' ? 'Sign In' : 'Create Account'}
              </motion.button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
