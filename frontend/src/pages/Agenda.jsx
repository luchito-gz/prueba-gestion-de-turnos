// ─────────────────────────────────────────────────────────────────────────────
// Agenda.jsx — drop-in replacement para frontend/src/pages/Agenda.jsx
// Stack: React 18 + Vite + React Router v6 + Axios (sin librerías extra)
// Vistas: Día / Semana / Mes  |  Estilos: dark theme (matching PR screenshot)
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── CSS injection (scoped con prefijo ag-) ───────────────────────────────────
;(() => {
  if (document.getElementById('ag-styles')) return
  const s = document.createElement('style')
  s.id = 'ag-styles'
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    @keyframes ag-spin { to { transform: rotate(360deg); } }
    .ag-scroll::-webkit-scrollbar { width: 8px; }
    .ag-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 4px; }
    .ag-ev:hover { transform: translateY(-1px) !important; z-index: 10 !important; box-shadow: 0 8px 24px rgba(0,0,0,.5) !important; }
    .ag-nb:hover { background: rgba(255,255,255,.07) !important; color: #e7ecf5 !important; }
    .ag-gb:hover { background: rgba(255,255,255,.06) !important; color: #e7ecf5 !important; }
    .ag-mc:hover { background: rgba(255,255,255,.04) !important; }
    .ag-dc:hover { background: rgba(56,189,248,.06) !important; }
  `
  document.head.appendChild(s)
})()

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#070a12', bgGlow: '#0e1730',
  panel: 'rgba(255,255,255,.025)', panel2: 'rgba(255,255,255,.05)',
  border: 'rgba(255,255,255,.07)', borderStrong: 'rgba(255,255,255,.13)',
  text: '#e7ecf5', textDim: '#98a3b6', textMute: '#5a6478',
  accent: '#38bdf8', accent2: '#2b82f6',
  ok:   '#2dd4bf', okBg:   'rgba(45,212,191,.12)', okBd:   'rgba(45,212,191,.32)',
  wait: '#fbbf24', waitBg: 'rgba(251,191,36,.12)', waitBd: 'rgba(251,191,36,.32)',
  can:  '#f87171', canBg:  'rgba(248,113,113,.1)', canBd:  'rgba(248,113,113,.28)',
  done: '#818cf8', doneBg: 'rgba(129,140,248,.12)',doneBd: 'rgba(129,140,248,.28)',
  ai:   '#a78bfa', aiBg:   'rgba(167,139,250,.1)', aiBd:   'rgba(167,139,250,.3)',
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS = {
  confirmado: { label: 'Confirmado', color: C.ok,   bg: C.okBg,   bd: C.okBd   },
  pendiente:  { label: 'En espera',  color: C.wait, bg: C.waitBg, bd: C.waitBd },
  cancelado:  { label: 'Cancelado',  color: C.can,  bg: C.canBg,  bd: C.canBd  },
  completado: { label: 'Completado', color: C.done, bg: C.doneBg, bd: C.doneBd },
}
const stCfg = s => STATUS[s?.toLowerCase()] || { label: s || '—', color: C.textDim, bg: C.panel, bd: C.border }

// ─── Grid constants ───────────────────────────────────────────────────────────
const HOUR_H = 56, START_H = 7, END_H = 20
const HOURS  = Array.from({ length: END_H - START_H }, (_, i) => i + START_H)
const DOW    = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DOWL   = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const MES    = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const TOTAL_H = (END_H - START_H) * HOUR_H

// ─── Date helpers ─────────────────────────────────────────────────────────────
const p2      = n  => String(n).padStart(2, '0')
const toISO   = d  => `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}`
const addD    = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
const monday  = d  => { const r = new Date(d), day = r.getDay(); r.setDate(r.getDate() - (day === 0 ? 6 : day - 1)); return r }
const dowIdx  = d  => (d.getDay() + 6) % 7
const isToday = d  => toISO(new Date()) === toISO(d)
const fmtH    = s  => s ? new Date(s).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--'
const evTop   = s  => { if (!s) return 0; const d = new Date(s); return Math.max(0, (d.getHours() * 60 + d.getMinutes() - START_H * 60) / 60 * HOUR_H) }
const evHpx   = (s, e) => { if (!s || !e) return 28; return Math.max((new Date(e) - new Date(s)) / 60000 / 60 * HOUR_H - 4, 28) }
const nowPx   = ()  => { const n = new Date(); return (n.getHours() * 60 + n.getMinutes() - START_H * 60) / 60 * HOUR_H }

// Detecta huecos ≥ 45 min entre turnos (IA free-slot hint, frontend-only)
function freeSlots(turnos) {
  const v = turnos
    .filter(t => t.fecha_inicio && t.fecha_fin)
    .map(t => ({ s: new Date(t.fecha_inicio).getHours() * 60 + new Date(t.fecha_inicio).getMinutes(), e: new Date(t.fecha_fin).getHours() * 60 + new Date(t.fecha_fin).getMinutes() }))
    .sort((a, b) => a.s - b.s)
  const slots = []; let cur = START_H * 60
  for (const { s, e } of v) { if (s - cur >= 45) slots.push({ s: cur, e: s, dur: s - cur }); cur = Math.max(cur, e) }
  if (END_H * 60 - cur >= 45) slots.push({ s: cur, e: END_H * 60, dur: END_H * 60 - cur })
  return slots
}

// ─── Componentes pequeños ─────────────────────────────────────────────────────
function Badge({ estado }) {
  const c = stCfg(estado)
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: c.bg, color: c.color, border: `1px solid ${c.bd}` }}>{c.label}</span>
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 60 }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${C.border}`, borderTopColor: C.accent, animation: 'ag-spin .7s linear infinite' }} />
    </div>
  )
}

