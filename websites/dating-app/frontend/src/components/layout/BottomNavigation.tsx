import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

const navItems = [
  { path: '/discovery', icon: '🔍', label: 'Discover' },
  { path: '/matches', icon: '💕', label: 'Matches' },
  { path: '/messages', icon: '💬', label: 'Messages' },
  { path: '/profile', icon: '👤', label: 'Profile' },
]

export default function BottomNavigation() {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors',
                'min-w-[60px]',
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )
            }
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

