import React, { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, X, Sparkles, Target, Trophy,
  Users, Building2, BookOpen, Gift, Star, Check, ArrowRight
} from 'lucide-react';

// Definição dos passos do tutorial
const TUTORIAL_STEPS = {
  student: [
    {
      id: 'welcome',
      title: 'Bem-vindo ao QUESTEDUCA! 🎮',
      description: 'Vamos guiar-te pelas funcionalidades principais do jogo. Este tutorial só aparece uma vez!',
      icon: Sparkles,
      color: 'from-purple-500 to-[hsl(340,60%,55%)]',
      highlight: null,
      position: 'center'
    },
    {
      id: 'resources',
      title: 'Os Teus Recursos 💰',
      description: 'Aqui podes ver as tuas moedas, diamantes e XP. Ganha-os respondendo a quizzes!',
      icon: Star,
      color: 'from-yellow-400 to-amber-500',
      highlight: '[data-testid="resources-bar"]',
      position: 'bottom'
    },
    {
      id: 'city',
      title: 'A Tua Cidade 🏙️',
      description: 'Esta é a tua cidade! Melhora os edifícios para evoluir de Aldeia para Metrópole.',
      icon: Building2,
      color: 'from-amber-400 to-orange-500',
      highlight: '[data-testid="tab-city"]',
      position: 'bottom'
    },
    {
      id: 'quiz',
      title: 'Aprender & Ganhar 📚',
      description: 'Na aba "Aprender", responde a quizzes do teu ano escolar para ganhar moedas e XP!',
      icon: BookOpen,
      color: 'from-[hsl(35,92%,50%)] to-indigo-600',
      highlight: '[data-testid="tab-quiz"]',
      position: 'bottom'
    },
    {
      id: 'challenges',
      title: 'Desafios Semanais 🎯',
      description: 'Completa desafios todas as semanas para ganhar recompensas especiais!',
      icon: Target,
      color: 'from-[hsl(35,92%,50%)] to-teal-600',
      highlight: '[data-testid="tab-challenges"]',
      position: 'bottom'
    },
    {
      id: 'league',
      title: 'Liga Mensal 🏆',
      description: 'Compete com outros alunos! Os top 10 do mês ganham diamantes e badges.',
      icon: Trophy,
      color: 'from-purple-500 to-[hsl(340,60%,55%)]',
      highlight: '[data-testid="tab-league"]',
      position: 'bottom'
    },
    {
      id: 'friends',
      title: 'Encontra Amigos 👥',
      description: 'Usa o mapa de Portugal para encontrar amigos de todo o país!',
      icon: Users,
      color: 'from-[hsl(340,65%,55%)] to-rose-500',
      highlight: '[data-testid="tab-friends"]',
      position: 'bottom'
    },
    {
      id: 'complete',
      title: 'Pronto para Jogar! 🚀',
      description: 'Agora já sabes tudo! Começa por fazer um quiz e ganhar as tuas primeiras moedas.',
      icon: Gift,
      color: 'from-gradient-to-br from-purple-500 via-[hsl(340,60%,55%)] to-red-500',
      highlight: null,
      position: 'center',
      showConfetti: true
    }
  ],
  parent: [
    {
      id: 'welcome',
      title: 'Bem-vindo, Pai/Mãe! 👋',
      description: 'Vamos mostrar-lhe como gerir a conta dos seus filhos no QUESTEDUCA.',
      icon: Sparkles,
      color: 'from-[hsl(35,92%,50%)] to-indigo-600',
      highlight: null,
      position: 'center'
    },
    {
      id: 'children',
      title: 'Gestão de Filhos 👨‍👩‍👧‍👦',
      description: 'Aqui pode adicionar e gerir os perfis dos seus filhos. Cada filho tem a sua própria conta.',
      icon: Users,
      color: 'from-[hsl(35,92%,50%)] to-teal-600',
      highlight: '[data-testid="tab-children"]',
      position: 'bottom'
    },
    {
      id: 'subscription',
      title: 'Subscrição Premium 💎',
      description: 'Subscreva o plano Premium para desbloquear todas as funcionalidades e apoiar o projeto.',
      icon: Star,
      color: 'from-purple-500 to-[hsl(340,60%,55%)]',
      highlight: '[data-testid="tab-subscription"]',
      position: 'bottom'
    },
    {
      id: 'minigames',
      title: 'Jogue com os Filhos 🎮',
      description: 'Clique em "Jogar" no card de um filho para iniciar mini-jogos educativos em família!',
      icon: Gift,
      color: 'from-amber-500 to-orange-500',
      highlight: null,
      position: 'center'
    },
    {
      id: 'complete',
      title: 'Tudo Pronto! ✨',
      description: 'Agora pode começar a gerir as contas dos seus filhos. Bom estudo!',
      icon: Check,
      color: 'from-[hsl(35,92%,50%)] to-emerald-600',
      highlight: null,
      position: 'center'
    }
  ]
};

