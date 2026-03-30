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
    try {
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/auth/me');
        const userData = response?.data?.user || response?.data || null;
        if (userData && typeof userData === 'object') {
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.warn('Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/cognito/login', { email, password });
      const data = response?.data || {};
      const { accessToken, refreshToken, idToken, user } = data;
      
      if (accessToken && user) {
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (idToken) localStorage.setItem('idToken', idToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        
        setUser(user);
        setIsAuthenticated(true);
        return user;
      }
      throw new Error('Invalid login response');
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData) => {
    const response = await api.post('/auth/cognito/signup', userData);
    return response?.data || {};
  };

  const confirmSignup = async (email, code) => {
    try {
      const response = await api.post('/auth/cognito/confirm', { email, code });
      const data = response?.data || {};
      const { accessToken, refreshToken, idToken, user } = data;

      if (accessToken && user) {
        localStorage.setItem('token', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        if (idToken) localStorage.setItem('idToken', idToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        setUser(user);
        setIsAuthenticated(true);
        return user;
      }
      throw new Error('Invalid confirmation response');
    } catch (error) {
      console.error('Confirmation failed:', error);
      throw error;
    }
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
    if (!userData || typeof userData !== 'object') return;
    setUser(prev => {
      if (!prev) return userData;
      return { ...prev, ...userData };
    });
  };

  const value = {
    user: user || {},
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