import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AuthProvider } from './context/AuthContext';

/* ========================================================================
   HU-16 (SCRUM-22): ELIMINAR CUENTA Y DATOS PERSONALES — SCRUM-98
   ======================================================================== */

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

// Simula el endpoint DELETE /api/users de vite.config.ts
function mockApiRequests() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, options?: RequestInit) => {
      if (url.includes('/DB/users.json')) {
        return Promise.resolve({ ok: true, json: async () => users });
      }

      if (url.includes('/api/users') && options?.method === 'DELETE') {
        const { password } = JSON.parse(options.body as string) as { id_user: string; password: string };
        if (password === validCredentials.password) {
          return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true }) });
        }
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: 'La contraseña no es correcta.' }),
        });
      }

      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
}

// Inicia sesión desde la interfaz y abre "Mi perfil" en el menú "Mi cuenta"
async function loginAndOpenProfile() {
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

  await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
  await user.click(screen.getByRole('button', { name: 'Mi perfil' }));
  return user;
}

function deleteCalls() {
  const fetchMock = vi.mocked(fetch);
  return fetchMock.mock.calls.filter(([, options]) => (options as RequestInit | undefined)?.method === 'DELETE');
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

describe('Eliminar cuenta (integración)', () => {
  it('GIVEN sesión iniciada en "Mi perfil", WHEN pulsa "Eliminar cuenta" y luego "Cancelar", THEN se cierra el diálogo sin borrar nada', async () => {
    const user = await loginAndOpenProfile();

    await user.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));

    const dialog = screen.getByRole('dialog', { name: 'Eliminar cuenta' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText(/IRREVERSIBLE/)).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/contraseña/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteCalls()).toHaveLength(0);
    expect(localStorage.getItem('hl_session')).not.toBeNull();
  });

  it('GIVEN el diálogo abierto, WHEN introduce una contraseña incorrecta, THEN muestra el error y la cuenta no se elimina', async () => {
    const user = await loginAndOpenProfile();
    await user.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));
    const dialog = screen.getByRole('dialog', { name: 'Eliminar cuenta' });

    await user.type(within(dialog).getByLabelText(/contraseña/i), 'incorrecta');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('La contraseña no es correcta.');
    expect(screen.queryByText(/se han eliminado correctamente/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('hl_session')).not.toBeNull();
  });

  it('GIVEN el diálogo abierto, WHEN confirma con su contraseña y pulsa "Aceptar", THEN se borra la cuenta, sale de la sesión y vuelve al login', async () => {
    const user = await loginAndOpenProfile();
    await user.click(screen.getByRole('button', { name: 'Eliminar cuenta' }));
    const dialog = screen.getByRole('dialog', { name: 'Eliminar cuenta' });

    await user.type(within(dialog).getByLabelText(/contraseña/i), validCredentials.password);
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar definitivamente' }));

    expect(await screen.findByText(/se han eliminado correctamente/i)).toBeInTheDocument();

    // Se ha llamado al endpoint con el usuario de la sesión y su contraseña
    const calls = deleteCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('/api/users');
    expect(JSON.parse((calls[0][1] as RequestInit).body as string)).toEqual({
      id_user: 'usr_98234',
      password: validCredentials.password,
    });

    await user.click(screen.getByRole('button', { name: 'Aceptar' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Control de Acceso')).toBeInTheDocument();
    expect(localStorage.getItem('hl_session')).toBeNull();
    expect(localStorage.getItem('hl_user_id')).toBeNull();
  });
});
