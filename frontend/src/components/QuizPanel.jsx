import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { generateQuiz, saveQuizScore } from '../api'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']
const COUNTS = [3, 5, 10]

export default function QuizPanel() {
  const [step, setStep] = useState('setup')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('Medium')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [quizTopic, setQuizTopic] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})

  async function handleGenerate() {
    if (!topic.trim()) { setError('Please enter a topic'); return }
    setError('')
    setLoading(true)
    try {
      const data = await generateQuiz(topic, difficulty.toLowerCase(), count)
      if (!data.questions || data.questions.length === 0) {
        setError('No questions generated. Try a different topic.')
        return
      }
      setQuestions(data.questions)
      setQuizTopic(topic)
      setCurrent(0)
      setAnswers({})
      setStep('quiz')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(qi, optIdx) {
    if (answers[qi] !== undefined) return
    setAnswers(prev => ({ ...prev, [qi]: optIdx }))
  }

  async function handleFinish() {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length
    const score = Math.round((correct / questions.length) * 100)
    try { await saveQuizScore(quizTopic, score, correct, questions.length) } catch {}
    setStep('results')
  }

  function handleRetry() {
    setCurrent(0)
    setAnswers({})
    setStep('setup')
  }

  const q = questions[current]
  const totalAnswered = Object.keys(answers).length
  const correct = questions.filter((qu, i) => answers[i] === qu.correct).length

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
        <h2 className="font-bold text-lg text-text-primary">Quiz</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6">
        <AnimatePresence mode="wait">

          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Topic</label>
                <input
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate()}
                  placeholder="e.g., Photosynthesis, World War II, React Hooks..."
                  className="w-full px-4 py-3 rounded-btn bg-card border border-border text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Difficulty</label>
                <div className="flex gap-2">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${
                        difficulty === d ? 'bg-primary text-white' : 'bg-card border border-border text-text-muted hover:text-text-primary'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Number of Questions</label>
                <div className="flex gap-2">
                  {COUNTS.map(c => (
                    <button
                      key={c}
                      onClick={() => setCount(c)}
                      className={`flex-1 py-2 rounded-btn text-sm font-medium transition-all ${
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
                {loading ? <><Loader2 size={18} className="animate-spin" /> Generating...</> : <><BookOpen size={18} /> Generate Quiz</>}
              </motion.button>
            </motion.div>
          )}

          {step === 'quiz' && q && (
            <motion.div key={`quiz-${current}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-muted">Question {current + 1} of {questions.length}</span>
                <div className="w-32 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
                </div>
              </div>

              <div className="rounded-card bg-card border border-border p-6 mb-4">
                <p className="text-text-primary font-semibold mb-4">{q.question}</p>
                <div className="space-y-2">
                  {q.options.map((opt, i) => {
                    const selected = answers[current] === i
                    const answered = answers[current] !== undefined
                    const isCorrect = i === q.correct
                    let cls = 'bg-card border border-border text-text-primary hover:border-primary/50'
                    if (answered) {
                      if (isCorrect) cls = 'bg-success/10 border-success text-success'
                      else if (selected) cls = 'bg-error/10 border-error text-error'
                      else cls = 'bg-card border border-border text-text-muted opacity-50'
                    }
                    return (
                      <motion.button
                        key={i}
                        whileHover={!answered ? { scale: 1.01 } : {}}
                        whileTap={!answered ? { scale: 0.99 } : {}}
                        onClick={() => handleAnswer(current, i)}
                        className={`w-full text-left px-4 py-3 rounded-btn text-sm transition-all flex items-center gap-3 ${cls}`}
                      >
                        <span className="flex-1">{opt}</span>
                        {answered && isCorrect && <CheckCircle size={16} className="text-success flex-shrink-0" />}
                        {answered && selected && !isCorrect && <XCircle size={16} className="text-error flex-shrink-0" />}
                      </motion.button>
                    )
                  })}
                </div>

                {answers[current] !== undefined && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-btn bg-card border border-border text-sm text-text-muted">
                    <span className="text-accent font-medium">Explanation: </span>{q.explanation}
                  </motion.div>
                )}
              </div>

              {answers[current] !== undefined && (
                current < questions.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrent(c => c + 1)}
                    className="w-full py-3 rounded-btn bg-primary hover:bg-primary-hover text-white font-semibold"
                  >
                    Next →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFinish}
                    className="w-full py-3 rounded-btn bg-success hover:bg-success/80 text-white font-semibold"
                  >
                    See Results
                  </motion.button>
                )
              )}
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto">
              <div className="rounded-card bg-card border border-border p-8 text-center mb-6">
                <div className="text-5xl mb-3">{correct / questions.length >= 0.8 ? '🎉' : correct / questions.length >= 0.6 ? '👍' : '📚'}</div>
                <h3 className="text-2xl font-bold text-text-primary mb-1">You got {correct}/{questions.length} correct!</h3>
                <p className="text-text-muted mb-4">{Math.round((correct / questions.length) * 100)}%</p>
                <div className="w-full h-3 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      correct / questions.length >= 0.8 ? 'bg-success' : correct / questions.length >= 0.6 ? 'bg-warning' : 'bg-error'
                    }`}
                    style={{ width: `${(correct / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {questions.map((q, i) => {
                  const isCorrect = answers[i] === q.correct
                  return (
                    <div key={i} className={`rounded-btn border p-3 text-sm ${isCorrect ? 'border-success/30 bg-success/5' : 'border-error/30 bg-error/5'}`}>
                      <div className="flex items-start gap-2">
                        {isCorrect ? <CheckCircle size={14} className="text-success mt-0.5 flex-shrink-0" /> : <XCircle size={14} className="text-error mt-0.5 flex-shrink-0" />}
                        <p className="text-text-primary">{q.question}</p>
                      </div>
                      {!isCorrect && <p className="text-text-muted text-xs mt-1 pl-5">Correct: {q.options[q.correct]}</p>}
                    </div>
                  )
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRetry}
                className="w-full py-3 rounded-btn bg-primary hover:bg-primary-hover text-white font-semibold flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} /> Try Again
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
