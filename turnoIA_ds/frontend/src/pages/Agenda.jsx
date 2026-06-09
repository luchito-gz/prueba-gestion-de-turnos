import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

// ─── Design System ────────────────────────────────────────────────────────────
const DS = {
  pageBg:       "#050510",
  cardBg:       "rgba(15,23,42,0.95)",
  inputBg:      "#1e293b",
  hoverBg:      "#0f172a",
  blue:         "#2563eb",
  cyan:         "#06b6d4",
  gradient:     "linear-gradient(135deg,#2563eb,#06b6d4)",
  text:         "#ffffff",
  textSec:      "#94a3b8",
  textDis:      "#64748b",
  border:       "#334155",
  borderCard:   "#1e293b",
  borderFocus:  "#2563eb",
  errorBg:      "rgba(220,38,38,0.15)",
  errorBorder:  "rgba(220,38,38,0.30)",
  errorText:    "#fca5a5",
  font:         "'Space Grotesk',sans-serif",
};

const SPEC_COLORS = {
  "Clínica":      ["rgba(37,99,235,0.18)","#60a5fa"],
  "Kinesiología": ["rgba(6,182,212,0.18)","#67e8f9"],
  "Nutrición":    ["rgba(245,158,11,0.18)","#fcd34d"],
  "Odontología":  ["rgba(239,68,68,0.18)","#fca5a5"],
  "Psicología":   ["rgba(139,92,246,0.18)","#c4b5fd"],
  "Cardiología":  ["rgba(236,72,153,0.18)","#f9a8d4"],
};
const CLINIC_ACCENT = {
  "Clínica":      ["#2563eb","#3b82f6"],
  "Kinesiología": ["#0891b2","#06b6d4"],
  "Nutrición":    ["#d97706","#f59e0b"],
  "Odontología":  ["#dc2626","#ef4444"],
  "Psicología":   ["#7c3aed","#8b5cf6"],
  "Cardiología":  ["#be185d","#ec4899"],
  "General":      ["#2563eb","#06b6d4"],
};
const SLOT_S = {
  ocupado:    { bg:"rgba(37,99,235,0.25)", fg:"#93c5fd", border:"rgba(37,99,235,0.5)"  },
  disponible: { bg:"rgba(6,182,212,0.15)", fg:"#67e8f9", border:"rgba(6,182,212,0.4)" },
  libre:      { bg:"rgba(15,23,42,0.4)",   fg:"#334155", border:"#1e293b"              },
};
const AVATAR_G = [
  ["#6366f1","#2563eb"],["#06b6d4","#0284c7"],
  ["#8b5cf6","#6d28d9"],["#10b981","#059669"],
  ["#f59e0b","#d97706"],["#ec4899","#be185d"],
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hoyISO() { return new Date().toISOString().split("T")[0]; }
function formatTitulo(iso) {
  if (!iso) return "";
  const [y,m,d] = iso.split("-");
  return new Date(+y,+m-1,+d).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
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
  const [mode,setMode]=useState(()=>{try{return localStorage.getItem("turnoIA_theme")||"dark";}catch{return "dark";}});
  const toggle=()=>setMode(m=>{const n=m==="light"?"dark":"light";try{localStorage.setItem("turnoIA_theme",n);}catch{}return n;});
  return [mode,toggle];
}

// ─── Starfield (canvas animado) ───────────────────────────────────────────────
import { useRef } from "react";
function Starfield() {
  const ref = useRef(null);
  useEffect(()=>{
    const c=ref.current; if(!c)return;
    const ctx=c.getContext("2d");
    c.width=window.innerWidth; c.height=window.innerHeight;
    const stars=Array.from({length:120},()=>({
      x:Math.random()*c.width,y:Math.random()*c.height,
      r:Math.random()*1.4+0.4,o:Math.random()*0.5+0.3,
      s:Math.random()*0.4+0.1,
    }));
    let frame;
    const draw=()=>{
      ctx.clearRect(0,0,c.width,c.height);
      stars.forEach(s=>{
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${s.o})`; ctx.fill();
        s.o+=s.s*0.007; if(s.o>0.9||s.o<0.3)s.s*=-1;
      });
      frame=requestAnimationFrame(draw);
    };
    draw();
    const resize=()=>{c.width=window.innerWidth;c.height=window.innerHeight;};
    window.addEventListener("resize",resize);
    return ()=>{cancelAnimationFrame(frame);window.removeEventListener("resize",resize);};
  },[]);
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:0,pointerEvents:"none"}}/>;
}

// ─── NavBar ───────────────────────────────────────────────────────────────────
function NavBar({navigate,onLogout,mode,onToggle}) {
  return (
    <nav style={{
      position:"sticky",top:0,zIndex:200,height:60,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"0 28px",
      background:"rgba(5,5,16,0.85)",
      borderBottom:`1px solid ${DS.borderCard}`,
      backdropFilter:"blur(20px)",
      boxShadow:"0 1px 0 rgba(37,99,235,0.15)",
      fontFamily:DS.font,
    }}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{
          width:32,height:32,borderRadius:8,
          background:DS.gradient,
          display:"flex",alignItems:"center",justifyContent:"center",
          fontSize:16, boxShadow:"0 0 12px rgba(37,99,235,0.4)",
        }}>⚙️</div>
        <div>
          <span style={{fontWeight:700,fontSize:16,color:DS.text,letterSpacing:1}}>TurnoIA</span>
          <span style={{fontSize:9,textTransform:"uppercase",letterSpacing:3,color:DS.textSec,marginLeft:8}}>
            Gestión de turnos
          </span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        <NavLnk active onClick={()=>navigate("/agenda")}>📅 Agenda</NavLnk>
        <NavLnk onClick={()=>navigate("/profesionales")}>👤 Profesionales</NavLnk>
        <NavLnk onClick={()=>navigate("/clientes")}>🧑‍🤝‍🧑 Clientes</NavLnk>
        <div style={{width:1,height:22,background:DS.border,margin:"0 8px"}}/>
        <button onClick={onLogout} style={{
          padding:"4px 12px",borderRadius:7,border:`1px solid rgba(220,38,38,0.3)`,
          background:"transparent",color:DS.errorText,fontSize:12,fontWeight:600,
          cursor:"pointer",fontFamily:DS.font,transition:"all .15s",
        }}>Salir</button>
      </div>
    </nav>
  );
}
function NavLnk({children,onClick,active}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      padding:"4px 12px",borderRadius:7,border:"none",cursor:"pointer",
      fontSize:12,fontWeight:active?700:500,fontFamily:DS.font,
      background:active?"rgba(37,99,235,0.2)":hov?"rgba(255,255,255,0.05)":"transparent",
      color:active?DS.cyan:hov?DS.textSec:DS.textDis,
      transition:"all .15s",
    }}>{children}</button>
  );
}

// ─── DateNav ──────────────────────────────────────────────────────────────────
function DateNav({fecha,onChange}){
  const shift=d=>{const dt=new Date(fecha+"T12:00");dt.setDate(dt.getDate()+d);onChange(dt.toISOString().split("T")[0]);};
  return(
    <div style={{display:"flex",alignItems:"center",gap:3,background:DS.inputBg,border:`1px solid ${DS.border}`,borderRadius:9,padding:3}}>
      <ArrBtn onClick={()=>shift(-1)}>‹</ArrBtn>
      <input type="date" value={fecha} onChange={e=>onChange(e.target.value)} style={{
        border:"none",background:"transparent",outline:"none",cursor:"pointer",
        fontSize:13,fontWeight:600,color:DS.text,fontFamily:DS.font,
        padding:"0 4px",colorScheme:"dark",
      }}/>
      <ArrBtn onClick={()=>shift(1)}>›</ArrBtn>
      {fecha!==hoyISO()&&<button onClick={()=>onChange(hoyISO())} style={{
        border:`1px solid ${DS.border}`,background:"transparent",borderRadius:6,
        fontSize:11,fontWeight:700,color:DS.cyan,cursor:"pointer",
        padding:"2px 7px",fontFamily:DS.font,
      }}>Hoy</button>}
    </div>
  );
}
function ArrBtn({children,onClick}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      width:26,height:26,border:"none",borderRadius:5,cursor:"pointer",
      background:hov?"rgba(37,99,235,0.25)":"transparent",
      color:hov?DS.cyan:DS.textDis,
      fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:DS.font,transition:"all .12s",
    }}>{children}</button>
  );
}
function PrimaryBtn({children,onClick}){
  const [hov,hp]=useHover();
  return(
    <button onClick={onClick} {...hp} style={{
      padding:"7px 16px",background:DS.gradient,color:"#fff",
      border:"none",borderRadius:8,fontWeight:700,fontSize:13,
      cursor:"pointer",fontFamily:DS.font,
      filter:hov?"brightness(1.15)":"none",
      transform:hov?"translateY(-1px)":"none",
      boxShadow:hov?"0 4px 16px rgba(37,99,235,0.4)":"none",
      transition:"all .15s",whiteSpace:"nowrap",
    }}>{children}</button>
  );
}

// ─── Filtro especialidad ──────────────────────────────────────────────────────
function SpecFilter({specs,value,onChange}){
  return(
    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
      <span style={{fontSize:11,fontWeight:500,color:DS.textSec,textTransform:"uppercase",letterSpacing:1}}>🔬 Especialidad:</span>
      {["Todas",...specs].map(sp=>{
        const active=value===sp;
        const [bg,fg]=SPEC_COLORS[sp]||["rgba(37,99,235,0.18)","#60a5fa"];
        const [hov,hp]=useHover();
        return(
          <button key={sp} onClick={()=>onChange(sp)} {...hp} style={{
            padding:"3px 12px",borderRadius:99,cursor:"pointer",
            fontSize:11,fontWeight:active?700:500,fontFamily:DS.font,
            border:`1px solid ${active?fg:"rgba(255,255,255,0.1)"}`,
            background:active?bg:hov?"rgba(255,255,255,0.05)":"transparent",
            color:active?fg:DS.textDis,transition:"all .12s",
          }}>{sp}</button>
        );
      })}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
function StatCard({icon,label,value,color}){
  return(
    <div style={{
      display:"flex",alignItems:"center",gap:10,
      background:DS.cardBg,border:`1px solid ${DS.borderCard}`,
      borderRadius:10,padding:"9px 14px",minWidth:120,
      backdropFilter:"blur(12px)",
    }}>
      <div style={{width:32,height:32,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,background:color+"33"}}>{icon}</div>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:DS.text,lineHeight:1,fontFamily:DS.font}}>{value}</div>
        <div style={{fontSize:10,color:DS.textSec,marginTop:2,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      </div>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({nombre,idx,size=28}){
  const [c1,c2]=AVATAR_G[idx%AVATAR_G.length];
  return(
    <div style={{
      width:size,height:size,borderRadius:"50%",flexShrink:0,
      background:`linear-gradient(135deg,${c1},${c2})`,
      display:"flex",alignItems:"center",justifyContent:"center",
      color:"#fff",fontSize:size*.38,fontWeight:700,fontFamily:DS.font,
      boxShadow:`0 0 8px ${c1}66`,
    }}>{(nombre||"?").charAt(0).toUpperCase()}</div>
  );
}

// ─── Badge especialidad ───────────────────────────────────────────────────────
function SpecBadge({especialidad}){
  if(!especialidad)return null;
  const [bg,fg]=SPEC_COLORS[especialidad]||["rgba(37,99,235,0.18)","#60a5fa"];
  return(
    <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:700,background:bg,color:fg,
                  textTransform:"uppercase",letterSpacing:1,fontFamily:DS.font,whiteSpace:"nowrap"}}>
      {especialidad}
    </span>
  );
}

// ─── Slot ─────────────────────────────────────────────────────────────────────
function SlotCell({slot,turno,onOcupado,onDisponible}){
  const [hov,hp]=useHover();
  const estado=!slot?"libre":slot.disponible?"disponible":"ocupado";
  const cfg=SLOT_S[estado];
  const click=estado!=="libre";
  const handle=()=>{ if(estado==="ocupado"&&turno)onOcupado(turno); else if(estado==="disponible")onDisponible(slot); };
  return(
    <div {...(click?{...hp,onClick:handle}:{})}
      style={{
        flex:1,minWidth:0,margin:"1px 3px",borderRadius:5,
        border:`1px solid ${cfg.border}`,background:hov&&click?cfg.bg+"cc":cfg.bg,
        color:cfg.fg,cursor:click?"pointer":"default",
        display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",
        padding:"3px 4px",overflow:"hidden",
        transition:"all .12s",
        transform:hov&&click?"scale(1.04)":"scale(1)",
        boxShadow:hov&&click?`0 2px 12px ${DS.blue}44`:"none",
        minHeight:36,fontFamily:DS.font,
      }}>
      {estado==="ocupado"&&turno?(
        <>
          <span style={{fontSize:9,fontWeight:700,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"100%",width:"100%",paddingLeft:2,paddingRight:2}}>{turno.cliente?.nombre||"Turno"}</span>
          <span style={{fontSize:8,opacity:.75,marginTop:1}}>{formatHora(turno.fecha_inicio)}</span>
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
function Loading({msg="Cargando..."}){
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 0",gap:12,color:DS.textSec,fontFamily:DS.font}}>
      <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${DS.border}`,borderTopColor:DS.cyan,animation:"spin .7s linear infinite"}}/>
      <span style={{fontSize:13}}>{msg}</span>
    </div>
  );
}
function ErrorBanner({msg,onRetry}){
  return(
    <div style={{background:DS.errorBg,border:`1px solid ${DS.errorBorder}`,borderRadius:9,padding:"10px 14px",marginBottom:12,fontSize:13,color:DS.errorText,display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:DS.font}}>
      <span>⚠ {msg}</span>
      {onRetry&&<button onClick={onRetry} style={{background:"none",border:"none",color:DS.errorText,cursor:"pointer",fontWeight:700,fontSize:12,fontFamily:DS.font}}>Reintentar</button>}
    </div>
  );
}

// ─── Tarjeta de clínica ───────────────────────────────────────────────────────
function ClinicCard({especialidad,profesionales,disponibilidad,turnoIdx,allHoras,onOcupado,onDisponible,defaultOpen=true}){
  const [open,setOpen]=useState(defaultOpen);
  const [hov,hp]=useHover();
  const [a1,a2]=CLINIC_ACCENT[especialidad]||CLINIC_ACCENT["General"];
  const [specBg,specFg]=SPEC_COLORS[especialidad]||["rgba(37,99,235,0.18)","#60a5fa"];

  const totalDisp=profesionales.reduce((acc,p)=>{return acc+(disponibilidad[p.id]||[]).filter(s=>s.disponible).length;},0);
  const totalOcup=profesionales.reduce((acc,p)=>{return acc+Object.keys(turnoIdx[p.id]||{}).length;},0);

  const CLINIC_ICON={"Clínica":"🏥","Kinesiología":"🦴","Nutrición":"🥗","Odontología":"🦷","Psicología":"🧠","Cardiología":"❤️"};

  return(
    <div style={{
      background:DS.cardBg,border:`1px solid ${DS.borderCard}`,
      borderRadius:14,overflow:"hidden",marginBottom:12,
      backdropFilter:"blur(20px)",
      boxShadow:`0 4px 24px rgba(0,0,0,0.4)`,
      transition:"box-shadow .2s",
    }}>
      {/* Header colapsable */}
      <div {...hp} onClick={()=>setOpen(o=>!o)} style={{
        display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"12px 18px",cursor:"pointer",userSelect:"none",
        background:hov?"rgba(37,99,235,0.06)":"transparent",
        borderBottom:open?`1px solid ${DS.borderCard}`:"none",
        transition:"background .15s",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{
            width:40,height:40,borderRadius:10,flexShrink:0,
            background:`linear-gradient(135deg,${a1},${a2})`,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:18,boxShadow:`0 2px 12px ${a1}55`,
          }}>{CLINIC_ICON[especialidad]||"🏪"}</div>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:15,fontWeight:700,color:DS.text,fontFamily:DS.font}}>{especialidad}</span>
              <span style={{padding:"1px 8px",borderRadius:99,fontSize:9,fontWeight:700,background:specBg,color:specFg,textTransform:"uppercase",letterSpacing:.5}}>{profesionales.length} prof.</span>
            </div>
            <div style={{display:"flex",gap:12,marginTop:3}}>
              <span style={{fontSize:10,color:"#6ee7b7",fontWeight:600}}>✅ {totalDisp} disponibles</span>
              <span style={{fontSize:10,color:DS.cyan,fontWeight:600}}>📋 {totalOcup} ocupados</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex"}}>
            {profesionales.slice(0,4).map((p,i)=>(
              <div key={p.id} style={{marginLeft:i>0?-7:0,zIndex:4-i,position:"relative",border:`2px solid rgba(5,5,16,0.9)`,borderRadius:"50%"}}>
                <Avatar nombre={p.nombre} idx={i} size={24}/>
              </div>
            ))}
          </div>
          <div style={{
            width:24,height:24,borderRadius:"50%",
            display:"flex",alignItems:"center",justifyContent:"center",
            background:"rgba(37,99,235,0.2)",color:DS.cyan,fontSize:12,fontWeight:700,
            transform:open?"rotate(180deg)":"rotate(0deg)",transition:"transform .25s",
          }}>▾</div>
        </div>
      </div>

      {/* Contenido */}
      <div style={{maxHeight:open?"1200px":"0",overflow:"hidden",transition:"max-height .35s cubic-bezier(.4,0,.2,1)"}}>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:68+profesionales.length*130}}>
            <thead>
              <tr style={{background:"rgba(15,23,42,0.8)"}}>
                <th style={{width:64,padding:"9px 6px",borderBottom:`1px solid ${DS.borderCard}`,borderRight:`1px solid ${DS.borderCard}`,position:"sticky",left:0,background:"rgba(15,23,42,0.95)",zIndex:2}}>
                  <span style={{fontSize:9,color:DS.textSec,fontWeight:700,textTransform:"uppercase",letterSpacing:1,fontFamily:DS.font}}>Hora</span>
                </th>
                {profesionales.map((prof,pi)=>(
                  <th key={prof.id} style={{padding:"11px 6px 10px",borderBottom:`1px solid ${DS.borderCard}`,borderLeft:`1px solid ${DS.borderCard}`,minWidth:130,fontWeight:"normal",background:pi%2===1?"rgba(255,255,255,0.02)":"transparent"}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                      <Avatar nombre={prof.nombre} idx={pi} size={28}/>
                      <span style={{fontSize:11,fontWeight:700,color:DS.text,textAlign:"center",lineHeight:1.2,fontFamily:DS.font}}>{prof.nombre}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allHoras.length===0?(
                <tr><td colSpan={profesionales.length+1}>
                  <div style={{textAlign:"center",padding:"24px 0",color:DS.textDis,fontSize:12,fontFamily:DS.font}}>Sin horarios configurados.</div>
                </td></tr>
              ):allHoras.map((hora,hi)=>{
                const esCadaHora=hora.endsWith(":00");
                return(
                  <tr key={hora} style={{borderBottom:`1px solid ${esCadaHora?DS.borderCard:"rgba(30,41,59,0.4)"}`,background:hi%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
                    <td style={{width:64,padding:"3px 6px",borderRight:`1px solid ${DS.borderCard}`,position:"sticky",left:0,zIndex:1,background:hi%2===0?"rgba(5,5,16,0.95)":"rgba(10,15,30,0.95)",textAlign:"center"}}>
                      <span style={{fontSize:esCadaHora?11:10,fontWeight:esCadaHora?700:400,color:esCadaHora?DS.text:DS.textDis,fontFamily:DS.fontMono||DS.font}}>{hora}</span>
                    </td>
                    {profesionales.map((prof,pi)=>{
                      const slots=disponibilidad[prof.id]||[];
                      const slot=slots.find(s=>s.hora===hora)||null;
                      const turno=turnoIdx[prof.id]?.[hora]||null;
                      return(
                        <td key={prof.id} style={{padding:"2px 0",borderLeft:`1px solid ${DS.borderCard}`,background:pi%2===1?"rgba(255,255,255,0.015)":"transparent"}}>
                          <div style={{display:"flex",padding:"0 2px"}}>
                            <SlotCell slot={slot} turno={turno} onOcupado={onOcupado} onDisponible={s=>onDisponible(prof,s)}/>
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
        {/* Leyenda */}
        <div style={{display:"flex",alignItems:"center",gap:16,padding:"7px 16px",borderTop:`1px solid ${DS.borderCard}`,background:"rgba(15,23,42,0.6)"}}>
          <span style={{fontSize:9,fontWeight:700,color:DS.textDis,textTransform:"uppercase",letterSpacing:1,fontFamily:DS.font}}>Ref:</span>
          {[{bg:SLOT_S.ocupado.bg,brd:SLOT_S.ocupado.border,lbl:"Ocupado"},
            {bg:SLOT_S.disponible.bg,brd:SLOT_S.disponible.border,lbl:"Disponible"},
            {bg:SLOT_S.libre.bg,brd:SLOT_S.libre.border,lbl:"Sin horario"}
          ].map(({bg,brd,lbl})=>(
            <div key={lbl} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:9,height:9,borderRadius:2,background:bg,border:`1px solid ${brd}`}}/>
              <span style={{fontSize:10,color:DS.textSec,fontFamily:DS.font}}>{lbl}</span>
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
    try{const r=await api.get("/profesionales");setProfes((r.data||[]).filter(p=>p.activo!==false));}
    catch(e){setErrorProf(e.response?.data?.detail||e.message||"Error al cargar profesionales.");}
    finally{setLoadingProf(false);}
  },[]);
  useEffect(()=>{fetchProfes();},[fetchProfes]);

  const fetchGrid=useCallback(async()=>{
    if(!profes.length)return;
    setLoadingGrid(true);setErrorGrid("");
    try{
      const[dR,tR]=await Promise.all([
        Promise.allSettled(profes.map(p=>api.get("/disponibilidad",{params:{profesional_id:p.id,fecha}}))),
        api.get("/turnos",{params:{fecha}}),
      ]);
      const nd={};profes.forEach((p,i)=>{nd[p.id]=dR[i].status==="fulfilled"?dR[i].value.data:[];});
      setDisp(nd);setTurnos(tR.data||[]);
    }catch(e){setErrorGrid(e.response?.data?.detail||e.message||"Error al cargar la agenda.");}
    finally{setLoadingGrid(false);}
  },[profes,fecha]);
  useEffect(()=>{fetchGrid();},[fetchGrid]);

  const specs=[...new Set(profes.map(p=>p.especialidad).filter(Boolean))].sort();
  const profsFiltrados=filtroSpec==="Todas"?profes:profes.filter(p=>p.especialidad===filtroSpec);
  const allHoras=[...new Set(Object.values(disp).flatMap(s=>s.map(x=>x.hora)))].sort();
  const turnoIdx={};
  turnos.forEach(t=>{const pid=t.profesional?.id;if(!pid)return;if(!turnoIdx[pid])turnoIdx[pid]={};turnoIdx[pid][formatHora(t.fecha_inicio)]=t;});
  const grupos={};profsFiltrados.forEach(p=>{const k=p.especialidad||"General";if(!grupos[k])grupos[k]=[];grupos[k].push(p);});
  const totalDisp=Object.values(disp).flatMap(s=>s).filter(s=>s.disponible).length;

  return(
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}*{box-sizing:border-box;}::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px;}`}</style>
      <Starfield/>
      <div style={{minHeight:"100vh",fontFamily:DS.font,position:"relative",zIndex:1}}>
        <NavBar navigate={navigate} onLogout={()=>{logout();navigate("/login");}}/>
        <main style={{maxWidth:1400,margin:"0 auto",padding:"22px 28px"}}>

          {/* Header */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:14}}>
            <div>
              <h1 style={{margin:0,fontSize:20,fontWeight:700,color:DS.text,letterSpacing:-.5}}>📅 Agenda de hoy</h1>
              <p style={{margin:"3px 0 0",fontSize:12,color:DS.textSec,textTransform:"capitalize"}}>{formatTitulo(fecha)}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <DateNav fecha={fecha} onChange={setFecha}/>
              <PrimaryBtn onClick={()=>navigate("/nuevo-turno")}>+ Nuevo turno</PrimaryBtn>
            </div>
          </div>

          {specs.length>0&&<div style={{marginBottom:14}}><SpecFilter specs={specs} value={filtroSpec} onChange={setFiltroSpec}/></div>}
          {errorProf&&<ErrorBanner msg={errorProf} onRetry={fetchProfes}/>}
          {errorGrid&&<ErrorBanner msg={errorGrid} onRetry={fetchGrid}/>}

          {/* Stats */}
          {!loadingProf&&!errorProf&&(
            <div style={{display:"flex",gap:9,flexWrap:"wrap",marginBottom:18}}>
              <StatCard icon="🏥" label="Clínicas"      value={Object.keys(grupos).length} color={DS.blue}/>
              <StatCard icon="👤" label="Profesionales" value={profsFiltrados.length}       color="#8b5cf6"/>
              <StatCard icon="✅" label="Disponibles"   value={totalDisp}                   color={DS.cyan}/>
              <StatCard icon="📋" label="Turnos"        value={turnos.length}               color="#f59e0b"/>
            </div>
          )}

          {loadingProf?(
            <Loading msg="Cargando profesionales..."/>
          ):Object.keys(grupos).length===0?(
            <div style={{textAlign:"center",padding:"48px 0",color:DS.textDis,fontSize:14,fontFamily:DS.font}}>
              {filtroSpec!=="Todas"?`Sin profesionales con especialidad "${filtroSpec}".`:"No hay profesionales registrados."}
            </div>
          ):Object.entries(grupos).map(([esp,profs],ci)=>(
            <ClinicCard key={esp} especialidad={esp} profesionales={profs}
              disponibilidad={disp} turnoIdx={turnoIdx} allHoras={allHoras}
              onOcupado={t=>navigate("/turnos/"+t.id)}
              onDisponible={(prof,slot)=>navigate(`/nuevo-turno?profesional_id=${prof.id}&fecha=${fecha}&hora=${slot.hora}`)}
              defaultOpen={ci===0}/>
          ))}
        </main>
      </div>
    </>
  );
}
