import React, { useState, useEffect } from 'react';
import { Swords, Clock, Send, X, Trophy, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const DuelSubjects = [
  { id: 'matematica', name: 'Matemática' },
  { id: 'portugues', name: 'Português' },
  { id: 'estudo_meio', name: 'Estudo do Meio' },
  { id: 'ciencias', name: 'Ciências' },
  { id: 'historia', name: 'História' },
];

const DuelGame = ({ duel, onExit, onFinished }) => {
  const { user } = useAuth();
  const questions = React.useMemo(() => {
    let raw = duel.questions;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = []; }
    }
    return (Array.isArray(raw) ? raw : []).filter(
      q => q && q.question && Array.isArray(q.options) && q.options.length >= 2 && Number.isInteger(q.correct_answer)
    );
  }, [duel.id]);
  const isChallenger = duel.challenger_id === user?.id;
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState(null);
  const [startTime] = useState(Date.now());
  const [done, setDone] = useState(false);

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <Swords className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Duelo indisponível
        </h3>
        <p className="text-slate-500 mb-4">Este duelo não tem perguntas válidas. Pede ao criador para enviar um novo desafio.</p>
        <button onClick={onExit} className="mt-2 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">Voltar</button>
      </div>
    );
  }

  const finish = async (finalScore) => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    setDone(true);
    try {
      const updates = isChallenger
        ? { challenger_score: finalScore, challenger_time: elapsed, status: 'finished' }
        : { opponent_score: finalScore, opponent_time: elapsed, status: 'finished' };

      // Buscar estado atual para calcular vencedor
      const { data: current } = await supabase
        .from('quiz_duels')
        .select('*')
        .eq('id', duel.id)
        .single();

      const myScore = finalScore;
      const myTime = elapsed;
      const oppScore = isChallenger ? current?.opponent_score : current?.challenger_score;
      const oppTime = isChallenger ? current?.opponent_time : current?.challenger_time;

      let winnerId = null;
      if (oppScore === null || oppScore === undefined) {
        winnerId = null; // adversário ainda não jogou
        updates.status = isChallenger ? 'active' : 'finished';
      } else if (myScore > oppScore) winnerId = user.id;
      else if (myScore < oppScore) winnerId = isChallenger ? duel.opponent_id : duel.challenger_id;
      else winnerId = myTime <= (oppTime ?? Infinity) ? user.id : (isChallenger ? duel.opponent_id : duel.challenger_id);

      if (winnerId) {
        updates.winner_id = winnerId;
        updates.finished_at = new Date().toISOString();
      }

      await supabase.from('quiz_duels').update(updates).eq('id', duel.id);

      // Notifica o adversário
      await supabase.from('notifications').insert({
        user_id: isChallenger ? duel.opponent_id : duel.challenger_id,
        type: 'duel',
        title: 'Duelo de Quiz',
        message: `${duel.challenger_name} terminou o duelo de ${DuelSubjects.find(s => s.id === duel.subject)?.name || duel.subject} com ${myScore}/10 corretas!`,
      });

      // Prémio de 50 moedas ao vencedor
      if (winnerId === user.id) {
        const { data: gs } = await supabase.from('game_states').select('coins').eq('user_id', user.id).single();
        if (gs) await supabase.from('game_states').update({ coins: gs.coins + 50 }).eq('user_id', user.id);
      }
    } catch (e) { /* ignore */ }
    onFinished?.();
  };

  const answer = (i) => {
    if (answered) return;
    setAnswered(true);
    setPicked(i);
    const isRight = i === questions[idx].correct_answer;
    const newCorrect = isRight ? correct + 1 : correct;
    if (isRight) setCorrect(newCorrect);
    setTimeout(() => {
      if (idx < questions.length - 1) {
        setIdx(idx + 1);
        setAnswered(false);
        setPicked(null);
      } else {
        finish(newCorrect);
      }
    }, 900);
  };

  if (done) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          Duelo concluído!
        </h3>
        <p className="text-slate-500 mb-4">Acertaste <strong>{correct}</strong> de {questions.length} perguntas.</p>
        <p className="text-sm text-slate-400">O resultado final será revelado quando o adversário também jogar.</p>
        <button onClick={onExit} className="mt-4 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">Voltar</button>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <Swords className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 mb-4">Pergunta indisponível. Voltando ao duelos…</p>
        <button onClick={onExit} className="px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">Voltar</button>
      </div>
    );
  }
  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="bg-red-100 px-4 py-2 rounded-xl">
          <span className="text-sm text-red-600 font-bold">⚔️ Duelo · Pergunta {idx + 1}/{questions.length}</span>
        </div>
        <div className="bg-[hsl(142,45%,88%)] px-4 py-2 rounded-xl">
          <span className="text-sm text-green-700 font-bold">{correct} corretas</span>
        </div>
      </div>
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl p-6 text-white text-center mb-4">
        <p className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{q.question}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          let cls = 'bg-white border-2 border-slate-200 hover:border-red-400';
          if (answered) {
            if (i === q.correct_answer) cls = 'bg-[hsl(142,45%,88%)] border-2 border-[hsl(35,92%,50%)]';
            else if (i === picked) cls = 'bg-red-100 border-2 border-red-500';
            else cls = 'bg-slate-100 border-2 border-slate-200 opacity-50';
          }
          return (
            <button key={i} onClick={() => answer(i)} disabled={answered} className={`p-4 rounded-xl font-medium transition ${cls}`}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const QuizDuels = ({ friends, onRefresh }) => {
  const { user, profile } = useAuth();
  const [duels, setDuels] = useState([]);
  const [mode, setMode] = useState('list'); // list | create | play
  const [activeDuel, setActiveDuel] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [subject, setSubject] = useState('matematica');
  const [creating, setCreating] = useState(false);

  const fetchDuels = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('quiz_duels')
        .select('*')
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setDuels(data || []);
    } catch (e) {
      setDuels([]);
    }
  };

  useEffect(() => {
    fetchDuels();
    const interval = setInterval(fetchDuels, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const createDuel = async () => {
    if (!selectedFriend) return;
    setCreating(true);
    try {
      // Busca 10 perguntas do tema para o ano do aluno
      const year = localStorage.getItem('questeduca_school_year') || '5';
      let { data: pool } = await supabase
        .from('quiz_questions')
        .select('id, question, options, correct_answer, school_year')
        .eq('subject', subject)
        .eq('school_year', year)
        .limit(40);
      if (!pool || pool.length < 10) {
        const { data: fallback } = await supabase
          .from('quiz_questions')
          .select('id, question, options, correct_answer, school_year')
          .eq('subject', subject)
          .limit(40);
        pool = fallback || [];
      }
      if (!pool || pool.length < 10) {
        toast.error('Ainda não há perguntas suficientes para este tema. Escolhe outro!');
        return;
      }
      const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, 10)
        .map(q => ({ id: q.id, question: q.question, options: q.options, correct_answer: q.correct_answer }));

      const { data: duel, error } = await supabase
        .from('quiz_duels')
        .insert({
          challenger_id: user.id,
          opponent_id: selectedFriend.friend_id,
          challenger_name: profile?.name || 'Desafiante',
          opponent_name: selectedFriend.name,
          subject,
          school_year: year,
          questions: chosen,
          status: 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: selectedFriend.friend_id,
        type: 'duel',
        title: 'Novo Desafio!',
        message: `${profile?.name || 'Um amigo'} desafiou-te para um duelo de ${DuelSubjects.find(s => s.id === subject)?.name}!`,
      });

      toast.success(`Desafio enviado para ${selectedFriend.name}!`);
      setMode('list');
      fetchDuels();
    } catch (e) {
      toast.error('Não foi possível criar o desafio.');
    } finally {
      setCreating(false);
    }
  };

  const canPlay = (duel) => {
    if (duel.status === 'finished') return false;
    if (duel.challenger_id === user.id) {
      return duel.challenger_score === null || duel.challenger_score === undefined;
    }
    return true; // oponente pode aceitar jogando
  };

  const pendingIncoming = duels.filter(d => d.opponent_id === user.id && d.status !== 'finished' && (d.opponent_score === null || d.opponent_score === undefined));
  const myActive = duels.filter(d => d.status !== 'finished');

  if (mode === 'play' && activeDuel) {
    return <DuelGame duel={activeDuel} onExit={() => { setMode('list'); setActiveDuel(null); fetchDuels(); onRefresh?.(); }} onFinished={() => { fetchDuels(); onRefresh?.(); }} />;
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl">
              <Swords size={26} />
            </div>
            <div>
              <h3 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Duelos de Conhecimento</h3>
              <p className="text-white/80 text-sm">Desafia um amigo: as mesmas 10 perguntas, quem acerta mais vence 50 moedas!</p>
            </div>
          </div>
          <button
            onClick={() => setMode(mode === 'create' ? 'list' : 'create')}
            className="px-4 py-2 bg-white/25 hover:bg-white/40 rounded-xl font-bold text-sm transition"
          >
            {mode === 'create' ? 'Ver duelos' : '+ Novo Duelo'}
          </button>
        </div>
      </div>

      <div className="p-5">
        {mode === 'create' ? (
          <div className="space-y-4">
            <div>
              <p className="font-bold text-slate-700 text-sm mb-2">1. Escolhe o tema:</p>
              <div className="flex flex-wrap gap-2">
                {DuelSubjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSubject(s.id)}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm transition ${
                      subject === s.id ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-700 text-sm mb-2">2. Escolhe o adversário:</p>
              {friends && friends.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {friends.map(f => (
                    <button
                      key={f.friend_id}
                      onClick={() => setSelectedFriend(f)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                        selectedFriend?.friend_id === f.friend_id ? 'bg-orange-100 border-2 border-orange-400' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-semibold text-slate-800">{f.name}</span>
                      {selectedFriend?.friend_id === f.friend_id && <CheckCircle2 className="text-orange-500" size={18} />}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm bg-slate-50 rounded-xl p-4 text-center">Adiciona amigos primeiro para poderes desafiá-los!</p>
              )}
            </div>
            <button
              onClick={createDuel}
              disabled={!selectedFriend || creating}
              className="w-full py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {creating ? 'A preparar as perguntas...' : selectedFriend ? `Desafiar ${selectedFriend.name}!` : 'Escolhe um adversário'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {myActive.length === 0 ? (
              <div className="text-center py-6">
                <Swords className="text-slate-300 mx-auto mb-2" size={40} />
                <p className="text-slate-500 text-sm">Ainda não há duelos. Cria o primeiro desafio!</p>
              </div>
            ) : (
              myActive.map(d => {
                const isChallenger = d.challenger_id === user.id;
                const iPlayed = isChallenger ? d.challenger_score !== null : d.opponent_score !== null;
                const oppPlayed = isChallenger ? d.opponent_score !== null : d.challenger_score !== null;
                return (
                  <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        {isChallenger ? `Tu desafiaste ${d.opponent_name || 'um amigo'}` : `${d.challenger_name} desafiou-te`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {DuelSubjects.find(s => s.id === d.subject)?.name || d.subject} ·{' '}
                        {!oppPlayed ? 'À espera do adversário jogar' : iPlayed ? 'Ambos jogaram — resultado a calcular' : 'É a tua vez!'}
                      </p>
                    </div>
                    {canPlay(d) ? (
                      <button
                        onClick={() => { setActiveDuel(d); setMode('play'); }}
                        className={`px-4 py-2 rounded-xl font-bold text-sm text-white transition ${iPlayed ? 'bg-slate-400' : 'bg-red-500 hover:bg-red-600'}`}
                      >
                        {iPlayed ? 'Já jogaste' : isChallenger ? 'Jogar' : 'Aceitar e Jogar'}
                      </button>
                    ) : (
                      <span className="text-xs text-[hsl(28,85%,40%)] font-bold">Concluído</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizDuels;
