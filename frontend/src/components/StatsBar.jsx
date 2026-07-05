import { useState, useEffect } from 'react'
import { Flame, MessageSquare, BookOpen } from 'lucide-react'
import { getInsights } from '../api'

export default function StatsBar() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getInsights()
      .then(d => setStats(d))
      .catch(() => {})
  }, [])

  if (!stats) return null

  return (
    <div className="flex items-center gap-4 text-xs text-text-muted">
      <span className="flex items-center gap-1">
        <Flame size={13} className="text-warning" />
        {stats.streak ?? 0} day streak
      </span>
      <span className="flex items-center gap-1">
        <MessageSquare size={13} className="text-primary" />
        {stats.total_questions ?? 0} questions
      </span>
      <span className="flex items-center gap-1">
        <BookOpen size={13} className="text-accent" />
        {stats.quizzes_taken ?? 0} quizzes
      </span>
    </div>
  )
}
