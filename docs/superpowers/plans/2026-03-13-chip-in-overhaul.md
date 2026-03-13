# Chip In — Full Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the chip-in poker PWA with a Terminal Green palette, fix two BetControl bugs, add game reconnection, game history with pause/resume, and a Settings page with persistent user preferences.

**Architecture:** All state lives in Firestore; user prefs in a `users/{uid}` collection; game history in `users/{uid}/gameHistory` subcollection. New UI layer adds a bottom tab bar via React Router and a UserPrefsContext. No new backend functions — client-driven writes throughout.

**Tech Stack:** React 18, TypeScript, Vite, Firebase 10 (Firestore + Auth), Tailwind CSS v3, React Router v6, PWA/Workbox.

---

## Palette Reference (Option B — Terminal Green)

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#0A0A0A` | Page background |
| `surface` | `#141414` | Card/panel backgrounds |
| `surface-2` | `#0F1F16` | Raised within surface (inputs, buttons) |
| `accent` | `#28C76F` | Primary CTA, active states |
| `accent-dark` | `#1E9A52` | Pressed / hover |
| `text` | `#FFFFFF` | Primary text |
| `text-muted` | `#2A7A50` | Labels, secondary text |
| `surface-border` | `rgba(255,255,255,0.07)` | All borders |

---

## File Map

### Modified
- `tailwind.config.js` — new color tokens
- `src/index.css` — range slider, scrollbar, CSS vars
- `src/types/index.ts` — add `UserPrefs`, `GameHistoryEntry`, `'paused'` status
- `src/firebase.ts` — add `userRef`, `gameHistoryRef`, `gameHistoryCollectionRef`
- `firestore.rules` — add `users/{uid}` + `gameHistory` rules, pause/resume transitions
- `src/App.tsx` — add routes, `BottomTabBar`, `UserPrefsProvider`
- `src/pages/Home.tsx` — rejoin banner, simplify auth state, remove sign-out
- `src/pages/CreateGame.tsx` — save active game, palette polish
- `src/pages/JoinGame.tsx` — save active game, palette polish
- `src/pages/Lobby.tsx` — palette polish, handle `'paused'` redirect
- `src/pages/Game.tsx` — pause/resume, history write on end, palette polish
- `src/components/BetControl.tsx` — preset fix, numpad input
- `src/components/PlayerList.tsx` — flat rows, left-border highlight
- `src/components/PotDisplay.tsx` — larger text, pulse animation

### Created
- `src/lib/activeGame.ts` — localStorage helpers for reconnection
- `src/contexts/UserPrefsContext.tsx` — Firestore-backed prefs context
- `src/components/BottomTabBar.tsx` — persistent bottom navigation
- `src/pages/Settings.tsx` — user preferences page
- `src/pages/History.tsx` — game history page (with data)

---

## Chunk 1: Foundation — Palette, Types, Firebase Utils

### Task 1: Update Tailwind color tokens

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Replace the `accent`/`accent-dark`/`surface`/`surface-2` tokens with the Terminal Green palette. Full replacement:**

```js
// tailwind.config.js
colors: {
  accent: '#28C76F',
  'accent-dark': '#1E9A52',
  surface: '#141414',
  'surface-2': '#0F1F16',
  'surface-border': 'rgba(255,255,255,0.07)',
  bg: '#0A0A0A',
  text: '#FFFFFF',
  'text-muted': '#2A7A50',
  // keep existing safe-area padding utilities below
}
```

- [ ] **Verify build compiles:**
```bash
npm run build 2>&1 | tail -5
```
Expected: no errors (unused color warnings are fine).

- [ ] **Commit:**
```bash
git add tailwind.config.js
git commit -m "feat: switch to Terminal Green palette tokens"
```

---

### Task 2: Update global CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Update CSS custom property and range slider colors. Find and replace:**
  - `--bg` value → `#0A0A0A`
  - `-webkit-slider-thumb` background → `#28C76F`
  - `-moz-range-thumb` background → `#28C76F`
  - Range track fill color → `#0F1F16`
  - Scrollbar thumb → `#0F1F16`
  - Scrollbar track → `#0A0A0A`

- [ ] **Commit:**
```bash
git add src/index.css
git commit -m "feat: update CSS vars and range slider to Terminal Green"
```

---

### Task 3: Extend TypeScript types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Add to the `GameDoc.status` union:**
```ts
status: 'lobby' | 'active' | 'paused' | 'ended'
```

