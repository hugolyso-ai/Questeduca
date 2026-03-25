import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
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
        navigate('/login');
        return;
      }

      try {
        const response = await axios.post(
          `${API}/auth/google/session`,
          null,
          {
            params: { session_id: sessionId },
            withCredentials: true
          }
        );

        const userData = response.data.user;

        // Redirect based on role
        if (userData.role === 'student') {
          navigate('/student/dashboard', { state: { user: userData } });
        } else if (userData.role === 'parent') {
          navigate('/parent/dashboard', { state: { user: userData } });
        } else if (userData.role === 'association') {
          navigate('/association/dashboard', { state: { user: userData } });
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Session processing failed:', error);
        navigate('/login');
      }
    };

    processSession();
  }, [navigate]);

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