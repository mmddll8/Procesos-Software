import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AuthProvider, type UserSession } from './context/AuthContext';
import { getHealthData, hasHealthData } from './healthData';

const MENSAJE_VACIO = 'No hay datos de salud registrados.';

const users = [
  {
    id_user: 'usr_98234',
    nombre: 'Carlos Pérez',
    email: 'carlos@urjc.es',
    password: 'password123',
    hasAllergies: false,
    allergies: '',
    hasDietaryPreferences: false,
    dietaryPreferences: '',
  },
  {
    id_user: 'ana.1234',
    nombre: 'Ana Gómez',
    email: 'ana@urjc.es',
    password: 'ana12345',
    hasAllergies: true,
    allergies: 'Frutos secos, Lactosa',
    hasDietaryPreferences: true,
    dietaryPreferences: 'Vegetariana',
  },
  {
    id_user: 'luis.5678',
    nombre: 'Luis Ruiz',
    email: 'luis@urjc.es',
    password: 'luis12345',
    hasAllergies: true,
    allergies: 'Gluten',
    hasDietaryPreferences: false,
    dietaryPreferences: '',
  },
];

function sesion(overrides: Partial<UserSession> = {}): UserSession {
  return {
    id_user: 'test.0001',
    nombre: 'Usuario Test',
    email: 'test@urjc.es',
    hasAllergies: false,
    allergies: '',
    hasDietaryPreferences: false,
    dietaryPreferences: '',
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, '', '/');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (url.includes('/DB/users.json')) {
        return Promise.resolve({ ok: true, json: async () => users });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('getHealthData / hasHealthData (unit)', () => {
  it('devuelve los apartados sin valor cuando el usuario no ha registrado nada', () => {
    const secciones = getHealthData(sesion());

    expect(secciones.map((s) => s.titulo)).toEqual(['Alergias e intolerancias', 'Preferencias dietéticas']);
    expect(secciones.every((s) => s.valor === '')).toBe(true);
    expect(hasHealthData(secciones)).toBe(false);
  });

  it('devuelve el valor registrado en cada apartado', () => {
    const secciones = getHealthData(
      sesion({
        hasAllergies: true,
        allergies: 'Lactosa',
        hasDietaryPreferences: true,
        dietaryPreferences: 'Vegana',
      }),
    );

    expect(secciones.find((s) => s.id === 'alergias')?.valor).toBe('Lactosa');
    expect(secciones.find((s) => s.id === 'dieta')?.valor).toBe('Vegana');
    expect(hasHealthData(secciones)).toBe(true);
  });

  it('ignora el texto de un apartado si el usuario lo marcó como "no"', () => {
    const secciones = getHealthData(sesion({ hasAllergies: false, allergies: 'Gluten' }));

    expect(secciones.find((s) => s.id === 'alergias')?.valor).toBe('');
    expect(hasHealthData(secciones)).toBe(false);
  });

  it('trata un texto con solo espacios como apartado sin datos', () => {
    const secciones = getHealthData(sesion({ hasDietaryPreferences: true, dietaryPreferences: '   ' }));

    expect(secciones.find((s) => s.id === 'dieta')?.valor).toBe('');
    expect(hasHealthData(secciones)).toBe(false);
  });

  it('considera que hay datos si basta con un solo apartado informado', () => {
    const secciones = getHealthData(sesion({ hasAllergies: true, allergies: 'Gluten' }));

    expect(hasHealthData(secciones)).toBe(true);
  });
});

describe('Pantalla de datos básicos de salud (integración)', () => {
  async function loginAndOpenHealth(email: string, password: string) {
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    await user.type(await screen.findByPlaceholderText('Email'), email);
    await user.type(screen.getByPlaceholderText('Contraseña'), password);
    await user.click(screen.getByRole('button', { name: 'Entrar' }));
    await screen.findByText(/¡Sesión iniciada!/i);

    await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
    await user.click(screen.getByRole('button', { name: 'Datos básicos de salud' }));
    await screen.findByRole('heading', { name: 'Datos básicos de salud', level: 2 });
    return user;
  }

  it('GIVEN sesión iniciada sin datos de salud, WHEN abre la pantalla, THEN muestra el mensaje de que no hay datos', async () => {
    await loginAndOpenHealth('carlos@urjc.es', 'password123');

    expect(screen.getByText(MENSAJE_VACIO)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Alergias e intolerancias' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Preferencias dietéticas' })).not.toBeInTheDocument();
  });

  it('GIVEN sesión iniciada con datos de salud, WHEN abre la pantalla, THEN muestra los datos en cada apartado', async () => {
    await loginAndOpenHealth('ana@urjc.es', 'ana12345');

    expect(screen.queryByText(MENSAJE_VACIO)).not.toBeInTheDocument();

    const alergias = screen.getByRole('region', { name: 'Alergias e intolerancias' });
    expect(within(alergias).getByText('Frutos secos, Lactosa')).toBeInTheDocument();

    const dieta = screen.getByRole('region', { name: 'Preferencias dietéticas' });
    expect(within(dieta).getByText('Vegetariana')).toBeInTheDocument();
  });

  it('GIVEN datos en un solo apartado, WHEN abre la pantalla, THEN muestra ese dato y marca el otro como sin datos', async () => {
    await loginAndOpenHealth('luis@urjc.es', 'luis12345');

    expect(screen.queryByText(MENSAJE_VACIO)).not.toBeInTheDocument();

    const alergias = screen.getByRole('region', { name: 'Alergias e intolerancias' });
    expect(within(alergias).getByText('Gluten')).toBeInTheDocument();

    const dieta = screen.getByRole('region', { name: 'Preferencias dietéticas' });
    expect(within(dieta).getByText('Sin datos registrados.')).toBeInTheDocument();
  });

  it('refleja los cambios hechos desde "Mi perfil" sin recargar la aplicación', async () => {
    const user = await loginAndOpenHealth('carlos@urjc.es', 'password123');
    expect(screen.getByText(MENSAJE_VACIO)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
    await user.click(screen.getByRole('button', { name: 'Mi perfil' }));
    await user.click(await screen.findByLabelText('¿Tienes alergias o intolerancias?'));
    await user.type(screen.getByPlaceholderText(/Indica tus alergias o intolerancias/i), 'Marisco');
    await user.click(screen.getByRole('button', { name: 'Guardar Cambios' }));
    await screen.findByText('Perfil actualizado correctamente.');

    await user.click(screen.getByRole('button', { name: /Mi cuenta/i }));
    await user.click(screen.getByRole('button', { name: 'Datos básicos de salud' }));

    expect(screen.queryByText(MENSAJE_VACIO)).not.toBeInTheDocument();
    const alergias = await screen.findByRole('region', { name: 'Alergias e intolerancias' });
    expect(within(alergias).getByText('Marisco')).toBeInTheDocument();
  });

  it('GIVEN sin sesión iniciada, THEN no se muestra ningún dato de salud', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    expect(await screen.findByText('Control de Acceso')).toBeInTheDocument();
    expect(screen.queryByText(MENSAJE_VACIO)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Datos básicos de salud' })).not.toBeInTheDocument();
  });
});