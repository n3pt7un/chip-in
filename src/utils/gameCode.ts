import { getDoc, doc } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'

// Excludes visually ambiguous characters: I, O, 0, 1
const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 5

function generateCode(): string {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return code
}

/**
 * Generates a unique 5-character game code that doesn't already exist in Firestore.
 * @param db - Firestore instance
 */
export async function generateUniqueCode(db: Firestore): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode()
    const snap = await getDoc(doc(db, 'games', code))
    if (!snap.exists()) return code
  }
  throw new Error('Failed to generate a unique game code after 10 attempts. Please try again.')
}
