import axios from 'axios'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'https://proyectosaasia-production.up.railway.app') + '/api'

// ─── Instancia centralizada ───────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
})

// ─── Interceptor REQUEST: inyectar Bearer token ───────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Interceptor RESPONSE: manejar 401 ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpiar sesión y forzar re-login
      localStorage.removeItem('token')
      localStorage.removeItem('negocio')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
