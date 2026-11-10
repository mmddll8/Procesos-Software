import { useState, useEffect } from 'react';
import { useAuth, type UserSession } from './context/AuthContext';
import MainMenu from './mainmenu';

type Vista = 'inicio' | 'perfil' | 'salud' | 'recuperar';

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

type ClaveSalud = 'peso' | 'altura' | 'imc' | 'horasUltimaNoche' | 'promedioSemanal' | 'vasosHoy' | 'objetivoDiario';

// Campos de salud que se muestran en el perfil (según el JSON de la captura)
const CAMPOS_SALUD: { clave: ClaveSalud; etiqueta: string; unidad?: string; icono: string }[] = [
  { clave: 'peso', etiqueta: 'Peso', unidad: 'kg', icono: '⚖️' },
  { clave: 'altura', etiqueta: 'Altura', unidad: 'm', icono: '📏' },
  { clave: 'imc', etiqueta: 'IMC', icono: '📊' },
  { clave: 'horasUltimaNoche', etiqueta: 'Horas de sueño anoche', unidad: 'h', icono: '😴' },
  { clave: 'promedioSemanal', etiqueta: 'Promedio semanal de sueño', unidad: 'h', icono: '🌙' },
  { clave: 'vasosHoy', etiqueta: 'Vasos de agua hoy', icono: '💧' },
  { clave: 'objetivoDiario', etiqueta: 'Objetivo diario de vasos', icono: '🎯' },
];

// Rutinas, eventos y comunidades de ejemplo del usuario (datos inventados para la demo)
const ACTIVIDADES_EJEMPLO = {
  rutinas: ['Cardio de la mañana', 'Estiramientos y movilidad'],
  eventos: ['Carrera solidaria del campus', 'Taller de cocina saludable'],
  comunidades: ['Runners URJC', 'Club de lectura saludable'],
};

// Valores de ejemplo de la captura
const DATOS_SALUD_EJEMPLO: Record<ClaveSalud, number> = {
  peso: 78,
  altura: 1.75,
  imc: 25.5,
  horasUltimaNoche: 7.5,
  promedioSemanal: 7.2,
  vasosHoy: 6,
  objetivoDiario: 8,
};

