import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

// ─── Tema ─────────────────────────────────────────────────────────────────────
const T = {
  bg:          "#f5f6fa",
  surface:     "#ffffff",
  surfaceAlt:  "#f8f9fc",
  border:      "#e8eaf0",
  borderFocus: "#4f46e5",
  primary:     "#4f46e5",
  primaryD:    "#3730a3",
  primaryL:    "#ede9fe",
  text:        "#1e1b3a",
  muted:       "#7c7a99",
  light:       "#b0aec8",
  danger:      "#ef4444",
  dangerL:     "#fef2f2",
  dangerD:     "#b91c1c",
  success:     "#10b981",
  successL:    "#d1fae5",
  inputBg:     "#ffffff",
  inputBorder: "#d1d5db",
  sectionBg:   "#f8f9fc",
  hint:        "#9ca3af",
  shadow:      "0 24px 60px rgba(79,70,229,.12), 0 8px 20px rgba(0,0,0,.07)",
};

const ESTADO_COLORS = {
  pendiente:    { bg: "#fef9c3", color: "#92400e", border: "#fde68a" },
  confirmado:   { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
  cancelado:    { bg: "#fee2e2", color: "#b91c1c", border: "#fca5a5" },
  reprogramado: { bg: "#fef3c7", color: "#92400e", border: "#fcd34d" },
  completado:   { bg: "#ede9fe", color: "#3730a3", border: "#c4b5fd" },
};

const ESTADOS = ["pendiente","confirmado","cancelado","reprogramado","completado"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toDatetimeLocal(isoStr) {
  if (!isoStr) return "";
  return isoStr.slice(0, 16);
}
function toLocalISO(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}
function useHover() {
  const [h, set] = useState(false);
  return [h, { onMouseEnter: () => set(true), onMouseLeave: () => set(false) }];
}

// ─── Componentes de formulario ────────────────────────────────────────────────
function Label({ children, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 5, display: "block" }}>
      {children}
      {required && <span style={{ color: T.danger, marginLeft: 2 }}>*</span>}
    </label>
  );
}

function Input({ error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: "100%", padding: "9px 11px", boxSizing: "border-box",
        border: `1.5px solid ${error ? T.danger : focused ? T.borderFocus : T.inputBorder}`,
        borderRadius: 8, fontSize: 13, outline: "none",
        background: T.inputBg, color: T.text,
        fontFamily: "'Segoe UI', sans-serif", transition: "border-color .15s",
      }}
    />
  );
}

function Select({ children, error, accentBg, accentColor, accentBorder, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%", padding: "9px 32px 9px 11px", boxSizing: "border-box",
          border: `1.5px solid ${error ? T.danger : focused ? T.borderFocus : (accentBorder || T.inputBorder)}`,
          borderRadius: 8, fontSize: 13, outline: "none",
          background: accentBg || T.inputBg,
          color: accentColor || (props.value ? T.text : T.muted),
          fontFamily: "'Segoe UI', sans-serif",
          cursor: "pointer", appearance: "none",
          fontWeight: accentColor ? 700 : 400,
          transition: "border-color .15s",
        }}
      >
        {children}
      </select>
      <span style={{
        position: "absolute", right: 10, top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
        fontSize: 11, color: accentColor || T.muted,
      }}>▾</span>
    </div>
  );
}

function Textarea({ error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      style={{
        width: "100%", padding: "9px 11px", boxSizing: "border-box",
        border: `1.5px solid ${error ? T.danger : focused ? T.borderFocus : T.inputBorder}`,
        borderRadius: 8, fontSize: 13, outline: "none",
        background: T.inputBg, color: T.text,
        fontFamily: "'Segoe UI', sans-serif",
        resize: "vertical", minHeight: 80, transition: "border-color .15s",
      }}
    />
  );
}

function Hint({ children }) {
  return <span style={{ fontSize: 11, color: T.hint, marginTop: 3, display: "block" }}>{children}</span>;
}

// ─── Botones ──────────────────────────────────────────────────────────────────
function BtnPrimary({ children, disabled, loading, type = "submit" }) {
  const [hov, hp] = useHover();
  return (
    <button type={type} disabled={disabled} {...hp} style={{
      padding: "10px 22px", border: "none", borderRadius: 9,
      background: disabled ? T.light : hov ? T.primaryD : T.primary,
      color: "#fff", fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Segoe UI', sans-serif",
      boxShadow: !disabled && hov ? "0 4px 14px rgba(99,102,241,.4)" : "none",
      transform: !disabled && hov ? "translateY(-1px)" : "none",
      transition: "all .15s", display: "flex", alignItems: "center", gap: 8,
    }}>
      {loading && (
        <span style={{
          width: 13, height: 13, borderRadius: "50%",
          border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff",
          display: "inline-block", animation: "spin .7s linear infinite",
        }} />
      )}
      {children}
    </button>
  );
}

