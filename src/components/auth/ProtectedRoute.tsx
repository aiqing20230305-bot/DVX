import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Protected Route Component
 * Redirects to /login if user is not authenticated
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, fetchCurrentUser } = useAuthStore()
  const location = useLocation()

  // Try to restore auth state from token on mount
  useEffect(() => {
    if (!isAuthenticated) {
      fetchCurrentUser()
    }
  }, [])

  if (!isAuthenticated) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
