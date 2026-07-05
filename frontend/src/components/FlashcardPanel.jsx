import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Loader2, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import { generateFlashcards } from '../api'

const COUNTS = [5, 10, 15]

function FlipCard({ card, flipped, onClick }) {
  return (
    <div
      onClick={onClick}
      className="relative w-full cursor-pointer"
      style={{ perspective: '1000px', height: '220px' }}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 rounded-card border"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            background: 'linear-gradient(135deg, #7C3AED22, #1A1A2E)',
            borderColor: '#7C3AED44',
          }}
        >
          <span className="text-xs text-accent mb-3 font-medium uppercase tracking-wider">Question</span>
          <p className="text-text-primary font-semibold text-center leading-relaxed">{card.front}</p>
          <span className="text-xs text-text-muted mt-4">Click to reveal answer</span>
        </div>

        {/* Back */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            position: 'absolute',
            inset: 0,
          }}
          className="flex flex-col items-center justify-center p-6 rounded-card border border-border bg-card"
        >
          <span className="text-xs text-success mb-3 font-medium uppercase tracking-wider">Answer</span>
          <p className="text-accent text-center leading-relaxed">{card.back}</p>
        </div>
      </div>
    </div>
  )
}

export default function FlashcardPanel() {
  const [topic, setTopic] = useState('')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cards, setCards] = useState([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [seen, setSeen] = useState(new Set())

  const handleKeyDown = useCallback((e) => {
    if (!cards.length) return
    if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f) }
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }, [cards.length, current])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function next() {
    setFlipped(false)
    setCurrent(c => Math.min(c + 1, cards.length - 1))
    setSeen(s => new Set([...s, current]))
  }

  function prev() {
    setFlipped(false)
    setCurrent(c => Math.max(c - 1, 0))
  }

  function shuffle() {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrent(0)
    setFlipped(false)
    setSeen(new Set())
  }

  async function handleGenerate() {
    if (!topic.trim()) { setError('Please enter a topic'); return }
    setError('')
    setLoading(true)
    try {
      const data = await generateFlashcards(topic, count)
      if (!data.cards || data.cards.length === 0) {
        setError('No flashcards generated. Try a different topic.')
        return
      }
      setCards(data.cards)
      setCurrent(0)
      setFlipped(false)
      setSeen(new Set())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex-shrink-0">
        <h2 className="font-bold text-lg text-text-primary">Flashcards</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-xl mx-auto space-y-4">
          {/* Setup */}
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder="Enter a topic..."
              className="flex-1 px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
            />
            <div className="flex gap-1">
              {COUNTS.map(c => (
                <button
                  key={c}
                  onClick={() => setCount(c)}
                  className={`px-3 py-3 rounded-btn text-sm font-medium transition-all ${
                    count === c ? 'bg-primary text-white' : 'bg-card border border-border text-text-muted hover:text-text-primary'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-error text-sm">{error}</p>}

          <motion.button
            onClick={handleGenerate}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-btn bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><CreditCard size={18} /> Generate Flashcards</>}
          </motion.button>

          {cards.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-muted">{current + 1} / {cards.length}</span>
                <div className="w-40 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((seen.size) / cards.length) * 100}%` }}
                  />
                </div>
                <button onClick={shuffle} className="text-text-muted hover:text-text-primary transition-colors">
                  <Shuffle size={16} />
                </button>
              </div>

              <FlipCard card={cards[current]} flipped={flipped} onClick={() => setFlipped(f => !f)} />

              <div className="flex items-center justify-between mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={prev}
                  disabled={current === 0}
                  className="flex items-center gap-1 px-4 py-2 rounded-btn bg-card border border-border text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={16} /> Prev
                </motion.button>

                <p className="text-xs text-text-muted">Space to flip · ← → to navigate</p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={next}
                  disabled={current === cards.length - 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-btn bg-card border border-border text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
                >
                  Next <ChevronRight size={16} />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
