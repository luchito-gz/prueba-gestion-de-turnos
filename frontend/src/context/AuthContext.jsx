import { createContext, useContext, useState } from 'react'

// ─── Contexto ────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Leer estado inicial desde localStorage (persiste al recargar)
  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [negocio, setNegocio] = useState(() => {
    try {
      const stored = localStorage.getItem('negocio')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const isAuthenticated = Boolean(token)

  /**
   * login(token, negocioData?)
   * Guarda en localStorage Y actualiza el estado React.
   */
  const login = (newToken, negocioData = null) => {
    localStorage.setItem('token', newToken)
    if (negocioData) {
      localStorage.setItem('negocio', JSON.stringify(negocioData))
    }
    setToken(newToken)
    setNegocio(negocioData)
  }

  /**
   * logout()
   * Limpia localStorage Y resetea el estado React.
   */
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('negocio')
    setToken(null)
    setNegocio(null)
  }

  return (
    <AuthContext.Provider value={{ token, negocio, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>.')
  }
  return ctx
}
