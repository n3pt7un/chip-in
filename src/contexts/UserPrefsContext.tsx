import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { onSnapshot, setDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { userRef } from '../lib/firebase'
import type { UserPrefs } from '../types'
import { applyTheme, getTheme, DEFAULT_THEME_ID } from '../lib/themes'

const DEFAULT_PREFS: UserPrefs = {
  currencySymbol: 'chips',
  soundEnabled: false,
  displayName: '',
  theme: DEFAULT_THEME_ID,
}

// Apply on module load so the default theme is present before first render
applyTheme(getTheme(DEFAULT_THEME_ID))

interface UserPrefsContextValue {
  prefs: UserPrefs
  updatePrefs: (partial: Partial<UserPrefs>) => void
  loading: boolean
}

const UserPrefsContext = createContext<UserPrefsContextValue>({
  prefs: DEFAULT_PREFS,
  updatePrefs: () => {},
  loading: false,
})

export const useUserPrefs = () => useContext(UserPrefsContext)

export function UserPrefsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(false)
  const appliedThemeRef = useRef(DEFAULT_THEME_ID)

  useEffect(() => {
    if (!user) {
      setPrefs(DEFAULT_PREFS)
      return
    }
    setLoading(true)
    const ref = userRef(user.uid)
    const unsub = onSnapshot(ref, snap => {
      if (!snap.exists()) {
        setDoc(ref, { ...DEFAULT_PREFS, displayName: user.displayName ?? '' }, { merge: true })
      } else {
        const newPrefs = { ...DEFAULT_PREFS, ...snap.data() } as UserPrefs
        setPrefs(newPrefs)
        const themeId = newPrefs.theme || DEFAULT_THEME_ID
        if (themeId !== appliedThemeRef.current) {
          applyTheme(getTheme(themeId))
          appliedThemeRef.current = themeId
        }
      }
      setLoading(false)
    })
    return unsub
  }, [user])

  const updatePrefs = (partial: Partial<UserPrefs>) => {
    if (!user) return
    if (partial.theme && partial.theme !== appliedThemeRef.current) {
      applyTheme(getTheme(partial.theme))
      appliedThemeRef.current = partial.theme
    }
    setDoc(userRef(user.uid), partial, { merge: true })
  }

  return (
    <UserPrefsContext.Provider value={{ prefs, updatePrefs, loading }}>
      {children}
    </UserPrefsContext.Provider>
  )
}
