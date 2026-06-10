import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Agenda from './pages/Agenda'
import NuevoTurno from './pages/NuevoTurno'
import Profesionales from './pages/Profesionales'
import Clientes from './pages/Clientes'
import DetalleTurno from './pages/DetalleTurno'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta raíz → redirige a /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Autenticación — pública */}
          <Route path="/login" element={<Login />} />

          {/* App principal — protegida */}
          <Route
            path="/agenda"
            element={
              <PrivateRoute>
                <Agenda />
              </PrivateRoute>
            }
          />
          <Route
            path="/nuevo-turno"
            element={
              <PrivateRoute>
                <NuevoTurno />
              </PrivateRoute>
            }
          />
          <Route
            path="/profesionales"
            element={
              <PrivateRoute>
                <Profesionales />
              </PrivateRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <PrivateRoute>
                <Clientes />
              </PrivateRoute>
            }
          />
          <Route
            path="/turnos/:id"
            element={
              <PrivateRoute>
                <DetalleTurno />
              </PrivateRoute>
            }
          />

          {/* Fallback: cualquier ruta desconocida → /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