function BtnDanger({ children, onClick, disabled }) {
  const [hov, hp] = useHover();
  return (
    <button type="button" onClick={onClick} disabled={disabled} {...hp} style={{
      padding: "10px 18px", borderRadius: 9,
      border: `1.5px solid ${hov ? T.danger : "#fca5a5"}`,
      background: hov ? T.dangerL : "transparent",
      color: T.danger, fontWeight: 700, fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Segoe UI', sans-serif", transition: "all .15s",
    }}>
      {children}
    </button>
  );
}

function BtnSecondary({ children, onClick, disabled }) {
  const [hov, hp] = useHover();
  return (
    <button type="button" onClick={onClick} disabled={disabled} {...hp} style={{
      padding: "10px 18px", borderRadius: 9,
      border: `1.5px solid ${T.border}`,
      background: hov ? T.sectionBg : "transparent",
      color: T.muted, fontWeight: 600, fontSize: 14,
      cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: "'Segoe UI', sans-serif", transition: "all .15s",
    }}>
      {children}
    </button>
  );
}

function BackBtn({ onClick }) {
  const [hov, hp] = useHover();
  return (
    <button onClick={onClick} {...hp} style={{
      padding: "5px 13px", borderRadius: 7,
      border: `1.5px solid ${hov ? T.primary : T.border}`,
      background: hov ? T.primaryL : "transparent",
      color: hov ? T.primary : T.muted,
      fontSize: 13, fontWeight: 600, cursor: "pointer",
      fontFamily: "'Segoe UI', sans-serif", transition: "all .15s",
    }}>← Volver</button>
  );
}

