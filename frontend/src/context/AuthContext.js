import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize user from sessionStorage if available (for OAuth flow persistence)
  const [user, setUserState] = useState(() => {
    try {
      const stored = sessionStorage.getItem('questeduca_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Wrapper to also persist to sessionStorage
  const setUser = useCallback((userData) => {
    console.log('AuthContext: setUser called with:', userData?.email || 'null');
    setUserState(userData);
    if (userData) {
      sessionStorage.setItem('questeduca_user', JSON.stringify(userData));
    } else {
      sessionStorage.removeItem('questeduca_user');
    }
  }, []);

  const checkAuth = useCallback(async () => {
    console.log('AuthContext: checkAuth called');
    console.log('  - Current pathname:', window.location.pathname);
    console.log('  - Current hash:', window.location.hash);
    console.log('  - Current search:', window.location.search);
    
    // CRITICAL: If on OAuth callback page, skip the /me check.
    // AuthCallback will exchange the session_id and establish the session first.
    if (window.location.pathname === '/auth/callback') {
      console.log('AuthContext: On callback page, skipping checkAuth');
      setLoading(false);
      return;
    }

    // If we already have a user from sessionStorage, validate with backend
    const storedUser = sessionStorage.getItem('questeduca_user');
    
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      console.log('AuthContext: /auth/me succeeded:', response.data.email);
      setUser(response.data);
    } catch (error) {
      console.log('AuthContext: /auth/me failed:', error.response?.status);
      // Only clear user if we don't have a stored user OR if backend explicitly rejects
      if (!storedUser || error.response?.status === 401) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    // If we already have user from sessionStorage, mark as not loading immediately
    if (user) {
      console.log('AuthContext: Already have user from sessionStorage:', user.email);
      setLoading(false);
      // Still validate with backend in background
      checkAuth();
    } else {
      checkAuth();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const response = await axios.post(
      `${API}/auth/login`,
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name, role) => {
    const response = await axios.post(`${API}/auth/register`, {
      email,
      password,
      name,
      role
    });
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};