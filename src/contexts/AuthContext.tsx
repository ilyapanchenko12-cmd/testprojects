import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Демо пользователи
const DEMO_USERS: User[] = [
  {
    id: '1',
    email: 'ilyapanchenko12@gmail.com',
    name: 'Илья Панченко',
    role: UserRole.OWNER,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    email: 'buyer@example.com',
    name: 'Алексей Медиабаер',
    role: UserRole.MEDIA_BUYER,
    teamId: 'team1',
    createdAt: new Date('2024-01-15')
  }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем сохраненного пользователя в localStorage
    const savedUser = localStorage.getItem('crm_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    
    // Демо логика входа
    const foundUser = DEMO_USERS.find(user => 
      user.email === credentials.email && 
      ((user.email === 'ilyapanchenko12@gmail.com' && credentials.password === 'kyrakk1005') ||
       (user.email === 'buyer@example.com' && credentials.password === 'buyer123'))
    );
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('crm_user', JSON.stringify(foundUser));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    
    // Демо логика регистрации
    const newUser: User = {
      id: Date.now().toString(),
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: new Date()
    };
    
    setUser(newUser);
    localStorage.setItem('crm_user', JSON.stringify(newUser));
    setLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('crm_user');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


