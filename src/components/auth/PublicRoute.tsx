import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/auth.store'

interface PublicRouteProps {
  children: React.ReactNode
}

/**
 * Public Route Component
 * Redirects to / if user is already authenticated
 * Use for login/register pages
 */
export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
