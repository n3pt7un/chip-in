import LoadingSpinner from '../components/LoadingSpinner'
import { useEffect, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { useNavigate, useParams, Navigate } from 'react-router-dom'
import { onSnapshot, runTransaction, updateDoc, setDoc, FieldPath, serverTimestamp, Timestamp } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { db, gameRef, gameHistoryRef } from '../lib/firebase'
import { PotDisplay } from '../components/PotDisplay'
import { PlayerList } from '../components/PlayerList'
import { BetControl } from '../components/BetControl'
import { saveActiveGame, clearActiveGame } from '../lib/activeGame'
import type { GameDoc, GameHistoryEntry } from '../types'

export function Game() {
  const { user } = useAuth()
  const { gameCode } = useParams<{ gameCode: string }>()
  const navigate = useNavigate()

  const [game, setGame] = useState<GameDoc | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showTakePot, setShowTakePot] = useState(false)
  const [takingPot, setTakingPot] = useState(false)
  const [endingGame, setEndingGame] = useState(false)

  const { play } = useSound()

  // Save active game on mount so we can rejoin if app is killed
  useEffect(() => {
    if (user && gameCode) {
      saveActiveGame(user.uid, gameCode)
    }
  }, [user, gameCode])

  useEffect(() => {
    if (!gameCode) return

    const unsub = onSnapshot(gameRef(gameCode), (snap) => {
      if (!snap.exists()) {
        setNotFound(true)
        return
      }
      const data = snap.data() as GameDoc
      setGame(data)
      if (data.status === 'ended') {
        // Clear active game tracking
        if (user) {
          clearActiveGame(user.uid)

          // Write game history entry (fire-and-forget)
          if (data.players[user.uid]) {
            const entry: GameHistoryEntry = {
              gameCode: gameCode,
              endedAt: data.endedAt ?? Timestamp.now(),
              hostName: data.hostName,
              myFinalBalance: data.players[user.uid].balance,
              myStartingBalance: data.startingBalance,
              netChips: data.players[user.uid].balance - data.startingBalance,
              players: Object.fromEntries(
                Object.entries(data.players).map(([uid, p]) => [uid, {
                  displayName: p.displayName,
                  finalBalance: p.balance,
                }])
              ),
              rounds: data.round,
              ttl: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
            }
            setDoc(gameHistoryRef(user.uid, gameCode), entry).catch(console.error)
          }
        }
        navigate('/', { replace: true })
      }
    })

    return unsub
  }, [gameCode, navigate, user])

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (notFound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
        <p className="text-white/60">Game not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-accent">Go home</button>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <LoadingSpinner />
      </div>
    )
  }

  const isHost = game.hostId === user.uid
  const myPlayer = game.players[user.uid]

  if (!myPlayer || myPlayer.status !== 'approved') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 gap-4 bg-bg">
        <p className="text-text-muted">You are not part of this game.</p>
        <button onClick={() => navigate('/')} className="text-accent">Go home</button>
      </div>
    )
  }

  async function handleBet(amount: number) {
    if (!user || !gameCode) return
    await runTransaction(db, async (t) => {
      const snap = await t.get(gameRef(gameCode))
      if (!snap.exists()) throw new Error('Game not found')
      const g = snap.data() as GameDoc
      const player = g.players[user.uid]
      if (!player) throw new Error('You are not in this game')
      if (player.balance < amount) throw new Error('Not enough chips')

      t.update(
        gameRef(gameCode),
        'pot', g.pot + amount,
        new FieldPath('players', user.uid, 'balance'), player.balance - amount,
        new FieldPath('players', user.uid, 'currentBet'), player.currentBet + amount
      )
    })
    play('bet')
  }

  async function handleTakePot() {
    if (!user || !gameCode) return
    setTakingPot(true)
    try {
      await runTransaction(db, async (t) => {
        const snap = await t.get(gameRef(gameCode))
        if (!snap.exists()) throw new Error('Game not found')
        const g = snap.data() as GameDoc

        const updatedPlayers = Object.fromEntries(
          Object.entries(g.players).map(([uid, p]) => [
            uid,
            { ...p, currentBet: 0, balance: uid === user.uid ? p.balance + g.pot : p.balance },
          ])
        )

        t.update(gameRef(gameCode), {
          pot: 0,
          round: g.round + 1,
          players: updatedPlayers,
        })
      })
      play('takePot')
      setShowTakePot(false)
    } catch (e) {
      console.error('Take pot error:', e)
    } finally {
      setTakingPot(false)
    }
  }

  async function handleEndGame() {
    if (!gameCode || !isHost) return
    setEndingGame(true)
    try {
      await updateDoc(gameRef(gameCode), { status: 'ended', endedAt: serverTimestamp() })
    } catch {
      setEndingGame(false)
    }
  }

  const handleSetGameStatus = async (status: 'paused' | 'active') => {
    try {
      await updateDoc(gameRef(gameCode!), { status })
    } catch (err) {
      console.error('Failed to update game status:', err)
    }
  }

  const maxBet = myPlayer.balance

  return (
    <div className="min-h-dvh flex flex-col bg-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe-top pt-3 pb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-text-muted tracking-wider">{gameCode}</span>
        </div>
        <div className="flex items-center gap-2">
          {isHost && game.status === 'active' && (
            <button onClick={() => handleSetGameStatus('paused')} className="text-xs text-text-muted border border-surface-border px-3 py-1.5 rounded-lg cursor-pointer">
              Pause
            </button>
          )}
          {isHost && game.status === 'paused' && (
            <button onClick={() => handleSetGameStatus('active')} className="text-xs text-accent border border-accent/30 px-3 py-1.5 rounded-lg cursor-pointer">
              Resume
            </button>
          )}
          {isHost && (
            <button
              onClick={handleEndGame}
              disabled={endingGame}
              className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-semibold border border-red-500/20 active:bg-red-500/20 transition-colors"
            >
              End Game
            </button>
          )}
          <div className="flex flex-col items-end">
            <p className="text-xs font-medium text-white truncate max-w-[100px]">{myPlayer.displayName}</p>
            <p className="text-xs text-accent tabular-nums font-semibold">{myPlayer.balance.toLocaleString()} chips</p>
          </div>
        </div>
      </div>

      {/*
        Layout: portrait = vertical stack, landscape = side by side
        On landscape phones the main layout splits into left (pot + players) and right (bet control)
      */}
      <div className="flex-1 flex flex-col landscape:flex-row overflow-hidden">

        {/* Left / top panel: pot + players */}
        <div className="flex flex-col landscape:flex-1 landscape:overflow-y-auto landscape:border-r landscape:border-surface-border px-4">
          <PotDisplay pot={game.pot} round={game.round} />

          <div className="flex-1 overflow-y-auto pb-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-3">Players</h2>
            <PlayerList
              players={game.players}
              currentUserId={user.uid}
              isHost={isHost}
              gameStatus="active"
            />
          </div>
        </div>

        {/* Right / bottom panel: bet control + take pot */}
        <div className="flex-shrink-0 landscape:w-80 landscape:flex landscape:flex-col landscape:justify-center px-4 pb-safe-bottom pb-24 pt-2 landscape:pt-4 bg-bg">
          <div className="pt-6 landscape:pt-0 flex flex-col gap-3">
            <BetControl
              minBet={game.minBet}
              presets={game.presets}
              maxBet={maxBet}
              onBet={handleBet}
              disabled={maxBet <= 0 || game.status === 'paused'}
            />

            <button
              onClick={() => setShowTakePot(true)}
              disabled={game.pot === 0 || game.status === 'paused'}
              className="w-full bg-accent/15 text-accent border border-accent/40 font-bold py-4 rounded-2xl text-sm active:bg-accent/25 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              Take Pot ({game.pot.toLocaleString()})
            </button>
          </div>
        </div>
      </div>

      {/* Paused overlay for non-hosts */}
      {game.status === 'paused' && !isHost && (
        <div className="fixed inset-0 z-40 bg-bg/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <p className="text-lg font-bold">Game Paused</p>
          <p className="text-sm text-text-muted">Waiting for host to resume</p>
        </div>
      )}

      {/* Take Pot confirmation modal */}
      {showTakePot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface border border-surface-border rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4">
            <div className="text-center">
              <p className="text-lg font-bold text-white">Take the Pot?</p>
              <p className="text-sm text-text-muted mt-1">
                You'll receive{' '}
                <span className="text-accent font-semibold">{game.pot.toLocaleString()} chips</span>.
                All bets will reset.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTakePot(false)}
                className="flex-1 py-3 rounded-xl bg-surface-2 text-white/70 font-semibold border border-surface-border active:bg-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTakePot}
                disabled={takingPot}
                className="flex-1 py-3 rounded-xl bg-accent text-black font-bold active:bg-accent-dark disabled:opacity-50 transition-colors"
              >
                {takingPot ? 'Taking…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
