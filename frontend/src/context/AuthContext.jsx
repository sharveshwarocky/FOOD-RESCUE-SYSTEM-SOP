import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      setLoading(true);
      authService.getCurrentUser()
        .then((res) => {
          if (res.success) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        })
        .catch(() => logout())
        .finally(() => setLoading(false));
    }
  }, [token]);

  const login = async (username, password, captcha_id, captcha_code) => {
    const res = await authService.login({ username, password, captcha_id, captcha_code });
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
