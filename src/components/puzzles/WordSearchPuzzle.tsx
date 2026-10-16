import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  generateWordSearch, getWordPositions, type Difficulty, type WordSearchGrid
} from '../../services/puzzles/puzzleService'
import { CheckCircle2 } from 'lucide-react'

interface WordSearchPuzzleProps {
  difficulty: Difficulty
  onSolved: () => void
}

export function WordSearchPuzzle({ difficulty, onSolved }: WordSearchPuzzleProps) {
  const [puzzle, setPuzzle] = useState<WordSearchGrid>(() => generateWordSearch(difficulty))
  const [selecting, setSelecting] = useState<[number, number][]>([])
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set())
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set())

  const wordPositions = getWordPositions(puzzle.grid, puzzle.words)

  const cellKey = (r: number, c: number) => `${r},${c}`

  const handleCellMouseDown = (r: number, c: number) => {
    setIsMouseDown(true)
    setSelecting([[r, c]])
  }

  const handleCellMouseEnter = (r: number, c: number) => {
    if (!isMouseDown) return
    // Only allow straight lines
    setSelecting(prev => {
      if (prev.length === 0) return [[r, c]]
      const [sr, sc] = prev[0]
      const dr = Math.sign(r - sr)
      const dc = Math.sign(c - sc)
      const dist = Math.max(Math.abs(r - sr), Math.abs(c - sc))
      const cells: [number, number][] = []
      for (let i = 0; i <= dist; i++) {
        cells.push([sr + dr * i, sc + dc * i])
      }
      return cells
    })
  }

  const handleMouseUp = useCallback(() => {
    if (!isMouseDown) return
    setIsMouseDown(false)
    // Check if selection matches any word
    const selectedLetters = selecting.map(([r, c]) => puzzle.grid[r]?.[c] ?? '').join('')
    const match = puzzle.words.find(w =>
      !foundWords.has(w) && (w === selectedLetters || w === selectedLetters.split('').reverse().join(''))
    )
    if (match) {
      const newFound = new Set([...foundWords, match])
      const newFoundCells = new Set([...foundCells, ...selecting.map(([r,c]) => cellKey(r,c))])
      setFoundWords(newFound)
      setFoundCells(newFoundCells)
      if (newFound.size === puzzle.words.length) {
        setTimeout(onSolved, 500)
      }
    }
    setSelecting([])
  }, [isMouseDown, selecting, puzzle, foundWords, foundCells, onSolved])

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseUp])

  const isSelected = (r: number, c: number) => selecting.some(([sr, sc]) => sr === r && sc === c)
  const isFound = (r: number, c: number) => foundCells.has(cellKey(r, c))

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isMouseDown) return
    const touch = e.touches[0]
    if (!touch) return
    const elem = document.elementFromPoint(touch.clientX, touch.clientY)
    if (!elem) return
    const rAttr = elem.getAttribute('data-row')
    const cAttr = elem.getAttribute('data-col')
    if (rAttr !== null && cAttr !== null) {
      const r = parseInt(rAttr, 10)
      const c = parseInt(cAttr, 10)
      setSelecting(prev => {
        if (prev.length === 0) return [[r, c]]
        const [sr, sc] = prev[0]
        const dr = Math.sign(r - sr)
        const dc = Math.sign(c - sc)
        const dist = Math.max(Math.abs(r - sr), Math.abs(c - sc))
        const cells: [number, number][] = []
        for (let i = 0; i <= dist; i++) {
          cells.push([sr + dr * i, sc + dc * i])
        }
        return cells
      })
    }
  }

  return (
    <motion.div
      className="card"
      style={{ padding: 20, userSelect: 'none', touchAction: 'none' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Word Search · {difficulty}
      </div>

      {/* Word list */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {puzzle.words.map(word => (
          <span
            key={word}
            style={{
              fontSize: 13, fontFamily: 'var(--font-mono)', fontWeight: 600,
              padding: '2px 10px', borderRadius: 999,
              background: foundWords.has(word) ? 'var(--accent)' : 'var(--bg-secondary)',
              color: foundWords.has(word) ? 'white' : 'var(--text-primary)',
              textDecoration: foundWords.has(word) ? 'line-through' : 'none',
              display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            {foundWords.has(word) && <CheckCircle2 size={11} />}
            {word}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${puzzle.size}, auto)`,
          gap: 3,
          width: 'fit-content',
          margin: '0 auto'
        }}
        role="grid"
        aria-label="Word search grid"
      >
        {puzzle.grid.map((row, r) =>
          row.map((letter, c) => (
            <div
              key={`${r}-${c}`}
              data-row={r}
              data-col={c}
              className={`ws-cell ${isSelected(r, c) ? 'selected' : ''} ${isFound(r, c) ? 'found' : ''}`}
              onMouseDown={() => handleCellMouseDown(r, c)}
              onMouseEnter={() => handleCellMouseEnter(r, c)}
              onTouchStart={() => handleCellMouseDown(r, c)}
              role="gridcell"
              aria-label={`Row ${r + 1}, Column ${c + 1}: ${letter}`}
            >
              {letter}
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>
        {foundWords.size}/{puzzle.words.length} words found
      </div>
    </motion.div>
  )
}
