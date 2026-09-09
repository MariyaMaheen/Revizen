import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, User, Lock } from 'lucide-react'
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

  const DARK = '#3d1a47'
  const MID  = '#7b2d8b'
  const LIGHT = '#a855b5'

  const inp = (err, icon) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}>{icon}</span>
      {arguments[2]}
      {err && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{err}</p>}
    </div>
  )

  const inputStyle = (err) => ({
    width: '100%', padding: '12px 14px 12px 40px',
    borderRadius: 8, border: `1.5px solid ${err ? '#e53e3e' : '#e2e8f0'}`,
    background: '#fff', color: '#1a202c', fontSize: 13,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  })

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'Inter, sans-serif', background: DARK }}>

      {/* Left panel — full height */}
      <div style={{ width: '30%', minWidth: 200, background: MID, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60 }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: 60, left: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: 180, right: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.3)' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 26 }}>R</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '0.15em' }}>REVIZEN</span>
        </div>

        {/* Nav tabs */}
        <div style={{ position: 'relative', zIndex: 2, marginTop: 48, width: '80%', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}) }}
              style={{
                padding: '10px 20px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em',
                textAlign: 'left', transition: 'all 0.15s',
                background: mode === m ? 'rgba(255,255,255,0.18)' : 'transparent',
                color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                borderLeft: mode === m ? '3px solid #fff' : '3px solid transparent',
              }}>
              {m === 'login' ? 'LOGIN' : 'SIGN UP'}
            </button>
          ))}
        </div>
      </div>

      {/* Right panel — full height, light */}
      <div style={{ flex: 1, background: '#f0f0f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1a202c', textAlign: 'center', marginBottom: 6, letterSpacing: '-0.3px' }}>
            {mode === 'login' ? 'LOGIN' : 'SIGN UP'}
          </h2>
          <p style={{ fontSize: 13, color: '#718096', textAlign: 'center', marginBottom: 32 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>

          <AnimatePresence mode="wait">
            <motion.form key={mode}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}
              onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}><User size={14} /></span>
                    <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full Name" style={inputStyle(errors.full_name)} />
                    {errors.full_name && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.full_name}</p>}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}><User size={14} /></span>
                  <input name="username" value={form.username} onChange={handleChange} placeholder="Username" autoComplete="username" style={inputStyle(errors.username)} />
                  {errors.username && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.username}</p>}
                </div>

                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}><User size={14} /></span>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" style={inputStyle(errors.email)} />
                    {errors.email && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.email}</p>}
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}><Lock size={14} /></span>
                  <input name="password" type={showPass ? 'text' : 'password'}
                    value={form.password} onChange={handleChange} placeholder="Password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    style={{ ...inputStyle(errors.password), paddingRight: 42 }} />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0, display: 'flex' }}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  {errors.password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#aaa', display: 'flex' }}><Lock size={14} /></span>
                    <input name="confirm_password" type={showPass ? 'text' : 'password'}
                      value={form.confirm_password} onChange={handleChange} placeholder="Confirm Password"
                      autoComplete="new-password" style={inputStyle(errors.confirm_password)} />
                    {errors.confirm_password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.confirm_password}</p>}
                  </div>
                )}

                <motion.button type="submit" disabled={loading}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 8, border: 'none',
                    background: MID, color: '#fff', fontWeight: 700, fontSize: 13,
                    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'inherit', letterSpacing: '0.1em', marginTop: 6,
                  }}>
                  {loading ? <Loader2 size={15} className="animate-spin" /> : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
                </motion.button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
