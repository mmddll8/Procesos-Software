import type { UserSession } from './context/AuthContext';

export type HealthSectionId = 'alergias' | 'dieta';

export interface HealthSection {
  id: HealthSectionId;
  titulo: string;
  valor: string;
}

function valorRegistrado(activo: boolean | undefined, texto: string | undefined): string {
  if (!activo) return '';
  return (texto ?? '').trim();
}

export function getHealthData(session: UserSession): HealthSection[] {
  return [
    {
      id: 'alergias',
      titulo: 'Alergias e intolerancias',
      valor: valorRegistrado(session.hasAllergies, session.allergies),
    },
    {
      id: 'dieta',
      titulo: 'Preferencias dietéticas',
      valor: valorRegistrado(session.hasDietaryPreferences, session.dietaryPreferences),
    },
  ];
}

export function hasHealthData(secciones: HealthSection[]): boolean {
  return secciones.some((s) => s.valor !== '');
}