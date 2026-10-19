import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Gamepad2, Swords, Trophy, X, Users, Sparkles, Play, Clock, Target, Coins
} from 'lucide-react'

// Batalha em família: pai + filho contra outra família. As pontuações são
// arbitrárias e simples (pontos obtidos num mini-jogo rápido), os prémios são
// creditados no servidor (funções create_family_battle / join_family_battle).
const BATTLE_WIN_COINS = 300
const BATTLE_LOSE_COINS = 80

const FamilyPlayPanel = ({ children: kids, onSelectChild }) => {
  const [tab, setTab] = useState('games')
  const [selectedChildId, setSelectedChildId] = useState(null)
  const [miniGame, setMiniGame] = useState(null)
  const [battleScore, setBattleScore] = useState(0)
  const [battleRounds, setBattleRounds] = useState(0)
  const [openBattles, setOpenBattles] = useState([])
  const [myBattles, setMyBattles] = useState([])
  const [childProfiles, setChildProfiles] = useState({})

  useEffect(() => {
    if (!kids?.length) return
    if (!selectedChildId || !kids.find(k => k.user_id === selectedChildId)) {
      setSelectedChildId(kids[0].user_id)
    }
  }, [kids])

  const loadBattles = useCallback(async () => {
    try {
      const { data: mine } = await supabase
        .from('family_battles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      const rows = mine || []
      setMyBattles(rows)
      setOpenBattles(rows.filter(b => b.status === 'open'))
    } catch {
      setMyBattles([])
      setOpenBattles([])
    }
  }, [])

  useEffect(() => { loadBattles() }, [loadBattles])

  // Nomes dos filhos envolvidos nas batalhas
  useEffect(() => {
    const ids = new Set()
    myBattles.forEach(b => {
      if (b.challenger_child_id) ids.add(b.challenger_child_id)
      if (b.opponent_child_id) ids.add(b.opponent_child_id)
    })
    if (ids.size === 0) return
    ;(async () => {
      const { data } = await supabase.from('student_profiles').select('user_id, nickname').in('user_id', [...ids])
      const map = {}
      ;(data || []).forEach(s => { map[s.user_id] = s.nickname })
      setChildProfiles(prev => ({ ...prev, ...map }))
    })()
  }, [myBattles])

  const childName = (id) => childProfiles[id] || kids?.find(k => k.user_id === id)?.nickname || 'Filho'
  const selectedChild = kids?.find(k => k.user_id === selectedChildId)

  // ---- Mini-jogo cooperativo: Memória Curricular ----
  const MEMORY_DECK = [
    { id: 'cap', symbol: '🏰', name: 'Castelo' },
    { id: 'sword', symbol: '⚔️', name: 'Espada' },
    { id: 'gem', symbol: '💎', name: 'Diamante' },
    { id: 'book', symbol: '📖', name: 'Livro' },
    { id: 'star', symbol: '⭐', name: 'Estrela' },
    { id: 'fire', symbol: '🔥', name: 'Fogo' },
  ]
  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const startMemory = () => {
    const deck = shuffle([...MEMORY_DECK, ...MEMORY_DECK].map((c, i) => ({ ...c, key: `${c.id}-${i}` })))
    setMiniGame({ type: 'memory', deck, flipped: [], matched: [], moves: 0, done: false })
  }

  const flipCard = (idx) => {
    setMiniGame(prev => {
      if (!prev || prev.type !== 'memory') return prev
      if (prev.matched.includes(idx) || prev.flipped.includes(idx) || prev.flipped.length === 2) return prev
      const flipped = [...prev.flipped, idx]
      if (flipped.length === 2) {
        const [a, b] = flipped
        const isMatch = prev.deck[a].id === prev.deck[b].id
        if (isMatch) {
          const matched = [...prev.matched, a, b]
          const done = matched.length === prev.deck.length
          return { ...prev, flipped, matched, moves: prev.moves + 1, done }
        }
        return { ...prev, flipped, moves: prev.moves + 1 }
      }
      return { ...prev, flipped }
    })
  }

  // Desvira as cartas não pareadas após um pequeno atraso
  useEffect(() => {
    if (miniGame?.type === 'memory' && miniGame.flipped.length === 2 && !miniGame.done) {
      const isMatch = miniGame.deck[miniGame.flipped[0]].id === miniGame.deck[miniGame.flipped[1]].id
      if (!isMatch) {
        const t = setTimeout(() => {
          setMiniGame(prev => (prev ? { ...prev, flipped: [] } : prev))
        }, 900)
        return () => clearTimeout(t)
      }
    }
  }, [miniGame])

  // ---- Mini-jogo cooperativo: Desafio Rápido de Matemática ----
  const startMath = () => {
    setMiniGame({
      type: 'math',
      questions: Array.from({ length: 5 }, () => {
        const a = 1 + Math.floor(Math.random() * 12)
        const b = 1 + Math.floor(Math.random() * 12)
        return { a, b, answer: a * b }
      }),
      idx: 0,
      score: 0,
      input: '',
      done: false,
    })
  }

  const answerMath = () => {
    setMiniGame(prev => {
      if (!prev || prev.type !== 'math') return prev
      const q = prev.questions[prev.idx]
      const correct = parseInt(prev.input, 10) === q.answer
      const score = correct ? prev.score + 1 : prev.score
      const idx = prev.idx + 1
      if (idx >= prev.questions.length) return { ...prev, score, idx, done: true }
      return { ...prev, score, idx, input: '' }
    })
  }

  // Recompensa: crédito no servidor (só o pai pode premiar o filho)
  const finishMiniGame = async (coins) => {
    if (!selectedChildId || coins <= 0) return
    try {
      const { error } = await supabase.rpc('grant_family_game_reward', {
        p_child_user_id: selectedChildId,
        p_coins: coins,
      })
      if (error) throw error
      toast.success(`+${coins} Qu€sts para ${childName(selectedChildId)}! Continuem a jogar juntos!`)
    } catch (err) {
      toast.error(err.message || 'Erro ao creditar recompensa')
    }
  }

  // ---- Batalha entre famílias ----
  const startBattle = async () => {
    if (!selectedChildId) return
    try {
      const { error } = await supabase.rpc('create_family_battle', {
        p_child_user_id: selectedChildId,
        p_score: battleScore,
      })
      if (error) throw error
      toast.success('Batalha criada! Agora é só esperar que outra família aceite o desafio.')
      setBattleScore(0)
      setBattleRounds(0)
      loadBattles()
    } catch (err) {
      toast.error(err.message || 'Erro ao criar batalha')
    }
  }

  const acceptBattle = async (battle) => {
    if (!selectedChildId) {
      toast.error('Escolhe primeiro o filho que vai jogar contigo')
      return
    }
    try {
      const { data: winner, error } = await supabase.rpc('join_family_battle', {
        p_battle_id: battle.id,
        p_child_user_id: selectedChildId,
        p_score: battleScore,
      })
      if (error) throw error
      if (winner === 'opponent') toast.success(`Vitória da vossa família! +${BATTLE_WIN_COINS} Qu€sts para ${childName(selectedChildId)}!`)
      else if (winner === 'draw') toast.success('Empate! Ambas as famílias recebem um prémio de consolação.')
      else toast.success(`A outra família venceu esta ronda — ${childName(selectedChildId)} recebeu ${BATTLE_LOSE_COINS} Qu€sts de participação.`)
      setBattleScore(0)
      setBattleRounds(0)
      loadBattles()
    } catch (err) {
      toast.error(err.message || 'Erro ao aceitar batalha')
    }
  }

  const addBattlePoint = () => { setBattleScore(s => s + 1); setBattleRounds(r => r + 1) }

  if (!kids || kids.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
        <Gamepad2 className="mx-auto text-slate-300 mb-3" size={44} />
        <p className="text-slate-500 text-sm">Adiciona um filho primeiro para poderem jogar em família!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden" data-testid="family-play-panel">
      <div className="bg-gradient-to-r from-purple-600 to-[hsl(340,60%,55%)] p-5 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-2xl"><Gamepad2 size={26} /></div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Jogar em Família</h2>
              <p className="text-white/80 text-sm">Mini-jogos a par com os filhos e batalhas contra outras famílias — os vencedores ganham Qu€sts e recursos!</p>
            </div>
          </div>
          <select
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/25 text-white font-semibold text-sm outline-none"
            data-testid="family-play-child-select"
          >
            {kids.map(k => <option key={k.user_id} value={k.user_id} className="text-slate-800">{k.nickname}</option>)}
          </select>
        </div>
        <div className="flex gap-2 mt-4">
          <button onClick={() => setTab('games')} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${tab === 'games' ? 'bg-white text-purple-700' : 'bg-white/20 hover:bg-white/30'}`}>Mini-jogos a Dois</button>
          <button onClick={() => setTab('battles')} className={`px-4 py-2 rounded-xl font-bold text-sm transition ${tab === 'battles' ? 'bg-white text-purple-700' : 'bg-white/20 hover:bg-white/30'}`}>Batalhas de Famílias</button>
        </div>
      </div>

      <div className="p-5">
        {tab === 'games' && !miniGame && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-2 border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2"><Sparkles className="text-purple-500" size={20} /><h3 className="font-bold text-slate-800">Memória em Família</h3></div>
              <p className="text-sm text-slate-500 mb-4">Vocês dois encontram os pares em ecrã partilhado. Menos jogadas = mais Qu€sts!</p>
              <button onClick={startMemory} className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition flex items-center gap-2"><Play size={16} /> Jogar</button>
            </div>
            <div className="border-2 border-slate-100 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2"><Target className="text-emerald-500" size={20} /><h3 className="font-bold text-slate-800">Desafio Rápido de Matemática</h3></div>
              <p className="text-sm text-slate-500 mb-4">Pai lê a pergunta, filho responde. 5 multiplicações, cada acerto vale Qu€sts!</p>
              <button onClick={startMath} className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition flex items-center gap-2"><Play size={16} /> Jogar</button>
            </div>
          </div>
        )}

        {tab === 'games' && miniGame?.type === 'memory' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-700">Jogadas: {miniGame.moves}</span>
              <button onClick={() => setMiniGame(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {miniGame.deck.map((card, idx) => {
                const revealed = miniGame.flipped.includes(idx) || miniGame.matched.includes(idx)
                return (
                  <button
                    key={card.key}
                    onClick={() => flipCard(idx)}
                    className={`aspect-square rounded-2xl text-3xl flex items-center justify-center transition-all duration-200 ${
                      revealed ? 'bg-purple-100 border-2 border-purple-400' : 'bg-gradient-to-br from-purple-500 to-[hsl(340,60%,55%)] hover:scale-105'
                    }`}
                  >
                    {revealed ? card.symbol : '❓'}
                  </button>
                )
              })}
            </div>
            {miniGame.done && (
              <div className="text-center mt-6">
                <Trophy className="mx-auto text-yellow-500 mb-2" size={36} />
                <p className="font-bold text-slate-800 mb-3">Terminaram em {miniGame.moves} jogadas!</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={startMemory} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition">Jogar de novo</button>
                  <button
                    onClick={() => finishMiniGame(Math.max(20, 100 - miniGame.moves * 5))}
                    className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition"
                  >
                    Receber recompensa
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'games' && miniGame?.type === 'math' && !miniGame.done && (
          <div className="text-center py-6">
            <div className="flex justify-between max-w-md mx-auto mb-6">
              <span className="font-bold text-slate-600">Pergunta {miniGame.idx + 1}/{miniGame.questions.length}</span>
              <button onClick={() => setMiniGame(null)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>
            <p className="text-5xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
              {miniGame.questions[miniGame.idx].a} × {miniGame.questions[miniGame.idx].b} = ?
            </p>
            <input
              type="number"
              value={miniGame.input}
              onChange={(e) => setMiniGame(prev => ({ ...prev, input: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') answerMath() }}
              className="w-40 text-center text-2xl font-bold border-2 border-slate-200 rounded-xl px-4 py-3 mb-4"
              placeholder="?"
              autoFocus
            />
            <button onClick={answerMath} className="block mx-auto px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition">Responder</button>
          </div>
        )}

        {tab === 'games' && miniGame?.type === 'math' && miniGame.done && (
          <div className="text-center py-8">
            <Trophy className="mx-auto text-yellow-500 mb-2" size={36} />
            <p className="font-bold text-slate-800 mb-3">Acertaram {miniGame.score} de {miniGame.questions.length}!</p>
            <div className="flex gap-2 justify-center">
              <button onClick={startMath} className="px-4 py-2 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition">Jogar de novo</button>
              <button
                onClick={() => finishMiniGame(20 + miniGame.score * 25)}
                className="px-4 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition"
              >
                Receber recompensa
              </button>
            </div>
          </div>
        )}

        {tab === 'battles' && (
          <div className="space-y-5">
            <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-5">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2"><Swords className="text-purple-600" size={18} /> Batalha de Famílias</h3>
              <p className="text-sm text-slate-600 mb-4">
                Joguem um mini-jogo em casa (ou em ecrã partilhado) e registem aqui cada ronda que ganharem — cada acerto vale 1 ponto.
                Depois desafiem outra família: a família vencedora ganha <strong>{BATTLE_WIN_COINS} Qu€sts</strong> + itens de construção para o filho; a outra leva {BATTLE_LOSE_COINS} de participação.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="bg-white px-4 py-2 rounded-xl border-2 border-purple-200 font-bold text-purple-700">
                  Pontos da equipa: {battleScore}
                </div>
                <button onClick={addBattlePoint} className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition">+1 ponto (acertámos!)</button>
                <button onClick={startBattle} disabled={battleScore <= 0} className="px-4 py-2 bg-gradient-to-r from-purple-600 to-[hsl(340,60%,55%)] text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2">
                  <Swords size={16} /> Desafiar outra família
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><Clock size={14} /> Batalhas abertas (outras famílias)</h4>
              {openBattles.length === 0 ? (
                <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center">Ainda não há batalhas abertas. Criem a primeira!</p>
              ) : (
                <div className="space-y-2">
                  {openBattles.filter(b => b.challenger_parent_id !== undefined).map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Família de {childName(b.challenger_child_id)}</p>
                        <p className="text-xs text-slate-500">Pontos a bater: {b.challenger_score}</p>
                      </div>
                      <button onClick={() => acceptBattle(b)} className="px-4 py-2 bg-purple-500 text-white font-bold rounded-xl text-sm hover:bg-purple-600 transition flex items-center gap-1">
                        <Play size={14} /> Aceitar desafio
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-bold text-slate-700 text-sm mb-2 flex items-center gap-2"><Trophy size={14} /> Histórico</h4>
              {myBattles.filter(b => b.status === 'completed').length === 0 ? (
                <p className="text-sm text-slate-400 bg-slate-50 rounded-xl p-4 text-center">Sem batalhas concluídas ainda.</p>
              ) : (
                <div className="space-y-2">
                  {myBattles.filter(b => b.status === 'completed').slice(0, 8).map(b => {
                    const isChallenger = b.challenger_parent_id !== null
                    const weWon = (isChallenger && b.winner_side === 'challenger') || (!isChallenger && b.winner_side === 'opponent')
                    return (
                      <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {childName(b.challenger_child_id)} ({b.challenger_score}) vs {childName(b.opponent_child_id) || 'Família'} ({b.opponent_score})
                          </p>
                          <p className="text-xs text-slate-500">{new Date(b.resolved_at || b.created_at).toLocaleDateString('pt-PT')}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${weWon ? 'bg-emerald-100 text-emerald-700' : b.winner_side === 'draw' ? 'bg-slate-200 text-slate-600' : 'bg-rose-100 text-rose-600'}`}>
                          {weWon ? 'Vitória!' : b.winner_side === 'draw' ? 'Empate' : 'Derrota'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FamilyPlayPanel
