import { useAuth } from '../contexts/AuthContext'
import { useUserPrefs } from '../contexts/UserPrefsContext'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { THEMES } from '../lib/themes'

const CURRENCY_OPTIONS = ['chips', '$', '€']

export default function Settings() {
  const { user } = useAuth()
  const { prefs, updatePrefs } = useUserPrefs()

  if (!user) return null

  return (
    <div className="min-h-dvh bg-bg text-white">
      <div className="max-w-sm mx-auto px-4 pt-safe-top pb-24">
        <h1 className="text-2xl font-bold pt-8 pb-6">Settings</h1>

        {/* Identity */}
        <section className="mb-8">
          <div className="flex items-center gap-3 py-4 border-b border-surface-border">
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName ?? 'Profile'} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{user.displayName}</p>
              <p className="text-sm text-text-muted truncate">{user.email}</p>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Preferences</p>

          {/* Currency symbol */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-2">Currency Display</p>
            <div className="flex gap-2">
              {CURRENCY_OPTIONS.map(sym => (
                <button
                  key={sym}
                  onClick={() => updatePrefs({ currencySymbol: sym })}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-colors duration-150 ${
                    prefs.currencySymbol === sym
                      ? 'bg-accent/15 text-accent border-accent/40'
                      : 'bg-surface border-surface-border text-text-muted'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="mb-6">
            <p className="text-sm font-medium mb-3">Theme</p>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => updatePrefs({ theme: theme.id })}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors duration-150 ${
                    prefs.theme === theme.id || (!prefs.theme && theme.id === 'terminal')
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-surface-border bg-surface'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: theme.accent }}
                  />
                  <span className="text-sm font-medium">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Display name */}
          <div className="mb-6">
            <label htmlFor="displayName" className="text-sm font-medium block mb-2">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              defaultValue={prefs.displayName || user.displayName || ''}
              onBlur={e => updatePrefs({ displayName: e.target.value })}
              className="w-full bg-surface border border-surface-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-accent/50 transition-colors"
              placeholder="Your name in games"
            />
          </div>

          {/* Sound (placeholder) */}
          <div className="flex items-center justify-between py-4 border-b border-surface-border opacity-40">
            <div>
              <p className="text-sm font-medium">Sound Effects</p>
              <p className="text-xs text-text-muted">Coming soon</p>
            </div>
            <div className="w-10 h-6 bg-surface-2 rounded-full border border-surface-border" />
          </div>
        </section>

        {/* App section */}
        <section className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">App</p>
          <div className="flex justify-between py-3 border-b border-surface-border">
            <span className="text-sm text-text-muted">Version</span>
            <span className="text-sm">1.0.0</span>
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={() => signOut(auth)}
          className="w-full py-3 rounded-xl border border-surface-border text-sm font-medium text-text-muted cursor-pointer hover:text-white hover:border-white/20 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
