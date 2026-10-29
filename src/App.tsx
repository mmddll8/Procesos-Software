import { useState, useEffect } from 'react';
import { useAuth, type UserSession } from './context/AuthContext';
import MainMenu from './mainmenu';

type Vista = 'inicio' | 'perfil' | 'salud';

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

// HU-06 y HU-08: vista de Perfil con soporte para edición y guardado
function PerfilView({ session, onVolver }: { session: UserSession; onVolver: () => void }) {
  const { updateProfile } = useAuth();

  // Estados locales para la edición del perfil (SCRUM-46 / SCRUM-47)
  const [nombre, setNombre] = useState(session.nombre || '');
  const [hasAllergies, setHasAllergies] = useState(session.hasAllergies || false);
  const [allergies, setAllergies] = useState(session.allergies || '');
  const [hasDietaryPreferences, setHasDietaryPreferences] = useState(session.hasDietaryPreferences || false);
  const [dietaryPreferences, setDietaryPreferences] = useState(session.dietaryPreferences || '');

  // Estados de feedback al guardar
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
          <h2 style={{ margin: '4px 0 0', fontSize: '24px' }}>{session.nombre}</h2>
        </div>
      </div>

      {/* Formulario de Edición de Perfil */}
      <form onSubmit={handleSave} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
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
    </section>
  );
}

// HU-10: datos básicos de salud
function SaludView({ onVolver }: { onVolver: () => void }) {
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
          <h2 style={{ margin: '4px 0 0', fontSize: '24px' }}>Datos básicos de salud</h2>
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '28px 16px',
            background: URJC.grisSuave,
            borderRadius: '10px',
            borderLeft: `4px solid ${URJC.rojo}`,
          }}
        >
          <p style={{ fontSize: '18px', color: URJC.texto, margin: '0 0 8px', fontWeight: 'bold' }}>
            No hay datos de salud registrados.
          </p>
          <p style={{ fontSize: '14px', color: URJC.textoSuave, margin: 0 }}>
            Cuando haya datos del Equipo 2, aparecerán aquí organizados por apartados.
          </p>
        </div>
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
  const [verificationFailed, setVerificationFailed] = useState(false);

  // Detectar si el usuario abre la App desde el enlace del email (?token=...)
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get('token');

    if (token) {
      handleEmailVerification(token);
    }
  }, []);

  const handleEmailVerification = async (token: string) => {
    setIsVerifying(true);
    setError('');
    setSuccessMessage('');
    setVerificationFailed(false);

    try {
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
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

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
          <p>Verificando tu correo electrónico...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>{isRegister ? 'Crear Cuenta' : 'Control de Acceso'}</h3>

          {error && <p style={{ fontSize: '14px', margin: '0', color: '#d9534f' }}>{error}</p>}
          {successMessage && <p style={{ fontSize: '14px', margin: '0', color: '#5cb85c' }}>{successMessage}</p>}

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