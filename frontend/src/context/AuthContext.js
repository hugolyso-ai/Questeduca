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
    const pathname = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    
    console.log('AuthContext.checkAuth: Starting');
    console.log('  - pathname:', pathname);
    console.log('  - hash:', hash);
    console.log('  - search:', search);
    
    // CRITICAL: If on OAuth callback page or have session_id, DO NOT check auth
    // Let AuthCallback handle everything
    if (pathname === '/auth/callback' || 
        hash?.includes('session_id=') || 
        search?.includes('session_id=')) {
      console.log('AuthContext.checkAuth: On callback, skipping');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      console.log('AuthContext.checkAuth: Success, user =', response.data.email);
      setUser(response.data);
    } catch (error) {
      console.log('AuthContext.checkAuth: Failed, status =', error.response?.status);
      setUser(null);
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