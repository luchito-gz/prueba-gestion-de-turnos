import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── Temas ────────────────────────────────────────────────────────────────────
const THEMES = {
  light: {
    bg:"#f5f6fa", surface:"#ffffff", surfaceAlt:"#f8f9fc",
    border:"#e8eaf0", borderL:"#f0f1f6",
    primary:"#4f46e5", primaryL:"#ede9fe", primaryD:"#3730a3",
    text:"#1e1b3a", muted:"#7c7a99", light:"#b0aec8",
    danger:"#ef4444", dangerL:"#fef2f2",
    success:"#10b981", warn:"#f59e0b",
    navShadow:"0 1px 4px rgba(79,70,229,.07)",
    cardShadow:"0 2px 16px rgba(79,70,229,.08)",
    slotOcupado:   { bg:"#4f46e5", fg:"#ffffff", border:"#3730a3" },
    slotDisp:      { bg:"#f0fdf4", fg:"#166534", border:"#86efac" },
    slotLibre:     { bg:"#f8f9fc", fg:"#b0aec8", border:"#f0f1f6" },
    rowAlt:"#fafafe", theadBg:"#f8f9fc", legendBg:"#fafafe",
    toggleTrack:"#e2e0f8", inputScheme:"light",
  },
  dark: {
    bg:"#0e0e1c", surface:"#181830", surfaceAlt:"#12122a",
    border:"#2a2a4a", borderL:"#20203a",
    primary:"#818cf8", primaryL:"#1e1b4b", primaryD:"#6366f1",
    text:"#e2e4f0", muted:"#8b8fad", light:"#3d3f60",
    danger:"#f87171", dangerL:"#2d1515",
    success:"#34d399", warn:"#fbbf24",
    navShadow:"0 1px 8px rgba(0,0,0,.5)",
    cardShadow:"0 4px 28px rgba(0,0,0,.45)",
    slotOcupado:   { bg:"#3730a3", fg:"#c7d2fe", border:"#4338ca" },
    slotDisp:      { bg:"#064e3b", fg:"#6ee7b7", border:"#065f46" },
    slotLibre:     { bg:"#181830", fg:"#2d2f50", border:"#2a2a4a" },
    rowAlt:"#141428", theadBg:"#141428", legendBg:"#141428",
    toggleTrack:"#3730a3", inputScheme:"dark",
  },
};

const SPEC_COLORS = {
  light:{
    "Clínica":["#ede9fe","#6d28d9"], "Kinesiología":["#d1fae5","#065f46"],
    "Nutrición":["#fef9c3","#92400e"], "Odontología":["#fee2e2","#991b1b"],
    "Psicología":["#e0f2fe","#075985"], "Cardiología":["#fce7f3","#9d174d"],
  },
  dark:{
    "Clínica":["#2e1b6e","#c4b5fd"], "Kinesiología":["#064e3b","#6ee7b7"],
    "Nutrición":["#3b2200","#fcd34d"], "Odontología":["#450a0a","#fca5a5"],
    "Psicología":["#0c2844","#7dd3fc"], "Cardiología":["#3b0a2a","#f9a8d4"],
  },
};

// Colores de cabecera por clínica/especialidad
const CLINIC_ACCENT = {
  "Clínica":     ["#4f46e5","#6366f1"],
  "Kinesiología":["#059669","#10b981"],
  "Nutrición":   ["#d97706","#f59e0b"],
  "Odontología": ["#dc2626","#ef4444"],
  "Psicología":  ["#0284c7","#0ea5e9"],
  "Cardiología": ["#be185d","#ec4899"],
  "General":     ["#7c3aed","#a78bfa"],
};

