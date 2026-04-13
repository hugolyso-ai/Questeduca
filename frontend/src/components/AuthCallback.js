import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const sessionId = params.get('session_id');

      if (!sessionId) {
        console.error('No session_id in URL hash');
        navigate('/login', { replace: true });
        return;
      }

      try {
        // Step 1: Exchange session_id for session cookie
        const response = await axios.post(
          `${API}/auth/google/session`,
          null,
          {
            params: { session_id: sessionId },
            withCredentials: true
          }
        );

        const userData = response.data.user;
        
        // Step 2: Set user directly in context (don't rely on cookie check)
        setUser(userData);

        // Step 3: Small delay to ensure cookie is set
        await new Promise(resolve => setTimeout(resolve, 100));

        // Step 4: Redirect based on role
        if (userData.role === 'student') {
          navigate('/student/dashboard', { replace: true });
        } else if (userData.role === 'parent') {
          navigate('/parent/dashboard', { replace: true });
        } else if (userData.role === 'association') {
          navigate('/association/dashboard', { replace: true });
        } else if (userData.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Session processing failed:', error);
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-slate-700">A processar autenticação...</p>
      </div>
    </div>
  );
};

export default AuthCallback;