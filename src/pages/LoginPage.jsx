import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Castle, Mail, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const LoginPage = () => {
  const navigate = useNavigate()
  const { login, profile, fetchProfile } = useAuth()
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
      if (role === 'student') navigate('/student/dashboard')
      else if (role === 'parent') navigate('/parent/dashboard')
      else if (role === 'association') navigate('/association/dashboard')
      else if (role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) {
      setError(err.message || 'Erro ao fazer login')
      toast.error('Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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

        <div className="bg-white rounded-3xl shadow-2xl p-8 border-b-4 border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
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
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 rounded-full font-bold text-white text-lg bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all border-b-4 border-green-600 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center mt-6 text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Não tens conta?{' '}
            <Link to="/register" className="text-green-600 font-bold hover:text-green-700">
              Registar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
