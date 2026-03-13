import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Home } from './pages/Home'
import { CreateGame } from './pages/CreateGame'
import { JoinGame } from './pages/JoinGame'
import { Lobby } from './pages/Lobby'
import { Game } from './pages/Game'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateGame />} />
          <Route path="/join" element={<JoinGame />} />
          <Route path="/lobby/:gameCode" element={<Lobby />} />
          <Route path="/game/:gameCode" element={<Game />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
