import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, BookOpen, FileText, CreditCard, BarChart3, LogOut, Menu, X, Plus, ChevronRight } from 'lucide-react'
import FileUpload from './FileUpload'
import DocumentList from './DocumentList'

const NAV_ITEMS = [
  { id: 'chat',       icon: <MessageSquare size={15} />, label: 'Smart Chat',    color: '#5b6af0', bg: '#eef0ff' },
  { id: 'quiz',       icon: <BookOpen size={15} />,      label: 'Practice Quiz', color: '#f59e0b', bg: '#fff7e6' },
  { id: 'flashcards', icon: <CreditCard size={15} />,    label: 'Flashcards',    color: '#10b981', bg: '#e8fbf3' },
  { id: 'summary',    icon: <FileText size={15} />,      label: 'Summary',       color: '#8b5cf6', bg: '#f4eeff' },
  { id: 'insights',   icon: <BarChart3 size={15} />,     label: 'Insights',      color: '#ef4444', bg: '#feeeee' },
]

export default function Sidebar({ user, activeTab, setActiveTab, onLogout, addToast, onUploadComplete, docRefreshKey }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const INK = '#1a202c'
  const SUBTEXT = '#94a3b8'
  const BORDER = '#eef0f3'

  const sidebarContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', fontFamily: 'Inter, sans-serif', borderRight: `1px solid ${BORDER}` }}>

      {/* Top — app name */}
      <div style={{ padding: '20px 16px 14px' }}>
        <span style={{ color: INK, fontWeight: 800, fontSize: 18, letterSpacing: '-0.2px' }}>Revizen</span>
      </div>

      {/* Nav section */}
      <div style={{ padding: '2px 10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV_ITEMS.map(item => {
            const active = activeTab === item.id
            return (
              <motion.button key={item.id}
                onClick={() => { setActiveTab(item.id); setMobileOpen(false) }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                  background: active ? item.bg : 'transparent',
                  transition: 'background 0.15s',
                }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: item.bg,
                }}>
                  <span style={{ color: item.color, display: 'flex' }}>{item.icon}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? INK : '#64748b' }}>{item.label}</span>
                {active && <ChevronRight size={13} style={{ marginLeft: 'auto', color: item.color }} />}
              </motion.button>
            )
          })}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${BORDER}`, margin: '6px 12px' }} />

      {/* Documents section */}
      <div style={{ padding: '10px 10px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 0 8px 6px' }}>
          <p style={{ color: SUBTEXT, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>My Decks</p>
          <button onClick={() => setShowUpload(p => !p)}
            style={{
              background: '#eef0f3', border: 'none', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 20, height: 20, borderRadius: 6,
            }}>
            <Plus size={12} />
          </button>
        </div>
        {showUpload && (
          <div style={{ marginBottom: 10 }}>
            <FileUpload onUploadComplete={() => { onUploadComplete(); setShowUpload(false) }} addToast={addToast} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        <DocumentList refreshKey={docRefreshKey} addToast={addToast} />
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#eef0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ color: '#5b6af0', fontWeight: 700, fontSize: 12 }}>{(user?.username || '?')[0].toUpperCase()}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
          <p style={{ margin: 0, fontSize: 10, color: SUBTEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SUBTEXT, display: 'flex', padding: 0 }}>
          <LogOut size={15} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside style={{ width: 220, flexShrink: 0 }} className="hidden md:flex flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex" style={{ background: '#fff', borderTop: `1px solid ${BORDER}` }}>
        {NAV_ITEMS.slice(0, 4).map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: activeTab === item.id ? item.color : SUBTEXT }}>
            {item.icon}
            <span style={{ fontSize: 9 }}>{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button onClick={() => setMobileOpen(true)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0', gap: 3, background: 'none', border: 'none', cursor: 'pointer', color: SUBTEXT }}>
          <Menu size={16} />
          <span style={{ fontSize: 9 }}>More</span>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileOpen(false)} />
          <motion.div initial={{ x: -260 }} animate={{ x: 0 }} style={{ position: 'relative', width: 220, height: '100%' }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: SUBTEXT, zIndex: 1 }}>
              <X size={16} />
            </button>
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  )
}
