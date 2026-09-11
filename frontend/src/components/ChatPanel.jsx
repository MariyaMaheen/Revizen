import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Square, Zap, Trash2, Upload, Youtube, Plus } from 'lucide-react'
import MessageBubble from './MessageBubble'
import TypingIndicator from './TypingIndicator'
import { chatStreamUrl, chatPost, ingestFile, ingestYoutube } from '../api'

const CAT_IMG = '/study-mascot-cat.gif'

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
        setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try
