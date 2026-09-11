import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, BookOpen, FileText, CreditCard, BarChart3, LogOut, Menu, X, Flame } from 'lucide-react'
import FileUpload from './FileUpload'
import DocumentList from './DocumentList'

const NAV_ITEMS = [
  { id: 'chat',       icon: <MessageSquare size={16} />, label: 'Smart Chat',     sub: 'Page citations sync' },
  { id: 'quiz',       icon: <BookOpen size={16} />,      label: 'Practice Quiz',  sub: 'High yield focus' },
  { id: 'flashcards', icon: <CreditCard size={16} />,    label: 'Flashcards',     sub: 'Spaced recall loop' },
  { id: 'summary',    icon: <FileText size={16} />,      label: 'Summary',        sub: 'Cheat sheet ready' },
  { id: 'insights',   icon: <BarChart3 size={16} />,     label: 'Insights',       sub: 'Weak area tracker' },
]

function getGreeting(name) {
  const h = new Date().getHours()
  const first = name?.split(' ')[0] || name || 'there'
  if (h >= 5 && h < 12) return `Good morning, ${first} 👋`
  if (h >= 12 && h < 17) return `Good afternoon, ${first} 👋`
  if (h >= 17 && h < 21) return `Good evening, ${first} 👋`
  return `Night owl mode, ${first} 🌙`
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, addToast, onUploadComplete, docRefreshKey }) {
  const [greeting, setGreeting] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const update = () => setGreeting(getGreeting(user?.full_name || user?.username))
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [user])

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e2235' }}>

      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #2d3450' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#5b6af0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>R</span>
          </div>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, margin: 0, lineHeight: 1 }}>Revizen</p>
            <p style={{ color: '#4a5568', fontSize: 10, margin: '2px 0 0', lineHeight: 1 }}>Study Brain</p>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#2d3450', color: '#5b6af0', fontWeight: 600 }}>2.0</span>
        </div>
        <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{greeting}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Flame size={11} color="#ef4444" />
          <span style={{ color: '#6b7280', fontSize: 11 }}>5 day streak — keep it up!</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => (
          <motion.button key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileOpen(false) }}
            whileTap={{ scale: 0.98 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
              background: activeTab === item.id ? '#2d3450' : 'transparent',
              transition: 'all 0.15s',
            }}>
            <span style={{ color: activeTab === item.id ? '#5b6af0' : '#4a5568', display: 'flex' }}>{item.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: activeTab === item.id ? '#fff' : '#a0aec0', lineHeight: 1 }}>{item.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: '#4a5568', lineHeight: 1 }}>{item.sub}</p>
            </div>
          </motion.button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid #2d3450', margin: '4px 10px' }} />

      {/* Upload + Docs */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <FileUpload onUploadComplete={onUploadComplete} addToast={addToast} />
        <div style={{ borderTop: '1px solid #2d3450', margin: '4px 10px' }} />
        <DocumentList refreshKey={docRefreshKey} addToast={addToast} />
      </div>

      {/* User footer */}
      <div style={{ borderTop: '1px solid #2d3450', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#2d3450', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#5b6af0', fontWeight: 700, fontSize: 12 }}>{(user?.username || '?')[0].toUpperCase()}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
          <p style={{ margin: 0, fontSize: 10, color: '#4a5568', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568', display: 'flex', padding: 0 }}>
          <LogOut size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside style={{ width: 220, flexShrink: 0, background: '#1e2235' }} className="hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex" style={{ background: '#1e2235', borderTop: '1px solid #2d3450' }}>
        {NAV_ITEMS.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === item.id ? '#5b6af0' : '#4a5568' }}>
            {item.icon}
            <span style={{ fontSize: 10 }}>{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button onClick={() => setMobileOpen(true)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}>
          <Menu size={16} />
          <span style={{ fontSize: 10 }}>More</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <motion.div initial={{ x: -280 }} animate={{ x: 0 }} style={{ position: 'relative', width: 240, height: '100%' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', zIndex: 1 }}>
              <X size={16} />
            </button>
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  )
}
