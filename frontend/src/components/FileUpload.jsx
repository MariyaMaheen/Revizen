import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Upload, File, Loader2 } from 'lucide-react'
import { ingestFile } from '../api'

export default function FileUpload({ onUploadComplete, addToast }) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [chunkCount, setChunkCount] = useState(0)
  const [animChunks, setAnimChunks] = useState(0)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  function animateChunks(target) {
    const start = performance.now()
    const duration = 1500
    function step(now) {
      const elapsed = now - start
      const pct = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - pct, 3)
      setAnimChunks(Math.round(ease * target))
      if (pct < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  async function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'txt'].includes(ext)) {
      addToast('Only PDF and TXT files are supported', 'error')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      addToast('File too large. Maximum size is 50MB', 'error')
      return
    }

    setUploading(true)
    setProgress(0)
    setStatus('Uploading...')
    setChunkCount(0)
    setAnimChunks(0)

    try {
      const result = await ingestFile(file, (pct) => {
        setProgress(pct)
        if (pct >= 50) setStatus('Extracting text...')
      })

      setProgress(90)
      setStatus('Embedding chunks...')
      await new Promise(r => setTimeout(r, 600))

      setProgress(100)
      setStatus('Done!')
      setChunkCount(result.chunks_indexed)
      animateChunks(result.chunks_indexed)

      addToast(`✓ ${file.name} — ${result.chunks_indexed} chunks indexed`, 'success')
      onUploadComplete()

      setTimeout(() => {
        setUploading(false)
        setProgress(0)
        setStatus('')
        setAnimChunks(0)
      }, 3000)
    } catch (err) {
      addToast(err.message, 'error')
      setUploading(false)
      setProgress(0)
      setStatus('')
    }
  }

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }, [])

  const onDragOver = useCallback((e) => { e.preventDefault(); setDragging(true) }, [])
  const onDragLeave = useCallback(() => setDragging(false), [])

  return (
    <div className="px-3 py-2">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Upload Document</p>

      {uploading ? (
        <div className="rounded-card bg-card border border-border p-3">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 size={14} className="text-primary animate-spin" />
            <span className="text-xs text-text-muted">{status}</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${progress === 100 ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {chunkCount > 0 && (
            <p className="text-xs text-accent mt-1">{animChunks} chunks indexed</p>
          )}
        </div>
      ) : (
        <motion.div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          whileHover={{ scale: 1.01 }}
          className={`border-2 border-dashed rounded-card p-4 cursor-pointer transition-colors text-center ${
            dragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          }`}
        >
          <Upload size={20} className="mx-auto text-text-muted mb-1" />
          <p className="text-xs text-text-muted">Drop PDF or TXT here</p>
          <p className="text-xs text-text-muted opacity-60">or click to browse</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
        </motion.div>
      )}
    </div>
  )
}
