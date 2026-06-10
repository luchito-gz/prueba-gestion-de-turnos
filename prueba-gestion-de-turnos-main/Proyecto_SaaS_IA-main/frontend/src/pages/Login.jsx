import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
  },
  title: {
    margin: '0 0 1.5rem',
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1a1a2e',
    textAlign: 'center',
  },
  tabs: {
    display: 'flex',
    marginBottom: '1.5rem',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e0e0e0',
  },
  tab: (active) => ({
    flex: 1,
    padding: '0.6rem',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.95rem',
    background: active ? '#4f46e5' : '#fff',
    color: active ? '#fff' : '#555',
    transition: 'background 0.2s',
  }),
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.35rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#444',
  },
  input: {
    width: '100%',
    padding: '0.6rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  btnPrimary: {
    width: '100%',
    padding: '0.75rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'background 0.2s',
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '0.65rem 0.9rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  success: {
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    padding: '0.65rem 0.9rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Register form state
  const [registerData, setRegisterData] = useState({
    nombre: '',
    email: '',
    password: '',
    slug: '',
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        email: loginData.email,
        password: loginData.password,
      })
      const token = res.data.access_token || res.data.token
      if (!token) throw new Error('No se recibió token del servidor.')
      login(token)
      // Volver a la ruta de origen o ir a /agenda por defecto
      const destination = location.state?.from?.pathname || '/agenda'
      navigate(destination, { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error al iniciar sesión.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await api.post('/auth/register', {
        nombre: registerData.nombre,
        email: registerData.email,
        password: registerData.password,
        slug: registerData.slug,
      })
      setSuccess('¡Cuenta creada! Ahora podés iniciar sesión.')
      setMode('login')
      setLoginData({ email: registerData.email, password: '' })
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Error al registrarse.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const switchMode = (newMode) => {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>TurnoIA</h1>

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={styles.tab(mode === 'login')} onClick={() => switchMode('login')}>
            Iniciar sesión
          </button>
          <button style={styles.tab(mode === 'register')} onClick={() => switchMode('register')}>
            Registrarse
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="tu@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            <button style={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre</label>
              <input
                style={styles.input}
                type="text"
                placeholder="Tu nombre completo"
                value={registerData.nombre}
                onChange={(e) => setRegisterData({ ...registerData, nombre: e.target.value })}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="tu@email.com"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Contraseña</label>
              <input
                style={styles.input}
                type="password"
                placeholder="••••••••"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Slug (identificador único)</label>
              <input
                style={styles.input}
                type="text"
                placeholder="mi-negocio"
                value={registerData.slug}
                onChange={(e) =>
                  setRegisterData({
                    ...registerData,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                  })
                }
                required
              />
            </div>
            <button style={styles.btnPrimary} type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
