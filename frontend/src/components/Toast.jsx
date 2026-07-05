import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={16} className="text-success" />,
  error: <XCircle size={16} className="text-error" />,
  warning: <AlertCircle size={16} className="text-warning" />,
}

export default function Toast({ id, message, type = 'success', onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 80 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-3 px-4 py-3 rounded-card bg-card border border-border shadow-xl min-w-72 max-w-sm"
    >
      {icons[type]}
      <span className="flex-1 text-sm text-text-primary">{message}</span>
      <button
        onClick={() => onRemove(id)}
        className="text-text-muted hover:text-text-primary transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
