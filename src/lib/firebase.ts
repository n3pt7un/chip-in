import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, doc, collection } from 'firebase/firestore'

// ─────────────────────────────────────────────────────────────
// Firebase Configuration from Environment Variables
//
// How to set up:
// 1. Copy .env.example to .env.local
// 2. Fill in your Firebase project config values in .env.local
// 3. Get these values from https://console.firebase.google.com
//    Project Settings → General → Your apps → Add app (</> Web)
// 4. Also enable in Firebase console:
//    - Authentication → Sign-in method → Google
//    - Firestore Database (start in production mode)
// ─────────────────────────────────────────────────────────────

const requiredEnvVars = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Validate that all required environment variables are present
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value)
  .map(([key]) => `VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`)

if (missingVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingVars.join(', ')}\n\n` +
    'Please copy .env.example to .env.local and fill in your Firebase config values.'
  )
}

const firebaseConfig = requiredEnvVars

// Guard against double-initialization in HMR environments
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// Firestore with offline persistence (IndexedDB cache)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
})

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

/** Shorthand to get a reference to a game document by its code */
export const gameRef = (code: string) => doc(db, 'games', code)

export const userRef = (uid: string) => doc(db, 'users', uid)

export const gameHistoryRef = (uid: string, gameCode: string) =>
  doc(db, 'users', uid, 'gameHistory', gameCode)

export const gameHistoryCollectionRef = (uid: string) =>
  collection(db, 'users', uid, 'gameHistory')
