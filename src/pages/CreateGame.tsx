import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { runTransaction, serverTimestamp, doc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../lib/firebase'
import type { GameDoc } from '../types'
import { saveActiveGame } from '../lib/activeGame'

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 5

function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

export function CreateGame() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [startingBalance, setStartingBalance] = useState(1000)
  const [minBet, setMinBet] = useState(10)
  const [presets, setPresets] = useState<[number, number, number]>([25, 50, 100])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return <Navigate to="/" replace />
  }

  function updatePreset(index: 0 | 1 | 2, value: number) {
    setPresets((prev) => {
      const next = [...prev] as [number, number, number]
      next[index] = value
      return next
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    // Validation
    if (startingBalance <= 0 || minBet <= 0) {
      setError('All values must be positive.')
      return
    }
    if (presets.some((p) => p < minBet)) {
      setError('Preset amounts must be at least the minimum bet.')
      return
    }
    if (new Set(presets).size !== 3) {
      setError('Preset amounts must be unique.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Use transaction to atomically check code uniqueness and create the game
      const code = await runTransaction(db, async (t) => {
        for (let attempt = 0; attempt < 10; attempt++) {
          const generatedCode = generateCode()
          const gameDocRef = doc(db, 'games', generatedCode)
          const snap = await t.get(gameDocRef)

          if (!snap.exists()) {
            const gameData: Omit<GameDoc, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
              hostId: user.uid,
              hostName: user.displayName ?? 'Host',
              status: 'lobby',
              startingBalance,
              minBet,
              presets,
              pot: 0,
              round: 1,
              createdAt: serverTimestamp(),
              players: {
                [user.uid]: {
                  displayName: user.displayName ?? 'Host',
                  photoURL: user.photoURL ?? '',
                  balance: startingBalance,
                  currentBet: 0,
                  status: 'approved',
                },
              },
            }
            t.set(gameDocRef, gameData)
            return generatedCode
          }
        }
        throw new Error('Failed to generate a unique game code after 10 attempts. Please try again.')
      })

      saveActiveGame(user.uid, code)
      navigate(`/lobby/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create game.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-safe-top pt-4 pb-4">
        <button
          onClick={() => navigate('/')}
          className="text-text-muted active:text-white transition-colors"
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-white">New Game</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleCreate} className="flex-1 flex flex-col px-4 gap-6 max-w-md mx-auto w-full" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
        <Section label="Starting Balance">
          <p className="text-xs text-text-muted mb-3">Chips each player starts with</p>
          <NumberInput
            value={startingBalance}
            onChange={setStartingBalance}
            min={1}
            step={50}
          />
        </Section>

        <Section label="Minimum Bet">
          <p className="text-xs text-text-muted mb-3">Smallest allowed bet (also the slider step)</p>
          <NumberInput
            value={minBet}
            onChange={setMinBet}
            min={1}
            step={5}
          />
        </Section>

        <Section label="Quick Bet Presets">
          <p className="text-xs text-text-muted mb-3">Three shortcut bet amounts</p>
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map((i) => (
              <input
                key={i}
                type="number"
                value={presets[i]}
                onChange={(e) => updatePreset(i, Number(e.target.value))}
                min={1}
                required
                className="bg-surface-2 border border-surface-border rounded-xl px-3 py-3 text-white text-center text-sm font-semibold focus:outline-none focus:border-accent/60 transition-colors"
              />
            ))}
          </div>
        </Section>

        {error && (
          <p className="text-sm text-red-400 text-center">{error}</p>
        )}

        <div className="mt-auto pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-accent text-black font-bold text-base disabled:opacity-50 active:bg-accent-dark transition-colors"
          >
            {loading ? 'Creating…' : 'Create Game'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">{label}</h2>
      {children}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  min,
  step,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  step: number
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-11 h-11 rounded-xl bg-surface-2 text-white text-xl font-bold flex items-center justify-center border border-surface-border active:bg-surface transition-colors"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value)))}
        min={min}
        required
        className="flex-1 bg-surface border border-surface-border rounded-xl px-3 py-3 text-white text-center text-lg font-semibold focus:outline-none focus:border-accent/60 transition-colors"
      />
      <button
        type="button"
        onClick={() => onChange(value + step)}
        className="w-11 h-11 rounded-xl bg-surface-2 text-white text-xl font-bold flex items-center justify-center border border-surface-border active:bg-surface transition-colors"
      >
        +
      </button>
    </div>
  )
}