- [ ] **Add optional `endedAt` to `GameDoc`:**
```ts
endedAt?: import('firebase/firestore').Timestamp
```

- [ ] **Add new interfaces after the existing ones:**
```ts
export interface UserPrefs {
  currencySymbol: string   // 'chips' | '$' | '€' | custom
  soundEnabled: boolean
  displayName: string
  theme: string            // 'dark' — reserved for future
}

export interface GameHistoryEntry {
  gameCode: string
  endedAt: import('firebase/firestore').Timestamp
  hostName: string
  myFinalBalance: number
  myStartingBalance: number
  netChips: number
  players: Record<string, { displayName: string; finalBalance: number }>
  rounds: number
  ttl: import('firebase/firestore').Timestamp
}
```

- [ ] **Verify TypeScript compiles:**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: 0 errors.

- [ ] **Commit:**
```bash
git add src/types/index.ts
git commit -m "feat: add UserPrefs, GameHistoryEntry types and paused status"
```

---

### Task 4: Add Firebase reference helpers

**Files:**
- Modify: `src/firebase.ts`

- [ ] **Add after the existing `gameRef` export:**
```ts
export const userRef = (uid: string) => doc(db, 'users', uid)

export const gameHistoryRef = (uid: string, gameCode: string) =>
  doc(db, 'users', uid, 'gameHistory', gameCode)

export const gameHistoryCollectionRef = (uid: string) =>
  collection(db, 'users', uid, 'gameHistory')
```