const AVATAR_COLORS = [
  ["#a78bfa","#6d28d9"],["#67e8f9","#0e7490"],
  ["#fca5a5","#b91c1c"],["#86efac","#166534"],
  ["#fdba74","#92400e"],["#c4b5fd","#4c1d95"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hoyISO() { return new Date().toISOString().split("T")[0]; }
function formatTitulo(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return new Date(+y,+m-1,+d).toLocaleDateString("es-AR",{
    weekday:"long",day:"numeric",month:"long",year:"numeric"
  });
}
function formatHora(str) {
  if (!str) return "—";
  try { return new Date(str).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}); }
  catch { return "—"; }
}
function useHover() {
  const [h,set]=useState(false);
  return [h,{onMouseEnter:()=>set(true),onMouseLeave:()=>set(false)}];
}
function useTheme() {
  const [mode,setMode]=useState(()=>{
    try{return localStorage.getItem("turnoIA_theme")||"light";}catch{return "light";}
  });
  const toggle=()=>setMode(m=>{
    const n=m==="light"?"dark":"light";
    try{localStorage.setItem("turnoIA_theme",n);}catch{}
    return n;
  });
  return [mode,toggle];
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({mode,onToggle,T}){
  const [hov,hp]=useHover();
  const dark=mode==="dark";
  return(
    <button onClick={onToggle} {...hp}
      title={dark?"Cambiar a modo claro":"Cambiar a modo oscuro"}
      style={{
        display:"flex",alignItems:"center",gap:8,
        padding:"5px 12px",borderRadius:99,cursor:"pointer",
        border:`1.5px solid ${hov?T.primary:T.border}`,
        background:hov?T.primaryL:T.surface,
        color:hov?T.primary:T.muted,
        fontSize:12,fontWeight:700,fontFamily:"'Segoe UI',sans-serif",
        transition:"all .2s",whiteSpace:"nowrap",
      }}>
      <span style={{
        position:"relative",width:34,height:18,borderRadius:99,
        background:dark?T.toggleTrack:T.border,
        display:"inline-block",flexShrink:0,transition:"background .2s",
      }}>
        <span style={{
          position:"absolute",left:dark?18:2,top:2,
          width:14,height:14,borderRadius:"50%",
          background:"#fff",boxShadow:"0 1px 3px rgba(0,0,0,.25)",
          transition:"left .2s",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:8,
        }}>{dark?"🌙":"☀️"}</span>
      </span>
      <span>{dark?"Oscuro":"Claro"}</span>
    </button>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavLink({children,onClick,active,danger,T}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      padding:"5px 13px",borderRadius:7,border:"none",cursor:"pointer",
      fontSize:13,fontWeight:active?700:500,fontFamily:"'Segoe UI',sans-serif",
      background:danger?(hov?T.dangerL:"transparent"):active?T.primaryL:hov?T.primaryL+"55":"transparent",
      color:danger?T.danger:active?T.primary:T.muted,transition:"all .15s",
    }}>{children}</button>
  );
}
function NavBar({navigate,onLogout,mode,onToggle,T}){
  return(
    <nav style={{
      position:"sticky",top:0,zIndex:200,height:60,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 32px",background:T.surface,borderBottom:`1px solid ${T.border}`,
      boxShadow:T.navShadow,fontFamily:"'Segoe UI',sans-serif",
      transition:"background .3s,border-color .3s",
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{
          width:32,height:32,borderRadius:8,display:"flex",
          alignItems:"center",justifyContent:"center",
          background:`linear-gradient(135deg,${T.primary},${T.primaryD})`,
          color:"#fff",fontWeight:800,fontSize:15,
        }}>T</div>
        <span style={{fontWeight:800,fontSize:17,color:T.text,letterSpacing:"-.02em"}}>TurnoIA</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <NavLink active onClick={()=>navigate("/agenda")} T={T}>📅 Agenda</NavLink>
        <NavLink onClick={()=>navigate("/profesionales")} T={T}>👤 Profesionales</NavLink>
        <NavLink onClick={()=>navigate("/clientes")} T={T}>🧑‍🤝‍🧑 Clientes</NavLink>
        <div style={{width:1,height:24,background:T.border,margin:"0 8px"}}/>
        <ThemeToggle mode={mode} onToggle={onToggle} T={T}/>
        <div style={{width:1,height:24,background:T.border,margin:"0 4px 0 8px"}}/>
        <NavLink danger onClick={onLogout} T={T}>Cerrar sesión</NavLink>
      </div>
    </nav>
  );
}

// ─── DateNav ──────────────────────────────────────────────────────────────────
function DateNav({fecha,onChange,T}){
  const shift=days=>{
    const d=new Date(fecha+"T12:00");d.setDate(d.getDate()+days);
    onChange(d.toISOString().split("T")[0]);
  };
  const [h1,h1p]=useHover();const [h2,h2p]=useHover();
  const ArBtn=({hov,hp,onClick:oc,ch})=>(
    <button onClick={oc} {...hp} style={{
      width:28,height:28,border:"none",borderRadius:6,cursor:"pointer",
      background:hov?T.primaryL:"transparent",color:hov?T.primary:T.muted,
      fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Segoe UI',sans-serif",transition:"all .12s",
    }}>{ch}</button>
  );
  return(
    <div style={{
      display:"flex",alignItems:"center",gap:4,
      background:T.surface,border:`1px solid ${T.border}`,
      borderRadius:10,padding:4,boxShadow:"0 1px 4px rgba(0,0,0,.06)",
      transition:"background .3s,border-color .3s",
    }}>
      <ArBtn hov={h1} hp={h1p} onClick={()=>shift(-1)} ch="‹"/>
      <input type="date" value={fecha} onChange={e=>onChange(e.target.value)}
        style={{
          border:"none",background:"transparent",outline:"none",cursor:"pointer",
          fontSize:13,fontWeight:600,color:T.text,
          fontFamily:"'Segoe UI',sans-serif",padding:"0 4px",
          colorScheme:T.inputScheme,
        }}/>
      <ArBtn hov={h2} hp={h2p} onClick={()=>shift(1)} ch="›"/>
      {fecha!==hoyISO()&&(
        <button onClick={()=>onChange(hoyISO())} style={{
          border:`1px solid ${T.border}`,background:"transparent",borderRadius:6,
          fontSize:11,fontWeight:700,color:T.primary,cursor:"pointer",
          padding:"2px 8px",fontFamily:"'Segoe UI',sans-serif",
        }}>Hoy</button>
      )}
    </div>
  );
}

function PrimaryBtn({children,onClick,T}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      padding:"8px 18px",background:hov?T.primaryD:T.primary,
      color:"#fff",border:"none",borderRadius:9,fontWeight:700,fontSize:13,
      cursor:"pointer",fontFamily:"'Segoe UI',sans-serif",
      boxShadow:hov?"0 4px 14px rgba(99,102,241,.4)":"none",
      transform:hov?"translateY(-1px)":"none",transition:"all .15s",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

// ─── SpecFilter ───────────────────────────────────────────────────────────────
function SpecFilter({specs,value,onChange,tmode,T}){
  const sc=SPEC_COLORS[tmode];
  return(
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <span style={{fontSize:12,fontWeight:600,color:T.muted,whiteSpace:"nowrap"}}>🔬 Especialidad:</span>
      {["Todas",...specs].map(sp=>{
        const active=value===sp;
        const [bg,fg]=sc[sp]||[T.primaryL,T.primary];
        const [hov,hp]=useHover();
        return(
          <button key={sp} onClick={()=>onChange(sp)} {...hp} style={{
            padding:"4px 13px",borderRadius:99,cursor:"pointer",
            fontSize:12,fontWeight:active?700:500,fontFamily:"'Segoe UI',sans-serif",
            border:`1.5px solid ${active?fg:T.border}`,
            background:active?bg:hov?T.primaryL+"33":T.surface,
            color:active?fg:T.muted,transition:"all .12s",
          }}>{sp}</button>
        );
      })}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({icon,label,value,color,T}){
  return(
    <div style={{
      display:"flex",alignItems:"center",gap:10,
      background:T.surface,border:`1px solid ${T.border}`,
      borderRadius:10,padding:"10px 16px",minWidth:130,
      boxShadow:"0 1px 4px rgba(0,0,0,.05)",
      transition:"background .3s,border-color .3s",
    }}>
      <div style={{width:34,height:34,borderRadius:8,display:"flex",
                   alignItems:"center",justifyContent:"center",
                   fontSize:16,background:color+"33"}}>{icon}</div>
      <div>
        <div style={{fontSize:20,fontWeight:800,color:T.text,lineHeight:1}}>{value}</div>
        <div style={{fontSize:11,color:T.muted,marginTop:2,fontWeight:500}}>{label}</div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({nombre,idx,size=28}){
  const [c1,c2]=AVATAR_COLORS[idx%AVATAR_COLORS.length];
  return(
    <div style={{
      width:size,height:size,borderRadius:"50%",flexShrink:0,
      background:`linear-gradient(135deg,${c1},${c2})`,
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"#fff",fontSize:size*.38,fontWeight:700,
    }}>{(nombre||"?").charAt(0).toUpperCase()}</div>
  );
}

// ─── Slot cell ────────────────────────────────────────────────────────────────
function SlotCell({slot,turno,onOcupado,onDisponible,T}){
  const [hov,hp]=useHover();
  const estado=!slot?"libre":slot.disponible?"disponible":"ocupado";
  const cfg={ocupado:T.slotOcupado,disponible:T.slotDisp,libre:T.slotLibre}[estado];
  const click=estado!=="libre";
  const handle=()=>{
    if(estado==="ocupado"&&turno)onOcupado(turno);
    else if(estado==="disponible")onDisponible(slot);
  };
  return(
    <div {...(click?{...hp,onClick:handle}:{})}
      title={
        estado==="ocupado"&&turno
          ?`${turno.cliente?.nombre} · ${formatHora(turno.fecha_inicio)}–${formatHora(turno.fecha_fin)}`
          :estado==="disponible"?"Disponible — clic para agendar":""
      }
      style={{
        flex:1,minWidth:0,margin:"1px 3px",borderRadius:5,
        border:`1px solid ${cfg.border}`,
        background:hov&&click?cfg.bg+"cc":cfg.bg,
        color:cfg.fg,cursor:click?"pointer":"default",
        display:"flex",flexDirection:"column",justifyContent:"center",
        alignItems:"center",padding:"3px 4px",overflow:"hidden",
        transition:"all .12s",
        transform:hov&&click?"scale(1.03)":"scale(1)",
        boxShadow:hov&&click?`0 2px 10px ${T.primary}44`:"none",
        minHeight:36,
      }}>
      {estado==="ocupado"&&turno?(
        <>
          <span style={{fontSize:9,fontWeight:700,textAlign:"center",
                        overflow:"hidden",textOverflow:"ellipsis",
                        whiteSpace:"nowrap",maxWidth:"100%",paddingLeft:2,paddingRight:2}}>
            {turno.cliente?.nombre||"Turno"}
          </span>
          <span style={{fontSize:8,opacity:.8,marginTop:1}}>{formatHora(turno.fecha_inicio)}</span>
        </>
      ):estado==="disponible"?(
        <span style={{fontSize:9,fontWeight:600,opacity:.9}}>Disponible</span>
      ):(
        <span style={{fontSize:9,opacity:.2}}>—</span>
      )}
    </div>
  );
}

// ─── Loading / Error ──────────────────────────────────────────────────────────
function Loading({msg="Cargando...",T}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",
                 padding:"40px 0",gap:10,color:T.muted}}>
      <div style={{width:28,height:28,borderRadius:"50%",
                   border:`3px solid ${T.border}`,borderTopColor:T.primary,
                   animation:"spin .7s linear infinite"}}/>
      <span style={{fontSize:13}}>{msg}</span>
    </div>
  );
}
function ErrorBanner({msg,onRetry,T}){
  return(
    <div style={{
      background:T.dangerL,border:`1px solid ${T.danger}44`,borderRadius:10,
      padding:"10px 16px",marginBottom:12,fontSize:13,
      display:"flex",alignItems:"center",justifyContent:"space-between",color:T.danger,
    }}>
      <span>⚠️ {msg}</span>
      {onRetry&&<button onClick={onRetry} style={{
        background:"none",border:"none",color:T.danger,cursor:"pointer",
        fontWeight:700,fontSize:12,fontFamily:"'Segoe UI',sans-serif",
      }}>Reintentar</button>}
    </div>
  );
}

// ─── TARJETA DE CLÍNICA (colapsable) ─────────────────────────────────────────
function ClinicCard({
  especialidad, profesionales, disponibilidad, turnoIdx,
  allHoras, onOcupado, onDisponible, tmode, T, defaultOpen=true,
}){
  const [open,setOpen]=useState(defaultOpen);
  const [hHdr,hHdrp]=useHover();
  const [a1,a2]=CLINIC_ACCENT[especialidad]||CLINIC_ACCENT["General"];
  const sc=SPEC_COLORS[tmode];
  const [bg,fg]=sc[especialidad]||[T.primaryL,T.primary];

  // Stats de esta tarjeta
  const totalDisp=profesionales.reduce((acc,p)=>{
    const slots=disponibilidad[p.id]||[];
    return acc+slots.filter(s=>s.disponible).length;
  },0);
  const totalOcup=profesionales.reduce((acc,p)=>{
    return acc+Object.keys(turnoIdx[p.id]||{}).length;
  },0);

  return(
    <div style={{
      background:T.surface,border:`1px solid ${T.border}`,
      borderRadius:14,overflow:"hidden",
      boxShadow:T.cardShadow,
      transition:"box-shadow .2s,background .3s,border-color .3s",
      marginBottom:16,
    }}>
      {/* ── Cabecera colapsable ── */}
      <div
        {...hHdrp}
        onClick={()=>setOpen(o=>!o)}
        style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 20px",cursor:"pointer",userSelect:"none",
          background:hHdr
            ?(tmode==="dark"?`${a1}22`:`${a1}11`)
            :T.surface,
          borderBottom:open?`1px solid ${T.border}`:"none",
          transition:"background .15s",
        }}>
        {/* Izquierda: icono + nombre + badge */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Ícono de acento */}
          <div style={{
            width:40,height:40,borderRadius:10,flexShrink:0,
            background:`linear-gradient(135deg,${a1},${a2})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,boxShadow:`0 2px 8px ${a1}55`,
          }}>
            {{"Clínica":"🏥","Kinesiología":"🦴","Nutrición":"🥗",
              "Odontología":"🦷","Psicología":"🧠","Cardiología":"❤️"}[especialidad]||"🏪"}
          </div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16,fontWeight:800,color:T.text}}>{especialidad}</span>
              <span style={{
                padding:"2px 9px",borderRadius:99,fontSize:10,fontWeight:700,
                background:bg,color:fg,
              }}>{profesionales.length} prof.</span>
            </div>
            <div style={{display:"flex",gap:14,marginTop:3}}>
              <span style={{fontSize:11,color:T.success,fontWeight:600}}>
                ✅ {totalDisp} disponibles
              </span>
              <span style={{fontSize:11,color:T.primary,fontWeight:600}}>
                📋 {totalOcup} ocupados
              </span>
            </div>
          </div>
        </div>

        {/* Derecha: avatares + flecha */}
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Mini avatares apilados */}
          <div style={{display:"flex",alignItems:"center"}}>
            {profesionales.slice(0,4).map((p,i)=>(
              <div key={p.id} style={{
                marginLeft:i>0?-8:0,zIndex:4-i,position:"relative",
                border:`2px solid ${T.surface}`,borderRadius:"50%",
              }}>
                <Avatar nombre={p.nombre} idx={i} size={26}/>
              </div>
            ))}
            {profesionales.length>4&&(
              <div style={{
                marginLeft:-8,width:26,height:26,borderRadius:"50%",
                background:T.primaryL,border:`2px solid ${T.surface}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:9,fontWeight:700,color:T.primary,
              }}>+{profesionales.length-4}</div>
            )}
          </div>
          {/* Flecha */}
          <div style={{
            width:28,height:28,borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",
            background:T.primaryL,color:T.primary,
            fontSize:14,fontWeight:700,
            transform:open?"rotate(180deg)":"rotate(0deg)",
            transition:"transform .25s",
          }}>▾</div>
        </div>
      </div>

      {/* ── Contenido colapsable ── */}
      <div style={{
        maxHeight:open?"1200px":"0px",
        overflow:"hidden",
        transition:"max-height .35s cubic-bezier(.4,0,.2,1)",
      }}>
        {/* Grilla horaria */}
        <div style={{overflowX:"auto"}}>
          <table style={{
            width:"100%",borderCollapse:"collapse",
            minWidth:68+profesionales.length*130,
          }}>
            {/* Cabecera profesionales */}
            <thead>
              <tr style={{background:T.theadBg,transition:"background .3s"}}>
                <th style={{
                  width:68,minWidth:68,padding:"10px 8px",
                  borderBottom:`1px solid ${T.border}`,
                  borderRight:`1px solid ${T.border}`,
                  position:"sticky",left:0,background:T.theadBg,zIndex:2,
                }}>
                  <span style={{fontSize:10,color:T.muted,fontWeight:700,
                                textTransform:"uppercase",letterSpacing:".06em"}}>Hora</span>
                </th>
                {profesionales.map((prof,pi)=>(
                  <th key={prof.id} style={{
                    padding:"12px 8px 10px",
                    borderBottom:`1px solid ${T.border}`,
                    borderLeft:`1px solid ${T.borderL}`,
                    minWidth:130,fontWeight:"normal",
                    background:pi%2===1?T.rowAlt:T.theadBg,
                    transition:"background .3s",
                  }}>
                    <div style={{display:"flex",flexDirection:"column",
                                 alignItems:"center",gap:5}}>
                      <Avatar nombre={prof.nombre} idx={pi} size={30}/>
                      <span style={{fontSize:11,fontWeight:700,color:T.text,
                                    textAlign:"center",lineHeight:1.2}}>
                        {prof.nombre}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Filas horarios */}
            <tbody>
              {allHoras.length===0?(
                <tr><td colSpan={profesionales.length+1}>
                  <div style={{textAlign:"center",padding:"24px 0",
                               color:T.muted,fontSize:12}}>
                    Sin horarios configurados.
                  </div>
                </td></tr>
              ):allHoras.map((hora,hi)=>{
                const esCadaHora=hora.endsWith(":00");
                return(
                  <tr key={hora} style={{
                    background:hi%2===0?T.surface:T.rowAlt,
                    borderBottom:`1px solid ${esCadaHora?T.border:T.borderL}`,
                    transition:"background .3s",
                  }}>
                    {/* Hora */}
                    <td style={{
                      width:68,minWidth:68,padding:"3px 8px",
                      borderRight:`1px solid ${T.border}`,
                      position:"sticky",left:0,zIndex:1,
                      background:hi%2===0?T.surface:T.rowAlt,
                      textAlign:"center",transition:"background .3s",
                    }}>
                      <span style={{
                        fontSize:esCadaHora?12:11,
                        fontWeight:esCadaHora?700:400,
                        color:esCadaHora?T.text:T.light,
                      }}>{hora}</span>
                    </td>

                    {/* Slots */}
                    {profesionales.map((prof,pi)=>{
                      const slots=disponibilidad[prof.id]||[];
                      const slot=slots.find(s=>s.hora===hora)||null;
                      const turno=turnoIdx[prof.id]?.[hora]||null;
                      return(
                        <td key={prof.id} style={{
                          padding:"2px 0",
                          borderLeft:`1px solid ${T.borderL}`,
                          background:pi%2===1
                            ?(hi%2===0?T.rowAlt:T.surfaceAlt)
                            :(hi%2===0?T.surface:T.rowAlt),
                          transition:"background .3s",
                        }}>
                          <div style={{display:"flex",padding:"0 2px"}}>
                            <SlotCell
                              slot={slot} turno={turno}
                              onOcupado={onOcupado}
                              onDisponible={s=>onDisponible(prof,s)}
                              T={T}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Leyenda dentro de la tarjeta */}
        <div style={{
          display:"flex",alignItems:"center",gap:18,padding:"8px 18px",
          borderTop:`1px solid ${T.border}`,background:T.legendBg,
          transition:"background .3s",
        }}>
          <span style={{fontSize:10,fontWeight:600,color:T.muted}}>Referencia:</span>
          {[
            {bg:T.slotOcupado.bg,border:T.slotOcupado.border,label:"Ocupado"},
            {bg:T.slotDisp.bg,   border:T.slotDisp.border,   label:"Disponible"},
            {bg:T.slotLibre.bg,  border:T.slotLibre.border,  label:"Sin horario"},
          ].map(({bg,border,label})=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:9,height:9,borderRadius:2,
                           background:bg,border:`1.5px solid ${border}`}}/>
              <span style={{fontSize:10,color:T.muted}}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PÁGINA PRINCIPAL ─────────────────────────────────────────────────────────
export default function Agenda(){
  const navigate=useNavigate();
  const {logout}=useAuth();
  const [tmode,toggleTheme]=useTheme();
  const T=THEMES[tmode];

  const [fecha,setFecha]=useState(hoyISO());
  const [profes,setProfes]=useState([]);
  const [disp,setDisp]=useState({});
  const [turnos,setTurnos]=useState([]);
  const [filtroSpec,setFiltroSpec]=useState("Todas");
  const [loadingProf,setLoadingProf]=useState(true);
  const [loadingGrid,setLoadingGrid]=useState(false);
  const [errorProf,setErrorProf]=useState("");
  const [errorGrid,setErrorGrid]=useState("");

  const fetchProfes=useCallback(async()=>{
    setLoadingProf(true);setErrorProf("");
    try{
      const r=await api.get("/profesionales");
      setProfes((r.data||[]).filter(p=>p.activo!==false));
    }catch(e){setErrorProf(e.response?.data?.detail||e.message||"Error al cargar profesionales.");}
    finally{setLoadingProf(false);}
  },[]);

  useEffect(()=>{fetchProfes();},[fetchProfes]);

  const fetchGrid=useCallback(async()=>{
    if(!profes.length)return;
    setLoadingGrid(true);setErrorGrid("");
    try{
      const[dispRes,tRes]=await Promise.all([
        Promise.allSettled(profes.map(p=>api.get("/disponibilidad",{params:{profesional_id:p.id,fecha}}))),
        api.get("/turnos",{params:{fecha}}),
      ]);
      const nd={};
      profes.forEach((p,i)=>{nd[p.id]=dispRes[i].status==="fulfilled"?dispRes[i].value.data:[];});
      setDisp(nd);
      setTurnos(tRes.data||[]);
    }catch(e){setErrorGrid(e.response?.data?.detail||e.message||"Error al cargar la agenda.");}
    finally{setLoadingGrid(false);}
  },[profes,fecha]);

  useEffect(()=>{fetchGrid();},[fetchGrid]);

  // Agrupar por especialidad
  const specs=[...new Set(profes.map(p=>p.especialidad).filter(Boolean))].sort();
  const profsFiltrados=filtroSpec==="Todas"?profes:profes.filter(p=>p.especialidad===filtroSpec);

  // Índice turnos por prof
  const turnoIdx={};
  turnos.forEach(t=>{
    const pid=t.profesional?.id;if(!pid)return;
    if(!turnoIdx[pid])turnoIdx[pid]={};
    turnoIdx[pid][formatHora(t.fecha_inicio)]=t;
  });

  // Union de horas
  const allHoras=[...new Set(Object.values(disp).flatMap(s=>s.map(x=>x.hora)))].sort();

  // Agrupar profesionales filtrados por especialidad
  const grupos={};
  profsFiltrados.forEach(p=>{
    const k=p.especialidad||"General";
    if(!grupos[k])grupos[k]=[];
    grupos[k].push(p);
  });

  const totalDisp=Object.values(disp).flatMap(s=>s).filter(s=>s.disponible).length;
  const handleLogout=()=>{logout();navigate("/login");};

  return(
    <>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg);}}
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:3px;}
      `}</style>

      <div style={{
        minHeight:"100vh",background:T.bg,
        fontFamily:"'Segoe UI',sans-serif",
        transition:"background .3s",
      }}>
        <NavBar
          navigate={navigate} onLogout={handleLogout}
          mode={tmode} onToggle={toggleTheme} T={T}
        />

        <main style={{maxWidth:1400,margin:"0 auto",padding:"24px 32px"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",
                       flexWrap:"wrap",gap:12,marginBottom:16}}>
            <div>
              <h1 style={{margin:0,fontSize:22,fontWeight:800,color:T.text,letterSpacing:"-.02em"}}>
                📅 Agenda de hoy
              </h1>
              <p style={{margin:"3px 0 0",fontSize:13,color:T.muted,textTransform:"capitalize"}}>
                {formatTitulo(fecha)}
              </p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <DateNav fecha={fecha} onChange={setFecha} T={T}/>
              <PrimaryBtn onClick={()=>navigate("/nuevo-turno")} T={T}>+ Nuevo turno</PrimaryBtn>
            </div>
          </div>

          {/* Filtro */}
          {specs.length>0&&(
            <div style={{marginBottom:16}}>
              <SpecFilter specs={specs} value={filtroSpec} onChange={setFiltroSpec} tmode={tmode} T={T}/>
            </div>
          )}

          {errorProf&&<ErrorBanner msg={errorProf} onRetry={fetchProfes} T={T}/>}
          {errorGrid&&<ErrorBanner msg={errorGrid} onRetry={fetchGrid} T={T}/>}

          {/* Stats */}
          {!loadingProf&&!errorProf&&(
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              <StatCard icon="🏥" label="Clínicas"           value={Object.keys(grupos).length} color={T.primary} T={T}/>
              <StatCard icon="👤" label="Profesionales"      value={profsFiltrados.length}       color={T.primaryD} T={T}/>
              <StatCard icon="✅" label="Slots disponibles"  value={totalDisp}                   color={T.success} T={T}/>
              <StatCard icon="📋" label="Turnos del día"     value={turnos.length}               color={T.warn} T={T}/>
            </div>
          )}

          {/* Tarjetas por clínica */}
          {loadingProf?(
            <Loading msg="Cargando profesionales..." T={T}/>
          ):Object.keys(grupos).length===0?(
            <div style={{textAlign:"center",padding:"48px 0",color:T.muted,fontSize:14}}>
              {filtroSpec!=="Todas"
                ?`No hay profesionales con especialidad "${filtroSpec}".`
                :"No hay profesionales registrados."}
            </div>
          ):Object.entries(grupos).map(([esp,profs],ci)=>(
            <ClinicCard
              key={esp}
              especialidad={esp}
              profesionales={profs}
              disponibilidad={disp}
              turnoIdx={turnoIdx}
              allHoras={allHoras}
              onOcupado={t=>navigate("/turnos/"+t.id)}
              onDisponible={(prof,slot)=>navigate(
                `/nuevo-turno?profesional_id=${prof.id}&fecha=${fecha}&hora=${slot.hora}`
              )}
              tmode={tmode}
              T={T}
              defaultOpen={ci===0}
            />
          ))}

        </main>
      </div>
    </>
  );
}
