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

interface UserRecord extends UserSession {
  password?: string;
}

export interface RegistrationData extends UserPreferences {
  nombre: string;
  email: string;
  password: string;
}

interface AuthContextType {
  session: UserSession | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: RegistrationData) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('hl_session');
    return savedSession ? JSON.parse(savedSession) as UserSession : null;
  });
  const [localUsers, setLocalUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    fetch('/DB/users.json')
      .then((res) => res.json())
      .then((data: UserRecord[]) => setLocalUsers(data))
      .catch((err) => console.error("Error cargando base de datos mock:", err));

  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const foundUser = localUsers.find((u) => u.email === email && u.password === pass);
      
      if (foundUser) {
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
        dietaryPreferences: data.dietaryPreferences
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
      const userSession: UserSession = {
        id_user: generatedId,
        nombre: data.nombre,
        email: data.email,
        hasAllergies: data.hasAllergies,
        allergies: data.allergies,
        hasDietaryPreferences: data.hasDietaryPreferences,
        dietaryPreferences: data.dietaryPreferences
      };
      
      setSession(userSession);
      localStorage.setItem('hl_session', JSON.stringify(userSession));
      localStorage.setItem('hl_user_id', generatedId);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem('hl_session');
    localStorage.removeItem('hl_user_id');
  };

  return (
    <AuthContext.Provider value={{ session, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// The provider and hook intentionally share this module as the authentication API.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};