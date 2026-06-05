import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'https://proyectosaasia-production.up.railway.app'

const EMPTY_FORM = { nombre: '', especialidad: '', email: '', telefono: '' }

const styles = {
  wrapper: {
    minHeight: '100vh',
    background: '#f0f2f5',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '2rem',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  btnBack: {
    padding: '0.5rem 1rem',
    background: '#fff',
    color: '#4f46e5',
    border: '1px solid #4f46e5',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#1a1a2e',
  },
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    overflow: 'hidden',
    marginBottom: '1.5rem',
  },
  formCard: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
    padding: '1.5rem 2rem',
  },
  formTitle: {
    margin: '0 0 1.2rem',
    fontSize: '1rem',
    fontWeight: 700,
    color: '#374151',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '0.35rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#444',
  },
  input: {
    padding: '0.6rem 0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  formActions: {
    marginTop: '1.2rem',
  },
  btnPrimary: {
    padding: '0.65rem 1.4rem',
    background: '#4f46e5',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  btnDanger: {
    padding: '0.4rem 0.85rem',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#f8f9fa',
    padding: '0.85rem 1rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '0.9rem 1rem',
    borderBottom: '1px solid #f3f4f6',
    fontSize: '0.92rem',
    color: '#374151',
  },
  emptyMsg: {
    textAlign: 'center',
    padding: '3rem',
    color: '#9ca3af',
    fontSize: '1rem',
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  success: {
    background: '#d1fae5',
    color: '#065f46',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#6b7280',
  },
}

export default function Profesionales() {
  const navigate = useNavigate()
  const [profesionales, setProfesionales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetchProfesionales(token)
  }, [navigate])

  const fetchProfesionales = async (token) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/profesionales`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setProfesionales(data || [])
    } catch (err) {
      setError(err.message || 'Error al cargar los profesionales.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_BASE}/api/profesionales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: form.nombre,
          especialidad: form.especialidad,
          email: form.email || null,
          telefono: form.telefono || null,
        }),
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          Array.isArray(errData.detail)
            ? errData.detail.map((d) => d.msg).join(' | ')
            : errData.detail || errData.message || `Error ${res.status}`
        )
      }
      setSuccess('Profesional creado correctamente.')
      setForm(EMPTY_FORM)
      fetchProfesionales(token)
    } catch (err) {
      setError(err.message || 'Error al crear el profesional.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este profesional?')) return
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    setDeletingId(id)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`${API_BASE}/api/profesionales/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem('token')
        navigate('/login')
        return
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.message || `Error ${res.status}`)
      }
      setSuccess('Profesional eliminado.')
      setProfesionales((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      setError(err.message || 'Error al eliminar.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.btnBack} onClick={() => navigate('/agenda')}>
            ← Volver
          </button>
          <h1 style={styles.title}>👨‍⚕️ Profesionales</h1>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Tabla */}
      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Cargando profesionales...</div>
        ) : profesionales.length === 0 ? (
          <div style={styles.emptyMsg}>No hay profesionales registrados todavía.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nombre</th>
                <th style={styles.th}>Especialidad</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Teléfono</th>
                <th style={styles.th}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {profesionales.map((p, i) => (
                <tr key={p.id ?? i}>
                  <td style={styles.td}>{p.nombre || '—'}</td>
                  <td style={styles.td}>{p.especialidad || '—'}</td>
                  <td style={styles.td}>{p.email || '—'}</td>
                  <td style={styles.td}>{p.telefono || '—'}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.btnDanger}
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                    >
                      {deletingId === p.id ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formulario de creación */}
      <div style={styles.formCard}>
        <p style={styles.formTitle}>+ Agregar profesional</p>
        <form onSubmit={handleCreate}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Nombre *</label>
              <input
                style={styles.input}
                type="text"
                name="nombre"
                placeholder="Ej: Dr. García"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Especialidad *</label>
              <input
                style={styles.input}
                type="text"
                name="especialidad"
                placeholder="Ej: Odontología"
                value={form.especialidad}
                onChange={handleChange}
                required
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                name="email"
                placeholder="doctor@clinica.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Teléfono</label>
              <input
                style={styles.input}
                type="text"
                name="telefono"
                placeholder="Ej: 11-1234-5678"
                value={form.telefono}
                onChange={handleChange}
              />
            </div>
          </div>
          <div style={styles.formActions}>
            <button style={styles.btnPrimary} type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear profesional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
