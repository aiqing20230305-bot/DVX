import React from 'react'
import { Sidebar } from './Sidebar.js'
import { useUIStore } from '../../store/ui.store.js'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const { sidebarCollapsed } = useUIStore()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
