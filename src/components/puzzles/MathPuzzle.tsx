import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { generateMathPuzzle, type Difficulty } from '../../services/puzzles/puzzleService'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface MathPuzzleProps {
  difficulty: Difficulty
  onSolved: () => void
}

export function MathPuzzle({ difficulty, onSolved }: MathPuzzleProps) {
  const [puzzle, setPuzzle] = useState(() => generateMathPuzzle(difficulty))
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<'idle' | 'wrong'>('idle')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const answer = Number(input.trim())
    if (answer === puzzle.answer) {
      onSolved()
    } else {
      setStatus('wrong')
      setInput('')
      setTimeout(() => {
        setPuzzle(generateMathPuzzle(difficulty))
        setStatus('idle')
      }, 1200)
    }
  }

  return (
    <motion.div
      className="card"
      style={{ padding: 24, textAlign: 'center' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Math Challenge · {difficulty}
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginBottom: 20 }}>
        {puzzle.question} = ?
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <input
          type="number"
          className="input"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Your answer"
          autoFocus
          style={{ maxWidth: 160, textAlign: 'center', fontSize: 18 }}
          aria-label="Math answer"
        />
        <button type="submit" className="btn btn-primary" disabled={!input.trim()}>Submit</button>
      </form>

      {status === 'wrong' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', justifyContent: 'center', marginTop: 12, fontSize: 14 }}
        >
          <AlertCircle size={16} /> Incorrect. Try again!
        </motion.div>
      )}
    </motion.div>
  )
}
