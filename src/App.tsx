import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import MainMenu from './mainmenu';

type Vista = 'inicio' | 'perfil';

interface PerfilDatos {
  nombre: string;
  email: string;
  id_user: string;
  hasAllergies: boolean;
  allergies: string;
  hasDietaryPreferences: boolean;
  dietaryPreferences: string;
}

// Colores institucionales de la URJC
const URJC = {
  rojo: '#c8102e',
  rojoOscuro: '#8f0a20',
  rojoSuave: '#fdecef',
  grisSuave: '#f5f6f8',
  texto: '#222',
  textoSuave: '#6b6f76',
} as const;

const tarjeta = {
  background: '#fff',
  borderRadius: '14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  overflow: 'hidden',
} as const;

// Caja de dato: borde rojo a la izquierda; las destacadas van en rojo suave
function DatoCaja({ etiqueta, valor, destacado = false, mono = false }: { etiqueta: string; valor: string; destacado?: boolean; mono?: boolean }) {
  return (
    <div
      style={{
        background: destacado ? URJC.rojoSuave : URJC.grisSuave,
        borderLeft: `4px solid ${URJC.rojo}`,
        borderRadius: '8px',
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: URJC.rojoOscuro, fontWeight: 'bold', marginBottom: '6px' }}>
        {etiqueta}
      </div>
      <div style={{ fontSize: '16px', color: URJC.texto, fontFamily: mono ? 'monospace' : 'inherit', wordBreak: 'break-word' }}>
        {valor}
      </div>
    </div>
  );
}

