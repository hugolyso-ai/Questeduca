import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Try to get session_id from multiple sources
      let sessionId = null;
      
      // 1. Try URL hash (e.g., /auth/callback#session_id=xxx)
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        sessionId = hashParams.get('session_id');
      }
      
      // 2. Try query params (e.g., /auth/callback?session_id=xxx)
      if (!sessionId) {
        sessionId = searchParams.get('session_id');
      }
      
      // 3. Try from URL search directly
      if (!sessionId) {
        const urlParams = new URLSearchParams(window.location.search);
        sessionId = urlParams.get('session_id');
      }

      console.log('AuthCallback: Looking for session_id');
      console.log('  - Hash:', hash);
      console.log('  - Search:', window.location.search);
      console.log('  - Found sessionId:', sessionId);

      if (!sessionId) {
        console.error('No session_id found in URL');
        navigate('/login', { replace: true });
        return;
      }

      try {
        console.log('AuthCallback: Exchanging session_id for token...');
        
        // Step 1: Exchange session_id for session cookie
        const response = await axios.post(
          `${API}/auth/google/session`,
          null,
          {
            params: { session_id: sessionId },
            withCredentials: true
          }
        );

        console.log('AuthCallback: Got response:', response.data);
        const userData = response.data.user;
        
        // Step 2: Set user directly in context (don't rely on cookie check)
        setUser(userData);

        // Step 3: Small delay to ensure state is propagated
        await new Promise(resolve => setTimeout(resolve, 200));

        console.log('AuthCallback: Redirecting to dashboard for role:', userData.role);

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
          console.error('AuthCallback: Unknown role:', userData.role);
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Session processing failed:', error);
        console.error('Error details:', error.response?.data);
        navigate('/login', { replace: true });
      }
    };

    processSession();
  }, [navigate, setUser, searchParams]);

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