// ─── TopNav ───────────────────────────────────────────────────────────────────
function TopNav({ negocio, onNav, onLogout }) {
  const init = (negocio?.nombre || 'T')[0].toUpperCase()
  const items = [
    { l: 'Agenda',         p: '/agenda',        active: true },
    { l: 'Pacientes',      p: '/clientes' },
    { l: 'Profesionales',  p: '/profesionales' },
    { l: 'Reportes',       p: null },
    { l: 'Configuración',  p: null },
  ]
  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 28px', height: 60, flexShrink: 0, borderBottom: `1px solid ${C.border}`, background: 'rgba(7,10,18,.88)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `linear-gradient(150deg,${C.accent},${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px rgba(43,130,246,.4)` }}>
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#04263f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4.5" width="18" height="16" rx="3" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /><circle cx="12" cy="14.5" r="2.4" />
          </svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: -.3 }}>Turno<span style={{ color: C.accent }}>IA</span></span>
      </div>
      {/* Nav items */}
      <div style={{ display: 'flex', gap: 4 }}>
        {items.map(({ l, p, active }) => (
          <button key={l} className="ag-nb" onClick={() => p && onNav(p)} style={{ padding: '8px 13px', borderRadius: 9, fontWeight: 600, fontSize: 13.5, color: active ? C.text : C.textDim, background: active ? C.panel2 : 'transparent', boxShadow: active ? `inset 0 0 0 1px ${C.borderStrong}` : 'none', border: 'none', cursor: p ? 'pointer' : 'default', transition: '.15s' }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="ag-gb" onClick={onLogout} style={{ padding: '7px 14px', borderRadius: 9, fontWeight: 600, fontSize: 13, color: C.can, background: 'rgba(248,113,113,.1)', border: `1px solid rgba(248,113,113,.25)`, cursor: 'pointer', transition: '.15s' }}>
          Salir
        </button>
        <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#04263f', background: `linear-gradient(150deg,${C.accent},${C.accent2})` }}>
          {init}
        </div>
      </div>
    </nav>
  )
}

// ─── KPI strip ────────────────────────────────────────────────────────────────
function KPIs({ turnos }) {
  const n = { p: 0, c: 0, ca: 0, co: 0 }
  turnos.forEach(t => {
    const s = t.estado?.toLowerCase()
    if (s === 'pendiente') n.p++
    else if (s === 'confirmado') n.c++
    else if (s === 'cancelado') n.ca++
    else if (s === 'completado') n.co++
  })
  const pct = turnos.length ? Math.round(n.co / turnos.length * 100) : 0
  const cards = [
    { l: 'Turnos del día', v: turnos.length, sub: `${n.c} confirmados`,     ac: C.accent },
    { l: 'En espera',      v: n.p,           sub: 'pendientes de confirmar', ac: C.wait },
    { l: 'Completados',    v: n.co,          sub: `${pct}% del día`,         ac: C.ok },
    { l: 'Cancelados',     v: n.ca,          sub: 'en esta fecha',           ac: C.can },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ padding: '16px 18px', borderRadius: 14, background: C.panel, boxShadow: `inset 0 0 0 1px ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${c.ac},transparent)` }} />
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.textMute, textTransform: 'uppercase' }}>{c.l}</div>
          <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, marginTop: 8, lineHeight: 1, color: C.text, fontVariantNumeric: 'tabular-nums' }}>{c.v}</div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 8 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Grid infra compartida ────────────────────────────────────────────────────
