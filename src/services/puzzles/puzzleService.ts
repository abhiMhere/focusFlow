// Math puzzle generator
export interface MathPuzzle {
  question: string
  answer: number
}

export type Difficulty = 'easy' | 'medium' | 'hard'

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateMathPuzzle(difficulty: Difficulty): MathPuzzle {
  const ops = difficulty === 'easy' ? ['+', '-'] :
               difficulty === 'medium' ? ['+', '-', '×'] :
               ['+', '-', '×', '÷']

  const op = ops[rng(0, ops.length - 1)]
  let a: number, b: number, answer: number, question: string

  switch (op) {
    case '+':
      a = rng(difficulty === 'easy' ? 1 : difficulty === 'medium' ? 10 : 50,
              difficulty === 'easy' ? 20 : difficulty === 'medium' ? 99 : 999)
      b = rng(difficulty === 'easy' ? 1 : difficulty === 'medium' ? 10 : 50,
              difficulty === 'easy' ? 20 : difficulty === 'medium' ? 99 : 999)
      answer = a + b
      question = `${a} + ${b}`
      break
    case '-':
      a = rng(difficulty === 'easy' ? 5 : 20, difficulty === 'easy' ? 30 : 200)
      b = rng(1, a)
      answer = a - b
      question = `${a} − ${b}`
      break
    case '×':
      a = rng(difficulty === 'medium' ? 2 : 6, difficulty === 'medium' ? 12 : 25)
      b = rng(difficulty === 'medium' ? 2 : 6, difficulty === 'medium' ? 12 : 25)
      answer = a * b
      question = `${a} × ${b}`
      break
    case '÷':
      b = rng(2, 12)
      answer = rng(2, 20)
      a = b * answer
      question = `${a} ÷ ${b}`
      break
    default:
      answer = 0; question = '0 + 0'
  }

  return { question, answer }
}

// Word search generator
const WORD_LISTS: Record<Difficulty, string[]> = {
  easy: ['CAT', 'DOG', 'SUN', 'RUN', 'FUN', 'MAP', 'HAT', 'BIG', 'RED', 'CUP'],
  medium: ['FOCUS', 'BRAIN', 'TASKS', 'GOALS', 'DAILY', 'LEARN', 'SLEEP', 'GROW'],
  hard: ['PRODUCTIVE', 'MINDFUL', 'RESILIENT', 'CREATIVE', 'DISCIPLINE', 'MOMENTUM'],
}

export interface WordSearchGrid {
  grid: string[][]
  words: string[]
  size: number
}

export function generateWordSearch(difficulty: Difficulty): WordSearchGrid {
  const wordPool = [...WORD_LISTS[difficulty]]
  const size = difficulty === 'easy' ? 8 : difficulty === 'medium' ? 10 : 12
  const maxWords = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 5 : 4

  // Pick random words that fit
  const words: string[] = []
  const shuffled = wordPool.sort(() => Math.random() - 0.5)
  for (const w of shuffled) {
    if (w.length <= size && words.length < maxWords) words.push(w)
  }

  // Initialize grid with empty cells
  const grid: string[][] = Array.from({ length: size }, () => Array(size).fill(''))

  // Place each word
  const placed: string[] = []
  for (const word of words) {
    if (placeWord(grid, word, size)) placed.push(word)
  }

  // Fill remaining cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (let r = 0; r < size; r++)
    for (let c = 0; c < size; c++)
      if (!grid[r][c]) grid[r][c] = alphabet[Math.floor(Math.random() * 26)]

  return { grid, words: placed, size }
}

function placeWord(grid: string[][], word: string, size: number): boolean {
  const directions = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // diagonal down-right
  ]

  for (let attempt = 0; attempt < 50; attempt++) {
    const [dr, dc] = directions[Math.floor(Math.random() * directions.length)]
    const maxR = dr === 0 ? size - 1 : size - word.length
    const maxC = dc === 0 ? size - 1 : size - word.length
    if (maxR < 0 || maxC < 0) continue
    const r = Math.floor(Math.random() * (maxR + 1))
    const c = Math.floor(Math.random() * (maxC + 1))

    // Check if placement is valid
    let ok = true
    for (let i = 0; i < word.length; i++) {
      const nr = r + dr * i, nc = c + dc * i
      if (grid[nr][nc] && grid[nr][nc] !== word[i]) { ok = false; break }
    }

    if (ok) {
      for (let i = 0; i < word.length; i++)
        grid[r + dr * i][c + dc * i] = word[i]
      return true
    }
  }
  return false
}

export interface WordPosition {
  word: string
  cells: [number, number][]
}

export function findWordInGrid(
  grid: string[][],
  word: string,
  selected: [number, number][]
): boolean {
  if (selected.length !== word.length) return false
  return selected.every(([r, c], i) => grid[r]?.[c] === word[i])
}

export function getWordPositions(grid: string[][], words: string[]): WordPosition[] {
  const result: WordPosition[] = []
  const size = grid.length
  const directions = [[0, 1], [1, 0], [1, 1]]

  for (const word of words) {
    outer: for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        for (const [dr, dc] of directions) {
          const cells: [number, number][] = []
          let ok = true
          for (let i = 0; i < word.length; i++) {
            const nr = r + dr * i, nc = c + dc * i
            if (nr >= size || nc >= size || grid[nr][nc] !== word[i]) { ok = false; break }
            cells.push([nr, nc])
          }
          if (ok) { result.push({ word, cells }); break outer }
        }
      }
    }
  }
  return result
}
