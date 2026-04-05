import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const API_BASE = 'http://localhost:3001/api/testing'
const SESSION_KEY = 'testing_session_id'

interface TrackingOptions {
  enabled?: boolean
  debounceMs?: number
}

/**
 * Testing Tracker Hook
 *
 * Automatically tracks user behavior during testing sessions:
 * - Page navigation
 * - Click events
 * - Errors
 * - Performance metrics
 */
export function useTestingTracker(options: TrackingOptions = {}) {
  const { enabled = true, debounceMs = 1000 } = options
  const location = useLocation()
  const lastActionTime = useRef(0)
  const pageLoadTime = useRef(Date.now())

  // Get current session ID from localStorage
  const getSessionId = (): string | null => {
    return localStorage.getItem(SESSION_KEY)
  }

  // Record action to API
  const recordAction = async (
    action_type: 'click' | 'navigate' | 'error' | 'success' | 'confusion',
    page: string,
    target?: string,
    details?: string
  ) => {
    const sessionId = getSessionId()
    if (!sessionId || !enabled) return

    // Debounce: prevent too frequent requests
    const now = Date.now()
    if (now - lastActionTime.current < debounceMs) return
    lastActionTime.current = now

    try {
      await fetch(`${API_BASE}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          action_type,
          page,
          target,
          details
        })
      })
    } catch (error) {
      console.error('Failed to record action:', error)
    }
  }

  // Track page navigation
  useEffect(() => {
    if (!enabled) return

    const sessionId = getSessionId()
    if (!sessionId) return

    // Calculate time spent on previous page
    const timeSpent = Date.now() - pageLoadTime.current
    pageLoadTime.current = Date.now()

    // Record navigation
    recordAction(
      'navigate',
      location.pathname,
      undefined,
      `Time spent: ${Math.floor(timeSpent / 1000)}s`
    )
  }, [location.pathname, enabled])

  // Track click events
  useEffect(() => {
    if (!enabled) return

    const sessionId = getSessionId()
    if (!sessionId) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Get meaningful target description
      let targetDesc = target.tagName
      if (target.id) targetDesc += `#${target.id}`
      if (target.className) targetDesc += `.${target.className.split(' ')[0]}`

      // Get button/link text
      const text = target.textContent?.trim().slice(0, 50) || ''

      // Record click
      recordAction(
        'click',
        location.pathname,
        targetDesc,
        text ? `Text: ${text}` : undefined
      )
    }

    // Add global click listener
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [location.pathname, enabled])

  // Track errors
  useEffect(() => {
    if (!enabled) return

    const sessionId = getSessionId()
    if (!sessionId) return

    const handleError = (event: ErrorEvent) => {
      recordAction(
        'error',
        location.pathname,
        event.message,
        `${event.filename}:${event.lineno}`
      )
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [location.pathname, enabled])

  return {
    // Manual tracking methods
    trackClick: (target: string, details?: string) => {
      recordAction('click', location.pathname, target, details)
    },
    trackSuccess: (message: string, details?: string) => {
      recordAction('success', location.pathname, message, details)
    },
    trackConfusion: (reason: string, details?: string) => {
      recordAction('confusion', location.pathname, reason, details)
    },
    trackError: (error: string, details?: string) => {
      recordAction('error', location.pathname, error, details)
    },
    // Session management
    getSessionId,
    isTracking: () => !!getSessionId() && enabled
  }
}

/**
 * Enable testing tracking for a session
 */
export function startTestingTracking(sessionId: string) {
  localStorage.setItem(SESSION_KEY, sessionId)
  console.log('[Testing Tracker] Started tracking for session:', sessionId)
}

/**
 * Disable testing tracking
 */
export function stopTestingTracking() {
  const sessionId = localStorage.getItem(SESSION_KEY)
  localStorage.removeItem(SESSION_KEY)
  console.log('[Testing Tracker] Stopped tracking for session:', sessionId)
}

/**
 * Check if tracking is active
 */
export function isTestingTrackingActive(): boolean {
  return !!localStorage.getItem(SESSION_KEY)
}
