import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SUBJECT_LABELS = {
  matematica: 'Matemática',
  portugues: 'Português',
  estudo_meio: 'Estudo do Meio',
  historia: 'História',
  geografia: 'Geografia',
  ciencias: 'Ciências',
  ingles: 'Inglês',
};

const DiagnosisPanel = ({ userId }) => {
  const [bySubject, setBySubject] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const analyze = async () => {
      if (!userId) { setLoading(false); return; }
      try {
        // Últimas 300 respostas agrupadas por disciplina
        const { data: answers, error } = await supabase
          .from('quiz_answers')
          .select('subject, correct')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(300);
        if (error) throw error;

        const stats = {};
        (answers || []).forEach(a => {
          const s = a.subject || 'outro';
          if (!stats[s]) stats[s] = { total: 0, correct: 0 };
          stats[s].total += 1;
          if (a.correct) stats[s].correct += 1;
        });

        const list = Object.entries(stats).map(([subject, s]) => ({
          subject,
          pct: Math.round((s.correct / s.total) * 100),
          total: s.total,
        })).sort((a, b) => a.pct - b.pct);

        setBySubject(list);
      } catch (e) {
        setBySubject([]);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, [userId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
        <div className="w-8 h-8 border-4 border-[hsl(35,60%,60%)] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (bySubject.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
        <Brain className="mx-auto text-slate-300 mb-3" size={40} />
        <p className="text-slate-500 text-sm">
          Ainda sem dados suficientes. O diagnóstico aparece automaticamente após os primeiros quizzes.
        </p>
      </div>
    );
  }

  const weakest = bySubject[0];
  const strongest = bySubject[bySubject.length - 1];

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[hsl(35,92%,50%)] to-indigo-600 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Brain size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Diagnóstico de Aprendizagem</h3>
            <p className="text-white/80 text-xs">Pontos fortes e áreas a reforçar, com base nas últimas 300 respostas</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {bySubject.map(({ subject, pct, total }) => {
          const color = pct >= 70 ? 'bg-[hsl(35,92%,50%)]' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
          const Icon = pct >= 70 ? TrendingUp : pct >= 40 ? TrendingDown : AlertTriangle;
          const label = SUBJECT_LABELS[subject] || subject;
          return (
            <div key={subject} className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pct >= 70 ? 'bg-[hsl(142,45%,88%)]' : pct >= 40 ? 'bg-amber-100' : 'bg-red-100'}`}>
                <Icon size={16} className={pct >= 70 ? 'text-[hsl(28,85%,40%)]' : pct >= 40 ? 'text-amber-600' : 'text-red-600'} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-0.5">
                  <span className="font-semibold text-slate-700">{label}</span>
                  <span className="text-slate-500">{pct}% · {total} respostas</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          );
        })}

        {bySubject.length >= 2 && (
          <div className="mt-4 bg-[hsl(38,80%,93%)] border border-[hsl(200,55%,80%)] rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="text-[hsl(35,92%,45%)] flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-[hsl(28,85%,30%)]">
              <strong>Sugestão:</strong> {SUBJECT_LABELS[weakest.subject] || weakest.subject} é a área que precisa de mais
              apoio ({weakest.pct}% de acerto). {SUBJECT_LABELS[strongest.subject] || strongest.subject} é o ponto forte
              ({strongest.pct}%) — podes usá-lo para motivar: "Se dominares {SUBJECT_LABELS[weakest.subject] || weakest.subject},
              ficas imbatível!"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisPanel;