- [ ] **Verify TypeScript compiles:**
```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Commit:**
```bash
git add src/firebase.ts
git commit -m "feat: add userRef, gameHistoryRef Firebase helpers"
```

---

### Task 5: Update Firestore security rules

**Files:**
- Modify: `firestore.rules`

- [ ] **Add `users` collection rules at the end of the `match /databases/{database}/documents` block (before the closing brace):**

```
match /users/{uid} {
  allow read, write: if request.auth != null && request.auth.uid == uid;

  match /gameHistory/{gameCode} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

- [ ] **In the existing `games/{gameCode}` rules, update `isHostUpdate` to allow pause/resume transitions and `endedAt` field. Find the `endingGame` variable and the line checking `changedKeys.hasOnly(['status'])` within it:**
  - Add two new variables alongside `endingGame`:
    ```
    let pausingGame = changedKeys.hasOnly(['status'])
      && existingData.status == 'active'
      && newData.status == 'paused';
    let resumingGame = changedKeys.hasOnly(['status'])
      && existingData.status == 'paused'
      && newData.status == 'active';
    ```
  - Update `endingGame` to also allow the `endedAt` field:
    ```
    let endingGame = (changedKeys.hasOnly(['status']) || changedKeys.hasOnly(['status', 'endedAt']))
      && newData.status == 'ended';
    ```
  - Update the `isHostUpdate` return to include new transitions:
    ```
    return isGameHost && (approvingPlayer || startingGame || pausingGame || resumingGame || endingGame);
    ```

- [ ] **Deploy rules:**
```bash
firebase deploy --only firestore:rules
```
Expected: `Deploy complete!`

- [ ] **Commit:**
```bash
git add firestore.rules
git commit -m "feat: add users collection rules and pause/resume game transitions"
```

---

## Chunk 2: Bug Fixes — BetControl

### Task 6: Fix preset rounding bug

**Files:**
- Modify: `src/components/BetControl.tsx`

- [ ] **Read the file to find exact line numbers for `setAmountClamped`:**

Read `src/components/BetControl.tsx` in full.

- [ ] **Replace the single `setAmountClamped` function with two:**
```ts
// Snaps to minBet increments — use for slider and +/- buttons
const setAmountSnapped = (v: number) =>
  setAmount(clamp(Math.round(v / effectiveMinBet) * effectiveMinBet || effectiveMinBet))

// Exact clamp — use for preset buttons and typed input
const setAmountExact = (v: number) =>
  setAmount(clamp(v))
```

- [ ] **Update all call sites:**
  - Preset button `onClick`: change `setAmountClamped(preset)` → `setAmountExact(preset)`
  - Slider `onChange`: change `setAmountClamped(Number(e.target.value))` → `setAmountSnapped(Number(e.target.value))`
  - Minus step button `onClick`: change `setAmountClamped(amount - effectiveMinBet)` → `setAmountSnapped(amount - effectiveMinBet)`
  - Plus step button `onClick`: change `setAmountClamped(amount + effectiveMinBet)` → `setAmountSnapped(amount + effectiveMinBet)`

- [ ] **Verify: start dev server and manually set minBet=10, click preset 25 — amount should display 25, not 30.**
```bash
npm run dev
```

- [ ] **Commit:**
```bash
git add src/components/BetControl.tsx
git commit -m "fix: preset buttons bypass step quantization"
```

---

### Task 7: Add tap-to-type numpad input for bet amount

**Files:**
- Modify: `src/components/BetControl.tsx`

- [ ] **Add two new state variables inside the component (after existing state):**
```ts
const [isEditing, setIsEditing] = useState(false)
const [rawInput, setRawInput] = useState('')
```

- [ ] **Add three new handler functions (after `setAmountExact`):**
```ts
const handleAmountTap = () => {
  if (!canAffordMinBet) return
  setRawInput(String(amount))
  setIsEditing(true)
}

const handleRawInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setRawInput(e.target.value)
}

const commitRawInput = () => {
  const parsed = parseInt(rawInput, 10)
  if (!isNaN(parsed)) setAmountExact(parsed)
  setIsEditing(false)
}

const handleRawInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') commitRawInput()
}
```

- [ ] **Find the static `<p>` that displays the bet amount and replace it with a conditional render:**
```tsx
{isEditing ? (
  <input
    type="tel"
    inputMode="numeric"
    pattern="[0-9]*"
    value={rawInput}
    onChange={handleRawInputChange}
    onBlur={commitRawInput}
    onKeyDown={handleRawInputKeyDown}
    autoFocus
    aria-label="Enter bet amount"
    className="text-center text-2xl font-bold text-white tabular-nums bg-transparent border-b border-accent outline-none w-full"
  />
) : (
  <p
    onClick={handleAmountTap}
    role="button"
    tabIndex={0}
    onKeyDown={e => (e.key === ' ' || e.key === 'Enter') && handleAmountTap()}
    className="text-center text-2xl font-bold text-white tabular-nums cursor-pointer underline decoration-dotted decoration-white/20"
  >
    {amount}
  </p>
)}
```

- [ ] **Verify: tap the amount display on mobile dev tools emulator — numeric keyboard should appear. Entering 75 with minBet=10 should produce 75 (no rounding).**

- [ ] **Commit:**
```bash
git add src/components/BetControl.tsx
git commit -m "feat: tap bet amount to type custom value via numpad"
```

---

## Chunk 3: Game Reconnection

### Task 8: Create localStorage active game utility

**Files:**
- Create: `src/lib/activeGame.ts`

- [ ] **Create the file:**
```ts
const key = (uid: string) => `chip-in:active:${uid}`

export const saveActiveGame = (uid: string, code: string): void =>
  localStorage.setItem(key(uid), code)

export const loadActiveGame = (uid: string): string | null =>
  localStorage.getItem(key(uid))

export const clearActiveGame = (uid: string): void =>
  localStorage.removeItem(key(uid))
```

- [ ] **Commit:**
```bash
git add src/lib/activeGame.ts
git commit -m "feat: localStorage helpers for active game persistence"
```

---

### Task 9: Persist game code on create and join

**Files:**
- Modify: `src/pages/CreateGame.tsx`
- Modify: `src/pages/JoinGame.tsx`

- [ ] **In `CreateGame.tsx`, import `saveActiveGame` and call it before navigating:**
```ts
import { saveActiveGame } from '../lib/activeGame'
// after navigate(`/lobby/${code}`) call:
saveActiveGame(user.uid, code)
```

- [ ] **In `JoinGame.tsx`, import and call in both navigate paths (joining as new player and already-joined path):**
```ts
import { saveActiveGame } from '../lib/activeGame'
// before each navigate(`/lobby/${trimmed}`) call:
saveActiveGame(user.uid, trimmed)
```

- [ ] **Also in `JoinGame.tsx`, import `clearActiveGame` and call on leave:**
```ts
import { clearActiveGame } from '../lib/activeGame'
// in handleLeave success path before navigate('/'):
clearActiveGame(user.uid)
```

- [ ] **Commit:**
```bash
git add src/pages/CreateGame.tsx src/pages/JoinGame.tsx
git commit -m "feat: persist active game code to localStorage on create/join"
```

---

### Task 10: Save/clear code from Lobby and Game

**Files:**
- Modify: `src/pages/Lobby.tsx`
- Modify: `src/pages/Game.tsx`

- [ ] **In `Lobby.tsx`:**
  - Import `saveActiveGame` and `clearActiveGame`
  - In the `onSnapshot` handler, when game doc is found and status is `'lobby'` or `'active'`, call `saveActiveGame(user.uid, gameCode)`
  - When status is `'ended'`, call `clearActiveGame(user.uid)` before navigating
  - In `handleLeave`, call `clearActiveGame(user.uid)` before navigating

- [ ] **In `Game.tsx`:**
  - Import `saveActiveGame` and `clearActiveGame`
  - Add a `useEffect` that calls `saveActiveGame(user.uid, gameCode)` once when the component mounts (with `user` and `gameCode` as deps, but only run once)
  - In the `onSnapshot` handler, when `data.status === 'ended'`, call `clearActiveGame(user.uid)` before navigating

- [ ] **Commit:**
```bash
git add src/pages/Lobby.tsx src/pages/Game.tsx
git commit -m "feat: save/clear active game code from Lobby and Game pages"
```

---

### Task 11: Add rejoin banner on Home page

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Import needed items:**
```ts
import { loadActiveGame, clearActiveGame } from '../lib/activeGame'
import { getDoc } from 'firebase/firestore'
import { gameRef } from '../firebase'
```

- [ ] **Add state for rejoin detection (inside the component, after existing state):**
```ts
const [rejoinState, setRejoinState] = useState<{ code: string; route: string } | null>(null)
const [rejoinChecking, setRejoinChecking] = useState(false)
```

- [ ] **Add a `useEffect` that runs after auth resolves:**
```ts
useEffect(() => {
  if (!user) return
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
```

- [ ] **Add the rejoin banner in the authenticated JSX, above the Start/Join buttons:**
```tsx
{rejoinChecking && (
  <div className="w-full h-14 bg-surface rounded-2xl animate-pulse" />
)}
{!rejoinChecking && rejoinState && (
  <div className="w-full flex items-center justify-between bg-surface-2 border border-surface-border rounded-2xl px-4 py-3">
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
```

- [ ] **Verify: start a game in one tab, refresh Home in another tab logged in as the same user — the rejoin banner should appear.**

- [ ] **Commit:**
```bash
git add src/pages/Home.tsx
git commit -m "feat: show rejoin banner on Home when user has an active game"
```

---

## Chunk 4: UI Redesign

### Task 12: Create UserPrefsContext

**Files:**
- Create: `src/contexts/UserPrefsContext.tsx`

- [ ] **Create the context file:**
```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onSnapshot, setDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { userRef } from '../firebase'
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
```

- [ ] **Commit:**
```bash
git add src/contexts/UserPrefsContext.tsx
git commit -m "feat: UserPrefsContext with Firestore-backed persistent preferences"
```

---

### Task 13: Create BottomTabBar component

**Files:**
- Create: `src/components/BottomTabBar.tsx`

- [ ] **Create the component:**
```tsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const tabs = [
  {
    label: 'Game',
    route: '/',
    activeOn: ['/', '/create', '/join'],
    activeOnPrefix: '/game/',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="18" rx="3"/>
        <path d="M8 12h8M12 8v8"/>
      </svg>
    ),
  },
  {
    label: 'History',
    route: '/history',
    activeOn: ['/history'],
    activeOnPrefix: null,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 7v5l3 3"/>
      </svg>
    ),
  },
  {
    label: 'Settings',
    route: '/settings',
    activeOn: ['/settings'],
    activeOnPrefix: null,
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
  },
]

export default function BottomTabBar() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) return null
  if (location.pathname.startsWith('/lobby/')) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-surface-border pb-safe-bottom">
      <div className="flex h-16">
        {tabs.map(tab => {
          const active =
            tab.activeOn.includes(location.pathname) ||
            (tab.activeOnPrefix != null && location.pathname.startsWith(tab.activeOnPrefix))
          return (
            <button
              key={tab.route}
              onClick={() => navigate(tab.route)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors duration-150 ${
                active ? 'text-accent' : 'text-text-muted'
              }`}
            >
              {tab.icon(active)}
              <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Commit:**
