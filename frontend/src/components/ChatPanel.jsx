import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Zap, Brain, Trash2 } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { chatStreamUrl, chatPost } from '../api'

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('revizen_chat')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamMode, setStreamMode] = useState(true)
  const [currentToken, setCurrentToken] = useState('')
  const bottomRef = useRef(null)
  const abortRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, currentToken])

  useEffect(() => {
    localStorage.setItem('revizen_chat', JSON.stringify(messages))
  }, [messages])

  function handleClearChat() {
    setMessages([])
    localStorage.removeItem('revizen_chat')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleSend() {
    const q = input.trim()
    if (!q || streaming) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setStreaming(true)
    setCurrentToken('')

    if (streamMode) {
      await handleStreamSend(q)
    } else {
      await handlePostSend(q)
    }
  }

  async function handleStreamSend(question) {
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const token = localStorage.getItem('revizen_token')
      const res = await fetch(chatStreamUrl(question), {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullText = ''
      let confidence = 'medium'
      let sources = []

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          try {
            const parsed = JSON.parse(data)
            if (parsed.done) {
              confidence = parsed.confidence || 'medium'
              sources = parsed.sources || []
            } else if (parsed.token) {
              fullText += parsed.token
              setCurrentToken(fullText)
            }
          } catch {}
        }
      }

      setCurrentToken('')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fullText,
        confidence,
        sources,
      }])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setCurrentToken('')
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Something went wrong. Please try again.',
          confidence: 'low',
          sources: [],
        }])
      }
    } finally {
      setStreaming(false)
      setCurrentToken('')
    }
  }

  async function handlePostSend(question) {
    try {
      const data = await chatPost(question)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        confidence: data.confidence,
        sources: data.sources,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.message || 'Something went wrong. Please try again.',
        confidence: 'low',
        sources: [],
      }])
    } finally {
      setStreaming(false)
    }
  }

  function handleStop() {
    abortRef.current?.abort()
    setStreaming(false)
    if (currentToken) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: currentToken + ' [stopped]',
        confidence: 'low',
        sources: [],
      }])
      setCurrentToken('')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex items-center justify-between flex-shrink-0">
        <h2 className="font-bold text-lg text-text-primary">Chat</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStreamMode(m => !m)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${
              streamMode ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-card text-text-muted border border-border'
            }`}
            title="Toggle streaming mode"
          >
            <Zap size={12} />
            {streamMode ? 'Streaming' : 'Full response'}
          </button>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1 px-3 py-1.5 rounded-btn text-xs font-medium bg-card text-text-muted border border-border hover:text-error hover:border-error/30 transition-all"
              title="Clear chat"
            >
              <Trash2 size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Brain size={32} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary mb-1">Ask anything from your notes</h3>
              <p className="text-text-muted text-sm">Upload a document in the sidebar, then start asking questions</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} {...msg} />
        ))}

        {streaming && currentToken && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mb-4"
          >
            <div className="max-w-xl px-4 py-3 rounded-bubble rounded-tl-sm bg-card border border-border text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
              {currentToken}
              <span className="inline-block w-1.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
            </div>
          </motion.div>
        )}

        {streaming && !currentToken && <div className="flex justify-start mb-4"><TypingIndicator /></div>}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-t border-border flex-shrink-0">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question about your documents..."
              rows={1}
              className="w-full px-4 py-3 pr-16 rounded-card bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none transition-colors text-sm"
              style={{ maxHeight: '120px' }}
            />
            <div className="absolute right-3 bottom-3 text-xs text-text-muted">{input.length}</div>
          </div>

          {streaming ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStop}
              className="flex-shrink-0 w-10 h-10 rounded-btn bg-error/20 border border-error/30 text-error flex items-center justify-center transition-colors hover:bg-error/30"
            >
              <Square size={14} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim()}
              className="flex-shrink-0 w-10 h-10 rounded-btn bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
