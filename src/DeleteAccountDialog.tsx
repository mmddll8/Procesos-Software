import { useState } from 'react';
import { useAuth } from './context/AuthContext';

// Paleta que recibe desde App.tsx (constante URJC) para no duplicar colores ni crear imports circulares
export interface ColoresDialogo {
  rojo: string;
  rojoOscuro: string;
  rojoSuave: string;
  grisSuave: string;
  texto: string;
  textoSuave: string;
}

interface DeleteAccountDialogProps {
  colores: ColoresDialogo;
  onCancel: () => void;
  // Se llama al pulsar "Aceptar" tras borrar la cuenta
  onDeleted: () => void;
}

// HU-16 / SCRUM-94: diálogo de confirmación para eliminar la cuenta
function DeleteAccountDialog({ colores, onCancel, onDeleted }: DeleteAccountDialogProps) {
  const { deleteAccount } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [eliminada, setEliminada] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password) {
      setError('Introduce tu contraseña para confirmar.');
      return;
    }

    setEnviando(true);
    const result = await deleteAccount(password);
    setEnviando(false);

    if (result.success) {
      setEliminada(true);
    } else {
      setError(result.message ?? 'No se pudo eliminar la cuenta.');
    }
  };

  const botonPrincipal = {
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    background: colores.rojo,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
  } as const;

  const botonSecundario = {
    padding: '12px 20px',
    border: `2px solid ${colores.rojo}`,
    borderRadius: '8px',
    background: '#fff',
    color: colores.rojo,
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '15px',
  } as const;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 100,
      }}
      onKeyDown={(e) => {
        // Escape cancela, salvo cuando la cuenta ya se ha borrado
        if (e.key === 'Escape' && !eliminada && !enviando) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-desc"
        style={{
          background: '#fff',
          borderRadius: '14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
          maxWidth: '440px',
          width: '100%',
          overflow: 'hidden',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ background: `linear-gradient(135deg, ${colores.rojo}, ${colores.rojoOscuro})`, color: '#fff', padding: '18px 24px' }}>
          <h2 id="delete-account-title" style={{ margin: 0, fontSize: '20px', color: '#fff' }}>
            {eliminada ? 'Cuenta eliminada' : 'Eliminar cuenta'}
          </h2>
        </div>

        {eliminada ? (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p
              id="delete-account-desc"
              role="status"
              style={{ margin: 0, padding: '12px 14px', background: '#eaf7ed', color: '#2e7d32', borderRadius: '8px', fontWeight: 'bold' }}
            >
              Tu cuenta y todos tus datos personales se han eliminado correctamente.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" onClick={onDeleted} style={botonPrincipal} autoFocus>
                Aceptar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              id="delete-account-desc"
              style={{ padding: '12px 14px', background: colores.rojoSuave, borderLeft: `4px solid ${colores.rojo}`, borderRadius: '6px', color: colores.texto, fontSize: '14px', lineHeight: 1.5 }}
            >
              <strong style={{ color: colores.rojoOscuro }}>Esta acción es IRREVERSIBLE.</strong> Se eliminarán tu cuenta y todos tus
              datos personales: consentimiento, preferencias, datos de salud, rutinas, eventos y comunidades.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="delete-account-password" style={{ fontSize: '14px', fontWeight: 'bold', color: colores.texto }}>
                Introduce tu contraseña para confirmar:
              </label>
              <input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                disabled={enviando}
                autoFocus
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '15px' }}
              />
            </div>

            {error && (
              <div role="alert" style={{ padding: '10px 14px', background: '#fde8e8', color: colores.rojo, borderRadius: '6px', fontSize: '14px', fontWeight: 'bold' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={onCancel} disabled={enviando} style={botonSecundario}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={enviando || !password}
                style={{ ...botonPrincipal, opacity: enviando || !password ? 0.6 : 1, cursor: enviando || !password ? 'not-allowed' : 'pointer' }}
              >
                {enviando ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default DeleteAccountDialog;
