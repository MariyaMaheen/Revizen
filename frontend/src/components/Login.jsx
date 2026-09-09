import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, Flame, Zap, BookOpen } from 'lucide-react'
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
    <div className="min-h-screen flex bg-bg">
      {/* Left — brand panel */}
      <div className="hidden md:flex flex-col justify-between w-1/2 px-14 py-12"
        style={{ background: 'linear-gradient(160deg, #0d1220 60%, #0f2318 100%)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: '#00c896' }}>
            <BookOpen size={18} color="#0a0e1a" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">Revizen</span>
        </div>

        {/* Hero */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-6 text-xs font-medium"
            style={{ background: '#00c89618', color: '#00c896', border: '1px solid #00c89630' }}>
            <Flame size={12} /> 42k+ active today
          </div>
          <h2 className="text-5xl font-extrabold text-text-primary leading-none mb-4">
            Your personal<br />
            <span style={{ color: '#00c896' }}>study brain.</span>
          </h2>
          <p className="text-text-muted text-lg leading-relaxed max-w-sm">
            Turn dense PDFs, lecture slides, and messy notes into examination mastery.
          </p>

          {/* Sample doc card */}
          <div className="mt-10 rounded-card p-4" style={{ background: '#111827', border: '1px solid #1e2d40' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-text-primary">Neurobiology 101</p>
                <p className="text-xs text-text-muted">Stanford Med · Fall Course</p>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-pill font-medium"
                style={{ background: '#00c89618', color: '#00c896' }}>Active</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Cell Signaling', 'Action Potentials', 'Synaptic Clefts'].map(t => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-pill"
                  style={{ background: '#1e2d40', color: '#6b7a99' }}>{t}</span>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: '#1e2d40' }}>
                <div className="h-full rounded-full" style={{ width: '84%', background: '#00c896' }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: '#00c896' }}>84% Retained</span>
            </div>
            <p className="text-xs text-text-muted mt-2">18 flashcards due in 3h · +120 XP</p>
          </div>
        </div>

        {/* Footer badges */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Zap size={12} style={{ color: '#00c896' }} /> 900+ Campuses
          </div>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Zap size={12} style={{ color: '#f59e0b' }} /> Instant Anki Export
          </div>
        </div>
      </div>

      {/* Right — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-10" style={{ background: '#0a0e1a' }}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#00c896' }}>
              <BookOpen size={16} color="#0a0e1a" />
            </div>
            <span className="font-bold text-text-primary">Revizen</span>
          </div>

          <h3 className="text-2xl font-bold text-text-primary mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h3>
          <p className="text-text-muted text-sm mb-8">
            {mode === 'login' ? 'Pick up where you left off.' : 'Start your study journey today.'}
          </p>

          {/* Toggle */}
          <div className="flex rounded-btn p-1 mb-6" style={{ background: '#111827', border: '1px solid #1e2d40' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}) }}
                className="flex-1 py-2 rounded text-sm font-medium transition-all duration-200"
                style={mode === m
                  ? { background: '#00c896', color: '#0a0e1a' }
                  : { color: '#6b7a99' }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={mode}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              onSubmit={handleSubmit} className="space-y-4">

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Full Name</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                    style={{ background: '#111827', border: `1px solid ${errors.full_name ? '#ef4444' : '#1e2d40'}` }} />
                  {errors.full_name && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.full_name}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Username</label>
                <input name="username" value={form.username} onChange={handleChange}
                  placeholder="janesmith" autoComplete="username"
                  className="w-full px-4 py-3 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                  style={{ background: '#111827', border: `1px solid ${errors.username ? '#ef4444' : '#1e2d40'}` }} />
                {errors.username && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.username}</p>}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange}
                    placeholder="jane@university.edu"
                    className="w-full px-4 py-3 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                    style={{ background: '#111827', border: `1px solid ${errors.email ? '#ef4444' : '#1e2d40'}` }} />
                  {errors.email && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.email}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Password</label>
                <div className="relative">
                  <input name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full px-4 py-3 pr-11 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                    style={{ background: '#111827', border: `1px solid ${errors.password ? '#ef4444' : '#1e2d40'}` }} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.password}</p>}
                {mode === 'register' && <PasswordStrength password={form.password} />}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Confirm Password</label>
                  <input name="confirm_password" type={showPass ? 'text' : 'password'}
                    value={form.confirm_password} onChange={handleChange} placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-btn text-sm text-text-primary placeholder-text-dim focus:outline-none transition-colors"
                    style={{ background: '#111827', border: `1px solid ${errors.confirm_password ? '#ef4444' : '#1e2d40'}` }} />
                  {errors.confirm_password && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.confirm_password}</p>}
                </div>
              )}

              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full py-3 rounded-btn font-semibold text-sm mt-2 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{ background: '#00c896', color: '#0a0e1a' }}>
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> {mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                  : mode === 'login' ? 'Sign In' : 'Create Account'}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