// Componente de Confetti simples
const Confetti = () => {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

// Componente principal do Tutorial
const InteractiveTutorial = ({ userRole = 'student', onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [highlightRect, setHighlightRect] = useState(null);

  const steps = TUTORIAL_STEPS[userRole] || TUTORIAL_STEPS.student;
  const step = steps[currentStep];
  const Icon = step.icon;

  // Verificar se tutorial já foi visto
  useEffect(() => {
    const tutorialKey = `tutorial_completed_${userRole}`;
    if (localStorage.getItem(tutorialKey)) {
      setIsVisible(false);
      onComplete?.();
    }
  }, [userRole, onComplete]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);

      // Mostrar confetti no último passo
      if (currentStep === steps.length - 2 && steps[currentStep + 1].showConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    const tutorialKey = `tutorial_completed_${userRole}`;
    localStorage.setItem(tutorialKey, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  // Highlight element and get its position
  useEffect(() => {
    if (step.highlight) {
      const element = document.querySelector(step.highlight);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Wait for scroll to complete
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setHighlightRect({
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16
          });
        }, 300);

        return () => {
          setHighlightRect(null);
        };
      }
    } else {
      setHighlightRect(null);
    }
  }, [step]);

  if (!isVisible) return null;

  return (
    <>
      {showConfetti && <Confetti />}

      {/* Dark overlay with cutout for highlighted element */}
      <div className="fixed inset-0 z-50 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="tutorial-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {highlightRect && (
                <rect
                  x={highlightRect.left}
                  y={highlightRect.top}
                  width={highlightRect.width}
                  height={highlightRect.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.75)"
            mask="url(#tutorial-mask)"
          />
        </svg>
      </div>

      {/* Highlight border around element */}
      {highlightRect && (
        <div
          className="fixed z-50 pointer-events-none border-4 border-purple-500 rounded-xl animate-pulse"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.4)'
          }}
        />
      )}

      {/* Arrow pointing to element */}
      {highlightRect && step.position === 'bottom' && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            top: highlightRect.top + highlightRect.height + 10,
            left: highlightRect.left + highlightRect.width / 2 - 20
          }}
        >
          <ArrowRight className="text-purple-500 transform -rotate-90" size={40} />
        </div>
      )}

      {/* Tutorial Card */}
      <div
        className={`fixed z-50 ${
          step.position === 'center'
            ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            : highlightRect
              ? 'left-1/2 transform -translate-x-1/2'
              : 'top-24 left-1/2 transform -translate-x-1/2'
        }`}
        style={highlightRect && step.position !== 'center' ? {
          top: highlightRect.top + highlightRect.height + 60
        } : undefined}
      >
        <div className="bg-white rounded-3xl shadow-2xl w-[90vw] max-w-md overflow-hidden animate-bounce-in">
          {/* Header with element name */}
          <div className={`bg-gradient-to-r ${step.color} p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Icon size={28} />
                </div>
                <div>
                  <p className="text-white/80 text-sm">
                    Passo {currentStep + 1} de {steps.length}
                  </p>
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
                    {step.title}
                  </h3>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-2 hover:bg-white/20 rounded-full transition"
                title="Saltar tutorial"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content with visual reference */}
          <div className="p-6">
            {step.highlight && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <span className="text-purple-700 text-sm font-medium">
                  Olhe para o elemento destacado acima ↑
                </span>
              </div>
            )}

            <p className="text-slate-600 text-lg mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentStep
                      ? 'w-6 bg-purple-500'
                      : i < currentStep
                        ? 'bg-purple-300'
                        : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition flex items-center justify-center gap-2"
                >
                  <ChevronLeft size={18} />
                  Anterior
                </button>
              )}

              <button
                onClick={handleNext}
                className={`flex-1 py-3 bg-gradient-to-r ${step.color} text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2`}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Começar!
                    <Sparkles size={18} />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </div>

            {/* Skip link */}
            <button
              onClick={handleSkip}
              className="w-full mt-4 text-slate-400 text-sm hover:text-slate-600 transition"
            >
              Saltar tutorial
            </button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
    </>
  );
};

export default InteractiveTutorial;
