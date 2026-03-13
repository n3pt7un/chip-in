import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function BottomTabBar() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  if (!user) return null
  if (location.pathname.startsWith('/lobby/')) return null

  const tabs = [
    {
      label: 'Game',
      route: '/',
      active:
        location.pathname === '/' ||
        location.pathname === '/create' ||
        location.pathname === '/join' ||
        location.pathname.startsWith('/game/'),
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="3"/>
          <path d="M8 12h8M12 8v8"/>
        </svg>
      ),
    },
    {
      label: 'History',
      route: '/history',
      active: location.pathname === '/history',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9"/>
          <path d="M12 7v5l3 3"/>
        </svg>
      ),
    },
    {
      label: 'Settings',
      route: '/settings',
      active: location.pathname === '/settings',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-surface-border pb-safe-bottom">
      <div className="flex h-16">
        {tabs.map(tab => (
          <button
            key={tab.route}
            onClick={() => navigate(tab.route)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors duration-150 ${
              tab.active ? 'text-accent' : 'text-text-muted'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
