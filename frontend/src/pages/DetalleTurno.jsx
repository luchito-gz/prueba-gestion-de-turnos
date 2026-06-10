import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
const ESTADO_COLORS={
  pendiente:   {bg:"rgba(245,158,11,0.15)",color:"#fcd34d",border:"rgba(245,158,11,0.3)"},
  confirmado:  {bg:"rgba(16,185,129,0.15)",color:"#6ee7b7",border:"rgba(16,185,129,0.3)"},
  cancelado:   {bg:"rgba(220,38,38,0.15)", color:"#fca5a5",border:"rgba(220,38,38,0.3)"},
  reprogramado:{bg:"rgba(6,182,212,0.15)", color:"#67e8f9",border:"rgba(6,182,212,0.3)"},
  completado:  {bg:"rgba(99,102,241,0.15)",color:"#c4b5fd",border:"rgba(99,102,241,0.3)"},
};
const ESTADOS=["pendiente","confirmado","cancelado","reprogramado","completado"];

function toDatetimeLocal(s){if(!s)return "";return s.slice(0,16);}
function toLocalISO(v){if(!v)return null;return v.length===16?`${v}:00`:v;}
function useHover(){const [h,set]=useState(false);return [h,{onMouseEnter:()=>set(true),onMouseLeave:()=>set(false)}];}

