import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2, Copy, Check, RefreshCw } from 'lucide-react'
import { generateSummary } from '../api'

const STYLES = [
  { id: 'bullet', label: 'Bullet Points' },
  { id: 'paragraph', label: 'Paragraph' },
  { id: 'concepts', label: 'Key Concepts' },
]

function renderSummary(text, style) {
  if (style === 'bullet') {
    const lines = text.split('\n').filter(l => l.trim())
    return (
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-2 text-sm text-text-primary">
            <span className="text-primary mt-1 flex-shrink-0">•</span>
            <span>{line.replace(/^[•\-\*]\s*/, '')}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (style === 'concepts') {
    const lines = text.split('\n').filter(l => l.trim())
    return (
      <div className="flex flex-wrap gap-2">
        {lines.map((line, i) => {
          const [concept, ...rest] = line.split(':')
          return (
            <div key={i} className="px-3 py-2 rounded-btn bg-primary/10 border border-primary/20 text-sm">
              <span className="text-accent font-medium">{concept}</span>
              {rest.length > 0 && <span className="text-text-muted">: {rest.join(':')}</span>}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {text.split('\n\n').filter(p => p.trim()).map((para, i) => (
        <p key={i} className="text-sm text-text-primary leading-relaxed">{para}</p>
      ))}
    </div>
  )
}

export default function SummaryPanel() {
  const [topic, setTopic] = useState('')
  const [style, setStyle] = useState('bullet')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!topic.trim()) { setError('Please enter a topic'); return }
    setError('')
    setLoading(true)
    try {
      const data = await generateSummary(topic, style)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result?.summary || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
        <h2 className="font-bold text-lg text-text-primary">Summary</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Topic</label>
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g., Mitosis, The French Revolution..."
              className="w-full px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">Style</label>
            <div className="flex gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className={`flex-1 py-2 px-3 rounded-btn text-sm font-medium transition-all ${
                    style === s.id ? 'bg-primary text-white' : 'bg-card border border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <div className="flex gap-2">
            <motion.button
              onClick={handleGenerate}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 rounded-btn bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><FileText size={18} /> Generate Summary</>}
            </motion.button>

            {result && (
              <motion.button
                onClick={handleGenerate}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-3 rounded-btn bg-card border border-border text-text-muted hover:text-text-primary transition-colors"
                title="Regenerate"
              >
                <RefreshCw size={18} />
              </motion.button>
            )}
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-card bg-card border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-text-primary">{result.topic}</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn bg-card border border-border text-text-muted hover:text-text-primary transition-colors text-xs"
                >
                  {copied ? <><Check size={12} className="text-success" /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              {renderSummary(result.summary, result.style)}
              {result.sources && result.sources.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-border">
                  {result.sources.map(s => (
                    <span key={s} className="text-xs text-text-muted px-2 py-1 rounded-full border border-border">{s}</span>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
