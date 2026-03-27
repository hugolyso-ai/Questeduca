import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal, Star, Clock, ChevronUp, Award, Sparkles, TrendingUp } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente de posição no pódio
const PodiumPosition = ({ entry, position }) => {
  const colors = {
    1: 'from-yellow-400 to-amber-500',
    2: 'from-slate-300 to-slate-400',
    3: 'from-amber-600 to-orange-700'
  };
  
  const heights = { 1: 'h-32', 2: 'h-24', 3: 'h-20' };
  const icons = { 1: Crown, 2: Medal, 3: Award };
  const Icon = icons[position];
  
  return (
    <div className={`flex flex-col items-center ${position === 1 ? 'order-2' : position === 2 ? 'order-1' : 'order-3'}`}>
      {/* Avatar */}
      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[position]} flex items-center justify-center text-white text-2xl font-bold mb-2 shadow-lg border-4 border-white`}>
        {entry?.nickname?.[0]?.toUpperCase() || '?'}
      </div>
      
      {/* Nome e XP */}
      <p className="font-bold text-slate-800 text-center text-sm truncate max-w-20">
        {entry?.nickname || `#${position}`}
      </p>
      <p className="text-xs text-purple-600 font-semibold">
        {entry?.xp_earned || 0} XP
      </p>
      
      {/* Pódio */}
      <div className={`${heights[position]} w-20 bg-gradient-to-t ${colors[position]} rounded-t-xl mt-2 flex items-center justify-center shadow-lg`}>
        <Icon className="text-white" size={28} />
      </div>
    </div>
  );
};

// Componente principal de Ligas
const MonthlyLeagues = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeague = async () => {
      try {
        const response = await axios.get(`${API}/leagues/current`, { withCredentials: true });
        setLeagueData(response.data);
      } catch (error) {
        console.error('Error fetching league:', error);
        // Fallback data for demo
        setLeagueData({
          league_id: '2026-03',
          month_name: 'Março 2026',
          days_left: 4,
          user_stats: {
            rank: 5,
            xp_earned: 850,
            nickname: 'Jogador'
          },
          top_10: [
            { rank: 1, nickname: 'SuperStar', xp_earned: 2500, school_name: 'Escola ABC' },
            { rank: 2, nickname: 'MegaMind', xp_earned: 2100, school_name: 'Escola XYZ' },
            { rank: 3, nickname: 'BrainPower', xp_earned: 1800, school_name: 'Escola 123' },
            { rank: 4, nickname: 'QuizMaster', xp_earned: 1500, school_name: 'Escola DEF' },
            { rank: 5, nickname: 'Estudioso', xp_earned: 850, school_name: 'Escola GHI' },
          ],
          rewards: {
            '1st': { diamonds: 100, badge: 'league_champion' },
            '2nd': { diamonds: 50, badge: 'league_silver' },
            '3rd': { diamonds: 25, badge: 'league_bronze' },
            '4th-10th': { diamonds: 10, badge: null }
          }
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeague();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-slate-500">A carregar liga...</p>
      </div>
    );
  }

  if (!leagueData) return null;

  const top3 = leagueData.top_10.slice(0, 3);
  const rest = leagueData.top_10.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Trophy size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Liga Mensal
              </h2>
              <p className="text-white/80">{leagueData.month_name}</p>
            </div>
          </div>
          
          {/* Tempo restante */}
          <div className="text-right bg-white/20 px-4 py-2 rounded-xl">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              <Clock size={16} />
              Faltam
            </div>
            <p className="text-2xl font-bold">{leagueData.days_left} dias</p>
          </div>
        </div>

        {/* User position */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
                #{leagueData.user_stats.rank}
              </div>
              <div>
                <p className="font-semibold">A tua posição</p>
                <p className="text-white/80 text-sm">{leagueData.user_stats.xp_earned} XP este mês</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-yellow-300">
              <TrendingUp size={20} />
              <span className="font-bold">Top {Math.round((leagueData.user_stats.rank / leagueData.top_10.length) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pódio */}
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          <Sparkles className="inline mr-2 text-yellow-500" size={24} />
          Top 3 do Mês
        </h3>
        
        <div className="flex justify-center items-end gap-4 mb-6">
          {[2, 1, 3].map(pos => (
            <PodiumPosition
              key={pos}
              position={pos}
              entry={top3[pos - 1]}
            />
          ))}
        </div>
      </div>

      {/* Resto do ranking */}
      {rest.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Classificação 4º - 10º
            </h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {rest.map(entry => (
              <div
                key={entry.rank}
                className={`flex items-center gap-4 p-4 ${
                  entry.nickname === leagueData.user_stats.nickname ? 'bg-purple-50' : 'hover:bg-slate-50'
                } transition`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                  {entry.rank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {entry.nickname}
                    {entry.nickname === leagueData.user_stats.nickname && (
                      <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">Tu</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{entry.school_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600">{entry.xp_earned} XP</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recompensas */}
      <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-3xl p-6 border-2 border-amber-200">
        <h3 className="text-xl font-bold text-amber-800 mb-4 text-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          <Award className="inline mr-2" size={24} />
          Recompensas da Liga
        </h3>
        
        <div className="grid grid-cols-4 gap-3">
          {[
            { pos: '🥇 1º', diamonds: 100, badge: '🏆 Campeão' },
            { pos: '🥈 2º', diamonds: 50, badge: '🥈 Prata' },
            { pos: '🥉 3º', diamonds: 25, badge: '🥉 Bronze' },
            { pos: '4º-10º', diamonds: 10, badge: '-' },
          ].map((reward, i) => (
            <div key={i} className="bg-white rounded-xl p-3 text-center shadow-sm">
              <p className="font-bold text-amber-700 text-sm">{reward.pos}</p>
              <p className="text-cyan-600 font-bold">{reward.diamonds} 💎</p>
              <p className="text-xs text-slate-500">{reward.badge}</p>
            </div>
          ))}
        </div>
        
        <p className="text-center text-amber-700 text-sm mt-4">
          Ganha XP para subir no ranking e receber recompensas exclusivas no fim do mês!
        </p>
      </div>
    </div>
  );
};

export default MonthlyLeagues;
