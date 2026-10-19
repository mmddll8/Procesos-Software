interface MainMenuProps {
  onLogout: () => void;
}

function MainMenu({ onLogout }: MainMenuProps) {
  return (
    <nav
      aria-label="Menú principal"
      style={{
        display: 'flex',
        justifyContent: 'flex-end',
        paddingBottom: '12px',
        marginBottom: '16px',
        borderBottom: '1px solid #ccc',
      }}
    >
      <button
        type="button"
        onClick={onLogout}
        style={{ padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        Cerrar sesión
      </button>
    </nav>
  );
}

export default MainMenu;