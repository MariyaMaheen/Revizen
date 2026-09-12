import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Zap, Trash2, Upload, Youtube, Plus, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { chatStreamUrl, chatPost, ingestFile, ingestYouTube } from '../api'

export default function ChatPanel({ addToast, onUploadComplete }) {
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
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const bottomRef = useRef(null)
  const abortRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

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
    if (streamMode) await handleStreamSend(q)
    else await handlePostSend(q)
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
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = '', fullText = '', confidence = 'medium', sources = []
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const parsed = JSON.parse(line.slice(6))
            if (parsed.done) { confidence = parsed.confidence || 'medium'; sources = parsed.sources || [] }
            else if (parsed.token) { fullText += parsed.token; setCurrentToken(fullText) }
          } catch {}
        }
      }
      setCurrentToken('')
      setMessages(prev => [...prev, { role: 'assistant', content: fullText, confidence, sources }])
    } catch (err) {
      if (err.name !== 'AbortError') {
        setCurrentToken('')
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.', confidence: 'low', sources: [] }])
      }
    } finally { setStreaming(false); setCurrentToken('') }
  }

  async function handlePostSend(question) {
    try {
      const data = await chatPost(question)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, confidence: data.confidence, sources: data.sources }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: err.message || 'Something went wrong.', confidence: 'low', sources: [] }])
    } finally { setStreaming(false) }
  }

  function handleStop() {
    abortRef.current?.abort()
    setStreaming(false)
    if (currentToken) {
      setMessages(prev => [...prev, { role: 'assistant', content: currentToken + ' [stopped]', confidence: 'low', sources: [] }])
      setCurrentToken('')
    }
  }

  async function handleFileSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    try {
      await ingestFile(file, (pct) => setUploadProgress(pct))
      addToast?.(`${file.name} uploaded successfully`, 'success')
      onUploadComplete?.()
    } catch (err) {
      addToast?.(err.message || 'Upload failed', 'error')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      e.target.value = ''
    }
  }

  async function handleYoutubeSubmit(e) {
    e.preventDefault()
    const url = youtubeUrl.trim()
    if (!url) return
    setYoutubeLoading(true)
    try {
      const result = await ingestYouTube(url)
      addToast?.(`YouTube video indexed — ${result.chunks_indexed} chunks`, 'success')
      onUploadComplete?.()
      setYoutubeUrl('')
      setShowYoutubeInput(false)
    } catch (err) {
      addToast?.(err.message || 'Failed to process YouTube video', 'error')
    } finally {
      setYoutubeLoading(false)
    }
  }

  const isEmpty = messages.length === 0 && !streaming

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f6fb', fontFamily: 'Inter, sans-serif' }}>

      <input ref={fileInputRef} type="file" accept=".pdf,.txt" onChange={handleFileSelected} style={{ display: 'none' }} />

      {/* Header */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1a1d2e' }}>
          {isEmpty ? 'Home' : 'Chat'}
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setStreamMode(m => !m)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: streamMode ? '#eff1fe' : '#fff', color: streamMode ? '#5b6af0' : '#6b7280', fontFamily: 'inherit' }}>
            <Zap size={11} /> {streamMode ? 'Streaming' : 'Full'}
          </button>
          {messages.length > 0 && (
            <button onClick={handleClearChat}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', fontFamily: 'inherit' }}>
              <Trash2 size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isEmpty ? '0' : '16px 24px' }}>
        {isEmpty ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ marginBottom: 40 }}>
              <p style={{ margin: '0 0 4px', fontSize: 15, color: '#6b7280', fontWeight: 500 }}>What shall we</p>
              <p style={{ margin: 0, fontSize: 32, fontWeight: 800, color: '#1a1d2e', lineHeight: 1 }}>Study?</p>
            </div>

            <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              <motion.div onClick={() => !uploading && fileInputRef.current?.click()}
                whileHover={{ scale: 1.03, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.98 }}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', minWidth: 130, cursor: uploading ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff1fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {uploading ? <Loader2 size={20} color="#5b6af0" className="animate-spin" /> : <Upload size={20} color="#5b6af0" />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1d2e' }}>
                    {uploading ? `Uploading ${uploadProgress}%` : 'Upload file'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>PDF, TXT...</p>
                </div>
              </motion.div>

              <motion.div onClick={() => setShowYoutubeInput(p => !p)}
                whileHover={{ scale: 1.03, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                whileTap={{ scale: 0.98 }}
                style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '20px 24px', minWidth: 130, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Youtube size={20} color="#ef4444" />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1d2e' }}>YouTube</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>Paste a link</p>
                </div>
              </motion.div>
            </div>

            <AnimatePresence>
              {showYoutubeInput && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleYoutubeSubmit}
                  style={{ display: 'flex', gap: 8, marginBottom: 16, width: '100%', maxWidth: 400 }}>
                  <input
                    autoFocus
                    value={youtubeUrl}
                    onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1.5px solid #5b6af0', outline: 'none', fontSize: 13, fontFamily: 'inherit', color: '#1a1d2e' }}
                  />
                  <button type="submit" disabled={!youtubeUrl.trim() || youtubeLoading}
                    style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: youtubeUrl.trim() && !youtubeLoading ? '#5b6af0' : '#e5e7eb', color: youtubeUrl.trim() && !youtubeLoading ? '#fff' : '#9ca3af', fontWeight: 700, fontSize: 13, cursor: youtubeUrl.trim() && !youtubeLoading ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {youtubeLoading ? <><Loader2 size={13} className="animate-spin" /> Processing...</> : 'Continue'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => <MessageBubble key={i} {...msg} />)}
            {streaming && currentToken && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                <div style={{ maxWidth: 560, padding: '12px 16px', borderRadius: 16, borderTopLeftRadius: 4, background: '#fff', border: '1px solid #e5e7eb', color: '#1a1d2e', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {currentToken}
                  <span style={{ display: 'inline-block', width: 6, height: 16, background: '#5b6af0', marginLeft: 2, verticalAlign: 'middle' }} />
                </div>
              </motion.div>
            )}
            {streaming && !currentToken && <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}><TypingIndicator /></div>}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div style={{ padding: '12px 24px 16px', background: '#fff', borderTop: '1px solid #e5e7eb', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, background: '#f4f6fb', borderRadius: 16, padding: '10px 14px', border: '1px solid #e5e7eb' }}>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: 'flex', padding: 0, flexShrink: 0 }}>
            <Plus size={18} />
          </button>
          <textarea ref={textareaRef} value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="I want to study..."
            rows={1}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none', fontSize: 14, color: '#1a1d2e', fontFamily: 'Inter, sans-serif', maxHeight: 120, lineHeight: 1.5 }}
          />
          {streaming ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleStop}
              style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#ef4444' }}>
              <Square size={14} />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleSend} disabled={!input.trim()}
              style={{ width: 36, height: 36, borderRadius: 10, background: input.trim() ? '#5b6af0' : '#e5e7eb', border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: input.trim() ? '#fff' : '#9ca3af', transition: 'all 0.15s' }}>
              <Send size={14} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
