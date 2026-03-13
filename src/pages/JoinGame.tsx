import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { getDoc, setDoc } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { gameRef } from '../lib/firebase'
import { saveActiveGame } from '../lib/activeGame'

export function JoinGame() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return <Navigate to="/" replace />
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 5) {
      setError('Enter a 5-character game code.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const snap = await getDoc(gameRef(trimmed))

      if (!snap.exists()) {
        setError('No game found with that code.')
        return
      }

      const game = snap.data()

      if (game.status === 'active') {
        setError('This game has already started.')
        return
      }
      if (game.status === 'ended') {
        setError('This game has ended.')
        return
      }

      // Already in the game — go straight to lobby
      if (game.players?.[user.uid]) {
        saveActiveGame(user.uid, trimmed)
        navigate(`/lobby/${trimmed}`)
        return
      }

      // Merge by map key so any valid UID works (including IDs with path-like characters).
      await setDoc(gameRef(trimmed), {
        players: {
          [user.uid]: {
            displayName: user.displayName ?? 'Player',
            photoURL: user.photoURL ?? '',
            balance: game.startingBalance,
            currentBet: 0,
            status: 'pending',
          },
        },
      }, { merge: true })

      saveActiveGame(user.uid, trimmed)
      navigate(`/lobby/${trimmed}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join game.')
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
        <h1 className="text-xl font-bold text-white">Join Game</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-safe-bottom pb-8 pb-20 max-w-sm mx-auto w-full">
        <form onSubmit={handleJoin} className="flex flex-col gap-6 w-full">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">
              Game Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))
                setError(null)
              }}
              placeholder="XXXXX"
              maxLength={5}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="bg-surface border border-surface-border rounded-2xl px-4 py-5 text-white text-center text-3xl font-bold tracking-[0.5em] focus:outline-none focus:border-accent/60 transition-colors placeholder:text-white/20 placeholder:tracking-[0.5em]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length !== 5}
            className="w-full py-4 rounded-2xl bg-accent text-black font-bold text-base disabled:opacity-40 active:bg-accent-dark transition-colors"
          >
            {loading ? 'Joining…' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  )
}
