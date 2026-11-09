import { useEffect, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AuthProvider, useAuth } from './context/AuthContext';

const validCredentials = {
  email: 'carlos@urjc.es',
  password: 'password123',
};

const users = [
  {
    id_user: 'usr_98234',
    nombre: 'Carlos Pérez',
    email: validCredentials.email,
    password: validCredentials.password,
    hasAllergies: false,
    allergies: '',
    hasDietaryPreferences: false,
    dietaryPreferences: '',
  },
];

function LoginProbe({
  email,
  password,
  onResult,
}: {
  email: string;
  password: string;
  onResult: (result: boolean) => void;
}) {
  const { login } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch('/DB/users.json').then(() => setReady(true));
  }, []);

  return (
    <button
      disabled={!ready}
      onClick={async () => {
        const res = await login(email, password);
        onResult(typeof res === 'boolean' ? res : res.success);
      }}
    >
      Probar login
    </button>
  );
}

function mockApiRequests() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/DB/users.json')) {
        return Promise.resolve({
          ok: true,
          json: async () => users,
        });
      }

      if (url.includes('/api/verification/verify')) {
        const { code } = JSON.parse(options?.body as string) as { code: string };
        if (code === '1234') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: 'El código no es válido o ha caducado. Solicita uno nuevo.',
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  mockApiRequests();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

/* ========================================================================
   1. TESTS UNITARIOS DE AUTHCONTEXT (LOGIN)
   ======================================================================== */
describe('AuthContext login unit tests', () => {
  it('inicia sesión con credenciales válidas', async () => {
    const onResult = vi.fn();
    render(
      <AuthProvider>
        <LoginProbe
          email={validCredentials.email}
          password={validCredentials.password}
          onResult={onResult}
        />
      </AuthProvider>,
    );

    const button = await screen.findByRole('button', { name: 'Probar login' });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    expect(localStorage.getItem('hl_user_id')).toBe('usr_98234');
  });

  it('rechaza credenciales inválidas', async () => {
    const onResult = vi.fn();
    render(
      <AuthProvider>
        <LoginProbe email="desconocido@urjc.es" password="incorrecta" onResult={onResult} />
      </AuthProvider>,
    );

    const button = await screen.findByRole('button', { name: 'Probar login' });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);

    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
    expect(localStorage.getItem('hl_session')).toBeNull();
  });
});

/* ========================================================================
   2. TESTS DE INTEGRACIÓN DE LOGIN
   ======================================================================== */
describe('login integration tests', () => {
  it('muestra la sesión iniciada al enviar credenciales válidas', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    await userEvent.setup().type(await screen.findByPlaceholderText('Email'), validCredentials.email);
    await userEvent.setup().type(screen.getByPlaceholderText('Contraseña'), validCredentials.password);
    await userEvent.setup().click(screen.getByRole('button', { name: 'Entrar' }));

    // Búsqueda flexible e insensible a mayúsculas/minúsculas
    expect(await screen.findByText(/¡Sesión iniciada!/i)).toBeInTheDocument();
    expect(screen.getByText(/Carlos Pérez/)).toBeInTheDocument();
  });

  it('gestiona campos vacíos y contraseña incorrecta como edge cases', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    const user = userEvent.setup();
    const loginButton = await screen.findByRole('button', { name: 'Entrar' });
    fireEvent.click(loginButton);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Contraseña');
    expect(emailInput).toBeInvalid();
    expect(passwordInput).toHaveValue('');
    expect(screen.queryByText(/¡Sesión iniciada!/i)).not.toBeInTheDocument();

    await user.type(emailInput, validCredentials.email);
    await user.type(passwordInput, 'incorrecta');
    await user.click(loginButton);

    expect(await screen.findByText(/incorrectos/i)).toBeInTheDocument();
    expect(screen.queryByText(/¡Sesión iniciada!/i)).not.toBeInTheDocument();
  });
});

/* ========================================================================
   3. HISTORIA DE USUARIO "CONFIRMAR EMAIL CON CÓDIGO"
   ======================================================================== */
