import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Swords, Mail, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, loginWithGoogle, ensureGoogleProfile, fetchProfile } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)
      const prof = await fetchProfile(result.user.id)
      const role = prof?.role

      if (result.mustChangePassword) {
        toast.info('Por favor altere a sua password')
        navigate('/login')
        return
      }

      toast.success('Login bem-sucedido!')
      if (prof?.approval_status === 'pending' || prof?.approval_status === 'rejected') {
        navigate('/pending-approval')
        return
      }
      if (role === 'pending_role') {
        navigate('/role-choice')
        return
      }
      if (role === 'student') navigate('/student/dashboard')
      else if (role === 'parent') navigate('/parent/dashboard')
      else if (role === 'association') navigate('/association/dashboard')
      else if (role === 'admin') navigate('/admin')
      else if (role === 'teacher') navigate('/teacher/dashboard')
      else navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao fazer login')
      toast.error('Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      await loginWithGoogle()
      // O redirecionamento acontece automaticamente; o perfil é garantido no onAuthStateChange
    } catch (err) {
      setError(err.message || 'Erro ao iniciar sessão com Google')
      toast.error('Erro ao entrar com Google')
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(40,33%,96%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <span className="w-12 h-12 rounded-2xl btn-gold flex items-center justify-center shadow-md">
              <Swords className="h-6 w-6 text-white" />
            </span>
            <span className="text-3xl font-bold text-[hsl(24,10%,18%)] tracking-wide" style={{ fontFamily: 'Cinzel, serif' }}>
              QUESTEDUCA
            </span>
          </Link>
          <p className="text-slate-600 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Bem-vindo de volta!
          </p>
        </div>

        <div className="parchment rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[hsl(24,10%,18%)] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
            Entrar
          </h2>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 rounded-xl font-bold text-white text-lg btn-gold hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-sm text-slate-400 font-semibold">ou</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-slate-700 text-lg bg-white border-2 border-slate-200 hover:bg-slate-50 hover:shadow-md transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <GoogleIcon />
            Continuar com Google
          </button>

          <p className="text-center mt-6 text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Não tens conta?{' '}
            <Link to="/register" className="text-[hsl(28,85%,40%)] font-bold hover:text-[hsl(28,85%,32%)]">
              Registar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
