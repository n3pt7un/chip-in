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
  status: 'lobby' | 'active' | 'ended'
  startingBalance: number
  minBet: number
  presets: [number, number, number]
  pot: number
  round: number
  createdAt: Timestamp
  players: Record<string, PlayerData>
}
