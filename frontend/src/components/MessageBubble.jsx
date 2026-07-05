import { motion } from 'framer-motion'
import ConfidenceBadge from './ConfidenceBadge'
import { FileText } from 'lucide-react'

export default function MessageBubble({ role, content, confidence, sources }) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`max-w-xl ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div
          className={`px-4 py-3 rounded-bubble text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-primary text-white rounded-tr-sm'
              : 'bg-card border border-border text-text-primary rounded-tl-sm'
          }`}
        >
          {content}
        </div>

        {!isUser && (confidence || (sources && sources.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2">
            {confidence && <ConfidenceBadge confidence={confidence} />}
            {sources && sources.map(s => (
              <span
                key={s}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-card border border-border text-text-muted"
              >
                <FileText size={10} />
                {s.length > 20 ? s.slice(0, 20) + '…' : s}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
