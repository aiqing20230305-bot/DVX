import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar.js'
import { useUIStore } from '../../store/ui.store.js'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()
  const [animateKey, setAnimateKey] = useState(0)

  // Trigger page transition animation on route change
  useEffect(() => {
    setAnimateKey(prev => prev + 1)
  }, [location.pathname])

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleResize = () => {
      // Auto-collapse on mobile
      if (window.innerWidth < 768 && !sidebarCollapsed) {
        toggleSidebar()
      }
    }

    // Check on mount
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />

      <main className="flex-1 overflow-y-auto min-w-0">
        <div key={animateKey} className="min-h-full animate-page-enter">
          {children}
        </div>
      </main>
    </div>
  )
}
