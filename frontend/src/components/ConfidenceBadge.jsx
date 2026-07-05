export default function ConfidenceBadge({ confidence }) {
  const config = {
    high: { label: 'High', dot: 'bg-success', text: 'text-success' },
    medium: { label: 'Medium', dot: 'bg-warning', text: 'text-warning' },
    low: { label: 'Low', dot: 'bg-error', text: 'text-error' },
  }
  const c = config[confidence] || config.medium

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-card border border-border ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label} confidence
    </span>
  )
}
