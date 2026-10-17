import React, { useState, useEffect } from 'react';
import { Target, Zap, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const SUBJECT_NAMES = {
  matematica: 'Matemática',
  portugues: 'Português',
  estudo_meio: 'Estudo do Meio',
  historia: 'História',
  geografia: 'Geografia',
  ciencias: 'Ciências',
  ingles: 'Inglês',
};

// Missão curricular da semana: determinística por semana ISO
// (todos os alunos do país têm a mesma disciplina-alvo na mesma semana)
const getWeekMission = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), 0, 1));
  const week = Math.ceil((((now - start) / 86400000) + start.getUTCDay() + 1) / 7);
  const subjects = Object.keys(SUBJECT_NAMES);
  const subject = subjects[week % subjects.length];
  const target = 3 + (week % 3); // 3 a 5 quizzes
  return { subject, target, week };
};

const WeeklyCurricularMission = ({ refreshKey }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [claimed, setClaimed] = useState(false);
  const [loading, setLoading] = useState(true);
  const mission = getWeekMission();

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) { setLoading(false); return; }
      setLoading(true);
      try {
        // Início da semana (segunda-feira)
        const now = new Date();
        const monday = new Date(now);
        const day = now.getDay() === 0 ? 7 : now.getDay();
        monday.setDate(now.getDate() - (day - 1));
        monday.setHours(0, 0, 0, 0);

        const { data: answers, error } = await supabase
          .from('quiz_answers')
          .select('quiz_id, created_at')
          .eq('user_id', user.id)
          .eq('subject', mission.subject)
          .gte('created_at', monday.toISOString());
        if (error) throw error;
        const distinctQuizzes = new Set((answers || []).map(a => a.quiz_id));
        setProgress(distinctQuizzes.size);

        const { data: claimedRow } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'mission_claimed')
          .gte('created_at', monday.toISOString())
          .limit(1);
        setClaimed((claimedRow || []).length > 0);
      } catch (e) {
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user?.id, refreshKey]);

  const complete = progress >= mission.target;

  const claimReward = async () => {
    if (!user || claimed || !complete) return;
    try {
      const { data: gs } = await supabase.from('game_states').select('coins, diamonds').eq('user_id', user.id).single();
      if (gs) {
        await supabase.from('game_states').update({
          coins: gs.coins + 200,
          diamonds: gs.diamonds + 10,
        }).eq('user_id', user.id);
      }
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'mission_claimed',
        title: 'Missão Curricular',
        message: `Missão de ${SUBJECT_NAMES[mission.subject]} da semana resgatada!`,
      });
      setClaimed(true);
    } catch (e) { /* ignore */ }
  };

  if (loading) return null;

  return (
    <div className={`rounded-3xl shadow-xl overflow-hidden border-2 ${complete && !claimed ? 'border-yellow-400 animate-pulse' : 'border-transparent'}`}>
      <div className="bg-gradient-to-r from-indigo-600 via-[hsl(28,85%,40%)] to-cyan-600 p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Target size={26} />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
                Missão Curricular da Semana
              </h3>
              <p className="text-white/85 text-sm">
                Completa <strong>{mission.target} quizzes de {SUBJECT_NAMES[mission.subject]}</strong> até domingo!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/15 px-4 py-2 rounded-xl font-bold text-sm">
            <Zap size={16} />
            Recompensa: 200 moedas + 10 diamantes
          </div>
        </div>
      </div>
      <div className="bg-white p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 font-medium">{Math.min(progress, mission.target)} / {mission.target} quizzes</span>
            <span className="text-slate-400">{Math.min(Math.round((progress / mission.target) * 100), 100)}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
              style={{ width: `${Math.min((progress / mission.target) * 100, 100)}%` }}
            />
          </div>
        </div>
        {claimed ? (
          <span className="flex items-center gap-2 text-[hsl(28,85%,40%)] font-bold text-sm px-4 py-2 bg-[hsl(38,80%,93%)] rounded-xl">
            <CheckCircle size={18} /> Missão resgatada!
          </span>
        ) : complete ? (
          <button
            onClick={claimReward}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Resgatar recompensa!
          </button>
        ) : (
          <span className="text-slate-400 text-sm">Faltam {mission.target - progress} quizzes</span>
        )}
      </div>
    </div>
  );
};

export default WeeklyCurricularMission;
