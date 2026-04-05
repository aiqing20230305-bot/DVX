import React, { useEffect, useState } from 'react'
import { useTestingTracker, isTestingTrackingActive, stopTestingTracking } from '../../hooks/useTestingTracker.js'
import { XCircle } from 'lucide-react'

/**
 * Testing Tracker Component
 *
 * Shows a visual indicator when testing tracking is active
 * and provides a way to stop tracking
 */
export function TestingTracker() {
  const [isActive, setIsActive] = useState(isTestingTrackingActive())
  const { getSessionId } = useTestingTracker({ enabled: isActive })

  useEffect(() => {
    // Check tracking status every second
    const interval = setInterval(() => {
      setIsActive(isTestingTrackingActive())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleStop = () => {
    if (window.confirm('确定要停止测试追踪吗？')) {
      stopTestingTracking()
      setIsActive(false)
    }
  }

  if (!isActive) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-indigo-600 border border-indigo-500 rounded-lg shadow-lg p-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-sm font-medium">测试追踪中</span>
        </div>
        <button
          onClick={handleStop}
          className="p-1 hover:bg-indigo-700 rounded transition-colors"
          title="停止追踪"
        >
          <XCircle size={16} className="text-white" />
        </button>
      </div>
      <div className="text-xs text-slate-400 mt-1 text-right">
        会话: {getSessionId()?.slice(0, 8)}...
      </div>
    </div>
  )
}

/**
 * Testing Tracker Provider
 *
 * Wraps the app to enable automatic tracking
 */
export function TestingTrackerProvider({ children }: { children: React.ReactNode }) {
  // Initialize tracker
  useTestingTracker({ enabled: isTestingTrackingActive() })

  return (
    <>
      {children}
      <TestingTracker />
    </>
  )
}
