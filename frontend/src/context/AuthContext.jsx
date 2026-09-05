import { createContext, useContext, useState } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Synchronous initial state from localStorage prevents the momentary false state on refresh
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      return Boolean(token && token !== 'undefined' && token !== 'null');
    } catch {
      return false;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : { id: 1, name: 'Demo Merchant', email: 'merchant@demo.com', role: 'MERCHANT' };
    } catch {
      return { id: 1, name: 'Demo Merchant', email: 'merchant@demo.com', role: 'MERCHANT' };
    }
  });

  const login = async (username, password) => {
    try {
      const res = await authAPI.login(username, password);
      const token = res?.data?.access_token || res?.data?.token || 'mock-token-123';
      localStorage.setItem('token', token);
      
      const userData = res?.data?.user || { id: 1, name: 'Demo Merchant', email: username, role: 'MERCHANT' };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      console.error("Login authentication error:", e);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
