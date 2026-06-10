import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const ESTADO_COLORS = {
  pendiente:    { bg: "#fef9c3", color: "#92400e" },
  confirmado:   { bg: "#d1fae5", color: "#065f46" },
  cancelado:    { bg: "#fee2e2", color: "#b91c1c" },
  reprogramado: { bg: "#fde68a", color: "#92400e" },
  completado:   { bg: "#e0e7ff", color: "#3730a3" },
};

const ESTADOS = ["pendiente", "confirmado", "cancelado", "reprogramado", "completado"];

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
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  btnBack: {
    padding: "0.5rem 1rem",
    background: "#fff",
    color: "#4f46e5",
    border: "1px solid #4f46e5",
    borderRadius: "8px",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  title: {
    margin: 0,
    fontSize: "1.6rem",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.07)",
    padding: "2rem",
    maxWidth: "600px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  fieldFull: {
    gridColumn: "1 / -1",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "0.35rem",
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "#444",
  },
  input: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
  },
  select: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
    cursor: "pointer",
    appearance: "none",
    fontWeight: 700,
  },
  textarea: {
    padding: "0.6rem 0.75rem",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    fontSize: "0.95rem",
    outline: "none",
    resize: "vertical",
    minHeight: "90px",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  actions: {
    marginTop: "1.5rem",
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
  },
  btnPrimary: {
    padding: "0.75rem 1.5rem",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
  },
  btnDanger: {
    padding: "0.75rem 1.5rem",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    fontSize: "0.9rem",
  },
  success: {
    background: "#d1fae5",
    color: "#065f46",
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
  hint: {
    fontSize: "0.78rem",
    color: "#9ca3af",
    marginTop: "0.25rem",
  },
};

function toDatetimeLocal(isoStr) {
  if (!isoStr) return "";
  // "2024-01-15T10:30:00" → "2024-01-15T10:30"
  return isoStr.slice(0, 16);
}

function toLocalISO(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}

export default function DetalleTurno() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loadingTurno, setLoadingTurno] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fecha_hora: "",
    duracion_min: 30,
    profesional_id: "",
    cliente_id: "",
    estado: "pendiente",
    notas: "",
  });

  useEffect(() => {
    const cargarTurno = async () => {
      setLoadingTurno(true);
      setError("");
      try {
        const res = await api.get(`/turnos/${id}`);
        const t = res.data;
        setForm({
          fecha_hora:     toDatetimeLocal(t.fecha_hora),
          duracion_min:   t.duracion_min ?? 30,
          profesional_id: t.profesional_id ?? "",
          cliente_id:     t.cliente_id ?? "",
          estado:         t.estado ?? "pendiente",
          notas:          t.notas ?? "",
        });
      } catch (err) {
        const msg =
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "No se pudo cargar el turno.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        setLoadingTurno(false);
      }
    };

    cargarTurno();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const payload = {
        fecha_hora:   toLocalISO(form.fecha_hora),
        duracion_min: Number(form.duracion_min),
        estado:       form.estado,
        notas:        form.notas || null,
      };
      if (form.profesional_id !== "") payload.profesional_id = Number(form.profesional_id);
      if (form.cliente_id !== "")     payload.cliente_id     = Number(form.cliente_id);

      await api.patch(`/turnos/${id}`, payload);
      setSuccess("Turno actualizado correctamente. Redirigiendo...");
      setTimeout(() => navigate("/agenda"), 1000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg).join(" | "));
      } else {
        setError(
          detail ||
            err.response?.data?.message ||
            err.message ||
            "Error al guardar los cambios."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelarTurno = async () => {
    const confirmado = window.confirm(
      `¿Estás seguro de que querés cancelar el Turno #${id}?\nEsta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    setSaving(true);
    setError("");
    try {
      await api.delete(`/turnos/${id}`);
      navigate("/agenda");
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Error al cancelar el turno.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setSaving(false);
    }
  };

  const selectEstadoStyle = {
    ...styles.select,
    background: ESTADO_COLORS[form.estado]?.bg || "#fff",
    color:      ESTADO_COLORS[form.estado]?.color || "#374151",
  };

  if (loadingTurno) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.loading}>Cargando turno...</div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate("/agenda")}>
          ← Volver
        </button>
        <h1 style={styles.title}>Turno #{id}</h1>
      </div>

      <div style={styles.card}>
        {error   && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleGuardar}>
          <div style={styles.grid}>

            {/* Fecha y hora */}
            <div style={{ ...styles.field, ...styles.fieldFull }}>
              <label style={styles.label}>Fecha y hora del turno *</label>
              <input
                style={styles.input}
                type="datetime-local"
                name="fecha_hora"
                value={form.fecha_hora}
                onChange={handleChange}
                required
              />
            </div>

            {/* Duración */}
            <div style={styles.field}>
              <label style={styles.label}>Duración (minutos) *</label>
              <input
                style={styles.input}
                type="number"
                name="duracion_min"
                min="5"
                max="480"
                step="5"
                value={form.duracion_min}
                onChange={handleChange}
                required
              />
              <span style={styles.hint}>Mínimo 5 min, máximo 480 min</span>
            </div>

            {/* Estado */}
            <div style={styles.field}>
              <label style={styles.label}>Estado *</label>
              <select
                style={selectEstadoStyle}
                name="estado"
                value={form.estado}
                onChange={handleChange}
                required
              >
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Profesional ID */}
            <div style={styles.field}>
              <label style={styles.label}>ID Profesional</label>
              <input
                style={styles.input}
                type="number"
                name="profesional_id"
                value={form.profesional_id}
                onChange={handleChange}
                placeholder="ID del profesional"
              />
            </div>

            {/* Cliente ID */}
            <div style={styles.field}>
              <label style={styles.label}>ID Cliente</label>
              <input
                style={styles.input}
                type="number"
                name="cliente_id"
                value={form.cliente_id}
                onChange={handleChange}
                placeholder="ID del cliente"
              />
            </div>

            {/* Notas */}
            <div style={{ ...styles.field, ...styles.fieldFull }}>
              <label style={styles.label}>Notas</label>
              <textarea
                style={styles.textarea}
                name="notas"
                placeholder="Indicaciones, observaciones, motivo de la consulta..."
                value={form.notas}
                onChange={handleChange}
              />
            </div>

          </div>

          <div style={styles.actions}>
            <button
              style={styles.btnPrimary}
              type="submit"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              style={styles.btnDanger}
              type="button"
              onClick={handleCancelarTurno}
              disabled={saving}
            >
              Cancelar turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