```bash
git add src/components/BottomTabBar.tsx
git commit -m "feat: BottomTabBar with Game/History/Settings tabs"
```

---

### Task 14: Create Settings page

**Files:**
- Create: `src/pages/Settings.tsx`

- [ ] **Create the page:**
```tsx
import { useAuth } from '../contexts/AuthContext'
import { useUserPrefs } from '../contexts/UserPrefsContext'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

const CURRENCY_OPTIONS = ['chips', '$', '€']

export default function Settings() {
  const { user } = useAuth()
  const { prefs, updatePrefs, loading } = useUserPrefs()

  if (!user) return null

  return (
    <div className="min-h-dvh bg-bg text-white">
      <div className="max-w-sm mx-auto px-4 pt-safe-top pb-24">
        <h1 className="text-2xl font-bold pt-8 pb-6">Settings</h1>

        {/* Identity */}
        <section className="mb-8">
          <div className="flex items-center gap-3 py-4 border-b border-surface-border">
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
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
```

- [ ] **Commit:**
```bash
git add src/pages/Settings.tsx
git commit -m "feat: Settings page with currency picker, display name, sign-out"
```

---

### Task 15: Create History page

**Files:**
- Create: `src/pages/History.tsx`

- [ ] **Create the page with data loading from Firestore:**
```tsx
import { useEffect, useState } from 'react'
import { onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { gameHistoryCollectionRef } from '../firebase'
import type { GameHistoryEntry } from '../types'

function formatDate(ts: GameHistoryEntry['endedAt']): string {
  return new Date(ts.seconds * 1000).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
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
      setLoading(false)
    })
    return unsub
  }, [user])

  if (!user) return null

  return (
    <div className="min-h-dvh bg-bg text-white">
      <div className="max-w-sm mx-auto px-4 pt-safe-top pb-24">
        <h1 className="text-2xl font-bold pt-8 pb-6">History</h1>

        {loading && (
          <div className="flex justify-center pt-20">
            <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center pt-24 gap-3">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2A7A50" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>
            </svg>
            <p className="text-base font-semibold">No games yet</p>
            <p className="text-sm text-text-muted text-center">Your completed games will appear here</p>
          </div>
        )}

        {!loading && entries.length > 0 && (
          <div className="space-y-0">
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
                      <p className="text-xs text-text-muted">{formatDate(entry.endedAt)} · {entry.rounds} rounds · {Object.keys(entry.players).length} players</p>
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
```

