import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const { user, loading, signIn, signOut } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0f1117]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#0f1117]">
        <div className="flex flex-col items-center gap-8 w-full max-w-sm">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-surface border-2 border-accent/30 flex items-center justify-center">
              <span className="text-3xl">♠</span>
            </div>
            <h1 className="text-3xl font-bold text-white">chip in</h1>
            <p className="text-sm text-white/40 text-center">
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
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[#0f1117]">
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-surface border-2 border-accent/30 flex items-center justify-center">
            <span className="text-3xl">♠</span>
          </div>
          <h1 className="text-3xl font-bold text-white">chip in</h1>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 bg-surface rounded-2xl w-full border border-white/5">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-10 h-10 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-accent font-bold">
              {user.displayName?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
        </div>

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
            className="w-full py-4 rounded-2xl bg-surface text-white font-semibold text-base border border-white/10 active:bg-surface-2 transition-colors"
          >
            Join Game
          </button>
        </div>

        <button
          onClick={signOut}
          className="text-sm text-white/30 active:text-white/60 transition-colors"
        >
          Sign out
        </button>
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
