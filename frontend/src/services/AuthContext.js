import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bv_token');
    const storedUser = localStorage.getItem('bv_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('bv_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const res = await authApi.login(username, password);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('bv_token', access_token);
    localStorage.setItem('bv_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const signup = async (data) => {
    const res = await authApi.signup(data);
    const { access_token, user: userData } = res.data;
    localStorage.setItem('bv_token', access_token);
    localStorage.setItem('bv_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