function Label({children,required}){
  return(<label style={{display:"block",marginBottom:6,fontSize:11,fontWeight:500,textTransform:"uppercase",letterSpacing:1,color:DS.textSec,fontFamily:DS.font}}>
    {children}{required&&<span style={{color:DS.errorText,marginLeft:2}}>*</span>}
  </label>);
}
function DSInput({error,...props}){
  const [f,sf]=useState(false);
  return(<input {...props} onFocus={e=>{sf(true);props.onFocus?.(e);}} onBlur={e=>{sf(false);props.onBlur?.(e);}}
    style={{width:"100%",height:44,padding:"0 12px",background:DS.inputBg,
      border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:DS.border}`,
      borderRadius:8,fontSize:14,color:DS.text,fontFamily:DS.font,outline:"none",
      transition:"border-color .2s",boxSizing:"border-box"}}/>);
}
function DSSelect({children,error,accentBg,accentColor,accentBorder,...props}){
  const [f,sf]=useState(false);
  return(<div style={{position:"relative"}}>
    <select {...props} onFocus={e=>{sf(true);props.onFocus?.(e);}} onBlur={e=>{sf(false);props.onBlur?.(e);}}
      style={{width:"100%",height:44,padding:"0 32px 0 12px",background:accentBg||DS.inputBg,
        border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:(accentBorder||DS.border)}`,
        borderRadius:8,fontSize:14,color:accentColor||(props.value?DS.text:DS.textDis),
        fontFamily:DS.font,outline:"none",cursor:"pointer",appearance:"none",
        fontWeight:accentColor?700:400,transition:"border-color .2s",boxSizing:"border-box"}}>
      {children}
    </select>
    <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none",fontSize:11,color:accentColor||DS.textDis}}>▾</span>
  </div>);
}
function DSTextarea({error,...props}){
  const [f,sf]=useState(false);
  return(<textarea {...props} onFocus={e=>{sf(true);props.onFocus?.(e);}} onBlur={e=>{sf(false);props.onBlur?.(e);}}
    style={{width:"100%",padding:"10px 12px",background:DS.inputBg,
      border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:DS.border}`,
      borderRadius:8,fontSize:14,color:DS.text,fontFamily:DS.font,outline:"none",
      resize:"vertical",minHeight:80,transition:"border-color .2s",boxSizing:"border-box"}}/>);
}
function Hint({children}){return <span style={{fontSize:11,color:DS.textDis,marginTop:3,display:"block",fontFamily:DS.font}}>{children}</span>;}

function ConfirmDialog({open,onConfirm,onCancel,turnoId}){
  if(!open)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:DS.cardBg,borderRadius:14,padding:"24px 28px",maxWidth:360,width:"100%",border:`1px solid ${DS.borderCard}`,boxShadow:"0 25px 60px rgba(0,0,0,0.6)",animation:"fadeUp .2s ease",position:"relative"}}>
        <BracketTL/><BracketBR/>
        <div style={{fontSize:28,textAlign:"center",marginBottom:10}}>⚠️</div>
        <div style={{fontSize:15,fontWeight:700,color:DS.text,textAlign:"center",marginBottom:8,fontFamily:DS.font}}>Cancelar turno #{turnoId}</div>
        <div style={{fontSize:13,color:DS.textSec,textAlign:"center",marginBottom:20,lineHeight:1.5,fontFamily:DS.font}}>Esta acción no se puede deshacer.<br/>¿Confirmás?</div>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onConfirm} style={{padding:"9px 18px",border:"none",borderRadius:8,background:DS.errorBg,color:DS.errorText,fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:DS.font,border:`1px solid ${DS.errorBorder}`}}>Sí, cancelar</button>
          <button onClick={onCancel} style={{padding:"9px 18px",border:`1px solid ${DS.border}`,borderRadius:8,background:"transparent",color:DS.textSec,fontWeight:600,fontSize:13,cursor:"pointer",fontFamily:DS.font}}>Volver</button>
        </div>
      </div>
    </div>
  );
}

function CTA({children,loading,disabled}){
  const [hov,hp]=useHover();
  return(<button type="submit" disabled={disabled} {...hp} style={{padding:"11px 22px",border:"none",borderRadius:8,background:disabled?DS.border:DS.gradient,color:"#fff",fontWeight:700,fontSize:14,cursor:disabled?"not-allowed":"pointer",fontFamily:DS.font,filter:!disabled&&hov?"brightness(1.15)":"none",transform:!disabled&&hov?"translateY(-1px)":"none",boxShadow:!disabled&&hov?"0 4px 16px rgba(37,99,235,0.4)":"none",transition:"all .15s",display:"flex",alignItems:"center",gap:8}}>
    {loading&&<span style={{width:13,height:13,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin .7s linear infinite"}}/>}
    {children}
  </button>);
}
function DangerBtn({children,onClick,disabled}){
  const [hov,hp]=useHover();
  return(<button type="button" onClick={onClick} disabled={disabled} {...hp} style={{padding:"11px 18px",borderRadius:8,border:`1px solid ${hov?"rgba(220,38,38,0.5)":DS.errorBorder}`,background:hov?DS.errorBg:"transparent",color:DS.errorText,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:DS.font,transition:"all .15s"}}>{children}</button>);
}
function BackBtn({onClick}){
  const [hov,hp]=useHover();
  return(<button onClick={onClick} {...hp} style={{padding:"4px 12px",borderRadius:7,border:`1px solid ${hov?"rgba(6,182,212,0.5)":DS.border}`,background:hov?"rgba(6,182,212,0.1)":"transparent",color:hov?DS.cyan:DS.textSec,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:DS.font,transition:"all .15s"}}>← Volver</button>);
}

export default function DetalleTurno(){
  const {id}=useParams();const navigate=useNavigate();
  const [loadingTurno,setLT]=useState(true);const [saving,setSaving]=useState(false);
  const [error,setError]=useState("");const [success,setSuccess]=useState("");const [confirmOpen,setCO]=useState(false);
  const [form,setForm]=useState({fecha_hora:"",duracion_min:30,profesional_id:"",cliente_id:"",estado:"pendiente",notas:""});

  useEffect(()=>{
    (async()=>{setLT(true);setError("");
      try{const r=await api.get(`/turnos/${id}`);const t=r.data;setForm({fecha_hora:toDatetimeLocal(t.fecha_hora),duracion_min:t.duracion_min??30,profesional_id:t.profesional_id??"",cliente_id:t.cliente_id??"",estado:t.estado??"pendiente",notas:t.notas??""});}
      catch(e){const m=e.response?.data?.detail||e.message||"No se pudo cargar el turno.";setError(typeof m==="string"?m:JSON.stringify(m));}
      finally{setLT(false);}
    })();
  },[id]);

  const handleChange=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleGuardar=async e=>{
    e.preventDefault();setError("");setSuccess("");setSaving(true);
    try{
      const p={fecha_hora:toLocalISO(form.fecha_hora),duracion_min:Number(form.duracion_min),estado:form.estado,notas:form.notas||null};
      if(form.profesional_id!=="")p.profesional_id=Number(form.profesional_id);
      if(form.cliente_id!=="")p.cliente_id=Number(form.cliente_id);
      await api.patch(`/turnos/${id}`,p);
      setSuccess("Turno actualizado correctamente. Volviendo...");
      setTimeout(()=>navigate("/agenda"),1200);
    }catch(e){const d=e.response?.data?.detail;setError(Array.isArray(d)?d.map(x=>x.msg).join(" | "):d||e.message||"Error al guardar.");}
    finally{setSaving(false);}
  };

  const handleCancelar=async()=>{
    setCO(false);setSaving(true);setError("");
    try{await api.delete(`/turnos/${id}`);navigate("/agenda");}
    catch(e){const m=e.response?.data?.detail||e.message||"Error al cancelar.";setError(typeof m==="string"?m:JSON.stringify(m));setSaving(false);}
  };

  const estilo=ESTADO_COLORS[form.estado]||{};

  if(loadingTurno)return(
    <div style={{minHeight:"100vh",background:"#050510",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:DS.font}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,color:DS.textSec}}>
        <div style={{width:28,height:28,borderRadius:"50%",border:`2px solid ${DS.border}`,borderTopColor:DS.cyan,animation:"spin .7s linear infinite"}}/>
        <span style={{fontSize:13}}>Cargando turno...</span>
      </div>
    </div>
  );

  return(
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}@keyframes fadeUp{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}*{box-sizing:border-box;}input::placeholder{color:#64748b!important;}input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #1e293b inset!important;-webkit-text-fill-color:#fff!important;}select option{background:#1e293b;color:#fff;}`}</style>
      <ConfirmDialog open={confirmOpen} turnoId={id} onConfirm={handleCancelar} onCancel={()=>setCO(false)}/>
      <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 75% 40%,rgba(88,28,235,0.3) 0%,transparent 55%),radial-gradient(ellipse at 25% 70%,rgba(37,99,235,0.15) 0%,transparent 50%),#050510`,fontFamily:DS.font,display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{height:56,display:"flex",alignItems:"center",gap:14,padding:"0 24px",background:"rgba(5,5,16,0.85)",borderBottom:`1px solid ${DS.borderCard}`,backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:10}}>
          <BackBtn onClick={()=>navigate("/agenda")}/>
          <div style={{width:1,height:22,background:DS.border}}/>
          <div style={{width:30,height:30,borderRadius:8,background:DS.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>📅</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:DS.text,fontFamily:DS.font}}>Turno #{id}</div>
            <div style={{fontSize:10,color:DS.textSec,fontFamily:DS.font}}>Editá o cancelá este turno</div>
          </div>
          {form.estado&&<div style={{marginLeft:"auto",padding:"3px 12px",borderRadius:99,background:estilo.bg,color:estilo.color,border:`1px solid ${estilo.border}`,fontSize:11,fontWeight:700,fontFamily:DS.font,textTransform:"uppercase",letterSpacing:1}}>{form.estado}</div>}
        </div>
        {/* Contenido */}
        <main style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"28px 16px"}}>
          <div style={{width:"100%",maxWidth:540,background:DS.cardBg,borderRadius:16,border:`1px solid ${DS.borderCard}`,backdropFilter:"blur(20px)",boxShadow:"0 25px 60px rgba(0,0,0,0.5)",animation:"fadeUp .3s ease",position:"relative"}}>
            <BracketTL/><BracketBR/>
            <div style={{padding:"22px 28px 26px"}}>
              {error&&<div style={{background:DS.errorBg,border:`1px solid ${DS.errorBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:DS.errorText,display:"flex",gap:8,fontFamily:DS.font}}><span style={{color:"#f59e0b"}}>⚠</span>{error}</div>}
              {success&&<div style={{background:DS.successBg,border:`1px solid ${DS.successBorder}`,borderRadius:8,padding:"12px 14px",marginBottom:16,fontSize:13,color:DS.successText,display:"flex",gap:8,alignItems:"center",fontWeight:700,fontFamily:DS.font}}><span style={{fontSize:18}}>✅</span>{success}</div>}
              <form onSubmit={handleGuardar} noValidate>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                  <div style={{gridColumn:"1/-1"}}><Label required>Fecha y hora del turno</Label><DSInput type="datetime-local" name="fecha_hora" value={form.fecha_hora} onChange={handleChange} required/></div>
                  <div><Label required>Duración (minutos)</Label><DSInput type="number" name="duracion_min" min="5" max="480" step="5" value={form.duracion_min} onChange={handleChange} required/><Hint>Entre 5 y 480 min</Hint></div>
                  <div><Label required>Estado</Label><DSSelect name="estado" value={form.estado} onChange={handleChange} required accentBg={estilo.bg} accentColor={estilo.color} accentBorder={estilo.border}>{ESTADOS.map(e=><option key={e} value={e}>{e.charAt(0).toUpperCase()+e.slice(1)}</option>)}</DSSelect></div>
                  <div><Label>ID Profesional</Label><DSInput type="number" name="profesional_id" value={form.profesional_id} onChange={handleChange} placeholder="ID del profesional"/></div>
                  <div><Label>ID Cliente</Label><DSInput type="number" name="cliente_id" value={form.cliente_id} onChange={handleChange} placeholder="ID del cliente"/></div>
                  <div style={{gridColumn:"1/-1"}}><Label>Notas <span style={{fontWeight:400,color:DS.textDis}}>(opcional)</span></Label><DSTextarea name="notas" placeholder="Indicaciones, observaciones..." value={form.notas} onChange={handleChange}/></div>
                </div>
                <div style={{display:"flex",gap:10,marginTop:20,paddingTop:18,borderTop:`1px solid ${DS.borderCard}`,flexWrap:"wrap"}}>
                  <CTA loading={saving} disabled={saving}>{saving?"Guardando...":"✓ Guardar cambios"}</CTA>
                  <DangerBtn onClick={()=>setCO(true)} disabled={saving}>🗑 Cancelar turno</DangerBtn>
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
