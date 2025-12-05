import { ReactNode } from 'react'
import MobileHeader from './MobileHeader'
import BottomNavigation from './BottomNavigation'

interface MobileLayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
}

export default function MobileLayout({ children, title, showBack = false }: MobileLayoutProps) {
  return (
    <div className="min-h-screen-dvh flex flex-col bg-background">
      {/* Mobile Header */}
      <MobileHeader title={title} showBack={showBack} />
      
      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-y-auto safe-bottom">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}

