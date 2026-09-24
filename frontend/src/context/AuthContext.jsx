import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

const readSavedUser = () => {
  try { return JSON.parse(localStorage.getItem('careconnect_user') || 'null'); }
  catch { localStorage.removeItem('careconnect_user'); return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    return readSavedUser();
  });
  const [token, setToken] = useState(() => localStorage.getItem('careconnect_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('careconnect_user', JSON.stringify(res.data.user));
          }
        } catch {
          // Invalid sessions are cleared by the API interceptor.
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('careconnect_token', newToken);
      localStorage.setItem('careconnect_user', JSON.stringify(userData));
      return userData;
    }
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('careconnect_token', newToken);
      localStorage.setItem('careconnect_user', JSON.stringify(newUser));
      return newUser;
    }
  };

  const logout = () => {
    try {
      if (token) api.post('/auth/logout').catch(() => {});
    } catch { /* Continue local sign-out even if the API client is unavailable. */ }
    setToken(null);
    setUser(null);
    localStorage.removeItem('careconnect_token');
    localStorage.removeItem('careconnect_user');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isAuthenticated: !!token && !!user,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