- [ ] **Commit:**
```bash
git add src/pages/History.tsx
git commit -m "feat: History page with game entries from Firestore"
```

---

### Task 16: Wire App.tsx — routes, providers, tab bar

**Files:**
- Modify: `src/App.tsx`

- [ ] **Read the current App.tsx in full first.**

- [ ] **Add imports:**
```tsx
import { UserPrefsProvider } from './contexts/UserPrefsContext'
import BottomTabBar from './components/BottomTabBar'
import Settings from './pages/Settings'
import History from './pages/History'
```

- [ ] **Wrap the existing `<AuthProvider>` children with `<UserPrefsProvider>`:**
```tsx
<AuthProvider>
  <UserPrefsProvider>
    <BrowserRouter>
      {/* existing routes */}
      <BottomTabBar />
    </BrowserRouter>
  </UserPrefsProvider>
</AuthProvider>
```

- [ ] **Add the two new routes inside `<Routes>`:**
```tsx
<Route path="/settings" element={<Settings />} />
<Route path="/history" element={<History />} />
```

- [ ] **Verify the app builds:**
```bash
npm run build 2>&1 | tail -10
```

- [ ] **Commit:**
```bash
git add src/App.tsx
git commit -m "feat: add Settings/History routes, BottomTabBar, UserPrefsProvider"
```

---

### Task 17: Redesign Home page

**Files:**
- Modify: `src/pages/Home.tsx`

- [ ] **Authenticated state changes:**
  - Remove the user info card (photo, name, email row) — that info lives in Settings now
  - Remove the standalone sign-out button — sign-out is in Settings
  - Keep the spade logo mark and "chip in" heading
  - Add `pb-24` to the outer container to clear the tab bar
  - Update "Start Game" button: `bg-accent text-black` (viridian, black text for contrast)
  - Update "Join Game" button: `border border-surface-border text-white`
  - Replace any `bg-[#0f1117]` with `bg-bg`

- [ ] **Unauthenticated state changes:**
  - Replace the spade icon container (bordered circle) with a bare large spade character in `text-accent`
  - Add `pb-24` to outer container