function Gutter() {
  return (
    <div style={{ width: 58, flexShrink: 0, borderRight: `1px solid ${C.border}` }}>
      {HOURS.map(h => (
        <div key={h} style={{ height: HOUR_H, position: 'relative' }}>
          <span style={{ position: 'absolute', top: -8, right: 8, fontSize: 11, color: C.textMute, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{p2(h)}:00</span>
        </div>
      ))}
    </div>
  )
}

function HLines() {
  return HOURS.map(h => <div key={h} style={{ position: 'absolute', left: 0, right: 0, top: (h - START_H) * HOUR_H, borderTop: `1px solid rgba(255,255,255,.04)`, pointerEvents: 'none' }} />)
}

function NowLine() {
  const t = nowPx()
  if (t < 0 || t > TOTAL_H) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: t, height: 2, background: C.accent, zIndex: 4, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: -4, top: -4, width: 10, height: 10, borderRadius: '50%', background: C.accent, boxShadow: `0 0 8px ${C.accent}` }} />
    </div>
  )
}

function EvCard({ t, onEdit, compact }) {
  const c = stCfg(t.estado)
  return (
    <div className="ag-ev" onClick={() => onEdit(t)} style={{ position: 'absolute', top: evTop(t.fecha_inicio), height: evHpx(t.fecha_inicio, t.fecha_fin), left: compact ? 3 : 5, right: compact ? 3 : 5, borderRadius: 9, padding: compact ? '4px 6px 4px 9px' : '6px 9px 6px 12px', background: c.bg, boxShadow: `inset 0 0 0 1px ${C.borderStrong}`, cursor: 'pointer', overflow: 'hidden', transition: 'transform .12s', zIndex: 2 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: c.color, borderRadius: 3 }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: c.color, fontVariantNumeric: 'tabular-nums' }}>{fmtH(t.fecha_inicio)}</div>
      {!compact && <div style={{ fontWeight: 700, fontSize: 12, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: C.text }}>{t.cliente?.nombre || '—'}</div>}
      {!compact && <div style={{ fontSize: 11, color: C.textDim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.profesional?.nombre || '—'}</div>}
    </div>
  )
}

