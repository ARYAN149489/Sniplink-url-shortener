import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(api.getUser());
  const [token, setToken] = useState(api.getToken());
  const [loading, setLoading] = useState(false);

  const isAuthenticated = !!token;

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      api.setToken(data.token);
      api.setUser(data.user);
      setToken(data.token);
      setUser(data.user);
      toast.success('Login successful!');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/register', { name, email, password });
      api.setToken(data.token);
      api.setUser(data.user);
      setToken(data.token);
      setUser(data.user);
      toast.success('Account created!');
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully.');
  }, []);

  // Sync state if localStorage changes in another tab
  useEffect(() => {
    const handleStorage = () => {
      setToken(api.getToken());
      setUser(api.getUser());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
