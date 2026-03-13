import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { onSnapshot, setDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { userRef } from '../lib/firebase'
import type { UserPrefs } from '../types'

const DEFAULT_PREFS: UserPrefs = {
  currencySymbol: 'chips',
  soundEnabled: false,
  displayName: '',
  theme: 'dark',
}

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
        setPrefs({ ...DEFAULT_PREFS, ...snap.data() } as UserPrefs)
      }
      setLoading(false)
    })
    return unsub
  }, [user])

  const updatePrefs = (partial: Partial<UserPrefs>) => {
    if (!user) return
    setDoc(userRef(user.uid), partial, { merge: true })
  }

  return (
    <UserPrefsContext.Provider value={{ prefs, updatePrefs, loading }}>
      {children}
    </UserPrefsContext.Provider>
  )
}
