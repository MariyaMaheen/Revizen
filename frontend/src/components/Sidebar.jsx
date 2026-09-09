import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, BookOpen, FileText, CreditCard, BarChart3, LogOut, Menu, X, Flame, Upload } from 'lucide-react'
import FileUpload from './FileUpload'
import DocumentList from './DocumentList'

const NAV_ITEMS = [
  { id: 'chat',       icon: <MessageSquare size={16} />, label: 'Smart Chat' },
  { id: 'quiz',       icon: <BookOpen size={16} />,      label: 'Practice Quiz' },
  { id: 'flashcards', icon: <CreditCard size={16} />,    label: 'Flashcards' },
  { id: 'summary',    icon: <FileText size={16} />,      label: 'Summary' },
  { id: 'insights',   icon: <BarChart3 size={16} />,     label: 'Insights' },
]

const NAV_DESC = {
  chat:       'Page citations sync',
  quiz:       'High yield focus',
  flashcards: 'Spaced recall loop',
  summary:    'Cheat sheet ready',
  insights:   'Weak area tracker',
}

function getGreeting(name) {
  const h = new Date().getHours()
  const first = name?.split(' ')[0] || name || 'there'
  if (h >= 5 && h < 12) return `Good morning, ${first} 👋`
  if (h >= 12 && h < 17) return `Good afternoon, ${first} 👋`
  if (h >= 17 && h < 21) return `Good evening, ${first} 👋`
  return `Studying late, ${first} 🌙`
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, addToast, onUploadComplete, docRefreshKey }) {
  const [greeting, setGreeting] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const streak = 5 // placeholder — wire to backend later

  useEffect(() => {
    const update = () => setGreeting(getGreeting(user?.full_name || user?.username))
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [user])

  const sidebarContent = (
    <div className="flex flex-col h-full" style={{ background: '#0d1220' }}>

      {/* Logo */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid #1e2d40' }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: '#00c896' }}>
            <BookOpen size={14} color="#0a0e1a" />
          </div>
          <span className="font-bold text-text-primary text-sm tracking-tight">Revizen</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-pill font-medium"
            style={{ background: '#00c89618', color: '#00c896', border: '1px solid #00c89630' }}>
            2.0
          </span>
        </div>

        {/* Greeting + streak */}
        <p className="text-sm font-semibold text-text-primary mb-1">{greeting}</p>
        <div className="flex items-center gap-1.5">
          <Flame size={12} style={{ color: '#ef4444' }} />
          <span className="text-xs text-text-muted">{streak} day streak — keep it up!</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <motion.button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileOpen(false) }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-left transition-all"
            style={activeTab === item.id
              ? { background: '#00c89618', border: '1px solid #00c89630' }
              : { background: 'transparent', border: '1px solid transparent' }}>
            <span style={{ color: activeTab === item.id ? '#00c896' : '#3d4f6b' }}>{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate"
                style={{ color: activeTab === item.id ? '#00c896' : '#e8eaf0' }}>
                {item.label}
              </p>
              <p className="text-xs truncate" style={{ color: '#3d4f6b' }}>{NAV_DESC[item.id]}</p>
            </div>
          </motion.button>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid #1e2d40', margin: '0 12px' }} />

      {/* Upload + Docs */}
      <div className="flex-1 overflow-y-auto">
        <FileUpload onUploadComplete={onUploadComplete} addToast={addToast} />
        <div style={{ borderTop: '1px solid #1e2d40', margin: '4px 12px' }} />
        <DocumentList refreshKey={docRefreshKey} addToast={addToast} />
      </div>

      {/* User footer */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ borderTop: '1px solid #1e2d40' }}>
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs"
          style={{ background: '#00c89620', color: '#00c896' }}>
          {(user?.username || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">{user?.full_name || user?.username}</p>
          <p className="text-xs truncate" style={{ color: '#3d4f6b' }}>{user?.email}</p>
        </div>
        <button onClick={onLogout} title="Logout"
          className="transition-colors hover:opacity-80" style={{ color: '#3d4f6b' }}>
          <LogOut size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0"
        style={{ background: '#0d1220', borderRight: '1px solid #1e2d40' }}>
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{ background: '#0d1220', borderTop: '1px solid #1e2d40' }}>
        {NAV_ITEMS.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
            style={{ color: activeTab === item.id ? '#00c896' : '#3d4f6b' }}>
            {item.icon}
            <span className="text-xs">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center py-2 gap-0.5"
          style={{ color: '#3d4f6b' }}>
          <Menu size={16} />
          <span className="text-xs">More</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <motion.div initial={{ x: -300 }} animate={{ x: 0 }}
            className="relative w-64 h-full shadow-2xl">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10" style={{ color: '#6b7a99' }}>
              <X size={16} />
            </button>
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  )
}
