import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const ESTADO_COLORS = {
  pendiente: { bg: "#fef9c3", color: "#92400e" },
  confirmado: { bg: "#d1fae5", color: "#065f46" },
  cancelado: { bg: "#fee2e2", color: "#b91c1c" },
  completado: { bg: "#e0e7ff", color: "#3730a3" },
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#f0f2f5",
    fontFamily: "'Segoe UI', sans-serif",
    padding: "2rem",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "1.5rem",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "0.6rem 1.2rem",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  btnDanger: {
    padding: "0.6rem 1.2rem",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  inputFecha: {
    padding: "0.55rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.9rem",
    outline: "none",
    cursor: "pointer",
    background: "#fff",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    background: "#f8f9fa",
    padding: "0.85rem 1rem",
    textAlign: "left",
    fontSize: "0.8rem",
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: "0.9rem 1rem",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "0.92rem",
    color: "#374151",
  },
  badge: (estado) => {
    const c = ESTADO_COLORS[estado?.toLowerCase()] || {
      bg: "#f3f4f6",
      color: "#374151",
    };
    return {
      display: "inline-block",
      padding: "0.25rem 0.65rem",
      borderRadius: "99px",
      fontSize: "0.78rem",
      fontWeight: 700,
      background: c.bg,
      color: c.color,
    };
  },
  emptyMsg: {
    textAlign: "center",
    padding: "3rem",
    color: "#9ca3af",
    fontSize: "1rem",
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  loading: {
    textAlign: "center",
    padding: "3rem",
    color: "#6b7280",
  },
  btnEdit: {
    padding: "0.3rem 0.75rem",
    background: "#fff",
    color: "#4f46e5",
    border: "1px solid #4f46e5",
    borderRadius: "6px",
    fontWeight: 600,
    fontSize: "0.8rem",
    cursor: "pointer",
  },
};

// Muestra solo la hora en formato HH:MM (ej: "10:00")
function formatHora(fechaStr) {
  if (!fechaStr) return "-";
  try {
    return new Date(fechaStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatFechaTitulo(fechaISO) {
  if (!fechaISO) return "";
  const [year, month, day] = fechaISO.split("-");
  return `${day}/${month}/${year}`;
}

export default function Agenda() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    fetchTurnos();
  }, [fechaSeleccionada]);

  const fetchTurnos = async () => {
    setLoading(true);
    setError("");
    try {
      // El backend acepta ?fecha=YYYY-MM-DD y filtra el dia completo
      const res = await api.get("/turnos", {
        params: { fecha: fechaSeleccionada },
      });
      setTurnos(res.data || []);
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Error al cargar los turnos.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Agenda - {formatFechaTitulo(fechaSeleccionada)}
        </h1>
        <div style={styles.headerActions}>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            style={styles.inputFecha}
          />
          <button
            style={styles.btnPrimary}
            onClick={() => navigate("/nuevo-turno")}
          >
            + Nuevo turno
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => navigate("/profesionales")}
          >
            Profesionales
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => navigate("/clientes")}
          >
            Clientes
          </button>
          <button style={styles.btnDanger} onClick={handleLogout}>
            Cerrar sesion
          </button>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loading}>Cargando turnos...</div>
        ) : turnos.length === 0 ? (
          <div style={styles.emptyMsg}>No hay turnos para esta fecha.</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Inicio</th>
                <th style={styles.th}>Fin</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Profesional</th>
                <th style={styles.th}>Estado</th>
                <th style={styles.th}>Notas</th>
                <th style={styles.th}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnos.map((t, i) => (
                <tr key={t.id ?? i}>
                  <td style={styles.td}>
                    {formatHora(t.fecha_inicio)}
                  </td>
                  <td style={styles.td}>
                    {formatHora(t.fecha_fin)}
                  </td>
                  <td style={styles.td}>
                    {t.cliente?.nombre ?? "-"}
                  </td>
                  <td style={styles.td}>
                    {t.profesional?.nombre ?? "-"}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.badge(t.estado)}>
                      {t.estado || "-"}
                    </span>
                  </td>
                  <td style={styles.td}>{t.notas || "-"}</td>
                  <td style={styles.td}>
                    <button
                      style={styles.btnEdit}
                      onClick={() => navigate("/turnos/" + t.id)}
                    >
                      Ver / Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
