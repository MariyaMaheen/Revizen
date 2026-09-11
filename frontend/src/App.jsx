import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import QuizPanel from './components/QuizPanel'
import SummaryPanel from './components/SummaryPanel'
import FlashcardPanel from './components/FlashcardPanel'
import InsightsPanel from './components/InsightsPanel'
import Toast from './components/Toast'

const tabVariants = {
  enter:  { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:   { opacity: 0, y: -10, transition: { duration: 0.15 } },
}

function TabPanel({ tab }) {
  switch (tab) {
    case 'chat':       return <ChatPanel />
    case 'quiz':       return <QuizPanel />
    case 'summary':    return <SummaryPanel />
    case 'flashcards': return <FlashcardPanel />
    case 'insights':   return <InsightsPanel />
    default:           return <ChatPanel />
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [toasts, setToasts] = useState([])
  const [docRefreshKey, setDocRefreshKey] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('revizen_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch {} }
  }, [])

  function addToast(message, type = 'success') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function handleLogin(userData) { setUser(userData) }

  function handleLogout() {
    localStorage.removeItem('revizen_token')
    localStorage.removeItem('revizen_user')
    setUser(null)
  }

  if (!user) return <Login onLogin={handleLogin} addToast={addToast} />

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f4f6fb', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar
        user={user} activeTab={activeTab} setActiveTab={setActiveTab}
        onLogout={handleLogout} addToast={addToast}
        onUploadComplete={() => setDocRefreshKey(k => k + 1)}
        docRefreshKey={docRefreshKey}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0 }} className="pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} variants={tabVariants} initial="enter" animate="center" exit="exit"
            style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <TabPanel tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </main>

      <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <AnimatePresence>
          {toasts.map(toast => <Toast key={toast.id} {...toast} onRemove={removeToast} />)}
        </AnimatePresence>
      </div>
    </div>
  )

  function removeToast(id) { setToasts(prev => prev.filter(t => t.id !== id)) }
}
