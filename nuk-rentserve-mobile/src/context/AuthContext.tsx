// Authentication & User State Context with Role Support

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi, User } from '../api/authApi';
import { Storage } from '../utils/storage';

export type AppRole =
  | 'Customer'
  | 'Service Provider'
  | 'Auto/Car Driver'
  | 'Goods Van Driver'
  | 'Property Owner'
  | 'Student Rental Partner'
  | 'Administrator';

export const APP_ROLES: AppRole[] = [
  'Customer',
  'Service Provider',
  'Auto/Car Driver',
  'Goods Van Driver',
  'Property Owner',
  'Student Rental Partner',
  'Administrator',
];

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: AppRole;
  setRole: (role: AppRole) => Promise<void>;
  isLoading: boolean;
  login: (login: string, pass: string) => Promise<User | null>;
  loginWithGoogle: (credential: string) => Promise<User | null>;
  adminLogin: (login: string, pass: string) => Promise<User | null>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    location: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  savedIds: string[];
  toggleSaved: (id: string) => Promise<void>;
  isSaved: (id: string) => boolean;
  termsAccepted: { at: string; version: string } | null;
  setTermsAccepted: (data: { at: string; version: string } | null) => void;
  updateUser: (user: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: 'Customer',
  setRole: async () => {},
  isLoading: true,
  login: async () => null,
  loginWithGoogle: async () => null,
  adminLogin: async () => null,
  register: async () => {},
  logout: async () => {},
  savedIds: [],
  toggleSaved: async () => {},
  isSaved: () => false,
  termsAccepted: null,
  setTermsAccepted: () => {},
  updateUser: async () => {},
  refreshUser: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRoleState] = useState<AppRole>('Customer');
  const [isLoading, setIsLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState<{ at: string; version: string } | null>(null);

  // Initialize session from storage
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await Storage.getToken();
        const storedUser = await Storage.getUser<User>();
        const storedRole = (await Storage.getRole()) as AppRole | null;
        const storedSaved = await Storage.getSavedIds();

        if (storedToken) {
          setToken(storedToken);
        }
        if (storedUser) {
          setUser(storedUser);
        }
        if (storedRole && APP_ROLES.includes(storedRole)) {
          setRoleState(storedRole);
        }
        setSavedIds(storedSaved);

        // Optionally verify session in background
        if (storedToken) {
          authApi
            .getMe()
            .then((freshUser) => {
              if (freshUser) {
                setUser(freshUser);
                Storage.setUser(freshUser);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.warn('Auth init failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (loginInput: string, pass: string): Promise<User | null> => {
    const res = await authApi.login(loginInput, pass);
    if (res.accessToken) {
      await Storage.setToken(res.accessToken);
      setToken(res.accessToken);
    }
    if (res.refreshToken) {
      await Storage.setRefreshToken(res.refreshToken);
    }
    if (res.user) {
      await Storage.setUser(res.user);
      setUser(res.user);

      // Infer authentic AppRole strictly from backend database role
      if (res.user.role === 'admin') setRoleState('Administrator');
      else if (res.user.role === 'driver') setRoleState('Auto/Car Driver');
      else if (res.user.role === 'student') setRoleState('Student Rental Partner');
      else if (res.user.role === 'provider') setRoleState('Service Provider');
      else if (res.user.role === 'owner') setRoleState('Property Owner');
      else setRoleState('Customer');
    }
    return res.user || null;
  };

  const loginWithGoogle = async (credential: string): Promise<User | null> => {
    const res = await authApi.googleLogin(credential);
    if (res.accessToken) {
      await Storage.setToken(res.accessToken);
      setToken(res.accessToken);
    }
    if (res.refreshToken) {
      await Storage.setRefreshToken(res.refreshToken);
    }
    if (res.user) {
      await Storage.setUser(res.user);
      setUser(res.user);

      if (res.user.role === 'admin') setRoleState('Administrator');
      else if (res.user.role === 'driver') setRoleState('Auto/Car Driver');
      else if (res.user.role === 'student') setRoleState('Student Rental Partner');
      else if (res.user.role === 'provider') setRoleState('Service Provider');
      else if (res.user.role === 'owner') setRoleState('Property Owner');
      else setRoleState('Customer');
    }
    return res.user || null;
  };

  const adminLogin = async (loginInput: string, pass: string): Promise<User | null> => {
    const res = await authApi.adminLogin(loginInput, pass);
    if (res.accessToken) {
      await Storage.setToken(res.accessToken);
      setToken(res.accessToken);
    }
    if (res.refreshToken) {
      await Storage.setRefreshToken(res.refreshToken);
    }
    if (res.user) {
      await Storage.setUser(res.user);
      setUser(res.user);
      setRoleState('Administrator');
    }
    return res.user || null;
  };

  const register = async (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    location: string;
  }) => {
    const res = await authApi.register(data);
    if (res.accessToken) {
      await Storage.setToken(res.accessToken);
      setToken(res.accessToken);
    }
    if (res.refreshToken) {
      await Storage.setRefreshToken(res.refreshToken);
    }
    if (res.user) {
      await Storage.setUser(res.user);
      setUser(res.user);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    await Storage.clearAuth();
    setUser(null);
    setToken(null);
    setRoleState('Customer');
  };

  const setRole = async (newRole: AppRole) => {
    // Role is strictly locked to backend database role when user is authenticated
    if (user) {
      return;
    }
    setRoleState(newRole);
    await Storage.setRole(newRole);
  };

  const toggleSaved = async (id: string) => {
    const updated = await Storage.toggleSavedId(id);
    setSavedIds(updated);
  };

  const isSaved = (id: string) => savedIds.includes(id);

  const updateUser = async (updatedFields: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...updatedFields };
    setUser(updated);
    await Storage.setUser(updated);
  };

  const refreshUser = async () => {
    try {
      const fresh = await authApi.getMe();
      if (fresh) {
        setUser(fresh);
        await Storage.setUser(fresh);
        return fresh;
      }
    } catch {}
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        setRole,
        isLoading,
        login,
        loginWithGoogle,
        adminLogin,
        register,
        logout,
        savedIds,
        toggleSaved,
        isSaved,
        termsAccepted,
        setTermsAccepted,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
