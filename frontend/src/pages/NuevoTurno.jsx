import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

// ─── Tema ─────────────────────────────────────────────────────────────────────
const T = {
  bg:           "#f5f6fa",
  surface:      "#ffffff",
  surfaceAlt:   "#f8f9fc",
  border:       "#e8eaf0",
  borderFocus:  "#4f46e5",
  primary:      "#4f46e5",
  primaryD:     "#3730a3",
  primaryL:     "#ede9fe",
  text:         "#1e1b3a",
  muted:        "#7c7a99",
  light:        "#b0aec8",
  danger:       "#ef4444",
  dangerL:      "#fef2f2",
  success:      "#10b981",
  successL:     "#d1fae5",
  inputBg:      "#ffffff",
  inputBorder:  "#d1d5db",
  sectionBg:    "#f8f9fc",
  hint:         "#9ca3af",
  shadow:       "0 24px 60px rgba(79,70,229,.15), 0 8px 20px rgba(0,0,0,.08)",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toLocalISO(value) {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}
function combineFechaHora(fecha, hora) {
  if (!fecha || !hora) return "";
  return `${fecha}T${hora}`;
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

function Select({ children, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width: "100%", padding: "9px 32px 9px 11px", boxSizing: "border-box",
          border: `1.5px solid ${error ? T.danger : focused ? T.borderFocus : T.inputBorder}`,
          borderRadius: 8, fontSize: 13, outline: "none",
          background: T.inputBg, color: props.value ? T.text : T.muted,
          fontFamily: "'Segoe UI', sans-serif", cursor: "pointer",
          appearance: "none", transition: "border-color .15s",
        }}
      >
        {children}
      </select>
      <span style={{
        position: "absolute", right: 10, top: "50%",
        transform: "translateY(-50%)", pointerEvents: "none",
        fontSize: 11, color: T.muted,
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

function FieldError({ msg }) {
  if (!msg) return null;
  return <span style={{ fontSize: 11, color: T.danger, marginTop: 3, display: "block" }}>{msg}</span>;
}

function Hint({ children }) {
  return <span style={{ fontSize: 11, color: T.hint, marginTop: 3, display: "block" }}>{children}</span>;
}

// ─── Preview en tiempo real ───────────────────────────────────────────────────
function TurnoPreview({ form, profesionales, clientes }) {
  const prof   = profesionales.find(p => String(p.id) === String(form.profesional_id));
  const client = clientes.find(c => String(c.id) === String(form.cliente_id));
  if (!prof && !client && !form.fecha && !form.hora) return null;

  let horaFin = null;
  if (form.fecha && form.hora && form.duracion_min) {
    const d = new Date(`${form.fecha}T${form.hora}`);
    d.setMinutes(d.getMinutes() + Number(form.duracion_min));
    horaFin = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  }

  const fechaLabel = form.fecha
    ? new Date(form.fecha + "T12:00").toLocaleDateString("es-AR", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
      })
    : null;

  return (
    <div style={{
      background: T.sectionBg, border: `1px solid ${T.border}`,
      borderRadius: 10, padding: "12px 14px",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: T.muted, textTransform: "uppercase",
        letterSpacing: ".06em", marginBottom: 8,
      }}>Vista previa del turno</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {fechaLabel && (
          <PreviewRow icon="📅" label="Fecha y hora"
            value={`${fechaLabel}${form.hora ? ` · ${form.hora}` : ""}${horaFin ? ` → ${horaFin}` : ""}`} />
        )}
        {prof && <PreviewRow icon="👤" label="Profesional" value={`${prof.nombre}${prof.especialidad ? ` · ${prof.especialidad}` : ""}`} />}
        {client && <PreviewRow icon="🧑" label="Cliente" value={client.nombre} />}
        {form.duracion_min > 0 && <PreviewRow icon="⏱️" label="Duración" value={`${form.duracion_min} minutos`} />}
        {form.notas && <PreviewRow icon="📝" label="Notas" value={form.notas} />}
      </div>
    </div>
  );
}

function PreviewRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <span style={{ fontSize: 13, flexShrink: 0 }}>{icon}</span>
      <div>
        <span style={{ fontSize: 10, fontWeight: 600, color: T.muted }}>{label}: </span>
        <span style={{ fontSize: 12, color: T.text, fontWeight: 500 }}>{value}</span>
      </div>
    </div>
  );
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

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function NuevoTurno() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [profesionales, setProfesionales] = useState([]);
  const [clientes,      setClientes]      = useState([]);
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [submitting,   setSubmitting]     = useState(false);
  const [success,      setSuccess]        = useState(false);
  const [apiError,     setApiError]       = useState("");
  const [fieldErrors,  setFieldErrors]    = useState({});

  const [form, setForm] = useState({
    fecha:          searchParams.get("fecha") || "",
    hora:           searchParams.get("hora")  || "",
    duracion_min:   30,
    profesional_id: searchParams.get("profesional_id") || "",
    cliente_id:     "",
    notas:          "",
  });

  // Cargar selects
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    (async () => {
      setLoadingSelects(true);
      try {
        const [rp, rc] = await Promise.all([
          api.get("/profesionales"),
          api.get("/clientes"),
        ]);
        setProfesionales(rp.data || []);
        setClientes(rc.data || []);
      } catch {
        setApiError("No se pudieron cargar profesionales/clientes. Recargá la página.");
      } finally {
        setLoadingSelects(false);
      }
    })();
  }, [navigate]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (fieldErrors[name]) setFieldErrors(fe => ({ ...fe, [name]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.fecha)          errs.fecha          = "La fecha es requerida.";
    if (!form.hora)           errs.hora           = "El horario es requerido.";
    if (!form.profesional_id) errs.profesional_id = "Seleccioná un profesional.";
    if (!form.cliente_id)     errs.cliente_id     = "Seleccioná un cliente.";
    const dur = Number(form.duracion_min);
    if (!dur || dur < 5 || dur > 480) errs.duracion_min = "La duración debe estar entre 5 y 480 min.";
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }

    setSubmitting(true);
    try {
      const fecha_hora = toLocalISO(combineFechaHora(form.fecha, form.hora));
      await api.post("/turnos", {
        fecha_hora,
        duracion_min:   Number(form.duracion_min),
        profesional_id: Number(form.profesional_id),
        cliente_id:     Number(form.cliente_id),
        notas:          form.notas || null,
      });
      setSuccess(true);
      setTimeout(() => navigate("/agenda"), 1400);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setApiError(
        Array.isArray(detail)
          ? detail.map(d => d.msg).join(" | ")
          : detail || err.response?.data?.message || err.message || "Error al crear el turno."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const hasPreview = form.fecha || form.hora || form.profesional_id || form.cliente_id;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{
        minHeight: "100vh", background: T.bg,
        fontFamily: "'Segoe UI', sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header de página */}
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
            }}>📋</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text }}>Nuevo turno</div>
              <div style={{ fontSize: 11, color: T.muted }}>Completá los datos para agendar</div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <main style={{
          flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "32px 16px",
        }}>
          <div style={{
            width: "100%", maxWidth: 560,
            background: T.surface, borderRadius: 16,
            border: `1px solid ${T.border}`,
            boxShadow: T.shadow,
            animation: "fadeIn .3s ease",
          }}>
            {/* Body */}
            <div style={{ padding: "22px 24px 24px" }}>

              {/* Error global */}
              {apiError && (
                <div style={{
                  background: T.dangerL, border: `1px solid ${T.danger}44`,
                  borderRadius: 9, padding: "10px 13px", marginBottom: 16,
                  fontSize: 13, color: T.danger,
                  display: "flex", gap: 8, alignItems: "flex-start",
                }}>
                  <span>⚠️</span><span>{apiError}</span>
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
                  <span style={{ fontSize: 20 }}>✅</span>
                  <span>¡Turno creado exitosamente! Volviendo a la agenda...</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

                  {/* Fecha */}
                  <div>
                    <Label required>Fecha</Label>
                    <Input type="date" name="fecha"
                      value={form.fecha} onChange={handleChange}
                      error={!!fieldErrors.fecha} />
                    <FieldError msg={fieldErrors.fecha} />
                  </div>

                  {/* Hora */}
                  <div>
                    <Label required>Horario</Label>
                    <Input type="time" name="hora"
                      value={form.hora} onChange={handleChange}
                      error={!!fieldErrors.hora} />
                    <FieldError msg={fieldErrors.hora} />
                  </div>

                  {/* Duración */}
                  <div>
                    <Label required>Duración (minutos)</Label>
                    <Input type="number" name="duracion_min"
                      min="5" max="480" step="5"
                      value={form.duracion_min} onChange={handleChange}
                      error={!!fieldErrors.duracion_min} />
                    <Hint>Entre 5 y 480 min</Hint>
                    <FieldError msg={fieldErrors.duracion_min} />
                  </div>

                  {/* Profesional */}
                  <div>
                    <Label required>Profesional</Label>
                    <Select name="profesional_id"
                      value={form.profesional_id} onChange={handleChange}
                      disabled={loadingSelects} error={!!fieldErrors.profesional_id}>
                      <option value="" disabled>
                        {loadingSelects ? "Cargando..." : "— Seleccionar —"}
                      </option>
                      {profesionales.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}{p.especialidad ? ` · ${p.especialidad}` : ""}
                        </option>
                      ))}
                    </Select>
                    <FieldError msg={fieldErrors.profesional_id} />
                  </div>

                  {/* Cliente — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label required>Cliente</Label>
                    <Select name="cliente_id"
                      value={form.cliente_id} onChange={handleChange}
                      disabled={loadingSelects} error={!!fieldErrors.cliente_id}>
                      <option value="" disabled>
                        {loadingSelects ? "Cargando..." : "— Seleccionar cliente —"}
                      </option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}{c.telefono ? ` · ${c.telefono}` : ""}
                        </option>
                      ))}
                    </Select>
                    <FieldError msg={fieldErrors.cliente_id} />
                  </div>

                  {/* Notas — full width */}
                  <div style={{ gridColumn: "1 / -1" }}>
                    <Label>
                      Notas{" "}
                      <span style={{ fontWeight: 400, color: T.light }}>(opcional)</span>
                    </Label>
                    <Textarea name="notas"
                      placeholder="Indicaciones, motivo de consulta, observaciones..."
                      value={form.notas} onChange={handleChange} />
                  </div>

                  {/* Preview — full width */}
                  {hasPreview && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <TurnoPreview
                        form={form}
                        profesionales={profesionales}
                        clientes={clientes}
                      />
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div style={{
                  display: "flex", gap: 10, marginTop: 20,
                  paddingTop: 18, borderTop: `1px solid ${T.border}`,
                }}>
                  <BtnPrimary loading={submitting} disabled={submitting || loadingSelects || success}>
                    {submitting ? "Guardando..." : "✓ Crear turno"}
                  </BtnPrimary>
                  <BtnSecondary onClick={() => navigate("/agenda")} disabled={submitting}>
                    Cancelar
                  </BtnSecondary>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
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
