import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Medal, School, Users, Crown, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const SchoolRanking = ({ studentProfile }) => {
  const { user, profile } = useAuth();
  const [scope, setScope] = useState('escola'); // escola | turma | nacional
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('school_rankings')
          .select('*')
          .order('xp', { ascending: false })
          .limit(100);
        if (error) throw error;
        setRows(data || []);
      } catch (e) {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [user?.id]);

  const filtered = useMemo(() => {
    let list = rows;
    if (scope === 'escola' && studentProfile?.school_id) {
      list = list.filter(r => r.school_id === studentProfile.school_id);
    } else if (scope === 'turma' && studentProfile?.school_id && studentProfile?.class_name) {
      list = list.filter(r => r.school_id === studentProfile.school_id && r.class_name === studentProfile.class_name);
    }
    return list.slice(0, 20);
  }, [rows, scope, studentProfile]);

  const myRank = filtered.findIndex(r => r.user_id === user?.id);
  const medalFor = (i) => {
    if (i === 0) return '🥇';
    if (i === 1) return '🥈';
    if (i === 2) return '🥉';
    return `${i + 1}º`;
  };

  const scopeOptions = [
    { id: 'turma', label: 'A Minha Turma', icon: Users, needs: studentProfile?.class_name },
    { id: 'escola', label: 'A Minha Escola', icon: School, needs: studentProfile?.school_id },
    { id: 'nacional', label: 'Nacional', icon: Crown, needs: true },
  ].filter(o => o.needs);

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-2xl">
            <Trophy size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Classificações</h2>
            <p className="text-white/80 text-sm">
              {scope === 'turma' && studentProfile?.class_name ? `Turma ${studentProfile.class_name}` :
               scope === 'escola' && studentProfile?.school_name ? studentProfile.school_name :
               'Top jogadores de todo o país'}
            </p>
          </div>
        </div>
        {myRank >= 0 && myRank < 20 && (
          <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center gap-2">
            <TrendingUp size={18} />
            <span className="font-bold text-sm">Estás em {medalFor(myRank)} lugar com {filtered[myRank]?.xp || 0} XP!</span>
          </div>
        )}
      </div>

      <div className="flex border-b">
        {scopeOptions.map(o => (
          <button
            key={o.id}
            onClick={() => setScope(o.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-semibold text-sm transition ${
              scope === o.id ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <o.icon size={16} />
            {o.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-orange-400 border-t-transparent mx-auto" />
            <p className="text-slate-400 text-sm mt-3">A carregar classificações...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <Medal className="text-slate-300 mx-auto mb-2" size={40} />
            <p className="text-slate-500 text-sm">
              {scope === 'nacional'
                ? 'Ainda não há jogadores classificados. Sê o primeiro!'
                : 'A tua turma/escola ainda não tem jogadores aqui. Convida os teus colegas!'}
            </p>
            {scope !== 'nacional' && (
              <p className="text-slate-400 text-xs mt-2">
                Dica: define a tua turma e escola nas definições para entrares nas classificações.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filtered.map((r, i) => (
              <div
                key={r.user_id}
                className={`flex items-center justify-between p-3 rounded-xl transition ${
                  r.user_id === user?.id
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-400'
                    : 'bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold w-10 text-center ${i < 3 ? '' : 'text-slate-500'}`}>
                    {medalFor(i)}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">
                      {r.name}
                      {r.user_id === user?.id && <span className="text-amber-600 ml-1 text-xs">(tu)</span>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {r.class_name ? `Turma ${r.class_name} · ` : ''}{r.school_name || 'Escola não definida'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-purple-600 text-sm">{r.xp || 0} XP</p>
                  <p className="text-xs text-amber-600">Nv.{r.level || 1}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolRanking;
