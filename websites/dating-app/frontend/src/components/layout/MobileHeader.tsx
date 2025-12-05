import { useLocation, useNavigate } from 'react-router-dom'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
}

export default function MobileHeader({ title, showBack = false }: MobileHeaderProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const getTitle = () => {
    if (title) return title
    
    switch (location.pathname) {
      case '/discovery':
        return 'Discover'
      case '/matches':
        return 'Matches'
      case '/messages':
        return 'Messages'
      case '/profile':
        return 'Profile'
      default:
        return 'Dating App'
    }
  }
  
  return (
    <header className="mobile-header safe-top">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-gray-900">{getTitle()}</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications icon */}
          <button className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.21 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
