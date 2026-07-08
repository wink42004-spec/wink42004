import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  continueAsGuest,
  getCurrentUser,
  login,
  logout,
  register,
} from '../services/mockAuthApi';
import type { AppUser } from '../types/shared';

interface AuthContextValue {
  currentUser: AppUser;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (
    username: string,
    password: string,
    companyNote: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
}

const guestUser: AppUser = {
  id: 'guest',
  username: '访客',
  companyNote: 'Mock Data',
  status: 'guest',
  registeredAt: '2026-07-08 00:00:00',
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser>(guestUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getCurrentUser()
      .then(setCurrentUser)
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = useCallback(async (username: string, password: string) => {
    setCurrentUser(await login(username, password));
  }, []);

  const handleRegister = useCallback(
    async (username: string, password: string, companyNote: string) => {
      setCurrentUser(await register(username, password, companyNote));
    },
    [],
  );

  const handleLogout = useCallback(async () => {
    setCurrentUser(await logout());
  }, []);

  const handleContinueAsGuest = useCallback(async () => {
    setCurrentUser(await continueAsGuest());
  }, []);

  const value = useMemo(
    () => ({
      currentUser,
      loading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      continueAsGuest: handleContinueAsGuest,
    }),
    [
      currentUser,
      handleContinueAsGuest,
      handleLogin,
      handleLogout,
      handleRegister,
      loading,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
