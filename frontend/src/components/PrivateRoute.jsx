import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * PrivateRoute
 * Si el usuario NO está autenticado → redirige a /login
 * guardando la ruta actual en location.state.from para volver
 * automáticamente tras el login.
 */
export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
