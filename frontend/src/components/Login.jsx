import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, User, Lock, Mail } from 'lucide-react'
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
      if (!form.full_name.trim()) errs.full_name = 'Required'
      if (!form.email.trim()) errs.email = 'Required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
      if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match'
    }
    if (!form.username.trim()) errs.username = 'Required'
    if (!form.password) errs.password = 'Required'
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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#2d1b3d', fontFamily: 'Inter, sans-serif', padding: 16,
    }}>
      <div style={{
        display: 'flex', borderRadius: 16, overflow: 'hidden',
        width: '100%', maxWidth: 760, minHeight: 460,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }}>

        {/* Left — geometric panel with tabs */}
        <div style={{
          width: 200, flexShrink: 0, background: '#7b2d6e',
          position: 'relative', overflow: 'hidden', display: 'flex',
          flexDirection: 'column', alignItems: 'center', paddingTop: 40,
        }} className="left-geo">

          {/* Geometric shapes */}
          <div style={{ position: 'absolute', top: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ position: 'absolute', bottom: -80, right: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', top: 80, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

          {/* Logo */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.25)' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 22, letterSpacing: '-1px' }}>R</span>
            </div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' }}>Revizen</span>
          </div>

          {/* Tabs */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 4, width: '100%', padding: '0 20px' }}>
            {[{ id: 'login', label: 'LOGIN' }, { id: 'register', label: 'SIGN UP' }].map(t => (
              <button key={t.id} onClick={() => { setMode(t.id); setErrors({}) }}
                style={{
                  padding: '10px 16px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 12, letterSpacing: 1, fontFamily: 'inherit',
                  background: mode === t.id ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: mode === t.id ? '#fff' : 'rgba(255,255,255,0.45)',
                  textAlign: 'left', transition: 'all 0.15s',
                  borderLeft: mode === t.id ? '3px solid #fff' : '3px solid transparent',
                }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right — form */}
        <div style={{ flex: 1, background: '#f5f5f5', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 36px' }}>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e', marginBottom: 6, textAlign: 'center' }}>
            {mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
          </h2>
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 28, letterSpacing: 0.3 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Fill in the details below'}
          </p>

          <AnimatePresence mode="wait">
            <motion.form key={mode}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}
              onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                    <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full Name"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 6, border: `1px solid ${errors.full_name ? '#e53e3e' : '#ddd'}`, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' }} />
                    {errors.full_name && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.full_name}</p>}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input name="username" value={form.username} onChange={handleChange} placeholder="Username"
                    autoComplete="username"
                    style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 6, border: `1px solid ${errors.username ? '#e53e3e' : '#ddd'}`, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' }} />
                  {errors.username && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.username}</p>}
                </div>

                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 6, border: `1px solid ${errors.email ? '#e53e3e' : '#ddd'}`, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' }} />
                    {errors.email && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.email}</p>}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{ width: '100%', padding: '10px 40px 10px 36px', borderRadius: 6, border: `1px solid ${errors.password ? '#e53e3e' : '#ddd'}`, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' }} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0, display: 'flex' }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {errors.password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#bbb' }} />
                    <input name="confirm_password" type={showPass ? 'text' : 'password'} value={form.confirm_password} onChange={handleChange} placeholder="Confirm Password"
                      autoComplete="new-password"
                      style={{ width: '100%', padding: '10px 14px 10px 36px', borderRadius: 6, border: `1px solid ${errors.confirm_password ? '#e53e3e' : '#ddd'}`, background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#1a1a2e', boxSizing: 'border-box' }} />
                    {errors.confirm_password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.confirm_password}</p>}
                  </div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    padding: '11px 0', borderRadius: 6, border: 'none',
                    background: '#7b2d6e', color: '#fff', fontWeight: 700,
                    fontSize: 13, letterSpacing: 1, cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                    textTransform: 'uppercase', marginTop: 4,
                  }}>
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" />{mode === 'login' ? 'Signing in...' : 'Creating...'}</>
                    : mode === 'login' ? 'Login' : 'Create Account'}
                </motion.button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) {
          .left-geo { display: none !important; }
        }
      `}</style>
    </div>
  )
}
