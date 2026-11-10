import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserPreferences {
  hasAllergies: boolean;
  allergies: string;
  hasDietaryPreferences: boolean;
  dietaryPreferences: string;
}

export interface UserSession extends UserPreferences {
  id_user: string;
  nombre: string;
  email: string;
}

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

export interface AuthContextType {
  session: UserSession | null;
  login: (email: string, pass: string) => Promise<boolean | { success: boolean; emailNotVerified?: boolean }>;
  register: (data: RegistrationData) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  
  // Verificación por correo
  verifyEmail: (email: string, code: string) => Promise<{ success: boolean; message?: string }>;
  resendVerificationEmail: (email: string) => Promise<{ success: boolean; message?: string }>;

  // HU-06: Editar perfil
  updateProfile: (updatedData: Partial<UserSession>) => Promise<{ success: boolean; message?: string }>;
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

  const register = async (data: RegistrationData): Promise<{ success: boolean; message?: string }> => {
    try {
      if (!data.aceptaTerminos) {
        return { success: false, message: 'Debes aceptar los términos y la política de privacidad.' };
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
        emailVerified: false,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: TERMS_VERSION
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        return { success: false, message: result.error ?? 'No se pudo crear la cuenta.' };
      }

      setLocalUsers((prevUsers) => [...prevUsers, newUser]);
      return { success: true };
    } catch (error) {
      console.error('Error al registrar la cuenta:', error);
      return { success: false, message: 'No se pudo contactar con el servidor para crear la cuenta.' };
    }
  };

  const verifyEmail = async (email: string, code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/verification/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) {
        return { success: false, message: result.error ?? 'El código no es válido o ha caducado.' };
      }

      setLocalUsers((users) => users.map((user) =>
        user.email.toLowerCase() === email.trim().toLowerCase() ? { ...user, emailVerified: true } : user
      ));
      return { success: true };
    } catch (error) {
      console.error('Error al verificar el código de correo:', error);
      return { success: false, message: 'No se pudo contactar con el servidor para verificar el código.' };
    }
  };

  const resendVerificationEmail = async (email: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/verification/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const result = await response.json() as { error?: string };
      return response.ok
        ? { success: true }
        : { success: false, message: result.error ?? 'No se pudo obtener el código de demostración.' };
    } catch (error) {
      console.error('Error al obtener el código de demostración:', error);
      return { success: false, message: 'No se pudo contactar con el servidor para obtener el código.' };
    }
  };

  const updateProfile = async (updatedData: Partial<UserSession>): Promise<{ success: boolean; message?: string }> => {
    if (!session) return { success: false, message: 'No existe sesión activa.' };

    if (updatedData.nombre !== undefined && updatedData.nombre.trim() === '') {
      return { success: false, message: 'El campo nombre no puede quedar vacío.' };
    }

    const newSession: UserSession = { ...session, ...updatedData };
    setSession(newSession);
    localStorage.setItem('hl_session', JSON.stringify(newSession));

    setLocalUsers((prev) =>
      prev.map((u) => (u.id_user === session.id_user ? { ...u, ...updatedData } : u))
    );

    return { success: true };
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
        resendVerificationEmail,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};