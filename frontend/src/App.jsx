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

const TABS = ['chat', 'quiz', 'summary', 'flashcards', 'insights']

const tabVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.2 } },
}

function TabPanel({ tab }) {
  switch (tab) {
    case 'chat': return <ChatPanel />
    case 'quiz': return <QuizPanel />
    case 'summary': return <SummaryPanel />
    case 'flashcards': return <FlashcardPanel />
    case 'insights': return <InsightsPanel />
    default: return <ChatPanel />
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [toasts, setToasts] = useState([])
  const [docRefreshKey, setDocRefreshKey] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('revizen_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch {}
    }
  }, [])

  function addToast(message, type = 'success') {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }

  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  function handleLogin(userData) {
    setUser(userData)
  }

  function handleLogout() {
    localStorage.removeItem('revizen_token')
    localStorage.removeItem('revizen_user')
    setUser(null)
  }

  function handleUploadComplete() {
    setDocRefreshKey(k => k + 1)
  }

  if (!user) {
    return <Login onLogin={handleLogin} addToast={addToast} />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text-primary font-sans">
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        addToast={addToast}
        onUploadComplete={handleUploadComplete}
        docRefreshKey={docRefreshKey}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabPanel tab={activeTab} />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