// ─── Dialogo de confirmación ──────────────────────────────────────────────────
function ConfirmDialog({ open, onConfirm, onCancel, turnoId }) {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(15,15,30,.55)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: T.surface, borderRadius: 14, padding: "24px 26px",
        maxWidth: 380, width: "100%",
        border: `1px solid ${T.border}`,
        boxShadow: "0 20px 50px rgba(0,0,0,.18)",
        animation: "fadeIn .2s ease",
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, textAlign: "center" }}>⚠️</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 8, textAlign: "center" }}>
          Cancelar turno #{turnoId}
        </div>
        <div style={{ fontSize: 13, color: T.muted, textAlign: "center", marginBottom: 20, lineHeight: 1.5 }}>
          Esta acción no se puede deshacer.<br />¿Estás seguro que querés continuar?
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <BtnDanger onClick={onConfirm}>Sí, cancelar turno</BtnDanger>
          <BtnSecondary onClick={onCancel}>Volver</BtnSecondary>
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function DetalleTurno() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loadingTurno, setLoadingTurno] = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [confirmOpen,  setConfirmOpen]  = useState(false);

  const [form, setForm] = useState({
    fecha_hora:     "",
    duracion_min:   30,
    profesional_id: "",
    cliente_id:     "",
    estado:         "pendiente",
    notas:          "",
  });

  // Carga del turno
  useEffect(() => {
    (async () => {
      setLoadingTurno(true); setError("");
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
        const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "No se pudo cargar el turno.";
        setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      } finally {
        setLoadingTurno(false);
      }
    })();
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleGuardar = async e => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      const payload = {
        fecha_hora:   toLocalISO(form.fecha_hora),
        duracion_min: Number(form.duracion_min),
        estado:       form.estado,
        notas:        form.notas || null,
      };
      if (form.profesional_id !== "") payload.profesional_id = Number(form.profesional_id);
      if (form.cliente_id     !== "") payload.cliente_id     = Number(form.cliente_id);
      await api.patch(`/turnos/${id}`, payload);
      setSuccess("Turno actualizado correctamente. Volviendo a la agenda...");
      setTimeout(() => navigate("/agenda"), 1200);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail)
          ? detail.map(d => d.msg).join(" | ")
          : detail || err.response?.data?.message || err.message || "Error al guardar los cambios."
      );
    } finally {
      setSaving(false); }
  };

  const handleCancelarConfirmado = async () => {
    setConfirmOpen(false);
    setSaving(true); setError("");
    try {
      await api.delete(`/turnos/${id}`);
      navigate("/agenda");
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.message || err.message || "Error al cancelar el turno.";
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
      setSaving(false);
    }
  };

  const estadoStyle = ESTADO_COLORS[form.estado] || {};

  if (loadingTurno) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, color: T.muted }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${T.border}`, borderTopColor: T.primary, animation: "spin .7s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Cargando turno...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <ConfirmDialog
        open={confirmOpen}
        turnoId={id}
        onConfirm={handleCancelarConfirmado}
        onCancel={() => setConfirmOpen(false)}
      />

      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: "'Segoe UI', sans-serif", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          padding: "0 32px", height: 60,
          display: "flex", alignItems: "center", gap: 14,
          boxShadow: "0 1px 4px rgba(79,70,229,.06)",
          position: "sticky", top: 0, zIndex: 10,
        }}>
          <BackBtn onClick={() => navigate("/agenda")} />
          <div style={{ width: 1, height: 24, background: T.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: `linear-gradient(135deg,${T.primary},${T.primaryD})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>📅</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Turno #{id}</div>
              <div style={{ fontSize: 11, color: T.muted }}>Editá o cancelá este turno</div>
            </div>
          </div>

          {/* Badge de estado en el header */}
          {form.estado && (
            <div style={{
              marginLeft: "auto",
              padding: "4px 12px", borderRadius: 99,
              background: estadoStyle.bg, color: estadoStyle.color,
              border: `1px solid ${estadoStyle.border}`,
              fontSize: 12, fontWeight: 700,
            }}>
              {form.estado.charAt(0).toUpperCase() + form.estado.slice(1)}
            </div>
          )}
        </div>

        {/* Contenido */}
        <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
          <div style={{
            width: "100%", maxWidth: 560,
            background: T.surface, borderRadius: 16,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
            animation: "fadeIn .3s ease",
          }}>
            <div style={{ padding: "22px 24px 24px" }}>

              {/* Error */}
              {error && (
                <div style={{
                  background: T.dangerL, border: `1px solid ${T.danger}44`,
                  borderRadius: 9, padding: "10px 13px", marginBottom: 16,
                  fontSize: 13, color: T.danger, display: "flex", gap: 8,
                }}>
                  <span>⚠️</span><span>{error}</span>
                </div>
              )}

              {/* Éxito */}
              {success && (
                <div style={{
                  background: T.successL, border: `1px solid ${T.success}66`,
                  borderRadius: 9, padding: "12px 14px", marginBottom: 16,
                  fontSize: 13, color: T.success,
                  display: "flex", gap: 8, alignItems: "center", fontWeight: 700,
                }}>
                  <span style={{ fontSize: 18 }}>✅</span><span>{success}</span>
                </div>
              )}

              <form onSubmit={handleGuardar} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                  {/* Fecha y hora — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label required>Fecha y hora del turno</Label>
                    <Input type="datetime-local" name="fecha_hora"
                      value={form.fecha_hora} onChange={handleChange} required />
                  </div>

                  {/* Duración */}
                  <div>
                    <Label required>Duración (minutos)</Label>
                    <Input type="number" name="duracion_min"
                      min="5" max="480" step="5"
                      value={form.duracion_min} onChange={handleChange} required />
                    <Hint>Entre 5 y 480 min</Hint>
                  </div>

                  {/* Estado con color */}
                  <div>
                    <Label required>Estado</Label>
                    <Select
                      name="estado"
                      value={form.estado}
                      onChange={handleChange}
                      required
                      accentBg={estadoStyle.bg}
                      accentColor={estadoStyle.color}
                      accentBorder={estadoStyle.border}
                    >
                      {ESTADOS.map(e => (
                        <option key={e} value={e}>
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Profesional ID */}
                  <div>
                    <Label>ID Profesional</Label>
                    <Input type="number" name="profesional_id"
                      value={form.profesional_id} onChange={handleChange}
                      placeholder="ID del profesional" />
                  </div>

                  {/* Cliente ID */}
                  <div>
                    <Label>ID Cliente</Label>
                    <Input type="number" name="cliente_id"
                      value={form.cliente_id} onChange={handleChange}
                      placeholder="ID del cliente" />
                  </div>

                  {/* Notas */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label>
                      Notas{" "}
                      <span style={{ fontWeight: 400, color: T.light }}>(opcional)</span>
                    </Label>
                    <Textarea name="notas"
                      placeholder="Indicaciones, observaciones, motivo de la consulta..."
                      value={form.notas} onChange={handleChange} />
                  </div>

                </div>

                {/* Acciones */}
                <div style={{
                  display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap",
                  paddingTop: 18, borderTop: `1px solid ${T.border}`,
                }}>
                  <BtnPrimary loading={saving} disabled={saving}>
                    {saving ? "Guardando..." : "✓ Guardar cambios"}
                  </BtnPrimary>
                  <BtnDanger onClick={() => setConfirmOpen(true)} disabled={saving}>
                    🗑 Cancelar turno
                  </BtnDanger>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
