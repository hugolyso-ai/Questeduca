import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Castle, Mail, Lock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      toast.success('Login bem-sucedido!');
      
      // Redirect based on role
      if (result.user.role === 'student') {
        navigate('/student/dashboard');
      } else if (result.user.role === 'parent') {
        navigate('/parent/dashboard');
      } else if (result.user.role === 'association') {
        navigate('/association/dashboard');
      } else if (result.user.role === 'admin') {
        navigate('/admin');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Erro ao fazer login');
      toast.error('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <Castle className="h-12 w-12 text-green-500" strokeWidth={2.5} />
            <span className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              QUESTEDUCA
            </span>
          </Link>
          <p className="text-slate-600 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Bem-vindo de volta!
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-b-4 border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Entrar
          </h2>

          {error && (
            <div data-testid="login-error" className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-800 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              data-testid="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 rounded-full font-bold text-white text-lg bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all border-b-4 border-green-600 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500" style={{ fontFamily: 'Nunito, sans-serif' }}>ou</span>
            </div>
          </div>

          <button
            data-testid="login-google-btn"
            onClick={handleGoogleLogin}
            type="button"
            className="w-full px-8 py-4 rounded-full font-bold text-slate-700 bg-white border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          <p className="text-center mt-6 text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Não tens conta?{' '}
            <Link to="/register" className="text-green-600 font-bold hover:text-green-700">
              Registar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;