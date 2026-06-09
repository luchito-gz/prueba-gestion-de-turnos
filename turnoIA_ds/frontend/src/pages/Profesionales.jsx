import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'https://proyectosaasia-production.up.railway.app'
const EMPTY_FORM = { nombre:'', especialidad:'', email:'', telefono:'' }

const DS = {
  pageBg:"#050510", cardBg:"rgba(15,23,42,0.95)", inputBg:"#1e293b",
  blue:"#2563eb", cyan:"#06b6d4", gradient:"linear-gradient(135deg,#2563eb,#06b6d4)",
  text:"#ffffff", textSec:"#94a3b8", textDis:"#64748b",
  border:"#334155", borderCard:"#1e293b", borderFocus:"#2563eb",
  errorBg:"rgba(220,38,38,0.15)", errorBorder:"rgba(220,38,38,0.30)", errorText:"#fca5a5",
  successBg:"rgba(16,185,129,0.15)", successBorder:"rgba(16,185,129,0.30)", successText:"#6ee7b7",
  font:"'Space Grotesk',sans-serif",
}
const SPEC_COLORS={"Clínica":["rgba(37,99,235,0.18)","#60a5fa"],"Kinesiología":["rgba(6,182,212,0.18)","#67e8f9"],"Nutrición":["rgba(245,158,11,0.18)","#fcd34d"],"Odontología":["rgba(239,68,68,0.18)","#fca5a5"],"Psicología":["rgba(139,92,246,0.18)","#c4b5fd"],"Cardiología":["rgba(236,72,153,0.18)","#f9a8d4"]}

