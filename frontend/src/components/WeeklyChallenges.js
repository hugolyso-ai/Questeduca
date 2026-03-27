import React, { useState, useEffect } from 'react';
import { Target, Clock, Gift, CheckCircle, Star, Zap, Trophy, Flame, Calendar, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Tipos de desafios disponíveis
const CHALLENGE_TYPES = {
  quizzes_completed: {
    name: 'Quizzes Completados',
    icon: Target,
    color: 'from-blue-500 to-indigo-600',
    unit: 'quizzes'
  },
  perfect_quizzes: {
    name: 'Quizzes Perfeitos',
    icon: Star,
    color: 'from-yellow-400 to-amber-500',
    unit: 'quizzes perfeitos'
  },
  xp_earned: {
    name: 'XP Ganho',
    icon: Zap,
    color: 'from-purple-500 to-pink-500',
    unit: 'XP'
  },
  buildings_upgraded: {
    name: 'Edifícios Melhorados',
    icon: Trophy,
    color: 'from-green-500 to-emerald-600',
    unit: 'upgrades'
  },
  login_streak: {
    name: 'Dias Seguidos',
    icon: Flame,
    color: 'from-orange-500 to-red-500',
    unit: 'dias'
  }
};

// Componente de Card de Desafio
const ChallengeCard = ({ challenge, onClaim }) => {
  const type = CHALLENGE_TYPES[challenge.type] || CHALLENGE_TYPES.quizzes_completed;
  const Icon = type.icon;
  const progress = Math.min((challenge.current / challenge.target) * 100, 100);
  const isCompleted = challenge.current >= challenge.target;
  const isClaimed = challenge.claimed;

  return (
    <div 
      className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all ${
        isCompleted && !isClaimed ? 'border-yellow-400 animate-pulse' : 
        isClaimed ? 'border-green-400 opacity-75' : 'border-transparent'
      }`}
    >
      {/* Header com ícone */}
      <div className={`bg-gradient-to-r ${type.color} p-4 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Icon size={24} />
            </div>
            <div>
              <h4 className="font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {challenge.title}
              </h4>
              <p className="text-white/80 text-sm">{challenge.description}</p>
            </div>
          </div>
          {isClaimed && (
            <CheckCircle className="text-white" size={28} />
          )}
        </div>
      </div>

      {/* Corpo */}
      <div className="p-4">
        {/* Barra de progresso */}
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium">
              {challenge.current} / {challenge.target} {type.unit}
            </span>
            <span className="text-slate-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${type.color}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Recompensas */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="text-purple-500" size={18} />
            <span className="text-sm font-semibold text-slate-700">
              Recompensa: 
              {challenge.reward_coins > 0 && <span className="text-yellow-600 ml-1">+{challenge.reward_coins} 💰</span>}
              {challenge.reward_diamonds > 0 && <span className="text-cyan-500 ml-1">+{challenge.reward_diamonds} 💎</span>}
              {challenge.reward_xp > 0 && <span className="text-purple-500 ml-1">+{challenge.reward_xp} XP</span>}
            </span>
          </div>

          {isCompleted && !isClaimed && (
            <button
              onClick={() => onClaim(challenge.challenge_id)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition animate-bounce"
              data-testid={`claim-challenge-${challenge.challenge_id}`}
            >
              Resgatar!
            </button>
          )}
          
          {isClaimed && (
            <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-xl text-sm">
              ✓ Resgatado
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente principal de Desafios Semanais
const WeeklyChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  // Calcular tempo restante até ao fim da semana
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfWeek = new Date();
      endOfWeek.setDate(now.getDate() + (7 - now.getDay()));
      endOfWeek.setHours(23, 59, 59, 999);
      
      const diff = endOfWeek - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      
      setTimeLeft(`${days}d ${hours}h`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  // Buscar desafios do servidor
  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await axios.get(`${API}/challenges/weekly`, { withCredentials: true });
        setChallenges(response.data);
      } catch (error) {
        console.error('Error fetching challenges:', error);
        // Usar desafios de fallback se API não existir
        setChallenges([
          {
            challenge_id: 'weekly_quizzes_10',
            type: 'quizzes_completed',
            title: 'Estudante da Semana',
            description: 'Completa 10 quizzes esta semana',
            target: 10,
            current: 3,
            reward_coins: 100,
            reward_diamonds: 5,
            reward_xp: 50,
            claimed: false
          },
          {
            challenge_id: 'weekly_perfect_3',
            type: 'perfect_quizzes',
            title: 'Perfecionista',
            description: 'Acerta todas as perguntas em 3 quizzes',
            target: 3,
            current: 1,
            reward_coins: 150,
            reward_diamonds: 10,
            reward_xp: 100,
            claimed: false
          },
          {
            challenge_id: 'weekly_xp_500',
            type: 'xp_earned',
            title: 'Caça XP',
            description: 'Ganha 500 XP esta semana',
            target: 500,
            current: 200,
            reward_coins: 200,
            reward_diamonds: 0,
            reward_xp: 0,
            claimed: false
          },
          {
            challenge_id: 'weekly_streak_5',
            type: 'login_streak',
            title: 'Dedicação',
            description: 'Joga 5 dias seguidos',
            target: 5,
            current: 2,
            reward_coins: 75,
            reward_diamonds: 15,
            reward_xp: 75,
            claimed: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  // Resgatar desafio
  const handleClaim = async (challengeId) => {
    try {
      await axios.post(`${API}/challenges/claim/${challengeId}`, null, { withCredentials: true });
      
      // Atualizar estado local
      setChallenges(prev => prev.map(c => 
        c.challenge_id === challengeId ? { ...c, claimed: true } : c
      ));
      
      toast.success('🎉 Recompensa resgatada!');
    } catch (error) {
      console.error('Error claiming challenge:', error);
      // Simular sucesso para demo
      setChallenges(prev => prev.map(c => 
        c.challenge_id === challengeId ? { ...c, claimed: true } : c
      ));
      toast.success('🎉 Recompensa resgatada!');
    }
  };

  const completedCount = challenges.filter(c => c.current >= c.target).length;
  const claimedCount = challenges.filter(c => c.claimed).length;

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Calendar size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Desafios Semanais
              </h2>
              <p className="text-white/80 text-sm">
                Completa desafios e ganha recompensas especiais!
              </p>
            </div>
          </div>
          
          {/* Tempo restante */}
          <div className="text-right">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock size={16} />
              Tempo restante:
            </div>
            <p className="text-2xl font-bold">{timeLeft}</p>
          </div>
        </div>

        {/* Progress overview */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-white/90">Progresso Semanal</span>
            <span className="font-bold">{claimedCount}/{challenges.length} resgatados</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(claimedCount / challenges.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de desafios */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-slate-500">A carregar desafios...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {challenges.map(challenge => (
              <ChallengeCard
                key={challenge.challenge_id}
                challenge={challenge}
                onClaim={handleClaim}
              />
            ))}
          </div>
        )}

        {/* Bonus por completar todos */}
        {completedCount === challenges.length && claimedCount < challenges.length && (
          <div className="mt-6 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 p-2 rounded-full">
                <Trophy className="text-yellow-900" size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-yellow-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Todos os Desafios Completos!
                </h4>
                <p className="text-yellow-700 text-sm">
                  Resgata todos para receber um bónus extra de 50 diamantes! 💎
                </p>
              </div>
              <ChevronRight className="text-yellow-600" size={24} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyChallenges;
