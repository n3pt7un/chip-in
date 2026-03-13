const key = (uid: string) => `chip-in:active:${uid}`

export const saveActiveGame = (uid: string, code: string): void =>
  localStorage.setItem(key(uid), code)

export const loadActiveGame = (uid: string): string | null =>
  localStorage.getItem(key(uid))

export const clearActiveGame = (uid: string): void =>
  localStorage.removeItem(key(uid))
