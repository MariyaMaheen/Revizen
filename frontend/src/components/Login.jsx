import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login, register } from '../api'

function PasswordStrength({ password }) {
  if (!password) return null
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const label = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score <= 3 ? 'Good' : 'Strong'
  const color = score <= 1 ? '#ef4444' : score <= 2 ? '#f59e0b' : score <= 3 ? '#3b82f6' : '#00c896'
  return (
    <div className="mt-2 flex items-center gap-2">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? color : '#1e2d40' }} />
        ))}
      </div>
      <span className="text-xs" style={{ color }}>{label}</span>
    </div>
  )
}

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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#0a0e1a' }}>

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center mb-10">
        {/* Bookmark icon */}
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
          <rect x="4" y="0" width="32" height="48" rx="4" fill="#00c896" />
          <path d="M4 32 L20 44 L36 32 L36 48 L4 48 Z" fill="#0a0e1a" opacity="0.15"/>
          <path d="M4 36 L20 48 L36 36" fill="none" stroke="#0a0e1a" strokeWidth="2.5" strokeLinejoin="round"/>
        </svg>
        <span className="text-2xl font-extrabold tracking-tight" style={{ color: '#e8eaf0' }}>Revizen</span>
        <span className="text-xs mt-1" style={{ color: '#3d4f6b' }}>Your personal study brain</span>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="w-full max-w-sm rounded-card p-8"
        style={{ background: '#111827', border: '1px solid #1e2d40' }}>

        <h3 className="text-lg font-bold text-text-primary mb-1">
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h3>
        <p className="text-sm mb-6" style={{ color: '#3d4f6b' }}>
          {mode === 'login' ? 'Pick up where you left off.' : 'Start your study journey.'}
        </p>

        {/* Toggle */}
        <div className="flex rounded-btn p-1 mb-6" style={{ background: '#0a0e1a', border: '1px solid #1e2d40' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}) }}
              className="flex-1 py-2 rounded text-sm font-medium transition-all duration-200"
              style={mode === m
                ? { background: '#00c896', color: '#0a0e1a' }
                : { color: '#6b7a99', background: 'transparent' }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form key={mode}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}
            onSubmit={handleSubmit} className="space-y-4">

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7a99' }}>Full Name</label>
                <input name="full_name" value={form.full_name} onChange={handleChange}
                  placeholder="Jane Smith"
                  className="w-full px-4 py-2.5 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                  style={{ background: '#0a0e1a', border: `1px solid ${errors.full_name ? '#ef4444' : '#1e2d40'}` }} />
                {errors.full_name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.full_name}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7a99' }}>Username</label>
              <input name="username" value={form.username} onChange={handleChange}
                placeholder="janesmith" autoComplete="username"
                className="w-full px-4 py-2.5 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                style={{ background: '#0a0e1a', border: `1px solid ${errors.username ? '#ef4444' : '#1e2d40'}` }} />
              {errors.username && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.username}</p>}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7a99' }}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="jane@university.edu"
                  className="w-full px-4 py-2.5 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                  style={{ background: '#0a0e1a', border: `1px solid ${errors.email ? '#ef4444' : '#1e2d40'}` }} />
                {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7a99' }}>Password</label>
              <div className="relative">
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange} placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full px-4 py-2.5 pr-11 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                  style={{ background: '#0a0e1a', border: `1px solid ${errors.password ? '#ef4444' : '#1e2d40'}` }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#3d4f6b' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password}</p>}
              {mode === 'register' && <PasswordStrength password={form.password} />}
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#6b7a99' }}>Confirm Password</label>
                <input name="confirm_password" type={showPass ? 'text' : 'password'}
                  value={form.confirm_password} onChange={handleChange} placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                  style={{ background: '#0a0e1a', border: `1px solid ${errors.confirm_password ? '#ef4444' : '#1e2d40'}` }} />
                {errors.confirm_password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.confirm_password}</p>}
              </div>
            )}

            <motion.button type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-btn font-semibold text-sm mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              style={{ background: '#00c896', color: '#0a0e1a' }}>
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> {mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                : mode === 'login' ? 'Sign In' : 'Create Account'}
            </motion.button>
          </motion.form>
        </AnimatePresence>
      </motion.div>

      <p className="text-xs mt-6" style={{ color: '#1e2d40' }}>
        Revizen · Study smarter, not harder
      </p>
    </div>
  )
}
