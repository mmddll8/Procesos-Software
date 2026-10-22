import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import MainMenu from './mainmenu';

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
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center' }}>Healthy Life — URJC</h2>

      {/* Pantalla de carga mientras se valida el token */}
      {isVerifying ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Verificando tu correo electrónico...</p>
        </div>
      ) : !session ? (
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
      ) : (
        <div style={{ textAlign: 'center' }}>
          <MainMenu onLogout={handleLogout} />
          <h3>¡Sesión Iniciada!</h3>
          <p>Hola, <strong>{session.nombre}</strong> ({session.email})</p>
          <p style={{ fontSize: '14px' }}>Tu identificador único de usuario es: <strong style={{ fontFamily: 'monospace' }}>{session.id_user}</strong></p>
        </div>
      )}
    </div>
  );
}

export default App;