- [ ] **Commit:**
```bash
git add src/pages/Home.tsx
git commit -m "feat: simplify Home page, remove user card, add tab bar clearance"
```

---

### Task 18: Polish Create, Join, and Lobby pages

**Files:**
- Modify: `src/pages/CreateGame.tsx`
- Modify: `src/pages/JoinGame.tsx`
- Modify: `src/pages/Lobby.tsx`

- [ ] **CreateGame.tsx:**
  - Replace `bg-[#0f1117]` → `bg-bg`
  - Add `pb-20 pb-safe-bottom` to the outer scroll container
  - Input borders: `border-white/10` → `border-surface-border`
  - Back button: remove `bg-surface` wrapper, style as bare `text-text-muted` arrow

- [ ] **JoinGame.tsx:**
  - Same palette replacements as CreateGame

- [ ] **Lobby.tsx:**
  - Replace `bg-[#0f1117]` → `bg-bg`
  - Game code block: remove filled `bg-surface` background, use more vertical padding (`py-8`), code in `text-accent`
  - Stat rows: replace `bg-surface border border-white/5 rounded-xl` → borderless with `border-b border-surface-border`
  - Section labels `text-white/40` → `text-text-muted`
  - Add `pb-20` to outer container

- [ ] **Commit:**
```bash
git add src/pages/CreateGame.tsx src/pages/JoinGame.tsx src/pages/Lobby.tsx
git commit -m "feat: palette and spacing polish on Create, Join, and Lobby pages"
```

---

### Task 19: Redesign Game page

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Global replacements in the file:**
  - `bg-[#0f1117]` → `bg-bg`
  - `border-white/5` and `border-white/10` → `border-surface-border`

- [ ] **Header:**
  - Add `pb-3` vertical breathing room
  - Game code: `text-text-muted/50` (softer)

- [ ] **Bottom panel:**
  - Remove `border-t border-white/5` horizontal rule, replace with `pt-6` spacing

- [ ] **Take Pot button — make more prominent:**
  - Change from `bg-surface text-accent border border-accent/30` → `bg-accent/15 text-accent border border-accent/40 font-bold py-4`

- [ ] **Modal:**
  - `border-white/10` → `border-surface-border`

- [ ] **Add `pb-24` to the portrait-mode bottom panel to clear tab bar.**

- [ ] **Commit:**
```bash
git add src/pages/Game.tsx
git commit -m "feat: Game page redesign — breathing room, stronger Take Pot, palette"
```

---

### Task 20: Redesign components — PlayerList, PotDisplay, BetControl styling

**Files:**
- Modify: `src/components/PlayerList.tsx`
- Modify: `src/components/PotDisplay.tsx`
- Modify: `src/components/BetControl.tsx`

- [ ] **PlayerList.tsx — flat rows:**
  - Remove `rounded-xl bg-surface border border-white/5` from non-current-user rows → add `border-b border-surface-border` only
  - Current user highlight: replace `bg-accent/10 border border-accent/30 rounded-xl` → `border-l-2 border-accent pl-3` (no background)
  - Remove `gap-2` between rows → `gap-0`
  - `text-white/40` labels → `text-text-muted`

- [ ] **PotDisplay.tsx — larger and animated:**
  - Pot number: `text-5xl` → `text-6xl font-bold`
  - Add 10px more vertical padding
  - Add pulse animation on value change using `useEffect`:
    ```tsx
    const [pulse, setPulse] = useState(false)
    const prevPot = useRef(pot)
    useEffect(() => {
      if (pot !== prevPot.current) {
        setPulse(true)
        prevPot.current = pot
        setTimeout(() => setPulse(false), 200)
      }
    }, [pot])
    // Add class: pulse ? 'scale-105' : 'scale-100' with transition-transform duration-200
    ```

- [ ] **BetControl.tsx — styling only (logic already done in Tasks 6-7):**
  - Preset buttons border: `border-white/10` → `border-surface-border`
  - Active preset: `bg-accent text-black` → `bg-accent text-black font-bold` (accent is bright enough for black text)
  - Step buttons border: `border-white/10` → `border-surface-border`
  - Place Bet button text: `Bet {amount}` → `Place Bet · {amount}`

- [ ] **Commit:**
```bash
git add src/components/PlayerList.tsx src/components/PotDisplay.tsx src/components/BetControl.tsx
git commit -m "feat: flat player rows, larger pot display with pulse, bet control polish"
```

