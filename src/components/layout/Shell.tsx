import React, { useEffect } from 'react'
import { Sidebar } from './Sidebar.js'
import { useUIStore } from '../../store/ui.store.js'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

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
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
