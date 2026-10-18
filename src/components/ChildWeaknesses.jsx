import React, { useState, useEffect, useCallback } from 'react';
import { Target, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUBJECT_NAMES = {
  matematica: { name: 'Matemática', color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700' },
  portugues: { name: 'Português', color: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700' },
  ciencias: { name: 'Ciências', color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' },
  estudo_meio: { name: 'Estudo do Meio', color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' },
  historia: { name: 'História', color: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700' },
  geografia: { name: 'Geografia', color: 'bg-teal-500', light: 'bg-teal-50', text: 'text-teal-700' },
  ingles: { name: 'Inglês', color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700' },
};

const metaFor = (subject) => SUBJECT_NAMES[subject] || { name: subject, color: 'bg-slate-500', light: 'bg-slate-50', text: 'text-slate-700' };

const pct = (accuracy) => (accuracy === null || accuracy === undefined ? null : Math.round(accuracy * 100));

/**
 * Painel "Onde o meu filho erra mais": precisão por disciplina,
 * com destaque para as disciplinas com mais dificuldade.
 */
const ChildWeaknesses = ({ children }) => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (children && children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  const fetchStats = useCallback(async (childId) => {
    if (!childId) { setStats([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_parent_weaknesses', { p_student: childId });
      if (rpcError) throw rpcError;
      setStats(data || []);
    } catch (e) {
      setError('Não foi possível carregar o relatório.');
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedChild) fetchStats(selectedChild.user_id);
  }, [selectedChild, fetchStats]);

  if (!children || children.length === 0) return null;

  const weakest = [...stats]
    .filter(s => pct(s.accuracy) !== null && pct(s.accuracy) < 60)
    .sort((a, b) => pct(a.accuracy) - pct(b.accuracy));

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-1">
        <Target className="text-[hsl(35,92%,45%)]" size={22} />
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Onde Erra Mais</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Desempenho por disciplina nas respostas ao quiz. Verde = boa precisão, vermelho = precisa de apoio.
      </p>

      {/* Escolha do filho */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {children.map(c => (
            <button
              key={c.user_id}
              onClick={() => setSelectedChild(c)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition border-2 ${
                selectedChild?.user_id === c.user_id
                  ? 'bg-amber-50 border-amber-400 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
              }`}
              data-testid={`weak-child-${c.user_id}`}
            >
              {c.nickname}
            </button>
          ))}
        </div>
      )}

      {loading && <p className="text-xs text-slate-400 py-4">A carregar relatório...</p>}
      {error && <p className="text-sm text-red-500 py-2">{error}</p>}

      {!loading && !error && stats.length === 0 && selectedChild && (
        <div className="text-center py-8">
          <BookOpen className="mx-auto text-slate-200 mb-3" size={44} />
          <p className="text-sm text-slate-400">
            {selectedChild.nickname} ainda não respondeu a nenhum quiz.
          </p>
        </div>
      )}

      {!loading && !error && stats.length > 0 && (
        <div className="space-y-3">
          {weakest.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4" data-testid="weakest-summary">
              <p className="text-sm font-bold text-red-700 flex items-center gap-2 mb-1">
                <TrendingDown size={16} /> A pedir atenção
              </p>
              <p className="text-xs text-red-600">
                {weakest.map(w => metaFor(w.subject).name).join(', ')} — abaixo de 60% de acertos. Vale a pena rever estes temas em conjunto.
              </p>
            </div>
          )}

          {stats.map(s => {
            const meta = metaFor(s.subject);
            const p = pct(s.accuracy);
            const barColor = p === null ? 'bg-slate-300'
              : p >= 75 ? 'bg-emerald-500'
              : p >= 60 ? 'bg-amber-400'
              : 'bg-red-500';
            return (
              <div key={s.subject} className="flex items-center gap-3" data-testid={`weak-row-${s.subject}`}>
                <div className={`w-32 flex-shrink-0 px-2 py-1.5 rounded-lg ${meta.light} ${meta.text} text-xs font-bold text-center`}>
                  {meta.name}
                </div>
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${p ?? 0}%` }}
                  />
                </div>
                <div className="w-24 text-right flex-shrink-0">
                  <span className={`text-sm font-bold ${p !== null && p < 60 ? 'text-red-600' : 'text-slate-700'}`}>
                    {p !== null ? `${p}%` : '—'}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {s.total_answers} respostas
                  </span>
                </div>
              </div>
            );
          })}

          {weakest.length === 0 && stats.some(s => pct(s.accuracy) !== null && pct(s.accuracy) >= 60) && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mt-4">
              <p className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <TrendingUp size={16} /> Boa evolução!
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Nenhuma disciplina abaixo de 60% de acertos. Continua a incentivar!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChildWeaknesses;