---

## Chunk 5: Game History & Pause/Resume

### Task 21: Write game history entry on game end

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Import new helpers:**
```ts
import { setDoc } from 'firebase/firestore'
import { gameHistoryRef } from '../firebase'
import type { GameHistoryEntry } from '../types'
import { Timestamp } from 'firebase/firestore'
```

- [ ] **In the `onSnapshot` handler, when `data.status === 'ended'`, before navigating, write the history entry:**
```ts
if (user && data.players[user.uid]) {
  const entry: GameHistoryEntry = {
    gameCode,
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
  // fire-and-forget — don't await, just write
  setDoc(gameHistoryRef(user.uid, gameCode), entry).catch(console.error)
}
```

- [ ] **In `handleEndGame`, also set `endedAt: serverTimestamp()` alongside `status: 'ended'`:**
```ts
import { serverTimestamp } from 'firebase/firestore'
// in updateDoc call:
await updateDoc(gameRef(gameCode), { status: 'ended', endedAt: serverTimestamp() })
```

- [ ] **Verify: end a game, navigate to History tab — the entry should appear.**

- [ ] **Commit:**
```bash
git add src/pages/Game.tsx
git commit -m "feat: write game history entry to Firestore when game ends"
```

---

### Task 22: Add pause/resume to Game page

**Files:**
- Modify: `src/pages/Game.tsx`

- [ ] **Add `handlePauseGame` function (mirrors `handleEndGame` pattern):**
```ts
const handlePauseGame = async () => {
  try {
    await updateDoc(gameRef(gameCode), { status: 'paused' })
  } catch (err) {
    console.error('Failed to pause game:', err)
  }
}

const handleResumeGame = async () => {
  try {
    await updateDoc(gameRef(gameCode), { status: 'active' })
  } catch (err) {
    console.error('Failed to resume game:', err)
  }
}
```

- [ ] **In the header (host controls area), add Pause/Resume alongside End Game:**
```tsx
{isHost && game.status === 'active' && (
  <button onClick={handlePauseGame} className="text-xs text-text-muted border border-surface-border px-3 py-1.5 rounded-lg cursor-pointer">
    Pause
  </button>
)}
{isHost && game.status === 'paused' && (
  <button onClick={handleResumeGame} className="text-xs text-accent border border-accent/30 px-3 py-1.5 rounded-lg cursor-pointer">
    Resume
  </button>
)}
```

- [ ] **Add a paused overlay that non-hosts see when `game.status === 'paused'`:**
```tsx
{game.status === 'paused' && !isHost && (
  <div className="fixed inset-0 z-40 bg-bg/90 flex flex-col items-center justify-center gap-3">
    <p className="text-lg font-bold">Game Paused</p>
    <p className="text-sm text-text-muted">Waiting for host to resume</p>
  </div>
)}
```

- [ ] **Disable BetControl and Take Pot button when paused:**
  - Pass `disabled={game.status === 'paused'}` to `<BetControl>`
  - Add `|| game.status === 'paused'` to the Take Pot button's disabled condition

- [ ] **Update Lobby.tsx to handle `'paused'` status in the `onSnapshot`:**
  - When `data.status === 'paused'`, redirect to `/game/${gameCode}` (same as `'active'`)

- [ ] **Commit:**
```bash
git add src/pages/Game.tsx src/pages/Lobby.tsx
git commit -m "feat: host can pause/resume game; non-hosts see pause overlay"
```

---

## Final Verification

- [ ] **Full build passes:**
```bash
npm run build 2>&1 | tail -10
```
Expected: `✓ built in` with no errors.

- [ ] **TypeScript clean:**
```bash
npx tsc --noEmit 2>&1
```
Expected: 0 errors.

- [ ] **Manual smoke test on mobile (iOS Safari or Chrome DevTools mobile emulation):**
  1. Create game → lobby → start game
  2. Refresh mid-game → rejoin banner appears on Home → tap Rejoin → lands in game
  3. Tap bet amount → numpad appears → type 75 → blurs → amount shows 75
  4. Click preset 25 with minBet=10 → amount shows 25 (not 30)
  5. End game → navigate to History tab → entry visible with net chips
  6. Settings tab → change currency to $ → visible immediately
  7. Pause game as host → non-host sees pause overlay → resume → game active

- [ ] **Deploy:**
```bash
firebase deploy
```
