import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        delete api.defaults.headers.common['Authorization'];
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/cognito/login', { email, password });
    const { accessToken, refreshToken, idToken, user } = response.data;
    
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (idToken) localStorage.setItem('idToken', idToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    setUser(user);
    setIsAuthenticated(true);
    return user;
  };

  const signup = async (userData) => {
    const response = await api.post('/auth/cognito/signup', userData);
    return response.data;
  };

  const confirmSignup = async (email, code) => {
    const response = await api.post('/auth/cognito/confirm', { email, code });
    const { accessToken, refreshToken, idToken, user } = response.data;

    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (idToken) localStorage.setItem('idToken', idToken);
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    setUser(user);
    setIsAuthenticated(true);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    setUser(prev => {
      if (!prev) return userData;
      return { ...prev, ...userData };
    });
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    confirmSignup,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
