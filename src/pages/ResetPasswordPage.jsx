import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Página de definição de nova password após clicar no link do email de recuperação.
// A sessão de recuperação é criada automaticamente pelo onAuthStateChange (evento PASSWORD_RECOVERY).
const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionMissing, setSessionMissing] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) setSessionMissing(true)
      })
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const isStrongPassword = (pwd) =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isStrongPassword(password)) {
      toast.error('A password deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e um caractere especial (ex.: ! ? #)')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As passwords não coincidem')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      toast.success('Password alterada com sucesso!')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err.message || 'Erro ao alterar a password')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
  const labelStyle = { fontFamily: 'Nunito, sans-serif' }

  return (
    <div className="min-h-screen bg-[hsl(40,33%,96%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="QUESTEDUCA" className="h-16 w-auto drop-shadow-md" />
            <span className="text-3xl font-bold text-[hsl(24,10%,18%)] tracking-wide" style={{ fontFamily: 'Cinzel, serif' }}>
              QUESTEDUCA
            </span>
          </Link>
          <p className="text-slate-600 mt-2" style={labelStyle}>Defina uma nova password para a sua conta</p>
        </div>

        <div className="parchment rounded-3xl shadow-xl p-8">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
              <h2 className="text-xl font-bold text-[hsl(24,10%,18%)] mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                Password alterada!
              </h2>
              <p className="text-slate-600" style={labelStyle}>A redirecionar para a página de entrada...</p>
            </div>
          ) : sessionMissing && !user ? (
            <div className="text-center py-6">
              <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
              <h2 className="text-xl font-bold text-[hsl(24,10%,18%)] mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
                Link inválido ou expirado
              </h2>
              <p className="text-slate-600 mb-6" style={labelStyle}>
                Este link de recuperação já não é válido. Peça um novo na página de entrada ("Esqueci-me da password").
              </p>
              <Link to="/login" className="text-[hsl(28,85%,40%)] font-bold hover:text-[hsl(28,85%,32%)]">
                Voltar à página de entrada
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="text-2xl font-bold text-[hsl(24,10%,18%)]" style={{ fontFamily: 'Cinzel, serif' }}>
                Nova Password
              </h2>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={labelStyle}>Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputCls}
                    style={labelStyle}
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-1" style={labelStyle}>
                  Mínimo 8 caracteres, com maiúscula, minúscula e caractere especial (ex.: Aa1!)
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={labelStyle}>Confirmar</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className={inputCls}
                    style={labelStyle}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full px-8 py-4 rounded-xl font-bold text-white text-lg btn-gold hover:-translate-y-0.5 transition-all disabled:opacity-50"
                style={labelStyle}
              >
                {saving ? 'A guardar...' : 'Alterar Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
