import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, BookOpen, Zap, Brain, BarChart3, Loader2 } from 'lucide-react'
import { login, register } from '../api'

function PasswordStrength({ password }) {
  const getStrength = (p) => {
    if (!p) return { level: 0, label: '', color: '' }
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { level: 1, label: 'Weak', color: 'bg-error' }
    if (score <= 2) return { level: 2, label: 'Medium', color: 'bg-warning' }
    return { level: 3, label: 'Strong', color: 'bg-success' }
  }

  const { level, label, color } = getStrength(password)
  if (!password) return null

  return (
    <div className="mt-1">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= level ? color : 'bg-border'}`} />
        ))}
      </div>
      <span className={`text-xs ${level === 1 ? 'text-error' : level === 2 ? 'text-warning' : 'text-success'}`}>{label}</span>
    </div>
  )
}

export default function Login({ onLogin, addToast }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  function validate() {
    const errs = {}
    if (mode === 'register') {
      if (!form.full_name.trim()) errs.full_name = 'Full name is required'
      if (!form.email.trim()) errs.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format'
      if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    }
    if (!form.username.trim()) errs.username = 'Username is required'
    if (!form.password) errs.password = 'Password is required'
    if (form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters'
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

  const features = [
    { icon: <Brain size={20} />, text: 'AI-powered Q&A from your own notes' },
    { icon: <Zap size={20} />, text: 'Auto-generate quizzes & flashcards' },
    { icon: <BookOpen size={20} />, text: 'Instant summaries in any style' },
    { icon: <BarChart3 size={20} />, text: 'Track weak areas & study streaks' },
  ]

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-center px-16 w-1/2 bg-sidebar border-r border-border">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Revizen</h1>
              <p className="text-text-muted text-sm">Revise without chaos</p>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold text-text-primary leading-tight mb-3">
            Study smarter,<br />not harder.
          </h2>
          <p className="text-text-muted text-lg">Upload your notes. Ask anything. Ace every exam.</p>
        </div>
        <div className="space-y-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-card bg-card border border-border"
            >
              <div className="text-primary">{f.icon}</div>
              <span className="text-text-primary">{f.text}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 md:py-10">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">Revizen</h1>
              <p className="text-text-muted text-xs">Revise without chaos</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex rounded-btn bg-card border border-border p-1 mb-8">
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}) }}
                className={`flex-1 py-2 rounded text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? 'bg-primary text-white shadow'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Full Name</label>
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.full_name && <p className="text-error text-xs mt-1">{errors.full_name}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="janesmith"
                  autoComplete="username"
                  className="w-full px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                {errors.username && <p className="text-error text-xs mt-1">{errors.username}</p>}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@example.com"
                    className="w-full px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full px-4 py-3 pr-12 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
                {mode === 'register' && <PasswordStrength password={form.password} />}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">Confirm Password</label>
                  <input
                    name="confirm_password"
                    type={showPass ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                  />
                  {errors.confirm_password && <p className="text-error text-xs mt-1">{errors.confirm_password}</p>}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-btn bg-primary hover:bg-primary-hover text-white font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> {mode === 'login' ? 'Signing in...' : 'Creating account...'}</>
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
