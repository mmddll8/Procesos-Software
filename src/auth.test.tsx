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
      onClick={async () => onResult(await login(email, password))}
    >
      Probar login
    </button>
  );
}

function mockUsersRequest() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => users,
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  mockUsersRequest();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

    expect(await screen.findByText('¡Sesión Iniciada!')).toBeInTheDocument();
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
    expect(screen.queryByText('¡Sesión Iniciada!')).not.toBeInTheDocument();

    await user.type(emailInput, validCredentials.email);
    await user.type(passwordInput, 'incorrecta');
    await user.click(loginButton);

    expect(await screen.findByText('Usuario o contraseña incorrectos')).toBeInTheDocument();
    expect(screen.queryByText('¡Sesión Iniciada!')).not.toBeInTheDocument();
  });
});