function useHover(){const [h,s]=useState(false);return [h,{onMouseEnter:()=>s(true),onMouseLeave:()=>s(false)}];}
function DSInput({error,...p}){
  const [f,sf]=useState(false);
  return <input {...p} onFocus={e=>{sf(true);p.onFocus?.(e);}} onBlur={e=>{sf(false);p.onBlur?.(e);}}
    style={{width:"100%",height:44,padding:"0 12px",background:DS.inputBg,
      border:`1px solid ${error?"rgba(220,38,38,0.6)":f?DS.borderFocus:DS.border}`,
      borderRadius:8,fontSize:14,color:DS.text,fontFamily:DS.font,outline:"none",
      transition:"border-color .2s",boxSizing:"border-box"}}/>;
}
function Label({children,required}){
  return <label style={{display:"block",marginBottom:6,fontSize:11,fontWeight:500,
    textTransform:"uppercase",letterSpacing:1,color:DS.textSec,fontFamily:DS.font}}>
    {children}{required&&<span style={{color:DS.errorText,marginLeft:2}}>*</span>}
  </label>;
}
function CTA({children,loading,disabled}){
  const [hov,hp]=useHover();
  return <button type="submit" disabled={disabled} {...hp} style={{
    padding:"10px 22px",border:"none",borderRadius:8,
    background:disabled?DS.border:DS.gradient,color:"#fff",fontWeight:700,fontSize:14,
    cursor:disabled?"not-allowed":"pointer",fontFamily:DS.font,
    filter:!disabled&&hov?"brightness(1.15)":"none",
    transform:!disabled&&hov?"translateY(-1px)":"none",
    boxShadow:!disabled&&hov?"0 4px 16px rgba(37,99,235,0.4)":"none",
    transition:"all .15s",display:"flex",alignItems:"center",gap:8,
  }}>
    {loading&&<span style={{width:12,height:12,borderRadius:"50%",border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",display:"inline-block",animation:"spin .7s linear infinite"}}/>}
    {children}
  </button>;
}
function BackBtn({onClick}){
  const [hov,hp]=useHover();
  return <button onClick={onClick} {...hp} style={{
    padding:"4px 12px",borderRadius:7,
    border:`1px solid ${hov?"rgba(6,182,212,0.5)":DS.border}`,
    background:hov?"rgba(6,182,212,0.1)":"transparent",
    color:hov?DS.cyan:DS.textSec,fontSize:12,fontWeight:600,
    cursor:"pointer",fontFamily:DS.font,transition:"all .15s",
  }}>← Volver</button>;
}
function DangerBtn({children,onClick,disabled}){
  const [hov,hp]=useHover();
  return <button type="button" onClick={onClick} disabled={disabled} {...hp} style={{
    padding:"4px 10px",borderRadius:6,
    border:`1px solid ${hov?"rgba(220,38,38,0.5)":DS.errorBorder}`,
    background:hov?DS.errorBg:"transparent",
    color:DS.errorText,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:DS.font,transition:"all .15s",
  }}>{children}</button>;
}
function SpecBadge({esp}){
  const [bg,fg]=SPEC_COLORS[esp]||["rgba(37,99,235,0.18)","#60a5fa"];
  return <span style={{padding:"2px 8px",borderRadius:99,fontSize:9,fontWeight:700,background:bg,color:fg,textTransform:"uppercase",letterSpacing:.5,fontFamily:DS.font}}>{esp}</span>;
}

export default function Profesionales(){
  const navigate=useNavigate()
  const [profesionales,setProfesionales]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [success,setSuccess]=useState('')
  const [form,setForm]=useState(EMPTY_FORM)
  const [saving,setSaving]=useState(false)
  const [deletingId,setDeletingId]=useState(null)

  useEffect(()=>{
    const token=localStorage.getItem('token');if(!token){navigate('/login');return;}
    fetchProfesionales(token);
  },[navigate])

  const fetchProfesionales=async token=>{
    setLoading(true);setError('');
    try{
      const res=await fetch(`${API_BASE}/api/profesionales`,{headers:{Authorization:`Bearer ${token}`}});
      if(res.status===401){localStorage.removeItem('token');navigate('/login');return;}
      if(!res.ok)throw new Error(`Error ${res.status}`);
      setProfesionales(await res.json()||[]);
    }catch(err){setError(err.message||'Error al cargar los profesionales.');}
    finally{setLoading(false);}
  }

  const handleCreate=async e=>{
    e.preventDefault();const token=localStorage.getItem('token');if(!token){navigate('/login');return;}
    setSaving(true);setError('');setSuccess('');
    try{
      const res=await fetch(`${API_BASE}/api/profesionales`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({nombre:form.nombre,especialidad:form.especialidad,email:form.email||null,telefono:form.telefono||null})});
      if(res.status===401){localStorage.removeItem('token');navigate('/login');return;}
      if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(Array.isArray(d.detail)?d.detail.map(x=>x.msg).join(' | '):d.detail||d.message||`Error ${res.status}`);}
      setSuccess('Profesional creado correctamente.');setForm(EMPTY_FORM);fetchProfesionales(token);
    }catch(err){setError(err.message||'Error al crear el profesional.');}
    finally{setSaving(false);}
  }

  const handleDelete=async id=>{
    if(!window.confirm('¿Eliminar este profesional?'))return;
    const token=localStorage.getItem('token');if(!token){navigate('/login');return;}
    setDeletingId(id);setError('');setSuccess('');
    try{
      const res=await fetch(`${API_BASE}/api/profesionales/${id}`,{method:'DELETE',headers:{Authorization:`Bearer ${token}`}});
      if(res.status===401){localStorage.removeItem('token');navigate('/login');return;}
      if(!res.ok){const d=await res.json().catch(()=>({}));throw new Error(d.detail||d.message||`Error ${res.status}`);}
      setSuccess('Profesional eliminado.');setProfesionales(prev=>prev.filter(p=>p.id!==id));
    }catch(err){setError(err.message||'Error al eliminar.');}
    finally{setDeletingId(null);}
  }

  return(
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}*{box-sizing:border-box;}input::placeholder{color:#64748b!important;}input:-webkit-autofill{-webkit-box-shadow:0 0 0 100px #1e293b inset!important;-webkit-text-fill-color:#fff!important;}`}</style>
      <div style={{minHeight:"100vh",background:`radial-gradient(ellipse at 75% 40%,rgba(88,28,235,0.3) 0%,transparent 55%),radial-gradient(ellipse at 25% 70%,rgba(37,99,235,0.15) 0%,transparent 50%),#050510`,fontFamily:DS.font,padding:"24px 28px"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20}}>
          <BackBtn onClick={()=>navigate('/agenda')}/>
          <div style={{width:1,height:22,background:DS.borderCard}}/>
          <div style={{width:30,height:30,borderRadius:8,background:DS.gradient,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👨‍⚕️</div>
          <h1 style={{margin:0,fontSize:18,fontWeight:700,color:DS.text,letterSpacing:.5}}>Profesionales</h1>
        </div>

        {error&&<div style={{background:DS.errorBg,border:`1px solid ${DS.errorBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:DS.errorText,display:"flex",gap:8}}><span style={{color:"#f59e0b"}}>⚠</span>{error}</div>}
        {success&&<div style={{background:DS.successBg,border:`1px solid ${DS.successBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:13,color:DS.successText,display:"flex",gap:8}}><span>✓</span>{success}</div>}

        {/* Tabla */}
        <div style={{background:DS.cardBg,border:`1px solid ${DS.borderCard}`,borderRadius:14,overflow:"hidden",backdropFilter:"blur(20px)",boxShadow:"0 20px 50px rgba(0,0,0,0.4)",marginBottom:16}}>
          {loading?(
            <div style={{textAlign:"center",padding:"40px 0",color:DS.textSec,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{width:24,height:24,borderRadius:"50%",border:`2px solid ${DS.border}`,borderTopColor:DS.cyan,animation:"spin .7s linear infinite"}}/>
              <span style={{fontSize:13}}>Cargando profesionales...</span>
            </div>
          ):profesionales.length===0?(
            <div style={{textAlign:"center",padding:"40px 0",color:DS.textDis,fontSize:13}}>No hay profesionales registrados todavía.</div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:"rgba(15,23,42,0.8)"}}>
                  {["Nombre","Especialidad","Email","Teléfono","Acción"].map(h=>(
                    <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10,fontWeight:700,color:DS.textSec,textTransform:"uppercase",letterSpacing:1,borderBottom:`1px solid ${DS.borderCard}`,fontFamily:DS.font}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profesionales.map((p,i)=>(
                  <tr key={p.id??i} style={{borderBottom:`1px solid ${DS.borderCard}`,background:i%2===0?"transparent":"rgba(255,255,255,0.015)"}}>
                    <td style={{padding:"10px 16px",fontSize:13,color:DS.text,fontFamily:DS.font,fontWeight:500}}>{p.nombre||'—'}</td>
                    <td style={{padding:"10px 16px"}}>{p.especialidad?<SpecBadge esp={p.especialidad}/>:<span style={{color:DS.textDis,fontSize:12}}>—</span>}</td>
                    <td style={{padding:"10px 16px",fontSize:12,color:DS.textSec,fontFamily:DS.font}}>{p.email||'—'}</td>
                    <td style={{padding:"10px 16px",fontSize:12,color:DS.textSec,fontFamily:DS.font}}>{p.telefono||'—'}</td>
                    <td style={{padding:"10px 16px"}}><DangerBtn onClick={()=>handleDelete(p.id)} disabled={deletingId===p.id}>{deletingId===p.id?'Eliminando...':'Eliminar'}</DangerBtn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Formulario */}
        <div style={{background:DS.cardBg,border:`1px solid ${DS.borderCard}`,borderRadius:14,padding:"20px 24px",backdropFilter:"blur(20px)",boxShadow:"0 20px 50px rgba(0,0,0,0.4)",maxWidth:640,position:"relative"}}>
          <BracketTL/><BracketBR/>
          <div style={{fontSize:12,fontWeight:700,color:DS.cyan,textTransform:"uppercase",letterSpacing:2,marginBottom:16,fontFamily:DS.font}}>+ Agregar profesional</div>
          <form onSubmit={handleCreate}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div><Label required>Nombre</Label><DSInput type="text" name="nombre" placeholder="Dr. García" value={form.nombre} onChange={e=>setForm({...form,nombre:e.target.value})} required/></div>
              <div><Label required>Especialidad</Label><DSInput type="text" name="especialidad" placeholder="Odontología" value={form.especialidad} onChange={e=>setForm({...form,especialidad:e.target.value})} required/></div>
              <div><Label>Email</Label><DSInput type="email" name="email" placeholder="doctor@clinica.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div>
              <div><Label>Teléfono</Label><DSInput type="text" name="telefono" placeholder="11-1234-5678" value={form.telefono} onChange={e=>setForm({...form,telefono:e.target.value})}/></div>
            </div>
            <CTA loading={saving} disabled={saving}>{saving?"Guardando...":"Crear profesional"}</CTA>
          </form>
        </div>
      </div>
    </>
  );
}
function BracketTL(){return(<div style={{position:"absolute",top:12,left:12,pointerEvents:"none"}}><div style={{width:14,height:2,background:"#2563eb",borderRadius:1}}/><div style={{width:2,height:14,background:"#2563eb",borderRadius:1,marginTop:-2}}/></div>);}
function BracketBR(){return(<div style={{position:"absolute",bottom:12,right:12,pointerEvents:"none",display:"flex",flexDirection:"column",alignItems:"flex-end"}}><div style={{width:2,height:14,background:"#06b6d4",borderRadius:1}}/><div style={{width:14,height:2,background:"#06b6d4",borderRadius:1,marginTop:-2}}/></div>);}
