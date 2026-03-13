import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { UserPrefsProvider } from './contexts/UserPrefsContext'
import { Home } from './pages/Home'
import BottomTabBar from './components/BottomTabBar'
import LoadingSpinner from './components/LoadingSpinner'

const CreateGame = lazy(() => import('./pages/CreateGame').then(m => ({ default: m.CreateGame })))
const JoinGame = lazy(() => import('./pages/JoinGame').then(m => ({ default: m.JoinGame })))
const Lobby = lazy(() => import('./pages/Lobby').then(m => ({ default: m.Lobby })))
const Game = lazy(() => import('./pages/Game').then(m => ({ default: m.Game })))
const Settings = lazy(() => import('./pages/Settings'))
const History = lazy(() => import('./pages/History'))

function PageLoader() {
  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center">
      <LoadingSpinner size="sm" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <UserPrefsProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateGame />} />
              <Route path="/join" element={<JoinGame />} />
              <Route path="/lobby/:gameCode" element={<Lobby />} />
              <Route path="/game/:gameCode" element={<Game />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/history" element={<History />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <BottomTabBar />
        </BrowserRouter>
      </UserPrefsProvider>
    </AuthProvider>
  )
}
