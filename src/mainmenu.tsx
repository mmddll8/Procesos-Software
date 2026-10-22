import { useState } from 'react';

interface MainMenuProps {
  onLogout: () => void;
  onMiPerfil: () => void;
  onDatosSalud: () => void;
}

// Desplegable "Mi cuenta", arriba a la derecha, con perfil (HU-08) y datos de salud (HU-10)
function MainMenu({ onLogout, onMiPerfil, onDatosSalud }: MainMenuProps) {
  const [abierto, setAbierto] = useState(false);

  const elegirPerfil = () => {
    onMiPerfil();
    setAbierto(false);
  };

  const elegirSalud = () => {
    onDatosSalud();
    setAbierto(false);
  };

  const opcion = {
    display: 'block',
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    background: 'none',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontSize: '15px',
    color: '#222',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        aria-expanded={abierto}
        style={{
          padding: '8px 14px',
          border: '1px solid #fff',
          borderRadius: '6px',
          background: 'transparent',
          color: '#fff',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Mi cuenta ▾
      </button>

      {abierto && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '6px',
            minWidth: '200px',
            background: '#fff',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <button type="button" onClick={elegirPerfil} style={opcion}>
            Mi perfil
          </button>
          <button type="button" onClick={elegirSalud} style={opcion}>
            Datos básicos de salud
          </button>
          <div style={{ height: '1px', background: '#eee' }} />
          <button type="button" onClick={onLogout} style={{ ...opcion, color: '#c8102e' }}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default MainMenu;
