import { motion } from 'framer-motion'

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-bubble rounded-tl-sm bg-card border border-border w-fit">
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="block w-2 h-2 rounded-full bg-accent"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </div>
  )
}
