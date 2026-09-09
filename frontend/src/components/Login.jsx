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
    width: '100%', padding: '9px 12px', borderRadius: 0,
    border: 'none', borderBottom: `1.5px solid ${err ? '#e53e3e' : '#ddd'}`,
    background: 'transparent', color: '#333', fontSize: 13,
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  })

  const DARK = '#6b2d5e'
  const MID  = '#9b4a82'
  const LIGHT = '#c47aaa'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: DARK, fontFamily: 'Inter, sans-serif', padding: 16 }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 720, minHeight: 420, borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>

        {/* Left geometric panel */}
        <div style={{ flex: '0 0 42%', background: DARK, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32 }}>
          <div style={{ position: 'absolute', top: 0, right: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 220px 220px 0', borderColor: `transparent ${MID} transparent transparent` }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '120px 0 0 120px', borderColor: `transparent transparent transparent ${MID}` }} />
          <div style={{ position: 'absolute', top: '38%', left: '18%', width: 120, height: 120, background: LIGHT, transform: 'rotate(45deg)', opacity: 0.3 }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: DARK, fontWeight: 800, fontSize: 13 }}>R</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Revizen</span>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0 }}>Your Study Brain</p>
          </div>
        </div>

        {/* Right form panel */}
        <div style={{ flex: 1, background: '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 36px' }}>
          <div style={{ display: 'flex', gap: 20, marginBottom: 28, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErrors({}) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', padding: '0 0 4px 0', color: mode === m ? DARK : '#bbb', borderBottom: mode === m ? `2px solid ${DARK}` : '2px solid transparent' }}>
                {m === 'login' ? 'LOGIN' : 'SIGN UP'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }} onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {mode === 'register' && (
                  <div>
                    <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full Name" style={inp(errors.full_name)} />
                    {errors.full_name && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.full_name}</p>}
                  </div>
                )}

                <div>
                  <input name="username" value={form.username} onChange={handleChange} placeholder="Username" autoComplete="username" style={inp(errors.username)} />
                  {errors.username && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.username}</p>}
                </div>

                {mode === 'register' && (
                  <div>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Email Address" style={inp(errors.email)} />
                    {errors.email && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.email}</p>}
                  </div>
                )}

                <div>
                  <div style={{ position: 'relative' }}>
                    <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} placeholder="Password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} style={{ ...inp(errors.password), paddingRight: 36 }} />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 0, display: 'flex' }}>
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {errors.password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.password}</p>}
                </div>

                {mode === 'register' && (
                  <div>
                    <input name="confirm_password" type={showPass ? 'text' : 'password'} value={form.confirm_password} onChange={handleChange} placeholder="Confirm Password" autoComplete="new-password" style={inp(errors.confirm_password)} />
                    {errors.confirm_password && <p style={{ fontSize: 11, color: '#e53e3e', marginTop: 3 }}>{errors.confirm_password}</p>}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                  <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                    style={{ padding: '10px 28px', borderRadius: 4, border: 'none', background: DARK, color: '#fff', fontWeight: 700, fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'inherit', letterSpacing: '0.05em' }}>
                    {loading ? <Loader2 size={14} className="animate-spin" /> : mode === 'login' ? 'LOGIN' : 'CREATE'}
                  </motion.button>
                </div>

                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 4 }}>
                  {mode === 'login' ? "No account? " : "Have an account? "}
                  <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
                    style={{ color: DARK, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
                    {mode === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
