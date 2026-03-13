import LoadingSpinner from '../components/LoadingSpinner'
import { useEffect, useState } from 'react'
import { onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { gameHistoryCollectionRef } from '../lib/firebase'
import type { GameHistoryEntry } from '../types'

function formatDate(ts: GameHistoryEntry['endedAt']): string {
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function History() {
  const { user } = useAuth()
  const [entries, setEntries] = useState<GameHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const q = query(gameHistoryCollectionRef(user.uid), orderBy('endedAt', 'desc'), limit(30))
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => d.data() as GameHistoryEntry))
      if (loading) setLoading(false)
    })
    return unsub
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null

  return (
    <div className="min-h-dvh bg-bg text-white">
      <div className="max-w-sm mx-auto px-4 pt-safe-top pb-24">
        <h1 className="text-2xl font-bold pt-8 pb-6">History</h1>

        {loading && (
          <div className="flex justify-center pt-20">
            <LoadingSpinner size="sm" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-24 gap-3 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2A7A50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <path d="M12 7v5l3 3"/>
            </svg>
            <p className="text-base font-semibold">No games yet</p>
            <p className="text-sm text-text-muted">Your completed games will appear here</p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div>
            {entries.map(entry => {
              const isPos = entry.netChips >= 0
              const isOpen = expanded === entry.gameCode
              return (
                <div key={entry.gameCode} className="border-b border-surface-border">
                  <button
                    onClick={() => setExpanded(isOpen ? null : entry.gameCode)}
                    className="w-full flex items-center justify-between py-4 cursor-pointer"
                  >
                    <div className="text-left">
                      <p className="font-mono text-sm font-bold text-white">{entry.gameCode}</p>
                      <p className="text-xs text-text-muted">
                        {formatDate(entry.endedAt)} · {entry.rounds} rounds · {Object.keys(entry.players).length} players
                      </p>
                    </div>
                    <span className={`text-sm font-bold tabular-nums ${isPos ? 'text-accent' : 'text-red-400'}`}>
                      {isPos ? '+' : ''}{entry.netChips}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="pb-4 space-y-2">
                      {Object.entries(entry.players)
                        .sort((a, b) => b[1].finalBalance - a[1].finalBalance)
                        .map(([uid, p]) => (
                          <div key={uid} className="flex justify-between text-sm px-1">
                            <span className="text-text-muted">{p.displayName}</span>
                            <span className="font-semibold tabular-nums">{p.finalBalance}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