describe('Email verification tests (código fijo de demostración)', () => {
  it('verifica la cuenta con el código fijo de demostración', async () => {
    const pendingUsers = [{
      ...users[0],
      id_user: 'usr_pending',
      email: 'pendiente@urjc.es',
      password: 'password123',
      emailVerified: false,
    }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, options?: RequestInit) => {
        if (url.includes('/DB/users.json')) {
          return Promise.resolve({ ok: true, json: async () => pendingUsers });
        }
        if (url.includes('/api/verification/verify')) {
          const { code } = JSON.parse(options?.body as string) as { code: string };
          return Promise.resolve(code === '1234'
            ? { ok: true, json: async () => ({ success: true }) }
            : { ok: false, json: async () => ({ error: 'El código no es válido o ha caducado.' }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }),
    );

    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    const user = userEvent.setup();
    await user.type(await screen.findByPlaceholderText('Email'), 'pendiente@urjc.es');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText(/Debes confirmar tu correo/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Código de verificación'), '1234');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByText(/Correo confirmado con éxito/i)).toBeInTheDocument();
  });

  it('muestra un error al introducir un código no válido', async () => {
    const pendingUsers = [{
      ...users[0],
      id_user: 'usr_pending',
      email: 'pendiente@urjc.es',
      password: 'password123',
      emailVerified: false,
    }];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.includes('/DB/users.json')) {
          return Promise.resolve({ ok: true, json: async () => pendingUsers });
        }
        if (url.includes('/api/verification/verify')) {
          return Promise.resolve({
            ok: false,
            json: async () => ({ error: 'El código no es válido o ha caducado. Solicita uno nuevo.' }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }),
    );

    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    const user = userEvent.setup();
    await user.type(await screen.findByPlaceholderText('Email'), 'pendiente@urjc.es');
    await user.type(screen.getByPlaceholderText('Contraseña'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/Debes confirmar tu correo/i);

    await user.type(screen.getByLabelText('Código de verificación'), '1111');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByText(/El código no es válido o ha caducado/i)).toBeInTheDocument();
  });
});

/* ========================================================================
   4. TESTS DE LOGOUT
   ======================================================================== */
describe('logout tests', () => {
  async function loginFromUi() {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    await user.type(await screen.findByPlaceholderText('Email'), validCredentials.email);
    await user.type(screen.getByPlaceholderText('Contraseña'), validCredentials.password);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/¡Sesión iniciada!/i);
    return user;
  }

  // Función auxiliar para desplegar el menú "Mi cuenta ▾"
  async function openUserMenu(user: ReturnType<typeof userEvent.setup>) {
    const accountBtn = screen.getByRole('button', { name: /Mi cuenta/i });
    await user.click(accountBtn);
  }

  it('muestra el botón "Cerrar sesión" en el menú principal con la sesión activa', async () => {
    const user = await loginFromUi();
    await openUserMenu(user);

    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });

  it('borra la sesión guardada en el navegador al cerrar sesión', async () => {
    const user = await loginFromUi();
    expect(localStorage.getItem('hl_session')).not.toBeNull();
    expect(localStorage.getItem('hl_user_id')).toBe('usr_98234');

    await openUserMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(localStorage.getItem('hl_session')).toBeNull();
    expect(localStorage.getItem('hl_user_id')).toBeNull();
  });

  it('vuelve automáticamente a la pantalla de login con el formulario vacío', async () => {
    const user = await loginFromUi();

    await openUserMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(screen.queryByText(/¡Sesión iniciada!/i)).not.toBeInTheDocument();
    expect(screen.getByText('Control de Acceso')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toHaveValue('');
    expect(screen.getByPlaceholderText('Contraseña')).toHaveValue('');
  });

  it('no restaura la sesión tras cerrar sesión y recargar la app', async () => {
    const user = await loginFromUi();
    await openUserMenu(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    cleanup();

    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    expect(await screen.findByText('Control de Acceso')).toBeInTheDocument();
    expect(screen.queryByText(/¡Sesión iniciada!/i)).not.toBeInTheDocument();
  });
});