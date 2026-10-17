import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trophy, Users, Swords } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const roleDashboard = {
  student: '/student/dashboard',
  parent: '/parent/dashboard',
  association: '/association/dashboard',
  admin: '/admin',
  teacher: '/teacher/dashboard',
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
    <div className="min-h-screen bg-[hsl(40,33%,96%)] text-[hsl(24,10%,18%)]">
      {/* Cabeçalho */}
      <nav className="sticky top-0 z-50 bg-[hsl(45,50%,99%)]/90 backdrop-blur border-b border-[hsl(35,25%,85%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="QUESTEDUCA" className="h-14 w-14 drop-shadow-md" />
              <span className="text-2xl sm:text-3xl font-bold tracking-wide text-[hsl(24,10%,18%)]" style={{ fontFamily: 'Cinzel, serif' }}>
                QUESTEDUCA
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl font-bold text-[hsl(24,10%,25%)] hover:bg-[hsl(36,33%,91%)] transition"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-7 py-3 rounded-xl font-bold btn-gold hover:-translate-y-0.5 transition-all"
              >
                Registar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Herói */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/assets/grass_texture.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(40,33%,96%)]/60 via-[hsl(40,33%,96%)]/40 to-[hsl(40,33%,96%)]" />
        <div className="relative pt-24 pb-28 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1
              className="text-4xl sm:text-6xl font-bold text-[hsl(24,10%,18%)] leading-tight mb-6"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Aprende, Constrói, <span className="text-[hsl(33,90%,45%)]">Defende!</span>
            </h1>
            <p className="text-lg sm:text-xl text-[hsl(25,10%,35%)] mb-10 leading-relaxed max-w-2xl mx-auto">
              O jogo educativo que transforma o estudo em aventura para o 1.º ciclo do ensino básico. Responde, conquista recursos e vê a tua vila crescer.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-10 py-4 rounded-xl font-bold text-lg btn-gold hover:-translate-y-0.5 transition-all"
              >
                Começar Aventura <Sparkles className="inline ml-2" size={20} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-4 rounded-xl font-bold text-lg bg-[hsl(45,50%,99%)] border-2 border-[hsl(35,25%,85%)] hover:border-[hsl(35,60%,60%)] hover:-translate-y-0.5 transition-all"
              >
                <Swords className="inline mr-2" size={20} /> Entrar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cartões de plataforma */}
      <section className="px-4 -mt-10 relative z-10">
        <div className="max-w-2xl mx-auto parchment rounded-2xl shadow-lg p-8">
          <p className="text-center text-sm font-bold tracking-[0.2em] uppercase text-[hsl(25,10%,40%)] mb-6">
            Disponível em todas as plataformas
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-4 p-5 rounded-xl bg-[hsl(24,10%,18%)] text-[hsl(45,55%,97%)] hover:-translate-y-0.5 transition-all shadow-md"
            >
              <span className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Swords size={24} />
              </span>
              <span className="text-left">
                <span className="block text-xs opacity-70">Instalar no</span>
                <span className="block font-bold text-lg">Telemóvel / Tablet</span>
              </span>
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-4 p-5 rounded-xl bg-[hsl(45,55%,99%)] border-2 border-[hsl(35,25%,85%)] hover:border-[hsl(35,60%,60%)] hover:-translate-y-0.5 transition-all shadow-sm"
            >
              <span className="w-12 h-12 rounded-xl bg-[hsl(36,33%,91%)] flex items-center justify-center text-[hsl(24,10%,25%)]">
                <Swords size={24} />
              </span>
              <span className="text-left">
                <span className="block text-xs text-[hsl(25,10%,40%)]">Jogar no</span>
                <span className="block font-bold text-lg text-[hsl(24,10%,18%)]">PC / Browser</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Porque escolher */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-14" style={{ fontFamily: 'Cinzel, serif' }}>
            Porque escolher QUESTEDUCA?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Trophy,
                title: 'Aprende Divertindo',
                desc: 'Responde a perguntas do currículo português e ganha moedas e diamantes para construir o teu império!',
                bg: 'bg-[hsl(38,95%,90%)]',
                fg: 'text-[hsl(28,80%,35%)]',
              },
              {
                icon: Sparkles,
                title: 'Constrói e Evolui',
                desc: 'Começa com uma aldeia e evolui para vila, cidade, concelho e até distrito! Construções com temporizadores reais.',
                bg: 'bg-[hsl(142,45%,88%)]',
                fg: 'text-[hsl(142,55%,28%)]',
              },
              {
                icon: Users,
                title: 'Joga com Amigos',
                desc: 'Pesquisa amigos pelo mapa de Portugal, troca recursos e desafia-os em mini-jogos educativos!',
                bg: 'bg-[hsl(200,55%,88%)]',
                fg: 'text-[hsl(200,60%,30%)]',
              },
            ].map(({ icon: Icon, title, desc, bg, fg }) => (
              <div key={title} className="parchment rounded-2xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className={`rounded-2xl w-16 h-16 flex items-center justify-center mb-6 ${bg} ${fg}`}>
                  <Icon size={30} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h3>
                <p className="text-[hsl(25,10%,35%)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chamada final */}
      <section className="py-20 px-4 bg-[hsl(24,10%,18%)]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(45,55%,97%)] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
            Pronto para começar a tua aventura?
          </h2>
          <p className="text-lg text-[hsl(45,20%,75%)] mb-10">
            Junta-te a milhares de alunos portugueses que já estão a aprender e a divertir-se!
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-12 py-5 rounded-xl font-bold text-lg btn-gold hover:-translate-y-0.5 transition-all"
          >
            Registar Grátis
          </button>
        </div>
      </section>

      <footer className="bg-[hsl(24,14%,12%)] text-[hsl(45,20%,75%)] py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>© 2026 QUESTEDUCA - Serv2all.pt | info@serv2all.pt</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <a href="/privacy" className="hover:text-[hsl(38,95%,65%)]">Política de Privacidade</a>
            <a href="/terms" className="hover:text-[hsl(38,95%,65%)]">Termos e Condições</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
