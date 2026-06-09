import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

const DS = {
  pageBg:"#050510",cardBg:"rgba(15,23,42,0.95)",inputBg:"#1e293b",hoverBg:"#0f172a",
  blue:"#2563eb",cyan:"#06b6d4",gradient:"linear-gradient(135deg,#2563eb,#06b6d4)",
  text:"#ffffff",textSec:"#94a3b8",textDis:"#64748b",
  border:"#334155",borderCard:"#1e293b",borderFocus:"#2563eb",
  errorBg:"rgba(220,38,38,0.15)",errorBorder:"rgba(220,38,38,0.30)",errorText:"#fca5a5",
  successBg:"rgba(16,185,129,0.15)",successBorder:"rgba(16,185,129,0.30)",successText:"#6ee7b7",
  font:"'Space Grotesk',sans-serif",
};

function toLocalISO(v){if(!v)return null;return v.length===16?`${v}:00`:v;}
function combineFechaHora(f,h){if(!f||!h)return "";return `${f}T${h}`;}
function useHover(){const [h,set]=useState(false);return [h,{onMouseEnter:()=>set(true),onMouseLeave:()=>set(false)}];}

function Label({children,required}){
  return(<label style={{display:"block",marginBottom:6,fontSize:11,fontWeight:500,textTransform:"uppercase",letterSpacing:1,color:DS.textSec,fontFamily:DS.font}}>
    {children}{required&&<span style={{color:DS.errorText,marginLeft:2}}>*</span>}
  </label>);
}
function DSInput({error,...props}){
  const [f,sf]=useState(false);
  return(<input {...props}
    onFocus={e=>{sf(true);props.onFocus?.(e);}} onBlur={e=>{sf(false);props.onBlur?.(e);}}
    style={{width:"100%",height:44,padding:"0 12px",background:DS.inputBg,
      border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:DS.border}`,
      borderRadius:8,fontSize:14,color:DS.text,fontFamily:DS.font,outline:"none",
      transition:"border-color .2s",boxSizing:"border-box"}}/>);
}
function DSSelect({children,error,...props}){
  const [f,sf]=useState(false);
  return(<div style={{position:"relative"}}>
    <select {...props}
      onFocus={e=>{sf(true);props.onFocus?.(e);}} onBlur={e=>{sf(false);props.onBlur?.(e);}}
      style={{width:"100%",height:44,padding:"0 32px 0 12px",background:DS.inputBg,
        border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:DS.border}`,
        borderRadius:8,fontSize:14,color:props.value?DS.text:DS.textDis,
        fontFamily:DS.font,outline:"none",cursor:"pointer",appearance:"none",
        transition:"border-color .2s",boxSizing:"border-box"}}>
      {children}
    </select>
    <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  pointerEvents:"none",fontSize:11,color:DS.textDis}}>▾</span>
  </div>);
}
function DSTextarea({error,...props}){
  const [f,sf]=useState(false);
  return(<textarea {...props}
    onFocus={e=>{sf(true);props.onFocus?.(e);}} onBlur={e=>{sf(false);props.onBlur?.(e);}}
    style={{width:"100%",padding:"10px 12px",background:DS.inputBg,
      border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:DS.border}`,
      borderRadius:8,fontSize:14,color:DS.text,fontFamily:DS.font,outline:"none",
      resize:"vertical",minHeight:80,transition:"border-color .2s",boxSizing:"border-box"}}/>);
}
function FieldError({msg}){if(!msg)return null;return <span style={{fontSize:11,color:DS.errorText,marginTop:3,display:"block",fontFamily:DS.font}}>{msg}</span>;}
function Hint({children}){return <span style={{fontSize:11,color:DS.textDis,marginTop:3,display:"block",fontFamily:DS.font}}>{children}</span>;}

function TurnoPreview({form,profesionales,clientes}){
  const prof=profesionales.find(p=>String(p.id)===String(form.profesional_id));
  const client=clientes.find(c=>String(c.id)===String(form.cliente_id));
  if(!prof&&!client&&!form.fecha)return null;
  let horaFin=null;
  if(form.fecha&&form.hora&&form.duracion_min){
    const d=new Date(`${form.fecha}T${form.hora}`);d.setMinutes(d.getMinutes()+Number(form.duracion_min));
    horaFin=d.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
  }
  const fechaLabel=form.fecha?new Date(form.fecha+"T12:00").toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short",year:"numeric"}):null;
  return(
    <div style={{background:"rgba(37,99,235,0.08)",border:`1px solid rgba(37,99,235,0.25)`,borderRadius:10,padding:"12px 14px"}}>
      <div style={{fontSize:9,fontWeight:700,color:DS.cyan,textTransform:"uppercase",letterSpacing:2,marginBottom:8,fontFamily:DS.font}}>Vista previa del turno</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {fechaLabel&&<PRow icon="📅" label="Fecha" value={`${fechaLabel}${form.hora?` · ${form.hora}`:""}${horaFin?` → ${horaFin}`:""}`}/>}
        {prof&&<PRow icon="👤" label="Profesional" value={`${prof.nombre}${prof.especialidad?` · ${prof.especialidad}`:""}`}/>}
        {client&&<PRow icon="🧑" label="Cliente" value={client.nombre}/>}
        {form.duracion_min>0&&<PRow icon="⏱️" label="Duración" value={`${form.duracion_min} minutos`}/>}
        {form.notas&&<PRow icon="📝" label="Notas" value={form.notas}/>}
      </div>
    </div>
  );
}
function PRow({icon,label,value}){
  return(<div style={{display:"flex",alignItems:"flex-start",gap:8}}>
    <span style={{fontSize:13,flexShrink:0}}>{icon}</span>
    <div><span style={{fontSize:10,fontWeight:600,color:DS.textSec,fontFamily:DS.font}}>{label}: </span>
    <span style={{fontSize:12,color:DS.text,fontWeight:500,fontFamily:DS.font}}>{value}</span></div>
  </div>);
}

function CTA({children,loading,disabled}){
  const [hov,hp]=useHover();
  return(<button type="submit" disabled={disabled} {...hp} style={{
    padding:"11px 22px",border:"none",borderRadius:8,
    background:disabled?DS.border:DS.gradient,color:"#fff",
    fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:DS.font,
    filter:!disabled&&hov?"brightness(1.15)":"none",
    transform:!disabled&&hov?"translateY(-1px)":"none",
    boxShadow:!disabled&&hov?"0 4px 16px rgba(37,99,235,0.4)":"none",
    transition:"all .15s",display:"flex",alignItems:"center",gap:8,
  }}>
    {loading&&<span style={{width:13,height:13,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin .7s linear infinite"}}/>}
    {children}
  </button>);
}
function SecBtn({children,onClick,disabled}){
  const [hov,hp]=useHover();
  return(<button type="button" onClick={onClick} disabled={disabled} {...hp} style={{
    padding:"11px 18px",borderRadius:8,border:`1px solid ${DS.border}`,
    background:hov?"rgba(255,255,255,0.05)":"transparent",
    color:DS.textSec,fontWeight:600,fontSize:14,cursor:"pointer",fontFamily:DS.font,transition:"all .15s",
  }}>{children}</button>);
}
function BackBtn({onClick}){
  const [hov,hp]=useHover();
  return(<button onClick={onClick} {...hp} style={{
    padding:"4px 12px",borderRadius:7,border:`1px solid ${hov?"rgba(6,182,212,0.5)":DS.border}`,
    background:hov?"rgba(6,182,212,0.1)":"transparent",
    color:hov?DS.cyan:DS.textSec,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:DS.font,transition:"all .15s",
  }}>← Volver</button>);
}

export default function NuevoTurno(){
  const navigate=useNavigate();
  const [searchParams]=useSearchParams();
  const [profesionales,setProfes]=useState([]);
  const [clientes,setClients]=useState([]);
  const [loadingSel,setLoadingSel]=useState(true);
  const [submitting,setSubmitting]=useState(false);
  const [success,setSuccess]=useState(false);
  const [apiError,setApiError]=useState("");
  const [fieldErrors,setFieldErrors]=useState({});
  const [form,setForm]=useState({
    fecha:searchParams.get("fecha")||"",hora:searchParams.get("hora")||"",
    duracion_min:30,profesional_id:searchParams.get("profesional_id")||"",
    cliente_id:"",notas:"",
  });

  useEffect(()=>{
    const token=localStorage.getItem("token");if(!token){navigate("/login");return;}
    (async()=>{
      setLoadingSel(true);
      try{const[rp,rc]=await Promise.all([api.get("/profesionales"),api.get("/clientes")]);setProfes(rp.data||[]);setClients(rc.data||[]);}
      catch{setApiError("No se pudieron cargar profesionales/clientes.");}
      finally{setLoadingSel(false);}
    })();
  },[navigate]);

  const handleChange=e=>{const{name,value}=e.target;setForm(f=>({...f,[name]:value}));if(fieldErrors[name])setFieldErrors(fe=>({...fe,[name]:""}));};
  const validate=()=>{const e={};if(!form.fecha)e.fecha="La fecha es requerida.";if(!form.hora)e.hora="El horario es requerido.";if(!form.profesional_id)e.profesional_id="Seleccioná un profesional.";if(!form.cliente_id)e.cliente_id="Seleccioná un cliente.";const d=Number(form.duracion_min);if(!d||d<5||d>480)e.duracion_min="Duración entre 5 y 480 min.";return e;};

  const handleSubmit=async e=>{
    e.preventDefault();setApiError("");const errs=validate();if(Object.keys(errs).length){setFieldErrors(errs);return;}
    setSubmitting(true);
    try{
      await api.post("/turnos",{fecha_hora:toLocalISO(combineFechaHora(form.fecha,form.hora)),duracion_min:Number(form.duracion_min),profesional_id:Number(form.profesional_id),cliente_id:Number(form.cliente_id),notas:form.notas||null});
      setSuccess(true);setTimeout(()=>navigate("/agenda"),1400);
    }catch(err){
      const d=err.response?.data?.detail;setApiError(Array.isArray(d)?d.map(x=>x.msg).join(" | "):d||err.message||"Error al crear el turno.");
    }finally{setSubmitting(false);}
  };

  const hasPreview=form.fecha||form.hora||form.profesional_id||form.cliente_id;

  return(
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}*{box-sizing:border-box;}input::placeholder{color:#64748b!important;}input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #1e293b inset!important;-webkit-text-fill-color:#fff!important;}select option{background:#1e293b;color:#fff;}`}</style>
      <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 75% 40%,rgba(88,28,235,0.3) 0%,transparent 55%),radial-gradient(ellipse at 25% 70%,rgba(37,99,235,0.15) 0%,transparent 50%),#050510`,fontFamily:DS.font,display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{height:56,display:"flex",alignItems:"center",gap:14,padding:"0 24px",background:"rgba(5,5,16,0.85)",borderBottom:`1px solid ${DS.borderCard}`,backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:10}}>
          <BackBtn onClick={()=>navigate("/agenda")}/>
          <div style={{width:1,height:22,background:DS.border}}/>
          <div style={{width:30,height:30,borderRadius:8,background:DS.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📋</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:DS.text,fontFamily:DS.font}}>Nuevo turno</div>
            <div style={{fontSize:10,color:DS.textSec,fontFamily:DS.font}}>Completá los datos para agendar</div>
          </div>
        </div>
        {/* Contenido */}
        <main style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 16px"}}>
          <div style={{width:"100%",maxWidth:540,background:DS.cardBg,borderRadius:16,border:`1px solid ${DS.borderCard}`,backdropFilter:"blur(20px)",boxShadow:"0 25px 60px rgba(0,0,0,0.5)",animation:"fadeUp .3s ease",position:"relative"}}>
            <BracketTL/><BracketBR/>
            <div style={{padding:"22px 28px 26px"}}>
              {apiError&&<div style={{background:DS.errorBg,border:`1px solid ${DS.errorBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:DS.errorText,display:"flex",gap:8,fontFamily:DS.font}}><span style={{color:"#f59e0b"}}>⚠</span>{apiError}</div>}
              {success&&<div style={{background:DS.successBg,border:`1px solid ${DS.successBorder}`,borderRadius:8,padding:"12px 14px",marginBottom:16,fontSize:13,color:DS.successText,display:"flex",gap:8,alignItems:"center",fontWeight:700,fontFamily:DS.font}}><span style={{fontSize:18}}>✅</span>¡Turno creado! Volviendo a la agenda...</div>}
              <form onSubmit={handleSubmit} noValidate>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div><Label required>Fecha</Label><DSInput type="date" name="fecha" value={form.fecha} onChange={handleChange} error={!!fieldErrors.fecha}/><FieldError msg={fieldErrors.fecha}/></div>
                  <div><Label required>Horario</Label><DSInput type="time" name="hora" value={form.hora} onChange={handleChange} error={!!fieldErrors.hora}/><FieldError msg={fieldErrors.hora}/></div>
                  <div><Label required>Duración (min)</Label><DSInput type="number" name="duracion_min" min="5" max="480" step="5" value={form.duracion_min} onChange={handleChange} error={!!fieldErrors.duracion_min}/><Hint>Entre 5 y 480 min</Hint><FieldError msg={fieldErrors.duracion_min}/></div>
                  <div><Label required>Profesional</Label><DSSelect name="profesional_id" value={form.profesional_id} onChange={handleChange} disabled={loadingSel} error={!!fieldErrors.profesional_id}><option value="" disabled>{loadingSel?"Cargando...":"— Seleccionar —"}</option>{profesionales.map(p=><option key={p.id} value={p.id}>{p.nombre}{p.especialidad?` · ${p.especialidad}`:""}</option>)}</DSSelect><FieldError msg={fieldErrors.profesional_id}/></div>
                  <div style={{gridColumn:"1/-1"}}><Label required>Cliente</Label><DSSelect name="cliente_id" value={form.cliente_id} onChange={handleChange} disabled={loadingSel} error={!!fieldErrors.cliente_id}><option value="" disabled>{loadingSel?"Cargando...":"— Seleccionar cliente —"}</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}{c.telefono?` · ${c.telefono}`:""}</option>)}</DSSelect><FieldError msg={fieldErrors.cliente_id}/></div>
                  <div style={{gridColumn:"1/-1"}}><Label>Notas <span style={{fontWeight:400,color:DS.textDis}}>(opcional)</span></Label><DSTextarea name="notas" placeholder="Indicaciones, motivo de consulta..." value={form.notas} onChange={handleChange}/></div>
                  {hasPreview&&<div style={{gridColumn:"1/-1"}}><TurnoPreview form={form} profesionales={profesionales} clientes={clientes}/></div>}
                </div>
                <div style={{display:"flex",gap:10,marginTop:20,paddingTop:18,borderTop:`1px solid ${DS.borderCard}`}}>
                  <CTA loading={submitting} disabled={submitting||loadingSel||success}>{submitting?"Guardando...":"✓ Crear turno"}</CTA>
                  <SecBtn onClick={()=>navigate("/agenda")} disabled={submitting}>Cancelar</SecBtn>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
function BracketTL(){return(<div style={{position:"absolute",top:12,left:12,pointerEvents:"none"}}><div style={{width:14,height:2,background:"#2563eb",borderRadius:1}}/><div style={{width:2,height:14,background:"#2563eb",borderRadius:1,marginTop:-2}}/></div>);}
function BracketBR(){return(<div style={{position:"absolute",bottom:12,right:12,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"flex-end"}}><div style={{width:2,height:14,background:"#06b6d4",borderRadius:1}}/><div style={{width:14,height:2,background:"#06b6d4",borderRadius:1,marginTop:-2}}/></div>);}
