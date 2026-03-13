import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDoc } from 'firebase/firestore'
import { gameRef } from '../lib/firebase'
import { loadActiveGame, clearActiveGame } from '../lib/activeGame'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()

  const [rejoinState, setRejoinState] = useState<{ code: string; route: string } | null>(null)
  const [rejoinChecking, setRejoinChecking] = useState(false)

  useEffect(() => {
    if (!user) {
      setRejoinState(null)
      return
    }
    const code = loadActiveGame(user.uid)
    if (!code) return

    setRejoinChecking(true)
    getDoc(gameRef(code)).then(snap => {
      if (!snap.exists()) {
        clearActiveGame(user.uid)
        return
      }
      const data = snap.data()
      if (data.status === 'ended' || !data.players?.[user.uid]) {
        clearActiveGame(user.uid)
        return
      }
      const route = data.status === 'active' || data.status === 'paused'
        ? `/game/${code}`
        : `/lobby/${code}`
      setRejoinState({ code, route })
    }).finally(() => setRejoinChecking(false))
  }, [user])

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-bg">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg">
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-accent text-5xl">♠</span>
            <h1 className="text-4xl font-bold text-white">chip in</h1>
            <p className="text-sm text-text-muted text-center">
              Virtual poker chips for your home games
            </p>
          </div>

          {/* Sign in */}
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-white text-gray-900 font-semibold text-base transition-opacity active:opacity-80"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-bg pb-24">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-accent/30 flex items-center justify-center">
            <span className="text-3xl">♠</span>
          </div>
          <h1 className="text-3xl font-bold text-white">chip in</h1>
        </div>

        {/* Rejoin banner */}
        {rejoinChecking && (
          <div className="w-full h-14 bg-surface rounded-2xl animate-pulse mb-3" />
        )}
        {!rejoinChecking && rejoinState && (
          <div className="w-full flex items-center justify-between bg-surface-2 border border-surface-border rounded-2xl px-4 py-3 mb-3">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-widest">Active game</p>
              <p className="text-sm font-mono font-bold text-white">{rejoinState.code}</p>
            </div>
            <button
              onClick={() => navigate(rejoinState.route)}
              className="bg-accent text-black text-sm font-bold px-4 py-2 rounded-xl cursor-pointer"
            >
              Rejoin
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => navigate('/create')}
            className="w-full py-4 rounded-2xl bg-accent text-black font-bold text-base active:bg-accent-dark transition-colors"
          >
            Start Game
          </button>
          <button
            onClick={() => navigate('/join')}
            className="w-full py-4 rounded-2xl border border-surface-border text-white font-semibold text-base active:bg-surface-2 transition-colors"
          >
            Join Game
          </button>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  )
}
