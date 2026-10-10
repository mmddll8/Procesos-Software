import { useState } from 'react';
import { useAuth } from './context/AuthContext';

function App() {
  const { session, login, register, logout } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (isRegister) {
      const success = await register(nombre, email, password);
      if (!success) setError('Error al crear la cuenta. Inténtalo de nuevo.');
    } else {
      const success = await login(email, password);
      if (!success) setError('Usuario o contraseña incorrectos');
    }
  };

  const toggleForm = () => {
    setIsRegister(!isRegister);
    setError('');
    setNombre('');
    setEmail('');
    setPassword('');
  };

  return (
    <div style={{ maxWidth: '400px', margin: '60px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2 style={{textAlign: 'center' }}>Healthy Life — URJC</h2>
      
      {!session ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3>{isRegister ? 'Crear Cuenta' : 'Control de Acceso'}</h3>
          
          {error && <p style={{fontSize: '14px', margin: '0' }}>{error}</p>}
          
          {isRegister && (
            <input type="text" placeholder="Nombre y Apellidos" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ padding: '8px' }} required />)}
          
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '8px' }} required />
          
          <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '8px' }} required />
          
          <button type="submit" style={{ padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRegister ? 'Registrarse' : 'Entrar'}</button>

          <p onClick={toggleForm} style={{ textAlign: 'center', cursor: 'pointer', fontSize: '14px', marginTop: '10px', textDecoration: 'underline' }}>
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}</p>
        </form>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h3>¡Sesión Iniciada!</h3>
          <p>Hola, <strong>{session.nombre}</strong> ({session.email})</p>
          <p style={{ fontSize: '14px'}}>Tu identificador único de usuario es: <strong style={{ fontFamily: 'monospace' }}>{session.id_user}</strong></p>

          <button onClick={logout} style={{ marginTop: '15px', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Cerrar Sesión</button>
        </div>
      )}</div>
  );
}

export default App;