import { useCallback, useRef } from 'react'
import { useUserPrefs } from '../contexts/UserPrefsContext'

type SoundType = 'bet' | 'takePot' | 'error'

function createAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    return new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  } catch {
    return null
  }
}

function playChipSound(ctx: AudioContext, time: number = 0) {
  // Short percussive click — like a chip landing on felt
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(800, ctx.currentTime + time)
  oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + time + 0.06)

  gainNode.gain.setValueAtTime(0, ctx.currentTime + time)
  gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + time + 0.005)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + time + 0.08)

  oscillator.start(ctx.currentTime + time)
  oscillator.stop(ctx.currentTime + time + 0.1)
}

function playPotSound(ctx: AudioContext) {
  // Multiple chip sounds cascading — like chips being swept into a pot
  const delays = [0, 0.05, 0.1, 0.15, 0.2, 0.25]
  delays.forEach(delay => playChipSound(ctx, delay))

  // Add a low resonant thud at the end
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(120, ctx.currentTime + 0.3)
  osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6)
  gain.gain.setValueAtTime(0.0, ctx.currentTime + 0.28)
  gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.32)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
  osc.start(ctx.currentTime + 0.28)
  osc.stop(ctx.currentTime + 0.8)
}

function playErrorSound(ctx: AudioContext) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(300, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.25)
}

export function useSound() {
  const { prefs } = useUserPrefs()
  const ctxRef = useRef<AudioContext | null>(null)

  const play = useCallback((sound: SoundType) => {
    if (!prefs.soundEnabled) return

    // Lazily create AudioContext on first user interaction
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext()
    }
    const ctx = ctxRef.current
    if (!ctx) return

    // Resume context if suspended (browser autoplay policy)
    const resume = ctx.state === 'suspended' ? ctx.resume() : Promise.resolve()
    resume.then(() => {
      switch (sound) {
        case 'bet': playChipSound(ctx); break
        case 'takePot': playPotSound(ctx); break
        case 'error': playErrorSound(ctx); break
      }
    }).catch(() => {})
  }, [prefs.soundEnabled])

  return { play }
}
