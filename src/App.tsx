import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { UserPrefsProvider } from './contexts/UserPrefsContext'
import { Home } from './pages/Home'
import { CreateGame } from './pages/CreateGame'
import { JoinGame } from './pages/JoinGame'
import { Lobby } from './pages/Lobby'
import { Game } from './pages/Game'
import Settings from './pages/Settings'
import History from './pages/History'
import BottomTabBar from './components/BottomTabBar'

export default function App() {
  return (
    <AuthProvider>
      <UserPrefsProvider>
        <BrowserRouter>
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
          <BottomTabBar />
        </BrowserRouter>
      </UserPrefsProvider>
    </AuthProvider>
  )
}
