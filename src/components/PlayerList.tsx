import type { PlayerData } from '../types'

interface PlayerListProps {
  players: Record<string, PlayerData>
  currentUserId: string
  isHost: boolean
  gameStatus: 'lobby' | 'active' | 'ended'
  onApprove?: (uid: string) => void
}

export function PlayerList({
  players,
  currentUserId,
  isHost,
  gameStatus,
  onApprove,
}: PlayerListProps) {
  const entries = Object.entries(players)

  // In lobby: show pending players first (they need action), then approved
  // In game: current user first, then by name
  const sorted = [...entries].sort(([aId, a], [bId, b]) => {
    if (gameStatus === 'lobby') {
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
    } else {
      if (aId === currentUserId) return -1
      if (bId === currentUserId) return 1
    }
    return a.displayName.localeCompare(b.displayName)
  })

  return (
    <div className="flex flex-col gap-0 w-full">
      {sorted.map(([uid, player]) => (
        <PlayerRow
          key={uid}
          uid={uid}
          player={player}
          isCurrentUser={uid === currentUserId}
          isHost={isHost}
          gameStatus={gameStatus}
          onApprove={onApprove}
        />
      ))}
    </div>
  )
}

interface PlayerRowProps {
  uid: string
  player: PlayerData
  isCurrentUser: boolean
  isHost: boolean
  gameStatus: 'lobby' | 'active' | 'ended'
  onApprove?: (uid: string) => void
}

function PlayerRow({
  uid,
  player,
  isCurrentUser,
  isHost,
  gameStatus,
  onApprove,
}: PlayerRowProps) {
  const isPending = player.status === 'pending'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        isCurrentUser
          ? 'border-b border-surface-border border-l-2 border-l-accent pl-3'
          : 'border-b border-surface-border'
      }`}
    >
      {/* Avatar */}
      {player.photoURL ? (
        <img
          src={player.photoURL}
          alt={player.displayName}
          className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-9 h-9 rounded-full flex-shrink-0 bg-surface-2 flex items-center justify-center text-sm font-semibold text-accent">
          {player.displayName.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isCurrentUser ? 'text-accent' : 'text-white'}`}>
          {player.displayName}
          {isCurrentUser && ' (you)'}
        </p>
        {gameStatus === 'lobby' && (
          <p className={`text-xs mt-0.5 ${isPending ? 'text-yellow-400' : 'text-text-muted'}`}>
            {isPending ? 'Waiting for approval' : 'Approved'}
          </p>
        )}
      </div>

      {/* Game mode: balance + current bet */}
      {gameStatus === 'active' && (
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-white tabular-nums">
            {player.balance.toLocaleString()}
          </p>
          {player.currentBet > 0 && (
            <p className="text-xs text-accent tabular-nums">
              bet {player.currentBet.toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Lobby mode: host approve button */}
      {gameStatus === 'lobby' && isHost && isPending && onApprove && (
        <button
          onClick={() => onApprove(uid)}
          className="ml-2 px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-semibold flex-shrink-0 active:bg-accent-dark transition-colors"
        >
          Approve
        </button>
      )}
    </div>
  )
}
