import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, MessageSquare, BookOpen, TrendingUp, FileText, AlertTriangle, Star, Loader2 } from 'lucide-react'
import { getInsights } from '../api'

function StatCard({ icon, label, value, color = 'text-primary' }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(124,58,237,0.15)' }}
      className="rounded-card bg-card border border-border p-4 flex flex-col gap-2"
    >
      <div className={`${color}`}>{icon}</div>
      <div className="text-2xl font-bold text-text-primary">{value ?? 0}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </motion.div>
  )
}

function TopicsBarChart({ topics }) {
  if (!topics || topics.length === 0) {
    return <p className="text-text-muted text-sm text-center py-4">No topics tracked yet</p>
  }
  const max = Math.max(...topics.map(t => t.count), 1)

  return (
    <svg viewBox={`0 0 400 ${topics.length * 36 + 16}`} className="w-full" style={{ maxHeight: '300px' }}>
      {topics.map((t, i) => {
        const barWidth = Math.max((t.count / max) * 260, 4)
        const y = i * 36 + 8
        return (
          <g key={t.topic}>
            <text x="0" y={y + 14} fill="#94A3B8" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">
              {t.topic.length > 18 ? t.topic.slice(0, 18) + '…' : t.topic}
            </text>
            <rect x="130" y={y} width={barWidth} height="22" rx="4" fill="#7C3AED" opacity="0.85">
              <animate attributeName="width" from="0" to={barWidth} dur="0.8s" fill="freeze" begin={`${i * 0.1}s`} />
            </rect>
            <text x={134 + barWidth} y={y + 15} fill="#A78BFA" fontSize="11" fontFamily="Plus Jakarta Sans, sans-serif">
              {t.count}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function ScoreBadge({ score }) {
  const pct = Math.round(score)
  const color = pct >= 80 ? 'bg-success/20 text-success border-success/30'
    : pct >= 60 ? 'bg-warning/20 text-warning border-warning/30'
    : 'bg-error/20 text-error border-error/30'
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${color}`}>{pct}%</span>
  )
}

export default function InsightsPanel() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const d = await getInsights()
        setData(d)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-error">{error}</p>
      </div>
    )
  }

  const d = data || {}

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b border-border flex-shrink-0">
        <h2 className="font-bold text-lg text-text-primary">Insights</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-6 md:space-y-8">

        {/* Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-card bg-card border border-border p-6 flex items-center gap-6"
        >
          <div className="text-5xl">🔥</div>
          <div>
            <div className="text-4xl font-extrabold text-text-primary">{d.streak ?? 0}</div>
            <div className="text-text-muted">day streak</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-sm text-text-muted">Keep it up!</div>
            <div className="text-xs text-accent">Study daily to maintain your streak</div>
          </div>
        </motion.div>

        {/* Overview Stats */}
        <section>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard icon={<MessageSquare size={20} />} label="Questions Asked" value={d.total_questions} />
            <StatCard icon={<BookOpen size={20} />} label="Quizzes Taken" value={d.quizzes_taken} color="text-accent" />
            <StatCard icon={<TrendingUp size={20} />} label="Avg Quiz Score" value={`${d.avg_quiz_score ?? 0}%`} color="text-success" />
            <StatCard icon={<FileText size={20} />} label="Documents" value={d.documents?.length ?? 0} color="text-warning" />
          </div>
        </section>

        {/* Topic Frequency */}
        <section>
          <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Topic Frequency</h3>
          <div className="rounded-card bg-card border border-border p-5">
            <TopicsBarChart topics={d.top_topics} />
          </div>
        </section>

        {/* Weak Areas */}
        {d.weak_topics && d.weak_topics.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Weak Areas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {d.weak_topics.map(t => (
                <motion.div
                  key={t.topic}
                  whileHover={{ scale: 1.01 }}
                  className="rounded-card border border-error/30 bg-error/5 p-4 flex items-center gap-4"
                >
                  <AlertTriangle size={18} className="text-error flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-text-primary font-medium truncate capitalize">{t.topic}</p>
                    <p className="text-xs text-text-muted">{t.low_confidence_count} low-confidence answers</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-error/10 text-error border border-error/20 flex-shrink-0">Review</span>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Suggested Review */}
        {d.suggested_review && d.suggested_review.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Suggested Review</h3>
            <div className="space-y-2">
              {d.suggested_review.map(s => (
                <motion.div
                  key={s.topic}
                  whileHover={{ scale: 1.01 }}
                  className="rounded-card border border-primary/20 bg-primary/5 p-4 flex items-center gap-4"
                >
                  <Star size={18} className="text-accent flex-shrink-0" />
                  <div>
                    <p className="text-text-primary font-medium capitalize">{s.topic}</p>
                    <p className="text-xs text-text-muted">{s.reason}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Quiz History */}
        {d.quiz_history && d.quiz_history.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Quiz History</h3>
            <div className="rounded-card border border-border overflow-hidden">
              {d.quiz_history.slice().reverse().map((q, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-4 py-3 ${i < d.quiz_history.length - 1 ? 'border-b border-border' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary capitalize truncate">{q.topic}</p>
                    <p className="text-xs text-text-muted">{q.date}</p>
                  </div>
                  <span className="text-xs text-text-muted">{q.correct}/{q.total}</span>
                  <ScoreBadge score={q.score} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Document Analytics */}
        {d.documents && d.documents.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Document Analytics</h3>
            <div className="rounded-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/50">
                    <th className="text-left px-4 py-3 text-text-muted font-medium">Filename</th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium">Chunks</th>
                    <th className="text-right px-4 py-3 text-text-muted font-medium hidden md:table-cell">Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {d.documents.map((doc, i) => (
                    <tr
                      key={doc.filename}
                      className={`border-b border-border last:border-0 ${i % 2 === 0 ? 'bg-transparent' : 'bg-card/30'}`}
                    >
                      <td className="px-4 py-3 text-text-primary truncate max-w-xs">{doc.filename}</td>
                      <td className="px-4 py-3 text-right text-accent">{doc.chunks}</td>
                      <td className="px-4 py-3 text-right text-text-muted hidden md:table-cell">{doc.upload_date || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Empty state */}
        {!d.total_questions && !d.quizzes_taken && (!d.documents || d.documents.length === 0) && (
          <div className="text-center py-16 text-text-muted">
            <div className="text-4xl mb-4">📊</div>
            <p className="font-medium text-text-primary mb-1">No data yet</p>
            <p className="text-sm">Upload documents and start studying to see your insights here.</p>
          </div>
        )}

      </div>
    </div>
  )
}
