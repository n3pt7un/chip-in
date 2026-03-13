# chip in

A real-time virtual poker chip tracker PWA for home games. No physical chips needed — share a code, track bets and balances live on everyone's phone.

## Features

- Google sign-in via Firebase Auth
- Create a game with custom starting balance, minimum bet, and quick-bet presets
- Share a 5-character code for friends to join
- Host approves players in the lobby before starting
- Live pot and balance tracking across all devices
- Bet using preset buttons or a precision slider
- Take the pot with one tap — balances update instantly on all phones
- Installable PWA — works offline, adds to home screen
- Landscape and portrait layouts

---

## Setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**, give it a name, and follow the prompts
3. Once created, go to **Build → Firestore Database**
   - Click **Create database** → choose **Production mode** → select a region
4. Go to **Build → Authentication → Sign-in method**
   - Enable **Google** as a provider
5. Go to **Project Settings → General → Your apps**
   - Click **Add app** → choose the **Web** icon (`</>`)
   - Register the app (you can skip Firebase Hosting for now)
   - Copy the `firebaseConfig` object

### 2. Add your Firebase config

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your Firebase project values:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

> **Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 3. Deploy Firestore security rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules
```

### 4. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Build & Deploy

```bash
npm run build
firebase deploy --only hosting
```

This deploys the PWA to Firebase Hosting (free tier is sufficient for home games).

---

## How to play

1. **Host**: Open the app → Sign in → **Start Game**
   - Set starting balance, minimum bet, and 3 quick-bet amounts
   - Share the 5-character code with friends
2. **Players**: Open the app on their phones → **Join Game** → enter the code
3. **Host**: Approve each player in the lobby → tap **Start Game**
4. **Everyone**: Place bets using the preset buttons or slider
5. **Winner** (real-life): tap **Take Pot** and confirm to collect all chips
6. Rounds continue until the host ends the game

---

## Stack

- React 18 + Vite + TypeScript
- Tailwind CSS v3 (dark theme, gold accent)
- Firebase v10 — Auth (Google) + Firestore (real-time)
- vite-plugin-pwa — Workbox service worker, installable manifest
- React Router v6
