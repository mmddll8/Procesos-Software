import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserSession {
  id_user: string;
  nombre: string;
  email: string;
}

interface UserRecord extends UserSession {
  password?: string;
}

interface AuthContextType {
  session: UserSession | null;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (nombre: string, email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [localUsers, setLocalUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    fetch('/data/users.json')
      .then((res) => res.json())
      .then((data: UserRecord[]) => setLocalUsers(data))
      .catch((err) => console.error("Error cargando base de datos mock:", err));

    const savedSession = localStorage.getItem('hl_session');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    }
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const foundUser = localUsers.find((u) => u.email === email && u.password === pass);
      
      if (foundUser) {
        const userSession: UserSession = {
          id_user: foundUser.id_user,
          nombre: foundUser.nombre,
          email: foundUser.email
        };
        
        setSession(userSession);
        localStorage.setItem('hl_session', JSON.stringify(userSession));
        localStorage.setItem('hl_user_id', foundUser.id_user);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const register = async (nombre: string, email: string, pass: string): Promise<boolean> => {
    try {
      const cleanName = nombre.toLowerCase().trim().replace(/\s+/g, '.');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedId = `${cleanName}.${randomNum}`;

      const newUser: UserRecord = {
        id_user: generatedId,
        nombre,
        email,
        password: pass
      };

      setLocalUsers((prevUsers) => [...prevUsers, newUser]);

      const userSession: UserSession = {
        id_user: generatedId,
        nombre,
        email
      };
      
      setSession(userSession);
      localStorage.setItem('hl_session', JSON.stringify(userSession));
      localStorage.setItem('hl_user_id', generatedId);
      return true;
    } catch (error) {
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth error');
  return context;
};