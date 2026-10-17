import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Trophy, Users, Swords, Smartphone, Monitor, Download, X } from 'lucide-react'
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

  const isMobile = useMemo(
    () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    []
  )

  const isIos = useMemo(
    () => /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    []
  )

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
  )
  const [instructions, setInstructions] = useState(null) // 'android' | 'ios' | 'desktop'

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferredPrompt(null)
      setInstructions(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (installed) {
      setInstructions('already')
      return
    }
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
      return
    }
    setInstructions(isIos ? 'ios' : isMobile ? 'android' : 'desktop')
  }

  const installHint = isMobile
    ? 'Estás no telemóvel/tablet — instala a app aqui'
    : 'Estás no PC — joga diretamente no browser'

  return (
    <div className="min-h-screen bg-[hsl(40,33%,96%)] text-[hsl(24,10%,18%)]">
      {/* Cabeçalho */}
      <nav className="sticky top-0 z-50 bg-[hsl(45,50%,99%)]/90 backdrop-blur border-b border-[hsl(35,25%,85%)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="QUESTEDUCA" className="h-14 w-auto drop-shadow-md" />
              <span className="text-2xl sm:text-3xl font-bold tracking-wide text-[hsl(24,10%,18%)]" style={{ fontFamily: 'Cinzel, serif' }}>
                QUESTEDUCA
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-xl font-bold text-[hsl(24,10%,25%)] hover:bg-[hsl(36,33%,91%)] transition"
              >
                Regressar à Aventura
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
                <span className="block text-xs font-normal opacity-80">cria a tua conta grátis</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-10 py-4 rounded-xl font-bold text-lg bg-[hsl(45,50%,99%)] border-2 border-[hsl(35,25%,85%)] hover:border-[hsl(35,60%,60%)] hover:-translate-y-0.5 transition-all"
              >
                <Swords className="inline mr-2" size={20} /> Regressar à Aventura
                <span className="block text-xs font-normal text-[hsl(25,10%,45%)]">já tenho conta — entrar</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Instalação da app */}
      <section className="px-4 -mt-10 relative z-10">
        <div className="max-w-2xl mx-auto parchment rounded-2xl shadow-lg p-8 text-center">
          <p className="text-center text-sm font-bold tracking-[0.2em] uppercase text-[hsl(25,10%,40%)] mb-3">
            Disponível em todas as plataformas
          </p>
          <p className="text-center text-xs text-[hsl(25,10%,45%)] mb-6">{installHint}</p>
          <button
            onClick={handleInstallClick}
            disabled={installed}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-xl font-bold text-lg btn-gold hover:-translate-y-0.5 transition-all disabled:opacity-60"
          >
            {isMobile ? <Smartphone size={22} /> : <Monitor size={22} />}
            {installed ? 'App já instalada' : 'Instalar a App'}
          </button>
          <p className="text-center text-xs text-[hsl(25,10%,45%)] mt-4">
            O botão deteta o teu equipamento {isMobile ? '(telemóvel/tablet)' : '(computador)'} e instala a versão certa.
          </p>
        </div>
      </section>

      {/* Instruções de instalação (quando o navegador não permite instalação automática) */}
      {instructions && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setInstructions(null)}>
          <div
            className="parchment rounded-3xl shadow-2xl p-8 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setInstructions(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            {instructions === 'already' ? (
              <>
                <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Cinzel, serif' }}>A app já está instalada</h3>
                <p className="text-[hsl(25,10%,35%)]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Estás a usar a QUESTEDUCA instalada. Abra-a a partir do ícone no teu ecrã principal ou navegador.
                </p>
              </>
            ) : instructions === 'ios' ? (
              <>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Instalar no iPhone / iPad</h3>
                <ol className="space-y-3 text-[hsl(25,10%,30%)]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">1.</span> Toque no ícone <strong>Partilhar</strong> (o quadrado com uma seta para cima) no fundo do Safari.</li>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">2.</span> Escolha <strong>Adicionar ao Ecrã Início</strong>.</li>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">3.</span> Toque em <strong>Adicionar</strong>. O ícone da QUESTEDUCA aparece no teu ecrã principal.</li>
                </ol>
              </>
            ) : instructions === 'android' ? (
              <>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Instalar no Telemóvel / Tablet</h3>
                <ol className="space-y-3 text-[hsl(25,10%,30%)]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">1.</span> Abra o menu do navegador (os três pontos ⋮ no canto superior).</li>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">2.</span> Toque em <strong>Instalar aplicação</strong> (ou <strong>Adicionar ao ecrã principal</strong>).</li>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">3.</span> Confirme. A app fica instalada no telemóvel, como uma aplicação normal.</li>
                </ol>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Instalar no PC</h3>
                <ol className="space-y-3 text-[hsl(25,10%,30%)]" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">1.</span> Clique no ícone <Download size={14} className="inline" /> de instalação na barra de endereço do navegador (ao lado do endereço).</li>
                  <li className="flex gap-3"><span className="font-bold text-[hsl(28,85%,40%)]">2.</span> Confirme <strong>Instalar</strong>. A QUESTEDUCA abre na própria janela, como um programa.</li>
                </ol>
              </>
            )}
          </div>
        </div>
      )}

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
          <p>© 2026 QUESTEDUCA — Todos os direitos reservados</p>
          <p className="mt-1 text-sm">info@questeduca.pt</p>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <a href="/#/privacy" className="hover:text-[hsl(38,95%,65%)]">Política de Privacidade</a>
            <a href="/#/terms" className="hover:text-[hsl(38,95%,65%)]">Termos e Condições</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
