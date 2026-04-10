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
  const { isAuthenticated, fetchCurrentUser, setUser, user } = useAuthStore()
  const location = useLocation()

  // 开发环境跳过认证
  const isDevelopment = import.meta.env.DEV

  // Try to restore auth state from token on mount
  useEffect(() => {
    if (isDevelopment && !user) {
      // 开发环境：设置mock用户
      setUser({
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: '开发测试用户',
        role: 'admin',
        status: 'active',
        email_verified: 1,
        created_at: Date.now(),
        updated_at: Date.now()
      })
    } else if (!isAuthenticated && !isDevelopment) {
      fetchCurrentUser()
    }
  }, [])

  // 开发环境直接通过
  if (isDevelopment) {
    return <>{children}</>
  }

  if (!isAuthenticated) {
    // Redirect to login, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