// HU-06 y HU-08: vista de Perfil con soporte para edición y guardado
function PerfilView({ session, onVolver }: { session: UserSession; onVolver: () => void }) {
  const { updateProfile } = useAuth();

  // Estados locales para la edición del perfil (SCRUM-46 / SCRUM-47)
  const [nombre, setNombre] = useState(session.nombre || '');
  const [hasAllergies, setHasAllergies] = useState(session.hasAllergies || false);
  const [allergies, setAllergies] = useState(session.allergies || '');
  const [hasDietaryPreferences, setHasDietaryPreferences] = useState(session.hasDietaryPreferences || false);
  const [dietaryPreferences, setDietaryPreferences] = useState(session.dietaryPreferences || '');

  // Datos de salud del perfil y modo edición

  // Estados de feedback al guardar
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Los datos personales solo se pueden editar después de pulsar el botón Editar
  const [editandoPerfil, setEditandoPerfil] = useState(false);

  // Sincronizar el estado local si cambia la sesión global
  useEffect(() => {
    setNombre(session.nombre || '');
    setHasAllergies(session.hasAllergies || false);
    setAllergies(session.allergies || '');
    setHasDietaryPreferences(session.hasDietaryPreferences || false);
    setDietaryPreferences(session.dietaryPreferences || '');
  }, [session]);

  const iniciales = (nombre || session.nombre)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  // SCRUM-48: Manejo del envío del formulario con gestión de errores
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Validación del Criterio de Aceptación 2: Campo vacío o incorrecto
    if (!nombre.trim()) {
      setErrorMsg('El campo nombre no puede quedar vacío.');
      return;
    }

    const result = await updateProfile({
      nombre,
      hasAllergies,
      allergies: hasAllergies ? allergies : '',
      hasDietaryPreferences,
      dietaryPreferences: hasDietaryPreferences ? dietaryPreferences : '',
    });

    if (result.success) {
      setSuccessMsg('Perfil actualizado correctamente.');
    } else {
      setErrorMsg(result.message || 'Error al actualizar el perfil.');
    }
  };

  return (
    <section style={tarjeta}>
      {/* Cabecera en rojo institucional */}
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
          {iniciales || 'U'}
        </div>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>Mi perfil</div>
          <h2 style={{ margin: '4px 0 0', fontSize: '24px', color: '#fff' }}>{session.nombre}</h2>
        </div>
      </div>

      {/* Datos personales: vista de lectura y formulario solo al pulsar Editar */}
      {!editandoPerfil && (
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
          <h3 style={{ margin: 0, color: URJC.texto }}>📋 Mis datos</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {[
              { etiqueta: 'Nombre completo', valor: session.nombre, icono: '👤' },
              { etiqueta: 'Email', valor: session.email, icono: '✉️' },
              { etiqueta: 'Alergias o intolerancias', valor: session.hasAllergies ? session.allergies || 'Sí, sin detallar' : 'No', icono: '🥜' },
              { etiqueta: 'Preferencias dietéticas', valor: session.hasDietaryPreferences ? session.dietaryPreferences || 'Sí, sin detallar' : 'No', icono: '🥗' },
            ].map((dato) => (
              <div key={dato.etiqueta} style={{ background: URJC.grisSuave, borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: URJC.textoSuave, fontWeight: 'bold', marginBottom: '6px' }}>
                  {dato.icono} {dato.etiqueta}
                </div>
                <div style={{ fontSize: '16px', color: URJC.texto, wordBreak: 'break-word' }}>{dato.valor}</div>
              </div>
            ))}
          </div>
          <h3 style={{ margin: '8px 0 0', color: URJC.texto }}>🌟 Mi actividad</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            {[
              { titulo: '🏃 Mis rutinas', items: ACTIVIDADES_EJEMPLO.rutinas },
              { titulo: '📅 Mis eventos', items: ACTIVIDADES_EJEMPLO.eventos },
              { titulo: '👥 Mis comunidades', items: ACTIVIDADES_EJEMPLO.comunidades },
            ].map((grupo) => (
              <div key={grupo.titulo} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '14px 16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: URJC.rojo, marginBottom: '10px' }}>{grupo.titulo}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {grupo.items.map((nombre) => (
                    <span
                      key={nombre}
                      style={{ background: URJC.rojoSuave, color: URJC.rojoOscuro, borderRadius: '999px', padding: '6px 12px', fontSize: '14px' }}
                    >
                      {nombre}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => setEditandoPerfil(true)}
              style={{ padding: '12px 20px', border: 'none', borderRadius: '8px', background: URJC.rojo, color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
            >
              Editar datos personales
            </button>
            <button
              type="button"
              onClick={onVolver}
              style={{ padding: '12px 20px', border: `2px solid ${URJC.rojo}`, borderRadius: '8px', background: '#fff', color: URJC.rojo, cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}

      {editandoPerfil && (
      <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', width: '100%', boxSizing: 'border-box', margin: '0 auto' }}>
        <h3 style={{ margin: 0, color: URJC.texto }}>Editar Datos Personales</h3>

        {/* Mensajes de feedback */}
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: '#fde8e8', color: '#c8102e', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '10px 14px', background: '#eaf7ed', color: '#2e7d32', borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
            {successMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label htmlFor="nombre-input" style={{ fontSize: '14px', fontWeight: 'bold', color: URJC.texto }}>
            Nombre completo:
          </label>
          <input
            id="nombre-input"
            type="text"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', color: URJC.textoSuave }}>Email (identificador no editable):</label>
          <input
            type="email"
            value={session.email}
            disabled
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e0e0e0', background: URJC.grisSuave, color: '#777', fontSize: '15px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={hasAllergies}
              onChange={(e) => setHasAllergies(e.target.checked)}
            />
            ¿Tienes alergias o intolerancias?
          </label>
          {hasAllergies && (
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Indica tus alergias o intolerancias (ej. Frutos secos, Lactosa)"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px', fontFamily: 'inherit' }}
            />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' }}>
            <input
              type="checkbox"
              checked={hasDietaryPreferences}
              onChange={(e) => setHasDietaryPreferences(e.target.checked)}
            />
            ¿Tienes preferencias dietéticas?
          </label>
          {hasDietaryPreferences && (
            <textarea
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              placeholder="Indica tus preferencias dietéticas (ej. Vegetariano, Vegano)"
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', minHeight: '60px', fontFamily: 'inherit' }}
            />
          )}
        </div>

        {/* Botones de acción */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '12px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              background: URJC.rojo,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
            }}
          >
            Guardar Cambios
          </button>
          <button
            type="button"
            onClick={() => setEditandoPerfil(false)}
            style={{ padding: '12px 20px', border: `2px solid ${URJC.rojo}`, borderRadius: '8px', background: '#fff', color: URJC.rojo, cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onVolver}
            style={{
              padding: '12px 20px',
              border: `2px solid ${URJC.rojo}`,
              borderRadius: '8px',
              background: '#fff',
              color: URJC.rojo,
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
            }}
          >
            Volver al inicio
          </button>
        </div>
      </form>
      )}
    </section>
  );
}

// HU-10: datos básicos de salud
// HU-10: datos básicos de salud, con las tarjetas y el botón Editar
function SaludView({ onVolver }: { onVolver: () => void }) {
  const salud = DATOS_SALUD_EJEMPLO;

  return (
    <section style={tarjeta}>
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
            fontSize: '30px',
            flexShrink: 0,
          }}
        >
          ♥
        </div>
        <div>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.85 }}>Mi salud</div>
          <h2 style={{ margin: '4px 0 0', fontSize: '24px', color:'#fff' }}>Datos básicos de salud</h2>
        </div>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'grid', width: '100%', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
          {CAMPOS_SALUD.map((campo) => (
            <div key={campo.clave} style={{ background: URJC.rojoSuave, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '30px', marginBottom: '6px' }}>{campo.icono}</div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: URJC.rojoOscuro, fontWeight: 'bold', marginBottom: '8px' }}>
                {campo.etiqueta}
              </div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', color: URJC.texto }}>
                {salud[campo.clave]}
                {campo.unidad && <span style={{ fontSize: '14px', color: URJC.textoSuave, marginLeft: '4px' }}>{campo.unidad}</span>}
              </div>
            </div>
          ))}
        </div>

      </div>

      <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
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

  // Estados para formulario de acceso
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

  // Vista activa dentro de la sesión (inicio, perfil o salud)
  const [vista, setVista] = useState<Vista>('inicio');

  // Estados de feedback y verificación de correo
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleEmailVerification = async () => {
    setIsVerifying(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await verifyEmail(email, verificationCode);

      if (result.success) {
        setSuccessMessage('¡Correo confirmado con éxito! Ya puedes iniciar sesión.');
        setVerificationPending(false);
        setVerificationCode('');
      } else {
        setError(result.message ?? 'El código no es válido o ha caducado. Solicita uno nuevo.');
      }
    } catch {
      setError('Ocurrió un error al verificar el código.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Por favor, introduce tu email para reenviar el código de verificación.');
      return;
    }
    setError('');
    setSuccessMessage('');

    const result = await resendVerificationEmail(email);
    if (result.success) {
      setSuccessMessage('');
    } else {
      setError(result.message ?? 'No se pudo completar la verificación de demostración.');
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

      const result = await register({
        nombre,
        email,
        password,
        hasAllergies,
        allergies: hasAllergies ? allergies : '',
        hasDietaryPreferences,
        dietaryPreferences: hasDietaryPreferences ? dietaryPreferences : '',
        aceptaTerminos
      });

      if (!result.success) {
        setError(result.message ?? 'Error al crear la cuenta. Inténtalo de nuevo.');
      } else {
        setSuccessMessage('Registro realizado.');
        setVerificationPending(true);
        setIsRegister(false);
      }
    } else {
      const result = await login(email, password);
      const isSuccess = typeof result === 'boolean' ? result : result.success;

      if (!isSuccess) {
        if (typeof result === 'object' && result.emailNotVerified) {
          setError('Debes confirmar tu correo electrónico antes de iniciar sesión.');
          setVerificationPending(true);
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
    setVerificationPending(false);
    setVerificationCode('');
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
    setError('');
    setSuccessMessage('');
    setNombre('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    sethasAllergies(false);
    setAlergias('');
    sethasDietaryPreferences(false);
    setPreferenciasDieteticas('');
    setAceptaTerminos(false);
    setVerificationPending(false);
    setVerificationCode('');
    setVista('inicio');
  };

  // ==========================================
  // RENDERIZADO DE VISTA DE RECUPERACIÓN (PRÁCTICA)
  // ==========================================
  if (!session && vista === 'recuperar') {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2 style={{ textAlign: 'center' }}>Healthy Life — URJC</h2>
        <RecuperarClaveView 
          onVolver={() => {
            setError('');
            setSuccessMessage('');
            setVista('inicio');
          }} 
        />
      </div>
    );
  }

  // Con sesión iniciada
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
          <MainMenu onLogout={handleLogout} onMiPerfil={() => setVista('perfil')} onDatosSalud={() => setVista('salud')} />
        </header>

        <main style={{ maxWidth: '720px', margin: '40px auto', padding: '0 16px' }}>
          {vista === 'perfil' && <PerfilView session={session} onVolver={() => setVista('inicio')} />}
          {vista === 'salud' && <SaludView onVolver={() => setVista('inicio')} />}
          {vista === 'inicio' && (
            <section style={{ ...tarjeta, padding: '28px' }}>
              <h2 style={{ marginTop: 0, color: URJC.rojo }}>¡Sesión iniciada!</h2>
              <p>Hola, <strong>{session.nombre}</strong> ({session.email}).</p>
              <p style={{ fontSize: '14px', color: URJC.textoSuave }}>
                Selecciona <strong>"Mi Perfil"</strong> en el menú desplegable superior para modificar tus datos personales, alergias y preferencias.
              </p>
            </section>
          )}
        </main>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Healthy Life — URJC</h2>

      {isVerifying ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Verificando tu código...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>{isRegister ? 'Crear Cuenta' : 'Control de Acceso'}</h3>

          {error && <p style={{ fontSize: '14px', margin: '0', color: '#d9534f' }}>{error}</p>}
          {successMessage && <p style={{ fontSize: '14px', margin: '0', color: '#5cb85c' }}>{successMessage}</p>}

          {verificationPending && (
            <>
              <p>Introduce el código de verificación para {email}.</p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Código de verificación"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                aria-label="Código de verificación"
              />
              <button type="button" onClick={handleEmailVerification} disabled={verificationCode.length !== 4}>
                Verificar código
              </button>
            </>
          )}

          {verificationPending && (
            <button
              type="button"
              onClick={handleResendEmail}
              style={{ padding: '8px', backgroundColor: '#f0ad4e', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Ver instrucciones de verificación
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

          {/* BOTÓN INTERCEPTOR DE LA HU: Sólo aparece en la vista de Login */}
          {!isRegister && (
            <p 
              onClick={() => {
                setError('');
                setSuccessMessage('');
                setVista('recuperar');
              }} 
              style={{ textAlign: 'center', cursor: 'pointer', fontSize: '14px', color: '#0056b3', textDecoration: 'underline', margin: '4px 0 0' }}
            >
              ¿Olvidaste tu contraseña?
            </p>
          )}

          <p onClick={toggleForm} style={{ textAlign: 'center', cursor: 'pointer', fontSize: '14px', marginTop: '10px', textDecoration: 'underline' }}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </p>
        </form>
      )}
    </div>
  );
}

// ==========================================
// NUEVO COMPONENTE AUXILIAR PARA LA HU DE RECUPERACIÓN
// ==========================================
function RecuperarClaveView({ onVolver }: { onVolver: () => void }) {
  const [email, setEmail] = useState('');
  const [enviado, setEnviado] = useState(false);

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulación por consola obligatoria de la práctica académica
    console.log(`[SIMULACIÓN SMTP] Enviando email a: ${email}`);
    console.log(`[SIMULACIÓN SMTP] URL generada: http://localhost:5173/reset?email=${encodeURIComponent(email)}`);
    setEnviado(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
      <h3>Recuperar Contraseña</h3>
      {!enviado ? (
        <form onSubmit={manejarEnvio} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.4' }}>
            Introduce tu dirección de correo electrónico para recibir un enlace de restablecimiento de contraseña.
          </p>
          <input
            type="email"
            placeholder="Introduce tu Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '8px' }}
            required
          />
          <button type="submit" style={{ padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', backgroundColor: '#c8102e', color: '#fff' }}>
            Enviar enlace
          </button>
        </form>
      ) : (
        /* Cumple con el criterio de seguridad de tu imagen de no revelar si existe el correo */
        <div style={{ padding: '10px', backgroundColor: '#fdecef', borderRadius: '4px', borderLeft: '4px solid #c8102e' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#c8102e', fontWeight: 'bold' }}>
            Si el correo está registrado, recibirás un enlace temporal para cambiar la clave.
          </p>
        </div>
      )}
      <p onClick={onVolver} style={{ textAlign: 'center', cursor: 'pointer', fontSize: '14px', marginTop: '10px', textDecoration: 'underline', color: '#555' }}>
        Volver al Control de Acceso
      </p>
    </div>
  );
}

export default App;