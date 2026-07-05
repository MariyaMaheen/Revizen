import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, BookOpen, FileText, CreditCard, BarChart3, LogOut, Menu, X } from 'lucide-react'
import FileUpload from './FileUpload'
import DocumentList from './DocumentList'

const NAV_ITEMS = [
  { id: 'chat', icon: <MessageSquare size={18} />, label: 'Chat' },
  { id: 'quiz', icon: <BookOpen size={18} />, label: 'Quiz' },
  { id: 'summary', icon: <FileText size={18} />, label: 'Summary' },
  { id: 'flashcards', icon: <CreditCard size={18} />, label: 'Flashcards' },
  { id: 'insights', icon: <BarChart3 size={18} />, label: 'Insights' },
]

function getGreeting(name) {
  const h = new Date().getHours()
  const first = name?.split(' ')[0] || name || 'there'
  if (h >= 5 && h < 12) return `Good morning, ${first}! Ready for today's revision?`
  if (h >= 12 && h < 17) return `Good afternoon, ${first}! Let's keep the momentum going.`
  if (h >= 17 && h < 21) return `Good evening, ${first}! Time for a study session.`
  return `Studying late, ${first}? Let's make it count. 🌙`
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
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">R</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary leading-none">Revizen</h1>
            <p className="text-xs text-text-muted leading-none mt-0.5">Revise without chaos</p>
          </div>
        </div>
        <p className="text-xs text-text-muted leading-relaxed">{greeting}</p>
      </div>

      {/* Nav */}
      <nav className="px-3 py-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <motion.button
            key={item.id}
            onClick={() => { setActiveTab(item.id); setMobileOpen(false) }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-all ${
              activeTab === item.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-text-muted hover:text-text-primary hover:bg-card'
            }`}
          >
            {item.icon}
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="border-t border-border mt-1" />

      {/* Upload */}
      <div className="flex-1 overflow-y-auto">
        <FileUpload onUploadComplete={onUploadComplete} addToast={addToast} />
        <div className="border-t border-border my-1" />
        <DocumentList refreshKey={docRefreshKey} addToast={addToast} />
      </div>

      {/* User */}
      <div className="border-t border-border px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-xs font-bold">
            {(user?.username || '?')[0].toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text-primary truncate">{user?.username}</p>
          <p className="text-xs text-text-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={onLogout}
          className="text-text-muted hover:text-error transition-colors"
          title="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-sidebar border-r border-border flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-border flex">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 transition-colors ${
              activeTab === item.id ? 'text-primary' : 'text-text-muted'
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex-1 flex flex-col items-center py-2 text-xs gap-1 text-text-muted"
        >
          <Menu size={18} />
          <span>More</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="relative w-72 bg-sidebar h-full shadow-2xl"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-text-muted hover:text-text-primary"
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </motion.div>
        </div>
      )}
    </>
  )
}
