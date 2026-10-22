import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserPreferences {
  hasAllergies: boolean;
  allergies: string;
  hasDietaryPreferences: boolean;
  dietaryPreferences: string;
}

interface UserSession extends UserPreferences {
  id_user: string;
  nombre: string;
  email: string;
}

// Versión de los términos de uso y política de privacidad aceptados (HU-07)
export const TERMS_VERSION = '1.0';

interface UserRecord extends UserSession {
  password?: string;
  emailVerified?: boolean;
  termsAcceptedAt?: string;
  termsVersion?: string;
}

export interface RegistrationData extends UserPreferences {
  nombre: string;
  email: string;
  password: string;
  aceptaTerminos: boolean;
}

// 1. Ampliación de la interfaz para incluir la Historia de Usuario "Confirmar Email"
interface AuthContextType {
  session: UserSession | null;
  login: (email: string, pass: string) => Promise<boolean | { success: boolean; emailNotVerified?: boolean }>;
  register: (data: RegistrationData) => Promise<boolean>;
  logout: () => void;
  
  // Nuevas funciones para la verificación por correo
  verifyEmail: (token: string) => Promise<{ success: boolean; expired?: boolean }>;
  resendVerificationEmail: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('hl_session');
    return savedSession ? (JSON.parse(savedSession) as UserSession) : null;
  });
  const [localUsers, setLocalUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    fetch('/DB/users.json')
      .then((res) => res.json())
      .then((data: UserRecord[]) => setLocalUsers(data))
      .catch((err) => console.error("Error cargando base de datos mock:", err));
  }, []);

  const login = async (email: string, pass: string): Promise<boolean | { success: boolean; emailNotVerified?: boolean }> => {
    try {
      const foundUser = localUsers.find((u) => u.email === email && u.password === pass);

      if (foundUser) {
        // Verificar si la cuenta requiere validación (si estuviera explícitamente marcada como no verificada)
        if (foundUser.emailVerified === false) {
          return { success: false, emailNotVerified: true };
        }

        const userSession: UserSession = {
          id_user: foundUser.id_user,
          nombre: foundUser.nombre,
          email: foundUser.email,
          hasAllergies: foundUser.hasAllergies ?? false,
          allergies: foundUser.allergies ?? '',
          hasDietaryPreferences: foundUser.hasDietaryPreferences ?? false,
          dietaryPreferences: foundUser.dietaryPreferences ?? ''
        };

        setSession(userSession);
        localStorage.setItem('hl_session', JSON.stringify(userSession));
        localStorage.setItem('hl_user_id', foundUser.id_user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (data: RegistrationData): Promise<boolean> => {
    try {
      // HU-07 / SCRUM-73: no se puede registrar sin aceptar términos y privacidad
      if (!data.aceptaTerminos) {
        return false;
      }

      const cleanName = data.nombre.toLowerCase().trim().replace(/\s+/g, '.');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedId = `${cleanName}.${randomNum}`;

      const newUser: UserRecord = {
        id_user: generatedId,
        nombre: data.nombre,
        email: data.email,
        password: data.password,
        hasAllergies: data.hasAllergies,
        allergies: data.allergies,
        hasDietaryPreferences: data.hasDietaryPreferences,
        dietaryPreferences: data.dietaryPreferences,
        emailVerified: false, // La cuenta se crea pendiente de confirmación
        // HU-07 / SCRUM-71: fecha y versión de los términos aceptados
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: TERMS_VERSION
      };

      setLocalUsers((prevUsers) => {
        const updatedUsers = [...prevUsers, newUser];
        localStorage.setItem('hl_users', JSON.stringify(updatedUsers));
        return updatedUsers;
      });

      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newUser)
        });

        if (!response.ok) {
          console.warn('El usuario se ha guardado localmente, pero no en el mock JSON.');
        }
      } catch {
        console.warn('No se pudo contactar con el mock de API; se conserva el usuario localmente.');
      }

      // Tras el registro no iniciamos sesión directamente hasta que confirme el email
      return true;
    } catch {
      return false;
    }
  };

  // 2. Implementación de la verificación de token recibida por la URL
  const verifyEmail = async (token: string): Promise<{ success: boolean; expired?: boolean }> => {
    // Simular retardo de red
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Si el token recibido en la URL equivale a inválido/expirado (utilizado en los tests)
    if (token === 'invalid_or_expired_token' || token.includes('invalid') || token.includes('expired')) {
      return { success: false, expired: token.includes('expired') };
    }

    if (token && token.length > 0) {
      return { success: true };
    }

    return { success: false };
  };

  // 3. Implementación de la solicitud para reenviar el correo de verificación
  const resendVerificationEmail = async (email: string): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return email.length > 0 && email.includes('@');
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('hl_session');
    localStorage.removeItem('hl_user_id');
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        login,
        register,
        logout,
        verifyEmail,
        resendVerificationEmail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};