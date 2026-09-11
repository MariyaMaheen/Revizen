import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, BookOpen, FileText, CreditCard, BarChart3, LogOut, Menu, X, Plus, ChevronRight } from 'lucide-react'
import FileUpload from './FileUpload'
import DocumentList from './DocumentList'

const NAV_ITEMS = [
  { id: 'chat',       icon: <MessageSquare size={16} />, label: 'Smart Chat',    color: '#5b6af0' },
  { id: 'quiz',       icon: <BookOpen size={16} />,      label: 'Practice Quiz', color: '#f59e0b' },
  { id: 'flashcards', icon: <CreditCard size={16} />,    label: 'Flashcards',    color: '#10b981' },
  { id: 'summary',    icon: <FileText size={16} />,      label: 'Summary',       color: '#8b5cf6' },
  { id: 'insights',   icon: <BarChart3 size={16} />,     label: 'Insights',      color: '#ef4444' },
]

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, addToast, onUploadComplete, docRefreshKey }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1f2e', fontFamily: 'Inter, sans-serif' }}>

      {/* Top — app name + user */}
      <div style={{ padding: '16px 14px 12px', borderBottom: '1px solid #252d40' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#5b6af0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>R</span>
            </div>
            <span style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 14 }}>Revizen</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#5b6af0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{(user?.username || '?')[0].toUpperCase()}</span>
            </div>
            <span style={{ color: '#a0aec0', fontSize: 12 }}>{user?.username}</span>
          </div>
        </div>
      </div>

      {/* Nav section */}
      <div style={{ padding: '12px 10px 4px' }}>
        <p style={{ color: '#3d4f6b', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px 6px' }}>Menu</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map(item => (
            <motion.button key={item.id}
              onClick={() => { setActiveTab(item.id); setMobileOpen(false) }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8,
                border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                background: activeTab === item.id ? '#252d40' : 'transparent',
                transition: 'background 0.15s',
              }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: activeTab === item.id ? item.color + '22' : '#252d40',
              }}>
                <span style={{ color: activeTab === item.id ? item.color : '#4a5568', display: 'flex' }}>{item.icon}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: activeTab === item.id ? '#f1f5f9' : '#6b7a99' }}>{item.label}</span>
              {activeTab === item.id && <ChevronRight size={12} style={{ marginLeft: 'auto', color: '#3d4f6b' }} />}
            </motion.button>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #252d40', margin: '8px 10px' }} />

      {/* Documents section */}
      <div style={{ padding: '0 10px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 6px 6px' }}>
          <p style={{ color: '#3d4f6b', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>My Decks</p>
          <button onClick={() => setShowUpload(p => !p)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d4f6b', display: 'flex', padding: 2, borderRadius: 4 }}>
            <Plus size={13} />
          </button>
        </div>
        {showUpload && (
          <div style={{ marginBottom: 8 }}>
            <FileUpload onUploadComplete={() => { onUploadComplete(); setShowUpload(false) }} addToast={addToast} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        <DocumentList refreshKey={docRefreshKey} addToast={addToast} />
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #252d40', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#252d40', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#5b6af0', fontWeight: 700, fontSize: 11 }}>{(user?.username || '?')[0].toUpperCase()}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
          <p style={{ margin: 0, fontSize: 10, color: '#3d4f6b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3d4f6b', display: 'flex', padding: 0 }}>
          <LogOut size={14} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside style={{ width: 210, flexShrink: 0 }} className="hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex" style={{ background: '#1a1f2e', borderTop: '1px solid #252d40' }}>
        {NAV_ITEMS.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === item.id ? item.color : '#4a5568' }}>
            {item.icon}
            <span style={{ fontSize: 9 }}>{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button onClick={() => setMobileOpen(true)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: '#4a5568' }}>
          <Menu size={16} />
          <span style={{ fontSize: 9 }}>More</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setMobileOpen(false)} />
          <motion.div initial={{ x: -260 }} animate={{ x: 0 }} style={{ position: 'relative', width: 220, height: '100%' }}>
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
