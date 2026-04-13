import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('A processar...');
  const [processed, setProcessed] = useState(false);

  useEffect(() => {
    if (processed) return;
    setProcessed(true);

    const process = async () => {
      try {
        // Get session_id from hash or query
        let sessionId = null;
        
        const hash = window.location.hash;
        if (hash && hash.includes('session_id=')) {
          const hashParams = new URLSearchParams(hash.substring(1));
          sessionId = hashParams.get('session_id');
        }
        
        if (!sessionId) {
          sessionId = searchParams.get('session_id');
        }
        
        if (!sessionId) {
          sessionId = new URLSearchParams(window.location.search).get('session_id');
        }

        setStatus(`Session ID: ${sessionId ? sessionId.substring(0, 8) + '...' : 'NÃO ENCONTRADO'}`);

        if (!sessionId) {
          setStatus('Erro: session_id não encontrado');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
          return;
        }

        setStatus('A trocar sessão...');
        
        const response = await axios.post(
          `${API}/auth/google/session`,
          null,
          {
            params: { session_id: sessionId },
            withCredentials: true
          }
        );

        const userData = response.data.user;
        setStatus(`Bem-vindo, ${userData.name}! A redirecionar...`);
        
        // Set user in context
        setUser(userData);

        // Wait a moment for state to propagate
        await new Promise(r => setTimeout(r, 500));

        // Redirect based on role
        const dashboardPaths = {
          student: '/student/dashboard',
          parent: '/parent/dashboard',
          association: '/association/dashboard',
          admin: '/admin'
        };
        
        const path = dashboardPaths[userData.role] || '/login';
        setStatus(`A ir para ${path}...`);
        
        // Use window.location for a hard redirect to avoid React Router issues
        window.location.href = path;
        
      } catch (error) {
        setStatus(`Erro: ${error.response?.data?.detail || error.message}`);
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    process();
  }, [processed, navigate, setUser, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-slate-700">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallback;