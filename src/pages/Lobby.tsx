import { useEffect, useState } from 'react'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { onSnapshot, updateDoc, deleteField } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { gameRef } from '../lib/firebase'
import { PlayerList } from '../components/PlayerList'
import type { GameDoc } from '../types'

export function Lobby() {
  const { user } = useAuth()
  const { gameCode } = useParams<{ gameCode: string }>()
  const navigate = useNavigate()

  const [game, setGame] = useState<GameDoc | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!gameCode) return

    const unsub = onSnapshot(gameRef(gameCode), (snap) => {
      if (!snap.exists()) {
        setNotFound(true)
        return
      }
      const data = snap.data() as GameDoc
      setGame(data)

      if (data.status === 'active') {
        navigate(`/game/${gameCode}`, { replace: true })
      }
      if (data.status === 'ended') {
        navigate('/', { replace: true })
      }
    })

    return unsub
  }, [gameCode, navigate])

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (notFound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#0f1117]">
        <p className="text-white/60">Game not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-accent">Go home</button>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0f1117]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isHost = game.hostId === user.uid
  const myPlayer = game.players[user.uid]
  const players = game.players
  const approvedCount = Object.values(players).filter((p) => p.status === 'approved').length
  const canStart = isHost && approvedCount >= 2

  async function handleApprove(uid: string) {
    if (!gameCode) return
    await updateDoc(gameRef(gameCode), {
      [`players.${uid}.status`]: 'approved',
    })
  }

  async function handleStart() {
    if (!gameCode || !canStart) return
    await updateDoc(gameRef(gameCode), { status: 'active' })
  }

  async function handleLeave() {
    if (!gameCode || !user || isHost) return
    setLeaving(true)
    try {
      await updateDoc(gameRef(gameCode), {
        [`players.${user.uid}`]: deleteField(),
      })
      navigate('/')
    } catch {
      setLeaving(false)
    }
  }

  function copyCode() {
    if (!gameCode) return
    navigator.clipboard.writeText(gameCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-safe-top pt-4 pb-4">
        {!isHost && (
          <button
            onClick={() => navigate('/')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface text-white/60 active:text-white transition-colors"
            aria-label="Go back"
          >
            ←
          </button>
        )}
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Waiting Room</h1>
          <p className="text-xs text-white/40">
            {isHost ? 'Approve players and start when ready' : `Hosted by ${game.hostName}`}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col px-4 pb-8 gap-6 max-w-md mx-auto w-full overflow-y-auto">
        {/* Game code */}
        <div className="bg-surface rounded-2xl border border-white/5 p-4 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
            Share this code
          </p>
          <p className="text-4xl font-bold tracking-[0.4em] text-accent font-mono">
            {gameCode}
          </p>
          <button
            onClick={copyCode}
            className="text-xs text-white/40 active:text-accent transition-colors py-1 px-3 rounded-lg"
          >
            {copied ? '✓ Copied' : 'Tap to copy'}
          </button>
        </div>

        {/* Game settings summary */}
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Starting Balance" value={game.startingBalance.toLocaleString()} />
          <Stat label="Min Bet" value={game.minBet.toLocaleString()} />
        </div>

        {/* Players */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
            Players ({Object.keys(players).length})
          </h2>
          <PlayerList
            players={players}
            currentUserId={user.uid}
            isHost={isHost}
            gameStatus="lobby"
            onApprove={handleApprove}
          />
        </div>

        {/* Status / my status for guests */}
        {!isHost && myPlayer?.status === 'pending' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-center">
            <p className="text-sm text-yellow-300">Waiting for host to approve you…</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-3">
          {isHost ? (
            <>
              <button
                onClick={handleStart}
                disabled={!canStart}
                className="w-full py-4 rounded-2xl bg-accent text-black font-bold text-base disabled:opacity-30 active:bg-accent-dark transition-colors"
              >
                {canStart ? 'Start Game' : `Need at least 2 approved players`}
              </button>
              <p className="text-center text-xs text-white/30">
                {approvedCount} / {Object.keys(players).length} player{approvedCount !== 1 ? 's' : ''} approved
              </p>
            </>
          ) : (
            <button
              onClick={handleLeave}
              disabled={leaving}
              className="w-full py-3 rounded-2xl bg-surface text-white/60 font-semibold text-sm border border-white/10 active:bg-surface-2 transition-colors"
            >
              {leaving ? 'Leaving…' : 'Leave Game'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-xl border border-white/5 px-3 py-2.5 flex flex-col gap-0.5">
      <p className="text-xs text-white/40">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}
