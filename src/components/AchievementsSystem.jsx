import React from 'react';
import {
  Award, Star, Trophy, Crown, Book, Brain, Target, Zap,
  Heart, Users, Building2, Coins, Diamond, Clock, Flame,
  Medal, Shield, Sparkles, GraduationCap, TrendingUp, Lock, Home
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Definição completa de todas as conquistas
export const ACHIEVEMENTS = {
  // Conquistas de Quiz
  first_quiz: {
    id: 'first_quiz',
    name: 'Primeiro Passo',
    description: 'Completa o teu primeiro quiz',
    icon: Star,
    color: 'from-yellow-400 to-amber-500',
    category: 'quiz',
    rarity: 'common',
    xpReward: 10,
    coinsReward: 25,
    check: (stats) => stats.quizzesCompleted >= 1
  },
  quiz_master_10: {
    id: 'quiz_master_10',
    name: 'Estudante Aplicado',
    description: 'Completa 10 quizzes',
    icon: Book,
    color: 'from-[hsl(35,92%,60%)] to-[hsl(28,85%,38%)]',
    category: 'quiz',
    rarity: 'common',
    xpReward: 50,
    coinsReward: 100,
    check: (stats) => stats.quizzesCompleted >= 10
  },
  quiz_master_50: {
    id: 'quiz_master_50',
    name: 'Mestre do Conhecimento',
    description: 'Completa 50 quizzes',
    icon: Brain,
    color: 'from-purple-400 to-purple-600',
    category: 'quiz',
    rarity: 'rare',
    xpReward: 200,
    coinsReward: 500,
    check: (stats) => stats.quizzesCompleted >= 50
  },
  quiz_master_100: {
    id: 'quiz_master_100',
    name: 'Génio',
    description: 'Completa 100 quizzes',
    icon: GraduationCap,
    color: 'from-indigo-500 to-purple-700',
    category: 'quiz',
    rarity: 'epic',
    xpReward: 500,
    coinsReward: 1000,
    check: (stats) => stats.quizzesCompleted >= 100
  },
  perfect_quiz: {
    id: 'perfect_quiz',
    name: 'Perfeição',
    description: 'Acerta todas as perguntas num quiz',
    icon: Target,
    color: 'from-[hsl(38,95%,60%)] to-emerald-600',
    category: 'quiz',
    rarity: 'uncommon',
    xpReward: 30,
    coinsReward: 50,
    check: (stats) => stats.perfectQuizzes >= 1
  },
  streak_5: {
    id: 'streak_5',
    name: 'Em Chamas!',
    description: '5 dias seguidos a jogar',
    icon: Flame,
    color: 'from-orange-400 to-red-500',
    category: 'quiz',
    rarity: 'uncommon',
    xpReward: 75,
    coinsReward: 150,
    check: (stats) => stats.longestStreak >= 5
  },
  streak_30: {
    id: 'streak_30',
    name: 'Dedicação Máxima',
    description: '30 dias seguidos a jogar',
    icon: Shield,
    color: 'from-red-500 to-rose-700',
    category: 'quiz',
    rarity: 'legendary',
    xpReward: 500,
    coinsReward: 1000,
    check: (stats) => stats.longestStreak >= 30
  },

  // Conquistas de Cidade
  first_building: {
    id: 'first_building',
    name: 'Construtor',
    description: 'Constrói o teu primeiro edifício',
    icon: Building2,
    color: 'from-amber-400 to-orange-500',
    category: 'city',
    rarity: 'common',
    xpReward: 15,
    coinsReward: 30,
    check: (stats) => stats.totalBuildingLevel >= 2
  },
  village_complete: {
    id: 'village_complete',
    name: 'Aldeia Completa',
    description: 'Todos os edifícios ao nível 1',
    icon: Home,
    color: 'from-[hsl(38,95%,60%)] to-teal-500',
    category: 'city',
    rarity: 'uncommon',
    xpReward: 100,
    coinsReward: 200,
    check: (stats) => stats.allBuildingsLevel1 === true
  },
  town_reached: {
    id: 'town_reached',
    name: 'De Aldeia a Vila',
    description: 'Atinge o nível de Vila',
    icon: TrendingUp,
    color: 'from-blue-400 to-cyan-500',
    category: 'city',
    rarity: 'uncommon',
    xpReward: 150,
    coinsReward: 300,
    check: (stats) => stats.settlementLevel === 'town' || stats.totalBuildingLevel >= 10
  },
  city_reached: {
    id: 'city_reached',
    name: 'Metrópole Nascente',
    description: 'Atinge o nível de Cidade',
    icon: Crown,
    color: 'from-purple-500 to-[hsl(340,60%,50%)]',
    category: 'city',
    rarity: 'rare',
    xpReward: 300,
    coinsReward: 600,
    check: (stats) => stats.settlementLevel === 'city' || stats.totalBuildingLevel >= 25
  },
  metropolis_reached: {
    id: 'metropolis_reached',
    name: 'Imperador',
    description: 'Atinge o nível de Metrópole',
    icon: Sparkles,
    color: 'from-yellow-400 via-amber-500 to-orange-600',
    category: 'city',
    rarity: 'legendary',
    xpReward: 1000,
    coinsReward: 2000,
    check: (stats) => stats.settlementLevel === 'metropolis' || stats.totalBuildingLevel >= 50
  },
  max_building: {
    id: 'max_building',
    name: 'Arquiteto Mestre',
    description: 'Melhora um edifício ao nível máximo',
    icon: Medal,
    color: 'from-slate-400 to-zinc-600',
    category: 'city',
    rarity: 'rare',
    xpReward: 200,
    coinsReward: 400,
    check: (stats) => stats.maxLevelBuildings >= 1
  },

  // Conquistas Sociais
  first_friend: {
    id: 'first_friend',
    name: 'Primeiro Amigo',
    description: 'Adiciona um amigo',
    icon: Users,
    color: 'from-[hsl(340,65%,70%)] to-rose-500',
    category: 'social',
    rarity: 'common',
    xpReward: 20,
    coinsReward: 40,
    check: (stats) => stats.friendsCount >= 1
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Popular',
    description: 'Adiciona 10 amigos',
    icon: Heart,
    color: 'from-rose-400 to-red-500',
    category: 'social',
    rarity: 'uncommon',
    xpReward: 100,
    coinsReward: 200,
    check: (stats) => stats.friendsCount >= 10
  },
  minigame_first: {
    id: 'minigame_first',
    name: 'Companheiro de Jogo',
    description: 'Joga o primeiro mini-jogo com um pai',
    icon: Zap,
    color: 'from-cyan-400 to-[hsl(24,70%,42%)]',
    category: 'social',
    rarity: 'common',
    xpReward: 25,
    coinsReward: 50,
    check: (stats) => stats.minigamesPlayed >= 1
  },
  minigame_champion: {
    id: 'minigame_champion',
    name: 'Campeão Familiar',
    description: 'Ganha 10 mini-jogos',
    icon: Trophy,
    color: 'from-yellow-400 to-amber-600',
    category: 'social',
    rarity: 'rare',
    xpReward: 200,
    coinsReward: 400,
    check: (stats) => stats.minigamesWon >= 10
  },

  // Conquistas de Recursos
  rich_100: {
    id: 'rich_100',
    name: 'Poupador',
    description: 'Junta 100 Qu€sts',
    icon: Coins,
    color: 'from-yellow-400 to-yellow-600',
    category: 'resources',
    rarity: 'common',
    xpReward: 10,
    coinsReward: 0,
    check: (stats) => stats.totalCoinsEarned >= 100
  },
  rich_1000: {
    id: 'rich_1000',
    name: 'Tesouro',
    description: 'Junta 1000 Qu€sts',
    icon: Coins,
    color: 'from-amber-400 to-orange-500',
    category: 'resources',
    rarity: 'uncommon',
    xpReward: 50,
    coinsReward: 0,
    check: (stats) => stats.totalCoinsEarned >= 1000
  },
  rich_10000: {
    id: 'rich_10000',
    name: 'Milionário',
    description: 'Junta 10000 Qu€sts',
    icon: Diamond,
    color: 'from-cyan-400 to-[hsl(24,70%,42%)]',
    category: 'resources',
    rarity: 'epic',
    xpReward: 200,
    coinsReward: 0,
    check: (stats) => stats.totalCoinsEarned >= 10000
  },
  xp_500: {
    id: 'xp_500',
    name: 'Estudante Dedicado',
    description: 'Ganha 500 XP',
    icon: Star,
    color: 'from-purple-400 to-violet-500',
    category: 'resources',
    rarity: 'uncommon',
    xpReward: 0,
    coinsReward: 100,
    check: (stats) => stats.totalXp >= 500
  },
  xp_5000: {
    id: 'xp_5000',
    name: 'Veterano',
    description: 'Ganha 5000 XP',
    icon: Award,
    color: 'from-indigo-500 to-purple-600',
    category: 'resources',
    rarity: 'epic',
    xpReward: 0,
    coinsReward: 500,
    check: (stats) => stats.totalXp >= 5000
  }
};

// Categorias de conquistas
export const ACHIEVEMENT_CATEGORIES = {
  quiz: { name: 'Quizzes', icon: Book, color: 'text-[hsl(35,92%,45%)]' },
  city: { name: 'Cidade', icon: Building2, color: 'text-amber-500' },
  social: { name: 'Social', icon: Users, color: 'text-[hsl(340,60%,55%)]' },
  resources: { name: 'Recursos', icon: Coins, color: 'text-yellow-500' }
};

// Raridades
export const RARITY_CONFIG = {
  common: { name: 'Comum', color: 'from-slate-400 to-slate-500', border: 'border-slate-300' },
  uncommon: { name: 'Incomum', color: 'from-[hsl(38,95%,60%)] to-[hsl(28,80%,38%)]', border: 'border-[hsl(38,95%,60%)]' },
  rare: { name: 'Raro', color: 'from-[hsl(35,92%,60%)] to-[hsl(28,85%,38%)]', border: 'border-[hsl(35,60%,60%)]' },
  epic: { name: 'Épico', color: 'from-purple-400 to-purple-600', border: 'border-purple-400' },
  legendary: { name: 'Lendário', color: 'from-yellow-400 to-amber-500', border: 'border-yellow-400' }
};

// Componente de Badge de Conquista
export const AchievementBadge = ({ achievement, unlocked, size = 'md', showDetails = true }) => {
  const Icon = achievement.icon;
  const rarity = RARITY_CONFIG[achievement.rarity];

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const iconSizes = { sm: 20, md: 28, lg: 36, xl: 44 };

  return (
    <div className={`relative ${unlocked ? '' : 'opacity-50 grayscale'}`}>
      <div
        className={`${sizeClasses[size]} rounded-2xl bg-gradient-to-br ${achievement.color} flex items-center justify-center shadow-lg border-2 ${rarity.border} ${
          unlocked ? 'animate-pulse-slow' : ''
        }`}
        title={achievement.name}
      >
        <Icon className="text-white" size={iconSizes[size]} />

        {!unlocked && (
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center">
            <Lock className="text-white/80" size={iconSizes[size] / 2} />
          </div>
        )}
      </div>

      {showDetails && (
        <div className="mt-2 text-center">
          <p className={`text-xs font-bold ${unlocked ? 'text-slate-700' : 'text-slate-400'}`}>
            {achievement.name}
          </p>
          <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${rarity.color} text-white`}>
            {rarity.name}
          </span>
        </div>
      )}
    </div>
  );
};

// Componente de Lista de Conquistas
export const AchievementsList = ({ stats: rawStats, unlockedIds = [] }) => {
  const [selectedCategory, setSelectedCategory] = React.useState('all');

  // Garante que todas as métricas existem — evita ecrã em branco se dados ainda não chegaram
  const stats = {
    quizzesCompleted: 0, perfectQuizzes: 0, longestStreak: 0,
    totalBuildingLevel: 0, allBuildingsLevel1: false, settlementLevel: 'village',
    maxLevelBuildings: 0, friendsCount: 0, minigamesPlayed: 0, minigamesWon: 0,
    totalCoinsEarned: 0, totalXp: 0,
    ...(rawStats || {}),
  };

  const filteredAchievements = Object.values(ACHIEVEMENTS).filter(a =>
    selectedCategory === 'all' || a.category === selectedCategory
  );

  const unlockedCount = Object.values(ACHIEVEMENTS).filter(a =>
    unlockedIds.includes(a.id) || a.check(stats)
  ).length;

  return (
    <div>
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-purple-500 to-[hsl(24,70%,42%)] rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
              <Trophy className="inline mr-2" size={28} />
              Conquistas
            </h2>
            <p className="text-white/80 text-sm">Desbloqueia badges e ganha recompensas!</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{unlockedCount}/{Object.keys(ACHIEVEMENTS).length}</p>
            <p className="text-xs text-white/80">Desbloqueadas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-white/20 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all"
            style={{ width: `${(unlockedCount / Object.keys(ACHIEVEMENTS).length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-purple-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Todas
        </button>
        {Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, cat]) => {
          const CatIcon = cat.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition flex items-center gap-2 ${
                selectedCategory === key
                  ? 'bg-purple-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CatIcon size={16} />
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAchievements.map(achievement => {
          const isUnlocked = unlockedIds.includes(achievement.id) || achievement.check(stats);

          return (
            <div
              key={achievement.id}
              className={`bg-white rounded-2xl p-4 shadow-lg transition-all ${
                isUnlocked ? 'border-2 border-yellow-400' : 'border border-slate-200 opacity-70'
              }`}
            >
              <div className="flex justify-center mb-3">
                <AchievementBadge
                  achievement={achievement}
                  unlocked={isUnlocked}
                  size="md"
                  showDetails={false}
                />
              </div>

              <h4 className="font-bold text-slate-800 text-center text-sm mb-1">
                {achievement.name}
              </h4>

              <p className="text-xs text-slate-500 text-center mb-2">
                {achievement.description}
              </p>

              {isUnlocked ? (
                <div className="text-center">
                  <span className="text-xs bg-[hsl(142,45%,88%)] text-[hsl(28,85%,32%)] px-2 py-1 rounded-full font-semibold">
                    ✓ Desbloqueado
                  </span>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400">
                  <span className="block">Recompensa:</span>
                  {achievement.xpReward > 0 && <span className="text-purple-500">+{achievement.xpReward} XP </span>}
                  {achievement.coinsReward > 0 && <span className="text-yellow-600">+{achievement.coinsReward} 💰</span>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Wrapper usado pelo painel do aluno: calcula estatísticas a partir do estado de jogo
// e da base de dados, com valores seguros enquanto os dados carregam.
const AchievementsSystem = ({ gameState, userId }) => {
  const [fetched, setFetched] = React.useState({ quizzesCompleted: 0, perfectQuizzes: 0, friendsCount: 0, minigamesPlayed: 0, minigamesWon: 0 });

  React.useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [answersRes, friendsRes, gamesRes] = await Promise.all([
          supabase.from('quiz_answers').select('quiz_id, correct').eq('user_id', userId),
          supabase.from('friendships').select('user1_id, user2_id').or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
          supabase.from('mini_game_scores').select('score, coins_won').eq('user_id', userId),
        ]);
        if (cancelled) return;
        const answers = answersRes.data || [];
        // Agrupa por quiz: um quiz está completo quando tem 10 respostas; perfeito quando todas corretas
        const byQuiz = {};
        answers.forEach(a => {
          if (!a.quiz_id) return;
          byQuiz[a.quiz_id] = byQuiz[a.quiz_id] || { total: 0, correct: 0 };
          byQuiz[a.quiz_id].total += 1;
          if (a.correct) byQuiz[a.quiz_id].correct += 1;
        });
        const quizzes = Object.values(byQuiz);
        const games = gamesRes.data || [];
        setFetched({
          quizzesCompleted: quizzes.filter(q => q.total >= 10).length || quizzes.length,
          perfectQuizzes: quizzes.filter(q => q.total >= 10 && q.correct === q.total).length,
          friendsCount: (friendsRes.data || []).length,
          minigamesPlayed: games.length,
          minigamesWon: games.filter(g => (g.coins_won || 0) > 0).length,
        });
      } catch {
        if (!cancelled) setFetched({ quizzesCompleted: 0, perfectQuizzes: 0, friendsCount: 0, minigamesPlayed: 0, minigamesWon: 0 });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [userId]);

  const buildings = gameState?.buildings || {};
  const placed = Object.values(buildings).filter(b => b && b.placed && (b.level || 0) > 0);
  const stats = {
    ...fetched,
    longestStreak: gameState?.longest_streak || 0,
    totalCoinsEarned: gameState?.coins || 0,
    totalXp: gameState?.xp || 0,
    settlementLevel: gameState?.settlement_level || 'village',
    totalBuildingLevel: placed.reduce((sum, b) => sum + (b.level || 0), 0),
    allBuildingsLevel1: placed.length > 0 && placed.every(b => (b.level || 0) >= 1),
    maxLevelBuildings: placed.filter(b => (b.level || 0) >= 3).length,
  };

  return <AchievementsList stats={stats} />;
};

export default AchievementsSystem;
