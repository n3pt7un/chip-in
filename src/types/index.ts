import type { Timestamp } from 'firebase/firestore'

export interface PlayerData {
  displayName: string
  photoURL: string
  balance: number
  currentBet: number
  status: 'pending' | 'approved'
}

export interface GameDoc {
  hostId: string
  hostName: string
  status: 'lobby' | 'active' | 'paused' | 'ended'
  startingBalance: number
  minBet: number
  presets: [number, number, number]
  pot: number
  round: number
  createdAt: Timestamp
  endedAt?: import('firebase/firestore').Timestamp
  players: Record<string, PlayerData>
}

export interface UserPrefs {
  currencySymbol: string
  soundEnabled: boolean
  displayName: string
  theme: string
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
