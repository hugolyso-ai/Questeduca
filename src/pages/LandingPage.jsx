import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trophy, Users, Castle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const roleDashboard = {
  student: '/student/dashboard',
  parent: '/parent/dashboard',
  association: '/association/dashboard',
  admin: '/admin',
}

const LandingPage = () => {
  const navigate = useNavigate()
  const { user, profile, loading } = useAuth()

  // Utilizador já autenticado (ex: regresso do Google OAuth) vai direto ao dashboard
  useEffect(() => {
    if (!loading && user && profile && roleDashboard[profile.role]) {
      navigate(roleDashboard[profile.role], { replace: true })
    }
  }, [loading, user, profile, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <Castle className="h-10 w-10 text-green-500" strokeWidth={2.5} />
              <span className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                QUESTEDUCA
              </span>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-full font-bold text-slate-700 hover:bg-slate-100 transition"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 rounded-full font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all border-b-4 border-green-600 active:translate-y-0 active:shadow-md"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Registar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-6"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                Aprende Jogando. <span className="text-green-500">Constrói o Teu Império!</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed" style={{ fontFamily: 'Nunito, sans-serif' }}>
                O jogo educativo #1 em Portugal para alunos do 1º ao 9º ano. Responde perguntas, constrói a tua aldeia e torna-te no melhor estudante de Portugal!
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-10 py-4 rounded-full font-bold text-white text-lg bg-green-500 hover:bg-green-600 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all border-b-4 border-green-600 active:translate-y-0"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Começar Agora <Sparkles className="inline ml-2" size={24} />
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-3xl shadow-2xl border-4 border-white bg-gradient-to-br from-green-200 to-blue-200 aspect-video flex items-center justify-center">
                <Castle className="h-32 w-32 text-green-600" strokeWidth={1.5} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-center text-slate-900 mb-16" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Porque escolher QUESTEDUCA?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg border-b-4 border-blue-200 hover:shadow-xl transition-shadow">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Trophy className="text-blue-600" size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Aprende Divertindo
              </h3>
              <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Responde a perguntas do currículo português e ganha moedas e diamantes para construir o teu império!
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-lg border-b-4 border-green-200 hover:shadow-xl transition-shadow">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Castle className="text-green-600" size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Constrói e Evolui
              </h3>
              <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Começa com uma aldeia e evolui para vila, cidade, concelho e até distrito! Construções realistas com temporizadores.
              </p>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-lg border-b-4 border-pink-200 hover:shadow-xl transition-shadow">
              <div className="bg-pink-100 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <Users className="text-pink-600" size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Joga com Amigos
              </h3>
              <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Pesquisa amigos pelo mapa de Portugal, troca recursos e desafia-os em mini-jogos educativos!
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-green-500 to-blue-500">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Pronto para começar a tua aventura?
          </h2>
          <p className="text-xl text-white/90 mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Junta-te a milhares de alunos portugueses que já estão a aprender e a divertir-se!
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 rounded-full font-bold text-green-600 text-lg bg-white hover:bg-slate-50 shadow-2xl transform hover:-translate-y-1 transition-all"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            Registar Grátis
          </button>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p style={{ fontFamily: 'Nunito, sans-serif' }}>© 2026 QUESTEDUCA - Serv2all.pt | info@serv2all.pt</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <a href="/privacy" className="hover:text-green-400">Política de Privacidade</a>
            <a href="/terms" className="hover:text-green-400">Termos e Condições</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
