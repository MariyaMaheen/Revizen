import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, User, Lock, Sparkles } from 'lucide-react'
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

  // ---- Funky palette ----
  const PINK = '#ff3d81'
  const YELLOW = '#ffd23f'
  const PURPLE = '#7b2d8b'
  const BLUE = '#3d8bff'
  const INK = '#1a1a1a'

  const inputStyle = (err) => ({
    width: '100%', padding: '13px 14px 13px 40px',
    borderRadius: 10, border: `2.5px solid ${err ? '#e53e3e' : INK}`,
    background: '#fff', color: INK, fontSize: 13, fontWeight: 600,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'transform 0.15s, box-shadow 0.15s',
  })

  const Field = ({ name, icon, placeholder, type = 'text', err, ...rest }) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: INK, display: 'flex' }}>{icon}</span>
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        type={type}
        style={inputStyle(err)}
        onFocus={(e) => { e.target.style.boxShadow = `4px 4px 0px ${PURPLE}`; e.target.style.transform = 'translate(-2px,-2px)' }}
        onBlur={(e) => { e.target.style.boxShadow = 'none'; e.target.style.transform = 'none' }}
        {...rest}
      />
      {err && <p style={{ fontSize: 11, fontWeight: 700, color: '#e53e3e', marginTop: 4 }}>{err}</p>}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(135deg, ${PURPLE} 0%, #2a1330 60%, ${INK} 100%)`,
      padding: 24,
    }}>

      {/* Floating funky blobs */}
      <motion.div animate={{ y: [0, 20, 0], rotate: [0, 15, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '8%', left: '8%', width: 160, height: 160, borderRadius: '42% 58% 65% 35% / 45% 45% 55% 55%', background: YELLOW, filter: 'blur(2px)', opacity: 0.85 }} />
      <motion.div animate={{ y: [0, -25, 0], rotate: [0, -20, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '10%', left: '14%', width: 90, height: 90, borderRadius: '50%', background: PINK, opacity: 0.8 }} />
      <motion.div animate={{ y: [0, 18, 0], x: [0, -10, 0] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '15%', right: '10%', width: 130, height: 130, borderRadius: '50%', border: `6px solid ${BLUE}`, opacity: 0.6 }} />
      <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', bottom: '6%', right: '8%', width: 120, height: 120, opacity: 0.5 }}>
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <circle cx="50" cy="50" r="42" fill="none" stroke={YELLOW} strokeWidth="4" strokeDasharray="8 10" />
        </svg>
      </motion.div>

      {/* Rotated sticker badge */}
      <motion.div
        initial={{ rotate: -12 }} animate={{ rotate: [-12, -6, -12] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', top: 40, left: '50%', marginLeft: -260, zIndex: 5,
          background: YELLOW, color: INK, fontWeight: 800, fontSize: 12, letterSpacing: '0.05em',
          padding: '8px 16px', borderRadius: 999, border: `2.5px solid ${INK}`,
          display: 'flex', alignItems: 'center', gap: 6, boxShadow: `3px 3px 0px ${INK}`,
        }}>
        <Sparkles size={14} /> HEY THERE!
      </motion.div>

      {/* Main card — neubrutalist */}
      <motion.div
        initial={{ opacity: 0, y: 20, rotate: -1 }}
        animate={{ opacity: 1, y: 0, rotate: -1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        style={{
          position: 'relative', zIndex: 2, width: '100%', maxWidth: 380,
          background: '#fff', borderRadius: 24, border: `3px solid ${INK}`,
          boxShadow: `10px 10px 0px ${PINK}`,
          padding: '38px 32px 32px',
        }}>

        {/* Logo blob */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <div style={{
            width: 60, height: 60, borderRadius: '38% 62% 60% 40% / 45% 40% 60% 55%',
            background: `linear-gradient(135deg, ${PURPLE}, ${PINK})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2.5px solid ${INK}`, marginBottom: 10, boxShadow: `3px 3px 0px ${INK}`,
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>R</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: INK, letterSpacing: '0.2em' }}>REVIZEN</span>
        </div>

        {/* Mode toggle — pill tabs */}
        <div style={{
          display: 'flex', background: '#f1f1f1', borderRadius: 999, padding: 4,
          border: `2px solid ${INK}`, marginBottom: 26, position: 'relative',
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}) }}
              style={{
                flex: 1, position: 'relative', zIndex: 1, padding: '9px 0', borderRadius: 999, border: 'none',
                cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
                color: mode === m ? '#fff' : INK, background: 'transparent', transition: 'color 0.2s',
              }}>
              {mode === m && (
                <motion.div layoutId="tab-bg" transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  style={{ position: 'absolute', inset: 0, borderRadius: 999, background: PURPLE, zIndex: -1, border: `2px solid ${INK}` }} />
              )}
              {m === 'login' ? 'LOGIN' : 'SIGN UP'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form key={mode}
            initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
            transition={{ duration: 0.18 }}
            onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {mode === 'register' && (
                <Field name="full_name" icon={<User size={14} />} placeholder="Full Name" err={errors.full_name} />
              )}

              <Field name="username" icon={<User size={14} />} placeholder="Username" autoComplete="username" err={errors.username} />

              {mode === 'register' && (
                <Field name="email" type="email" icon={<User size={14} />} placeholder="Email Address" err={errors.email} />
              )}

              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: INK, display: 'flex' }}><Lock size={14} /></span>
                <input name="password" type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={handleChange} placeholder="Password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  style={{ ...inputStyle(errors.password), paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: INK, padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {errors.password && <p style={{ fontSize: 11, fontWeight: 700, color: '#e53e3e', marginTop: 4 }}>{errors.password}</p>}
              </div>

              {mode === 'register' && (
                <Field name="confirm_password" type={showPass ? 'text' : 'password'} icon={<Lock size={14} />}
                  placeholder="Confirm Password" autoComplete="new-password" err={errors.confirm_password} />
              )}

              <motion.button type="submit" disabled={loading}
                whileHover={{ y: -2, boxShadow: `5px 5px 0px ${INK}` }}
                whileTap={{ y: 0, boxShadow: `2px 2px 0px ${INK}` }}
                style={{
                  width: '100%', padding: '13px 0', borderRadius: 10, border: `2.5px solid ${INK}`,
                  background: `linear-gradient(90deg, ${PINK}, ${YELLOW})`, color: INK, fontWeight: 800, fontSize: 13,
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', letterSpacing: '0.1em', marginTop: 6,
                  boxShadow: `3px 3px 0px ${INK}`, transition: 'box-shadow 0.15s',
                }}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : mode === 'login' ? 'LOGIN' : 'CREATE ACCOUNT'}
              </motion.button>
            </div>
          </motion.form>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
