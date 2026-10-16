// Audio manager – handles timer sounds and ambient audio
// All audio is created via Web Audio API oscillators or <audio> elements.
// No copyrighted content is bundled; placeholders degrade gracefully.

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

// Generate a pleasant completion chime using Web Audio API oscillators
export function playCompletionChime(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()

    const frequencies = [523.25, 659.25, 783.99, 1046.5] // C5-E5-G5-C6
    const now = ctx.currentTime

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0, now + i * 0.18)
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.18 + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.18 + 0.6)

      osc.start(now + i * 0.18)
      osc.stop(now + i * 0.18 + 0.7)
    })
  } catch (e) {
    console.warn('Audio playback failed:', e)
  }
}

// A subtle single tick sound
export function playTick(): void {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.value = 1200
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.06)
  } catch { /* ignore */ }
}

// Alarm buzzer – ascending alert pattern
export function playAlarmBuzzer(): () => void {
  let stopped = false
  let timeout: ReturnType<typeof setTimeout>

  function buzz() {
    if (stopped) return
    try {
      const ctx = getAudioContext()
      if (ctx.state === 'suspended') ctx.resume()
      const freqs = [440, 550, 440, 550, 660]
      const now = ctx.currentTime
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sawtooth'
        osc.frequency.value = f
        gain.gain.setValueAtTime(0.3, now + i * 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.12)
        osc.start(now + i * 0.15)
        osc.stop(now + i * 0.15 + 0.13)
      })
    } catch { /* ignore */ }
    timeout = setTimeout(buzz, 1500)
  }

  buzz()
  return () => {
    stopped = true
    clearTimeout(timeout)
  }
}

// ── Ambient audio using oscillator nodes ──────────────
let ambientNodes: OscillatorNode[] = []
let ambientGain: GainNode | null = null

export function playAmbient(type: 'rain' | 'cafe' | 'nature', volume = 0.3): void {
  stopAmbient()
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') ctx.resume()
    ambientGain = ctx.createGain()
    ambientGain.gain.value = volume
    ambientGain.connect(ctx.destination)

    // Create pink-noise-like sound using multiple oscillators with slight detuning
    const baseFreqs: Record<string, number[]> = {
      rain:   [180, 200, 350, 600, 900, 1400],
      cafe:   [100, 200, 400, 600],
      nature: [200, 320, 500, 800, 1200],
    }

    ;(baseFreqs[type] || baseFreqs.rain).forEach(freq => {
      const osc = ctx.createOscillator()
      const g2 = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = freq + (Math.random() * 20 - 10)
      g2.gain.value = 0.015
      osc.connect(g2)
      g2.connect(ambientGain!)
      osc.start()
      ambientNodes.push(osc)
    })
  } catch (e) {
    console.warn('Ambient audio failed:', e)
  }
}

export function stopAmbient(): void {
  ambientNodes.forEach(o => { try { o.stop() } catch { } })
  ambientNodes = []
  if (ambientGain) {
    ambientGain.disconnect()
    ambientGain = null
  }
}

export function setAmbientVolume(volume: number): void {
  if (ambientGain) ambientGain.gain.value = volume
}

export function isAmbientPlaying(): boolean {
  return ambientNodes.length > 0
}

export function resumeAudioContext(): void {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => { })
  }
}