function FreeSlot({ slot }) {
  const hS = Math.floor(slot.s / 60), mS = slot.s % 60, hE = Math.floor(slot.e / 60), mE = slot.e % 60
  return (
    <div style={{ position: 'absolute', top: (slot.s - START_H * 60) / 60 * HOUR_H, height: Math.max(slot.dur / 60 * HOUR_H - 4, 22), left: 5, right: 5, zIndex: 1, borderRadius: 7, padding: '4px 10px', background: `repeating-linear-gradient(135deg,${C.aiBg} 0 8px,transparent 8px 16px)`, border: `1px dashed ${C.aiBd}`, display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
      <span style={{ color: C.ai, fontWeight: 700, fontSize: 11 }}>✦</span>
      <span style={{ color: C.textDim, fontSize: 11, whiteSpace: 'nowrap' }}>{p2(hS)}:{p2(mS)} – {p2(hE)}:{p2(mE)} · {slot.dur} min libres</span>
    </div>
  )
}

// ─── Vista DÍA ────────────────────────────────────────────────────────────────
function DayView({ turnos, date, onEdit }) {
  const slots = freeSlots(turnos)
  return (
    <div>
      {/* Header del día */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ width: 58, flexShrink: 0, borderRight: `1px solid ${C.border}` }} />
        <div style={{ flex: 1, padding: '14px 20px', background: isToday(date) ? 'rgba(56,189,248,.05)' : 'transparent' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.textMute, textTransform: 'uppercase' }}>{DOWL[dowIdx(date)]}</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -1, color: isToday(date) ? C.accent : C.text, fontVariantNumeric: 'tabular-nums' }}>{date.getDate()}</span>
            <span style={{ fontSize: 16, color: C.textDim, fontWeight: 600 }}>{MES[date.getMonth()]} {date.getFullYear()}</span>
          </div>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 5 }}>
            {turnos.length} turno{turnos.length !== 1 ? 's' : ''} · {turnos.filter(t => t.estado === 'confirmado').length} confirmados · {turnos.filter(t => t.estado === 'pendiente').length} en espera
          </div>
        </div>
      </div>
      {/* Timeline */}
      <div className="ag-scroll" style={{ display: 'flex', maxHeight: 580, overflowY: 'auto' }}>
        <Gutter />
        <div style={{ flex: 1, position: 'relative', height: TOTAL_H, background: isToday(date) ? 'rgba(56,189,248,.015)' : 'transparent' }}>
          <HLines />
          {isToday(date) && <NowLine />}
          {slots.map((s, i) => <FreeSlot key={i} slot={s} />)}
          {turnos.filter(t => t.fecha_inicio).map(t => <EvCard key={t.id} t={t} onEdit={onEdit} />)}
          {turnos.length === 0 && (
            <div style={{ position: 'absolute', top: '40%', left: 0, right: 0, textAlign: 'center', color: C.textMute, fontSize: 14 }}>
              No hay turnos para este día.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Vista SEMANA ─────────────────────────────────────────────────────────────
function WeekView({ turnosByDate, weekStart, onEdit, onDayClick }) {
  const days = Array.from({ length: 7 }, (_, i) => addD(weekStart, i))
  return (
    <div>
      {/* Cabecera de días */}
      <div style={{ display: 'grid', gridTemplateColumns: `58px repeat(7,1fr)`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ borderRight: `1px solid ${C.border}` }} />
        {days.map((d, i) => {
          const ts = turnosByDate[toISO(d)] || []
          const today = isToday(d)
          return (
            <div key={i} className="ag-dc" onClick={() => onDayClick(d)} style={{ padding: '10px 6px', textAlign: 'center', borderRight: i < 6 ? `1px solid ${C.border}` : 'none', background: today ? 'rgba(56,189,248,.06)' : 'transparent', cursor: 'pointer', transition: '.12s' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.textMute, textTransform: 'uppercase' }}>{DOW[i]}</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, lineHeight: 1, color: today ? C.accent : C.text, fontVariantNumeric: 'tabular-nums' }}>{d.getDate()}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 5 }}>{ts.length ? `${ts.length} turno${ts.length !== 1 ? 's' : ''}` : '—'}</div>
            </div>
          )
        })}
      </div>
      {/* Grid horario */}
      <div className="ag-scroll" style={{ display: 'grid', gridTemplateColumns: `58px repeat(7,1fr)`, maxHeight: 580, overflowY: 'auto' }}>
        <Gutter />
        {days.map((d, i) => {
          const ts = turnosByDate[toISO(d)] || []
          return (
            <div key={i} style={{ position: 'relative', height: TOTAL_H, borderRight: i < 6 ? `1px solid ${C.border}` : 'none', background: isToday(d) ? 'rgba(56,189,248,.015)' : 'transparent' }}>
              <HLines />
              {isToday(d) && <NowLine />}
              {ts.filter(t => t.fecha_inicio).map(t => <EvCard key={t.id} t={t} onEdit={onEdit} compact />)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Vista MES ────────────────────────────────────────────────────────────────
function MonthView({ turnosByDate, currentDate, onDayClick }) {
  const y = currentDate.getFullYear(), m = currentDate.getMonth()
  const firstDay = new Date(y, m, 1)
  const gridStart = monday(firstDay)
  // Calcular celdas necesarias para cubrir el mes completo en semanas de lunes a domingo
  const lastDay = new Date(y, m + 1, 0)
  const lastDow = dowIdx(lastDay)
  const totalCells = dowIdx(firstDay) + lastDay.getDate() + (lastDow < 6 ? 6 - lastDow : 0)

  return (
    <div>
      {/* Cabecera días de la semana */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: `1px solid ${C.border}` }}>
        {DOWL.map((d, i) => (
          <div key={d} style={{ padding: '10px 12px', fontSize: 11, fontWeight: 700, letterSpacing: 1, color: C.textMute, textTransform: 'uppercase', borderRight: i < 6 ? `1px solid ${C.border}` : 'none' }}>{d}</div>
        ))}
      </div>
      {/* Celdas del mes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {Array.from({ length: totalCells }, (_, i) => {
          const d = addD(gridStart, i)
          const inMonth = d.getMonth() === m
          const iso = toISO(d)
          const ts = turnosByDate[iso]
          const today = isToday(d)
          const chips = (ts || []).slice(0, 3)
          const extra = ts ? Math.max(0, ts.length - 3) : 0

          return (
            <div key={i} className="ag-mc" onClick={() => onDayClick(d)} style={{ minHeight: 100, padding: 8, borderRight: (i % 7) < 6 ? `1px solid ${C.border}` : 'none', borderBottom: `1px solid ${C.border}`, opacity: inMonth ? 1 : .3, background: today ? 'rgba(56,189,248,.05)' : 'transparent', cursor: 'pointer', transition: '.12s', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Número del día */}
              {today ? (
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `linear-gradient(150deg,${C.accent},${C.accent2})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#04263f', fontVariantNumeric: 'tabular-nums' }}>{d.getDate()}</div>
              ) : (
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textDim, fontVariantNumeric: 'tabular-nums' }}>{d.getDate()}</div>
              )}
              {/* Loading hint */}
              {ts === undefined && inMonth && <div style={{ fontSize: 10, color: C.textMute }}>···</div>}
              {/* Event chips */}
              {chips.map((t, ci) => {
                const c = stCfg(t.estado)
                return (
                  <div key={ci} style={{ fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4, background: c.bg, borderLeft: `2px solid ${c.color}`, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {fmtH(t.fecha_inicio)} {t.cliente?.nombre || '—'}
                  </div>
                )
              })}
              {extra > 0 && <div style={{ fontSize: 10, color: C.textMute, fontWeight: 700 }}>+{extra} más</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── AGENDA — componente principal ───────────────────────────────────────────
export default function Agenda() {
  const navigate  = useNavigate()
  const { logout, negocio } = useAuth()

  const [view,         setView]         = useState('week')
  const [currentDate,  setCurrentDate]  = useState(new Date())
  const [turnosByDate, setTurnosByDate] = useState({})
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  // ── Fetch: carga las fechas necesarias según la vista ─────────────────────
  useEffect(() => {
    let cancelled = false

    const load = async (dates) => {
      setLoading(true)
      setError('')
      try {
        const results = await Promise.all(
          dates.map(d =>
            api.get('/turnos', { params: { fecha: d } })
              .then(r => [d, r.data || []])
              .catch(() => [d, []])  // un día fallido no corta todo
          )
        )
        if (!cancelled) {
          setTurnosByDate(prev => ({ ...prev, ...Object.fromEntries(results) }))
        }
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.detail || e.message || 'Error al cargar turnos.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    const iso = toISO(currentDate)
    if (view === 'day') {
      load([iso])
    } else if (view === 'week') {
      const mon = monday(currentDate)
      load(Array.from({ length: 7 }, (_, i) => toISO(addD(mon, i))))
    } else {
      const y = currentDate.getFullYear(), m = currentDate.getMonth()
      const days = new Date(y, m + 1, 0).getDate()
      load(Array.from({ length: days }, (_, i) => toISO(new Date(y, m, i + 1))))
    }

    return () => { cancelled = true }
  }, [view, currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()])

  // ── Navegación de fechas ───────────────────────────────────────────────────
  const shift = dir => setCurrentDate(prev => {
    if (view === 'day')   return addD(prev, dir)
    if (view === 'week')  return addD(prev, dir * 7)
    return new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
  })

  const onDayClick  = d => { setCurrentDate(d); setView('day') }
  const onEventEdit = t => navigate(`/turnos/${t.id}`)
  const onLogout    = () => { logout(); navigate('/login') }

  // ── Etiqueta del rango según vista ────────────────────────────────────────
  const rangeLabel = () => {
    if (view === 'day') return `${DOWL[dowIdx(currentDate)]} ${currentDate.getDate()}, ${MES[currentDate.getMonth()]}`
    if (view === 'week') {
      const mon = monday(currentDate), sun = addD(mon, 6)
      return mon.getMonth() === sun.getMonth()
        ? `${mon.getDate()} – ${sun.getDate()} ${MES[mon.getMonth()]}`
        : `${mon.getDate()} ${MES[mon.getMonth()].slice(0,3)} – ${sun.getDate()} ${MES[sun.getMonth()].slice(0,3)}`
    }
    return MES[currentDate.getMonth()]
  }

  // KPIs: siempre muestran el día seleccionado (o hoy si hay datos)
  const kpiTurnos = turnosByDate[toISO(currentDate)] || []
  const todayKey  = toISO(new Date())
  const todayCount = turnosByDate[todayKey]?.length

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(1100px 500px at 50% -5%, ${C.bgGlow} 0%, transparent 60%), ${C.bg}`, color: C.text, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", WebkitFontSmoothing: 'antialiased', boxSizing: 'border-box' }}>

      <TopNav negocio={negocio} onNav={navigate} onLogout={onLogout} />

      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '28px 28px 60px' }}>

        {/* Encabezado de página */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 22 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -.5, color: C.text }}>Agenda</h1>
            <div style={{ color: C.textDim, fontSize: 13.5, marginTop: 5 }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {todayCount !== undefined && <> · <b style={{ color: C.text }}>{todayCount} turno{todayCount !== 1 ? 's' : ''}</b> programados hoy</>}
            </div>
          </div>
          <button onClick={() => navigate('/nuevo-turno')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 11, fontWeight: 700, fontSize: 14, background: `linear-gradient(150deg,${C.accent},${C.accent2})`, color: '#04263f', border: 'none', cursor: 'pointer', boxShadow: `0 6px 18px rgba(43,130,246,.35)`, whiteSpace: 'nowrap', transition: '.15s' }}>
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Nuevo turno
          </button>
        </div>

        {/* KPIs */}
        <KPIs turnos={kpiTurnos} />

        {/* Error */}
        {error && <div style={{ background: 'rgba(248,113,113,.1)', color: C.can, border: `1px solid ${C.canBd}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>{error}</div>}

        {/* Toolbar: fecha + segmented */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          {/* Navegación de fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="ag-gb" onClick={() => shift(-1)} style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDim, background: C.panel, border: `1px solid ${C.border}`, cursor: 'pointer', transition: '.15s' }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m15 6-6 6 6 6" /></svg>
              </button>
              <button className="ag-gb" onClick={() => setCurrentDate(new Date())} style={{ padding: '0 14px', height: 36, borderRadius: 9, fontWeight: 600, fontSize: 13, color: C.textDim, background: C.panel, border: `1px solid ${C.border}`, cursor: 'pointer', transition: '.15s' }}>Hoy</button>
              <button className="ag-gb" onClick={() => shift(1)}  style={{ width: 36, height: 36, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textDim, background: C.panel, border: `1px solid ${C.border}`, cursor: 'pointer', transition: '.15s' }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
              </button>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -.3, lineHeight: 1.15, color: C.text }}>{rangeLabel()}</div>
              <div style={{ fontSize: 11, color: C.textMute }}>{currentDate.getFullYear()}</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          {/* Segmented control Día / Semana / Mes */}
          <div style={{ display: 'flex', background: C.panel, borderRadius: 11, padding: 4, boxShadow: `inset 0 0 0 1px ${C.border}` }}>
            {[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: view === v ? '#04263f' : C.textDim, background: view === v ? `linear-gradient(150deg,${C.accent},${C.accent2})` : 'transparent', boxShadow: view === v ? `0 3px 10px rgba(43,130,246,.3)` : 'none', border: 'none', cursor: 'pointer', transition: '.15s' }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Calendario */}
        <div style={{ borderRadius: 14, background: C.panel, boxShadow: `inset 0 0 0 1px ${C.border}`, overflow: 'hidden', position: 'relative' }}>
          {/* Overlay de carga — no bloquea el layout */}
          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,10,18,.55)', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)' }}>
              <Spinner />
            </div>
          )}
          {view === 'day'   && <DayView   turnos={turnosByDate[toISO(currentDate)] || []} date={currentDate} onEdit={onEventEdit} />}
          {view === 'week'  && <WeekView  turnosByDate={turnosByDate} weekStart={monday(currentDate)} onEdit={onEventEdit} onDayClick={onDayClick} />}
          {view === 'month' && <MonthView turnosByDate={turnosByDate} currentDate={currentDate} onDayClick={onDayClick} />}
        </div>

        {/* Leyenda */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginTop: 14, color: C.textDim, fontSize: 12.5 }}>
          {Object.entries(STATUS).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: v.bg, border: `1px solid ${v.bd}`, display: 'inline-block' }} />
              {v.label}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: C.aiBg, border: `1px dashed ${C.aiBd}`, display: 'inline-block' }} />
            Hueco libre detectado
          </div>
        </div>

      </div>
    </div>
  )
}