// HU-08: datos personales del usuario con sesión iniciada
function PerfilView({ session, onVolver }: { session: PerfilDatos; onVolver: () => void }) {
  const iniciales = session.nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <section style={tarjeta}>
      {/* Cabecera en rojo institucional con el nombre y la inicial */}
      <div
        style={{
          background: `linear-gradient(135deg, ${URJC.rojo}, ${URJC.rojoOscuro})`,
          color: '#fff',
          padding: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <div
          style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: '#fff',
            color: URJC.rojo,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            flexShrink: 0,
          }}
        >
          {iniciales}
        </div>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>Mi perfil</div>
          <h2 style={{ margin: '4px 0 0', fontSize: '24px' }}>{session.nombre}</h2>
        </div>
      </div>

      {/* Datos del usuario en cajas */}
      <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
        <DatoCaja etiqueta="Email" valor={session.email} />
        <DatoCaja
          etiqueta="Alergias o intolerancias"
          valor={session.hasAllergies ? session.allergies || 'Sí, sin detallar' : 'No'}
          destacado
        />
        <DatoCaja
          etiqueta="Preferencias dietéticas"
          valor={session.hasDietaryPreferences ? session.dietaryPreferences || 'Sí, sin detallar' : 'No'}
          destacado
        />
      </div>

      <div style={{ padding: '0 24px 24px' }}>
        <button
          type="button"
          onClick={onVolver}
          style={{
            padding: '10px 18px',
            border: `2px solid ${URJC.rojo}`,
            borderRadius: '8px',
            background: '#fff',
            color: URJC.rojo,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Volver al inicio
        </button>
      </div>
    </section>
  );
}

function App() {
  const { session, login, register, logout, verifyEmail, resendVerificationEmail } = useAuth();

  // Estados para formulario
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [hasAllergies, sethasAllergies] = useState(false);
  const [allergies, setAlergias] = useState('');
  const [hasDietaryPreferences, sethasDietaryPreferences] = useState(false);
  const [dietaryPreferences, setPreferenciasDieteticas] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  // Vista activa dentro de la sesión (inicio o perfil)
  const [vista, setVista] = useState<Vista>('inicio');

  // Estados de feedback y verificación de correo
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);

  // EFECTO: Detectar si el usuario abre la App desde el enlace del email (?token=...)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    if (token) {
      handleEmailVerification(token);
    }
  }, []);

  // Función para procesar el token de confirmación recibido por enlace
  const handleEmailVerification = async (token: string) => {
    setIsVerifying(true);
    setError('');
    setSuccessMessage('');
    setVerificationFailed(false);

    try {
      // Llamada a la función de verificación en AuthContext
      const result = await verifyEmail(token);

      if (result.success) {
        setSuccessMessage('¡Correo confirmado con éxito! Ya puedes acceder a todas las funcionalidades de la plataforma.');
      } else {
        setVerificationFailed(true);
        if (result.expired) {
          setError('El enlace de verificación ha expirado. Solicita uno nuevo a continuación.');
        } else {
          setError('El enlace de verificación no es válido o ya ha sido utilizado.');
        }
      }
    } catch {
      setVerificationFailed(true);
      setError('Ocurrió un error al verificar el correo electrónico.');
    } finally {
      setIsVerifying(false);
      // Limpiar la URL para no dejar el token expuesto
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Solicitar un nuevo enlace si el anterior expiró o falló
  const handleResendEmail = async () => {
    if (!email) {
      setError('Por favor, introduce tu email para reenviar el enlace de verificación.');
      return;
    }
    setError('');
    setSuccessMessage('');

    const sent = await resendVerificationEmail(email);
    if (sent) {
      setSuccessMessage('Se ha enviado un nuevo enlace de verificación a tu correo.');
      setVerificationFailed(false);
    } else {
      setError('No se pudo enviar el correo de verificación. Revisa el email introducido.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }

      const success = await register({
        nombre,
        email,
        password,
        hasAllergies,
        allergies: hasAllergies ? allergies : '',
        hasDietaryPreferences,
        dietaryPreferences: hasDietaryPreferences ? dietaryPreferences : '',
        aceptaTerminos
      });

      if (!success) {
        setError('Error al crear la cuenta. Inténtalo de nuevo.');
      } else {
        setSuccessMessage('Registro realizado con éxito. Te hemos enviado un correo de verificación para activar tu cuenta.');
        setIsRegister(false);
      }
    } else {
  const result = await login(email, password);

  const isSuccess = typeof result === 'boolean' ? result : result.success;

  if (!isSuccess) {
    if (typeof result === 'object' && result.emailNotVerified) {
      setError('Debes confirmar tu correo electrónico antes de iniciar sesión.');
      setVerificationFailed(true);
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  }
}
  };

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setError('');
    setSuccessMessage('');
    setVerificationFailed(false);
    setNombre('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    sethasAllergies(false);
    setAlergias('');
    sethasDietaryPreferences(false);
    setPreferenciasDieteticas('');
    setAceptaTerminos(false);
  };

  const handleLogout = () => {
    logout();
    setIsRegister(false);
    setError('');
    setSuccessMessage('');
    setVerificationFailed(false);
    setNombre('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    sethasAllergies(false);
    setAlergias('');
    sethasDietaryPreferences(false);
    setPreferenciasDieteticas('');
    setAceptaTerminos(false);
    setVista('inicio');
  };

  // Con sesión iniciada: página completa con cabecera y desplegable arriba a la derecha
  if (session) {
    return (
      <div style={{ minHeight: '100vh', background: '#f4f5f7', fontFamily: 'sans-serif' }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 32px',
            background: '#c8102e',
            color: '#fff',
          }}
        >
          <strong style={{ fontSize: '18px' }}>Healthy Life — URJC</strong>
          <MainMenu onLogout={handleLogout} onMiPerfil={() => setVista('perfil')} />
        </header>

        <main style={{ maxWidth: '720px', margin: '40px auto', padding: '0 16px' }}>
          {vista === 'perfil' ? (
            <PerfilView session={session} onVolver={() => setVista('inicio')} />
          ) : (
            <section style={{ ...tarjeta, padding: '28px' }}>
              <h2 style={{ marginTop: 0, color: URJC.rojo }}>¡Sesión iniciada!</h2>
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Healthy Life — URJC</h2>

      {/* Pantalla de carga mientras se valida el token */}
      {isVerifying ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Verificando tu correo electrónico...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>{isRegister ? 'Crear Cuenta' : 'Control de Acceso'}</h3>

          {/* Mensajes de Estado */}
          {error && <p style={{ fontSize: '14px', margin: '0', color: '#d9534f' }}>{error}</p>}
          {successMessage && <p style={{ fontSize: '14px', margin: '0', color: '#5cb85c' }}>{successMessage}</p>}

          {/* Opción de reenviar email de verificación si falló */}
          {verificationFailed && (
            <button
              type="button"
              onClick={handleResendEmail}
              style={{ padding: '8px', backgroundColor: '#f0ad4e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Solicitar nuevo enlace de verificación
            </button>
          )}

          {isRegister && (
            <input type="text" placeholder="Nombre y Apellidos" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '8px' }} required />
          )}

          <input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} style={{ padding: '8px' }} required />

          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} style={{ padding: '8px' }} required />

          {isRegister && (
            <input type="password" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ padding: '8px' }} required />
          )}

          {isRegister && (
            <>
              <label className="preference-question">
                <input className="preference-checkbox" type="checkbox" checked={hasAllergies} onChange={(e) => sethasAllergies(e.target.checked)} />
                ¿Tienes alergias o intolerancias?
              </label>
              {hasAllergies && (
                <textarea className="preference-field" placeholder="Indica tus alergias o intolerancias" value={allergies} onChange={(e) => setAlergias(e.target.value)} required />
              )}

              <label className="preference-question">
                <input className="preference-checkbox" type="checkbox" checked={hasDietaryPreferences} onChange={(e) => sethasDietaryPreferences(e.target.checked)} />
                ¿Tienes preferencias dietéticas?
              </label>
              {hasDietaryPreferences && (
                <textarea className="preference-field" placeholder="Indica tus preferencias dietéticas" value={dietaryPreferences} onChange={(e) => setPreferenciasDieteticas(e.target.value)} required />
              )}
            </>
          )}

          {isRegister && (
            <label className="preference-question">
              <input
                className="preference-checkbox"
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => {
                  e.currentTarget.setCustomValidity('');
                  setAceptaTerminos(e.target.checked);
                  setError('');
                }}
                onInvalid={(e) => e.currentTarget.setCustomValidity('Marca esta casilla para continuar.')}
                required
              />
              He leído y acepto los términos de uso y la política de privacidad
            </label>
          )}

          <button type="submit" style={{ padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegister ? 'Registrarse' : 'Entrar'}
          </button>

          <p onClick={toggleForm} style={{ textAlign: 'center', cursor: 'pointer', fontSize: '14px', marginTop: '10px', textDecoration: 'underline' }}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </p>
        </form>
      )}
    </div>
  );
}

export default App;
