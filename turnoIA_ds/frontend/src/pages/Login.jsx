import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

// ─── Design System ────────────────────────────────────────────────────────────
const DS = {
  pageBg:        "#050510",
  cardBg:        "rgba(15,23,42,0.95)",
  inputBg:       "#1e293b",
  hoverBg:       "#0f172a",
  blue:          "#2563eb",
  cyan:          "#06b6d4",
  gradient:      "linear-gradient(135deg,#2563eb,#06b6d4)",
  textPrimary:   "#ffffff",
  textSecondary: "#94a3b8",
  textDisabled:  "#64748b",
  borderDefault: "#334155",
  borderFocus:   "#2563eb",
  borderCard:    "#1e293b",
  errorBg:       "rgba(220,38,38,0.15)",
  errorBorder:   "rgba(220,38,38,0.30)",
  errorText:     "#fca5a5",
  successBg:     "rgba(16,185,129,0.15)",
  successBorder: "rgba(16,185,129,0.30)",
  successText:   "#6ee7b7",
  font:          "'Space Grotesk',sans-serif",
};

// ─── Estrellas ────────────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      o: Math.random() * 0.5 + 0.4,
      speed: Math.random() * 0.4 + 0.1,
    }));
    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${s.o})`;
        ctx.fill();
        s.o += s.speed * 0.008;
        if (s.o > 0.95 || s.o < 0.35) s.speed *= -1;
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const handleResize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', handleResize); };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    }} />
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginBottom:24 }}>
      <div style={{
        width:56, height:56, borderRadius:14,
        background: DS.gradient,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow: '0 0 24px rgba(37,99,235,0.5)',
        fontSize: 26,
      }}>⚙️</div>
      <div style={{ textAlign:'center' }}>
        <div style={{
          fontFamily: DS.font, fontWeight:700, fontSize:26,
          color: DS.textPrimary, letterSpacing:1,
        }}>TurnoIA</div>
        <div style={{
          fontSize:11, textTransform:'uppercase', letterSpacing:3,
          color: DS.textSecondary, marginTop:3,
        }}>Gestión inteligente de turnos</div>
      </div>
    </div>
  );
}

// ─── Input con ícono ──────────────────────────────────────────────────────────
function AuthInput({ icon, error, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <span style={{
        position:'absolute', left:13, top:'50%', transform:'translateY(-50%)',
        fontSize:15, color: focused ? DS.cyan : DS.textDisabled,
        pointerEvents:'none', transition:'color .2s',
      }}>{icon}</span>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
        style={{
          width:'100%', height:46, padding:'0 12px 0 40px',
          background: DS.inputBg,
          border: `1px solid ${error ? 'rgba(220,38,38,0.6)' : focused ? DS.borderFocus : DS.borderDefault}`,
          borderRadius:8, fontSize:14, color: DS.textPrimary,
          fontFamily: DS.font, outline:'none',
          transition:'border-color .2s',
          boxSizing:'border-box',
        }}
      />
    </div>
  );
}

// ─── PÁGINA LOGIN ─────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [mode, setMode]       = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  const [loginData, setLoginData]       = useState({ email:'', password:'' });
  const [registerData, setRegisterData] = useState({ nombre:'', email:'', password:'', slug:'' });

  const handleLogin = async e => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginData.email, password: loginData.password });
      const token = res.data.access_token || res.data.token;
      if (!token) throw new Error('No se recibió token del servidor.');
      login(token);
      const destination = location.state?.from?.pathname || '/agenda';
      navigate(destination, { replace:true });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Error al iniciar sesión.');
    } finally { setLoading(false); }
  };

  const handleRegister = async e => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await api.post('/auth/register', {
        nombre: registerData.nombre, email: registerData.email,
        password: registerData.password, slug: registerData.slug,
      });
      setSuccess('¡Cuenta creada! Ahora podés iniciar sesión.');
      setMode('login');
      setLoginData({ email: registerData.email, password:'' });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || err.message || 'Error al registrarse.');
    } finally { setLoading(false); }
  };

  const switchMode = m => { setMode(m); setError(''); setSuccess(''); };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);} }
        @keyframes spin   { to{transform:rotate(360deg);} }
        input::placeholder { color: #64748b !important; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #1e293b inset !important;
          -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>

      <Starfield />

      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        padding:16, position:'relative', zIndex:1,
        fontFamily: DS.font,
      }}>
        <div style={{
          width:'100%', maxWidth:400,
          background: DS.cardBg,
          border: `1px solid ${DS.borderCard}`,
          borderRadius:16, padding:'32px 40px',
          backdropFilter:'blur(20px)',
          boxShadow:'0 25px 60px rgba(0,0,0,0.5)',
          animation:'fadeUp .35s ease',
          position:'relative',
        }}>
          {/* Brackets decorativos */}
          <BracketTL /><BracketBR />

          <Logo />

          {/* Tabs */}
          <div style={{
            display:'flex', marginBottom:20,
            background: DS.inputBg, borderRadius:8, padding:4,
          }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex:1, padding:'7px 0', border:'none', cursor:'pointer',
                borderRadius:6, fontSize:13, fontWeight:600, fontFamily: DS.font,
                background: mode===m ? DS.gradient : 'transparent',
                color: mode===m ? '#fff' : DS.textDisabled,
                transition:'all .2s',
              }}>
                {m==='login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Banners */}
          {error && (
            <div style={{
              background: DS.errorBg, border:`1px solid ${DS.errorBorder}`,
              borderRadius:8, padding:'10px 14px', marginBottom:16,
              fontSize:13, color: DS.errorText,
              display:'flex', alignItems:'flex-start', gap:8,
            }}>
              <span style={{ color:'#f59e0b', flexShrink:0 }}>⚠</span>{error}
            </div>
          )}
          {success && (
            <div style={{
              background: DS.successBg, border:`1px solid ${DS.successBorder}`,
              borderRadius:8, padding:'10px 14px', marginBottom:16,
              fontSize:13, color: DS.successText,
              display:'flex', alignItems:'center', gap:8,
            }}>
              <span>✓</span>{success}
            </div>
          )}

          {/* LOGIN */}
          {mode==='login' && (
            <form onSubmit={handleLogin}>
              <FieldGroup label="EMAIL">
                <AuthInput icon="✉" type="email" placeholder="tu@email.com"
                  value={loginData.email}
                  onChange={e => setLoginData({...loginData, email:e.target.value})} required />
              </FieldGroup>
              <FieldGroup label="CONTRASEÑA">
                <AuthInput icon="🔒" type="password" placeholder="••••••••"
                  value={loginData.password}
                  onChange={e => setLoginData({...loginData, password:e.target.value})} required />
              </FieldGroup>
              <div style={{ textAlign:'right', marginBottom:20 }}>
                <span style={{ fontSize:12, color: DS.cyan, cursor:'pointer' }}>¿Olvidaste tu contraseña?</span>
              </div>
              <CTA loading={loading}>{loading ? 'Ingresando...' : 'Iniciar sesión'}</CTA>
            </form>
          )}

          {/* REGISTER */}
          {mode==='register' && (
            <form onSubmit={handleRegister}>
              <FieldGroup label="NOMBRE">
                <AuthInput icon="👤" type="text" placeholder="Tu nombre completo"
                  value={registerData.nombre}
                  onChange={e => setRegisterData({...registerData, nombre:e.target.value})} required />
              </FieldGroup>
              <FieldGroup label="EMAIL">
                <AuthInput icon="✉" type="email" placeholder="tu@email.com"
                  value={registerData.email}
                  onChange={e => setRegisterData({...registerData, email:e.target.value})} required />
              </FieldGroup>
              <FieldGroup label="CONTRASEÑA">
                <AuthInput icon="🔒" type="password" placeholder="••••••••"
                  value={registerData.password}
                  onChange={e => setRegisterData({...registerData, password:e.target.value})} required />
              </FieldGroup>
              <FieldGroup label="SLUG (IDENTIFICADOR)">
                <AuthInput icon="🔗" type="text" placeholder="mi-negocio"
                  value={registerData.slug}
                  onChange={e => setRegisterData({...registerData, slug:e.target.value.toLowerCase().replace(/\s+/g,'-')})} required />
              </FieldGroup>
              <CTA loading={loading}>{loading ? 'Creando cuenta...' : 'Crear cuenta'}</CTA>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{
        display:'block', marginBottom:6, fontSize:11, fontWeight:500,
        textTransform:'uppercase', letterSpacing:1, color:'#94a3b8',
        fontFamily:"'Space Grotesk',sans-serif",
      }}>{label}</label>
      {children}
    </div>
  );
}

function CTA({ children, loading }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="submit" disabled={loading}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        width:'100%', height:48, border:'none', borderRadius:8,
        background: "linear-gradient(135deg,#2563eb,#06b6d4)",
        color:'#fff', fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer',
        fontFamily:"'Space Grotesk',sans-serif",
        filter: hov && !loading ? 'brightness(1.1)' : 'none',
        transform: hov && !loading ? 'scale(1.01)' : 'scale(1)',
        transition:'all .2s',
        display:'flex', alignItems:'center', justifyContent:'center', gap:8,
        marginTop:4,
      }}>
      {loading && (
        <span style={{
          width:14, height:14, borderRadius:'50%',
          border:'2px solid rgba(255,255,255,.35)', borderTopColor:'#fff',
          display:'inline-block', animation:'spin .7s linear infinite',
        }} />
      )}
      {children}
    </button>
  );
}

function BracketTL() {
  return (
    <div style={{ position:'absolute', top:12, left:12, pointerEvents:'none' }}>
      <div style={{ width:14, height:2, background:'#2563eb', borderRadius:1 }} />
      <div style={{ width:2, height:14, background:'#2563eb', borderRadius:1, marginTop:-2 }} />
    </div>
  );
}
function BracketBR() {
  return (
    <div style={{ position:'absolute', bottom:12, right:12, pointerEvents:'none', display:'flex', flexDirection:'column', alignItems:'flex-end' }}>
      <div style={{ width:2, height:14, background:'#06b6d4', borderRadius:1 }} />
      <div style={{ width:14, height:2, background:'#06b6d4', borderRadius:1, marginTop:-2 }} />
    </div>
  );
}
