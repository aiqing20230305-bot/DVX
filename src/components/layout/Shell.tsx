import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar.js'
import { useUIStore } from '../../store/ui.store.js'
import { FeedbackButton } from '../shared/FeedbackButton.js'
// v2.11.0 Phase 4: Language Switcher
import { LanguageSwitcher } from '../shared/LanguageSwitcher.js'
// v2.15.0 Phase 2.1: Keyboard Help Modal
import { KeyboardHelpModal } from '../shared/KeyboardHelpModal.js'
// v2.24.0 Phase 1.2: Notification Badge
import { NotificationBadge } from '../shared/NotificationBadge.js'
// v2.25.0 Phase 1: Comment Search Modal
import { CommentSearchModal } from '../shared/CommentSearchModal.js'
import { Search } from 'lucide-react'

interface ShellProps {
  children: React.ReactNode
}

export function Shell({ children }: ShellProps) {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const location = useLocation()
  const [animateKey, setAnimateKey] = useState(0)
  // v2.15.0 Phase 2.1: Keyboard help modal state
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  // v2.25.0 Phase 1: Comment search modal state
  const [showCommentSearch, setShowCommentSearch] = useState(false)

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

  // v2.15.0 Phase 2.1 + v2.25.0 Phase 1: Global keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      const isContentEditable = target.contentEditable === 'true'

      // v2.25.0: Cmd/Ctrl + K for comment search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowCommentSearch(true)
        return
      }

      // v2.15.0: ? key for keyboard help (only if not in input)
      if (e.key === '?' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        if (!isInput && !isContentEditable) {
          e.preventDefault()
          setShowKeyboardHelp(true)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      {/* v2.10.0 Phase 4.4: Skip to main content link */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-[9999] focus:px-4 focus:py-3 focus:rounded-md focus:m-2 focus:font-medium transition-all duration-200"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#FFFFFF'
        }}
      >
        跳转到主内容
      </a>

      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
          onClick={toggleSidebar}
        />
      )}

      <Sidebar />

      <main id="main-content" className="flex-1 overflow-y-auto min-w-0 flex flex-col">
        {/* v2.11.0 Phase 4 + v2.24.0 Phase 1.2 + v2.25.0 Phase 1: Top bar with search, notification, and language switcher */}
        <div
          className="sticky top-0 z-30 flex justify-end items-center gap-2 px-6 py-3"
          style={{
            backgroundColor: 'var(--color-bg-elevated-1)',
            borderBottom: '1px solid var(--color-border-subtle)'
          }}
        >
          {/* v2.25.0 Phase 1: Comment Search Button */}
          <button
            onClick={() => setShowCommentSearch(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
            title="搜索评论 (Cmd/Ctrl + K)"
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">搜索</span>
            <span className="hidden lg:inline text-xs text-gray-400 ml-1">⌘K</span>
          </button>

          <NotificationBadge />
          <LanguageSwitcher />
        </div>

        <div key={animateKey} className="flex-1 animate-page-enter">
          {children}
        </div>
      </main>

      {/* v2.10.0 Phase 1: User Feedback Button */}
      <FeedbackButton />

      {/* v2.15.0 Phase 2.1: Keyboard Help Modal */}
      {showKeyboardHelp && (
        <KeyboardHelpModal onClose={() => setShowKeyboardHelp(false)} />
      )}

      {/* v2.25.0 Phase 1: Comment Search Modal */}
      <CommentSearchModal
        isOpen={showCommentSearch}
        onClose={() => setShowCommentSearch(false)}
      />
    </div>
  )
}
