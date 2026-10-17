import React, { useState, useEffect } from 'react';
import { Flame, Gift, Trophy, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const DailyStreak = ({ onStreakUpdate }) => {
  const { user } = useAuth();
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    longest_streak: 0,
    bonus_available: false,
    next_bonus: 1,
    streak_active: false,
    streak_claimed_today: false
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchStreakStatus();
  }, [user]);

  const fetchStreakStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_states')
        .select('current_streak, longest_streak, streak_claimed_today, last_quiz_date, diamonds')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const lastQuizDate = data.last_quiz_date
          ? new Date(data.last_quiz_date).toISOString().split('T')[0]
          : null;

        const streakActive = lastQuizDate === today;
        const nextBonus = Math.max(1, 3 - (data.current_streak % 3));

        // Bonus available if streak is active (played today) and hasn't claimed today
        const bonusAvailable = streakActive && !data.streak_claimed_today && data.current_streak > 0;

        setStreakData({
          current_streak: data.current_streak || 0,
          longest_streak: data.longest_streak || 0,
          bonus_available: bonusAvailable,
          next_bonus: nextBonus,
          streak_active: streakActive,
          streak_claimed_today: data.streak_claimed_today || false
        });
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    if (claiming || !streakData.bonus_available || !user) return;

    setClaiming(true);
    try {
      // Award diamonds based on streak
      const diamondsToAward = streakData.next_bonus;

      const { data, error } = await supabase
        .from('game_states')
        .update({
          streak_claimed_today: true,
          diamonds: (await supabase
            .from('game_states')
            .select('diamonds')
            .eq('user_id', user.id)
            .single()
          ).data?.diamonds + diamondsToAward
        })
        .eq('user_id', user.id)
        .select('diamonds')
        .single();

      if (error) throw error;

      setShowCelebration(true);
      toast.success(`Bónus reclamado! +${diamondsToAward} 💎`, {
        icon: '💎',
        duration: 4000
      });

      // Update local state
      setStreakData(prev => ({
        ...prev,
        bonus_available: false,
        streak_claimed_today: true
      }));

      // Notify parent to refresh game state
      if (onStreakUpdate && data) {
        onStreakUpdate(data.diamonds);
      }

      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast.error('Erro ao reclamar bónus');
    } finally {
      setClaiming(false);
    }
  };

  // Calculate streak milestones
  const getMilestone = (streak) => {
    if (streak >= 30) return { label: 'Lenda', color: 'from-yellow-400 to-amber-500', emoji: '👑' };
    if (streak >= 14) return { label: 'Mestre', color: 'from-purple-400 to-purple-600', emoji: '🏆' };
    if (streak >= 7) return { label: 'Dedicado', color: 'from-[hsl(35,92%,60%)] to-[hsl(28,85%,38%)]', emoji: '⭐' };
    if (streak >= 3) return { label: 'Consistente', color: 'from-[hsl(38,95%,60%)] to-[hsl(28,80%,38%)]', emoji: '🔥' };
    return { label: 'Iniciante', color: 'from-slate-400 to-slate-500', emoji: '🌱' };
  };

  const milestone = getMilestone(streakData.current_streak);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="h-16 bg-slate-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Celebration animation */}
      {showCelebration && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`
              }}
            >
              💎
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg border border-orange-100 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${milestone.color} p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Flame size={28} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ fontFamily: 'Cinzel, serif' }}>
                  Streak Diário
                </h3>
                <p className="text-white/80 text-sm">
                  {milestone.emoji} {milestone.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
                {streakData.current_streak}
              </div>
              <div className="text-white/80 text-xs">dias seguidos</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Streak Progress */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-500">Próximo bónus em</span>
              <span className="text-sm font-semibold text-orange-600">
                {3 - (streakData.current_streak % 3)} {3 - (streakData.current_streak % 3) === 1 ? 'dia' : 'dias'}
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${milestone.color} transition-all duration-500`}
                style={{ width: `${(streakData.current_streak % 3) / 3 * 100}%` }}
              />
            </div>
          </div>

          {/* Streak Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <Trophy size={20} className="mx-auto text-amber-500 mb-1" />
              <div className="text-lg font-bold text-slate-800">{streakData.longest_streak}</div>
              <div className="text-xs text-slate-500">Recorde</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <Gift size={20} className="mx-auto text-purple-500 mb-1" />
              <div className="text-lg font-bold text-slate-800">{streakData.next_bonus}</div>
              <div className="text-xs text-slate-500">💎 Bónus</div>
            </div>
            <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
              <Calendar size={20} className="mx-auto text-[hsl(35,92%,45%)] mb-1" />
              <div className="text-lg font-bold text-slate-800">
                {streakData.streak_active ? '✓' : '—'}
              </div>
              <div className="text-xs text-slate-500">Hoje</div>
            </div>
          </div>

          {/* Milestone Progress */}
          <div className="mb-5">
            <p className="text-xs text-slate-500 mb-2">Marcos de Streak</p>
            <div className="flex gap-2">
              {[3, 7, 14, 30].map((days) => (
                <div
                  key={days}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    streakData.current_streak >= days
                      ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                      : 'bg-slate-200'
                  }`}
                  title={`${days} dias`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-slate-400">3d</span>
              <span className="text-[10px] text-slate-400">7d</span>
              <span className="text-[10px] text-slate-400">14d</span>
              <span className="text-[10px] text-slate-400">30d</span>
            </div>
          </div>

          {/* Claim Button */}
          {streakData.bonus_available ? (
            <button
              onClick={claimBonus}
              disabled={claiming}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
                claiming
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600'
              }`}
              data-testid="claim-streak-btn"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {claiming ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Sparkles size={20} />
                  Reclamar {streakData.next_bonus} 💎
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          ) : streakData.streak_claimed_today ? (
            <div className="w-full py-4 rounded-xl bg-[hsl(142,45%,88%)] text-[hsl(28,85%,32%)] font-semibold text-center flex items-center justify-center gap-2">
              <Check size={20} />
              Bónus reclamado hoje!
            </div>
          ) : (
            <div className="w-full py-4 rounded-xl bg-slate-100 text-slate-500 font-medium text-center">
              <p className="text-sm">Responde a um quiz para iniciar o teu streak!</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-orange-50 px-5 py-3 border-t border-orange-100">
          <p className="text-xs text-orange-600">
            <strong>💡 Dica:</strong> Responde a quizzes todos os dias para manter o streak e ganhar mais diamantes!
          </p>
        </div>
      </div>
    </div>
  );
};

// Check icon component for milestone completion
const Check = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default DailyStreak;
