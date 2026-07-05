import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FolderOpen, X, RefreshCw } from 'lucide-react'
import { getDocuments, deleteDocument } from '../api'

export default function DocumentList({ refreshKey, addToast }) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)

  async function fetchDocs() {
    setLoading(true)
    try {
      const data = await getDocuments()
      setDocs(data.documents || [])
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [refreshKey])

  async function handleDelete(filename) {
    if (!confirm(`Delete "${filename}"?`)) return
    try {
      await deleteDocument(filename)
      setDocs(prev => prev.filter(d => d.filename !== filename))
      addToast(`Deleted ${filename}`, 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  return (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Your Documents</p>
        <button onClick={fetchDocs} className="text-text-muted hover:text-text-primary transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {docs.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-2">No documents uploaded yet</p>
      ) : (
        <div className="space-y-1">
          {docs.map((doc, i) => (
            <motion.div
              key={doc.filename}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-2 px-2 py-2 rounded-btn hover:bg-card group transition-colors"
            >
              <FolderOpen size={13} className="text-primary flex-shrink-0" />
              <span className="flex-1 text-xs text-text-primary truncate" title={doc.filename}>
                {doc.filename.length > 20 ? doc.filename.slice(0, 20) + '…' : doc.filename}
              </span>
              <span className="text-xs text-text-muted bg-border/50 px-1.5 py-0.5 rounded-full">{doc.chunk_count}</span>
              <button
                onClick={() => handleDelete(doc.filename)}
                className="text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
