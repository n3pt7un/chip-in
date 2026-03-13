import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, doc } from 'firebase/firestore'

// ─────────────────────────────────────────────────────────────
// TODO: Replace with your Firebase project config.
//
// How to get this:
// 1. Go to https://console.firebase.google.com
// 2. Create a project (or open an existing one)
// 3. Project Settings → General → Your apps → Add app (</> Web)
// 4. Copy the firebaseConfig object and paste it below
// 5. In the Firebase console, also enable:
//    - Authentication → Sign-in method → Google
//    - Firestore Database (start in production mode)
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
}

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
