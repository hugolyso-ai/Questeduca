import React, { useState } from 'react'
import { Users, Trophy, Gamepad2, Zap, Brain, Clock, Star, X, Check, ArrowRight, Crown, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import MemoryMatchGame from './MemoryMatchGame'
import SpeedMathGame from './SpeedMathGame'

const FALLBACK_QUESTIONS = [
  { question_text: 'Quanto é 5 + 3?', options: ['6', '7', '8', '9'], correct_answer: 2 },
  { question_text: 'Qual é a capital de Portugal?', options: ['Porto', 'Lisboa', 'Braga', 'Coimbra'], correct_answer: 1 },
  { question_text: 'Quanto é 4 × 6?', options: ['20', '22', '24', '26'], correct_answer: 2 },
  { question_text: 'Qual o maior oceano do mundo?', options: ['Atlântico', 'Índico', 'Ártico', 'Pacífico'], correct_answer: 3 },
  { question_text: 'Quantos continentes existem?', options: ['5', '6', '7', '8'], correct_answer: 2 },
]

const MINIGAMES = {
  quiz_duel: {
    id: 'quiz_duel',
    name: 'Duelo de Conhecimento',
    description: 'Responde mais rápido que o teu adversário!',
    icon: Brain,
    color: 'from-[hsl(35,92%,50%)] to-cyan-600',
    players: 2,
    duration: '5 min',
    rewards: { winner: 50, loser: 10 }
  },
  memory_match: {
    id: 'memory_match',
    name: 'Jogo da Memória',
    description: 'Encontra os pares mais rápido!',
    icon: Zap,
    color: 'from-amber-500 to-orange-600',
    players: 1,
    duration: '2 min',
    rewards: { winner: 40, loser: 15 }
  },
  speed_math: {
    id: 'speed_math',
    name: 'Matemática Rápida',
    description: 'Resolve operações contra o tempo!',
    icon: Calculator,
    color: 'from-[hsl(35,92%,50%)] to-teal-600',
    players: 1,
    duration: '1 min',
    rewards: { winner: 35, loser: 10 }
  }
}

const MiniGameCard = ({ game, onSelect, disabled }) => {
  const Icon = game.icon
  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-[hsl(200,40%,85%)] ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => !disabled && onSelect(game)}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 mx-auto`}>
        <Icon className="text-white" size={32} />
      </div>
      <h3 className="font-bold text-lg text-slate-800 text-center mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{game.name}</h3>
      <p className="text-sm text-slate-500 text-center mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>{game.description}</p>
      <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1"><Users size={14} />{game.players} jogadores</span>
        <span className="flex items-center gap-1"><Clock size={14} />{game.duration}</span>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-[hsl(28,85%,40%)] font-semibold"><Trophy size={14} className="inline mr-1" />+{game.rewards.winner} moedas</span>
          <span className="text-slate-400">Participação: +{game.rewards.loser}</span>
        </div>
      </div>
    </div>
  )
}

const QuizDuelGame = ({ opponent, onEnd, questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [playerScore, setPlayerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !answered) {
      setAnswered(true)
      setOpponentScore(prev => prev + 1)
      setTimeout(() => nextQuestion(), 2000)
    }
  }, [timeLeft, answered])

  const handleAnswer = (index) => {
    if (answered) return
    setSelectedAnswer(index)
    setAnswered(true)
    const question = questions[currentQuestion]
    if (index === question.correct_answer) setPlayerScore(prev => prev + 1)
    if (Math.random() > 0.5) setOpponentScore(prev => prev + 1)
    setTimeout(() => nextQuestion(), 2000)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
      setAnswered(false)
      setSelectedAnswer(null)
      setTimeLeft(10)
    } else {
      setShowResult(true)
    }
  }

  if (showResult) {
    const won = playerScore > opponentScore
    const tie = playerScore === opponentScore
    return (
      <div className="text-center py-12">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${won ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : tie ? 'bg-gradient-to-br from-[hsl(200,55%,88%)] to-[hsl(24,70%,42%)]' : 'bg-gradient-to-br from-slate-400 to-slate-600'}`}>
          {won ? <Crown className="text-white" size={48} /> : <Trophy className="text-white" size={48} />}
        </div>
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif' }}>{won ? 'Vitória!' : tie ? 'Empate!' : 'Boa Tentativa!'}</h2>
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center"><p className="text-sm text-slate-500">Tu</p><p className="text-4xl font-bold text-[hsl(28,85%,40%)]">{playerScore}</p></div>
          <div className="text-2xl font-bold text-slate-300 self-center">VS</div>
          <div className="text-center"><p className="text-sm text-slate-500">{opponent}</p><p className="text-4xl font-bold text-slate-600">{opponentScore}</p></div>
        </div>
        <p className="text-lg text-[hsl(28,85%,40%)] font-semibold mb-6">+{won ? 50 : tie ? 25 : 10} moedas ganhas!</p>
        <button onClick={() => onEnd(won ? 50 : tie ? 25 : 10)} className="px-8 py-3 bg-gradient-to-r from-[hsl(35,92%,50%)] to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition">Continuar</button>
      </div>
    )
  }

  const question = questions[currentQuestion]
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="text-center"><p className="text-xs text-slate-500">Tu</p><p className="text-2xl font-bold text-[hsl(28,85%,40%)]">{playerScore}</p></div>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700'}`}>{timeLeft}</div>
          <p className="text-xs text-slate-500 mt-1">{currentQuestion + 1}/{questions.length}</p>
        </div>
        <div className="text-center"><p className="text-xs text-slate-500">{opponent}</p><p className="text-2xl font-bold text-slate-600">{opponentScore}</p></div>
      </div>
      <div className="bg-gradient-to-r from-[hsl(35,92%,50%)] to-cyan-600 rounded-2xl p-6 text-white mb-6">
        <p className="text-lg font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>{question.question_text}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          let buttonClass = 'bg-white border-2 border-slate-200 hover:border-[hsl(35,60%,60%)] hover:bg-[hsl(38,80%,93%)]'
          if (answered) {
            if (index === question.correct_answer) buttonClass = 'bg-[hsl(142,45%,88%)] border-2 border-[hsl(35,92%,50%)]'
            else if (index === selectedAnswer) buttonClass = 'bg-red-100 border-2 border-red-500'
            else buttonClass = 'bg-slate-100 border-2 border-slate-200 opacity-50'
          }
          return (
            <button key={index} onClick={() => handleAnswer(index)} disabled={answered} className={`p-4 rounded-xl font-medium transition ${buttonClass}`}>
              <span className="text-sm">{option}</span>
              {answered && index === question.correct_answer && <Check className="inline ml-2 text-[hsl(28,85%,40%)]" size={18} />}
              {answered && index === selectedAnswer && index !== question.correct_answer && <X className="inline ml-2 text-red-600" size={18} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const MiniGamesHub = ({ childId, childName, onClose }) => {
  const [selectedGame, setSelectedGame] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [opponent] = useState('CPU Bot')

  const startGame = async (game) => {
    setSelectedGame(game)
    setLoading(true)
    try {
      if (game.id === 'quiz_duel') {
        // Tenta buscar perguntas do banco (aleatórias, por ano se possível)
        const { data } = await supabase.from('quiz_questions').select('*').limit(50)
        if (data && data.length >= 3) {
          const shuffled = [...data].sort(() => Math.random() - 0.5).slice(0, 5)
          setQuestions(shuffled.map(q => ({
            question_text: q.question,
            options: q.options,
            correct_answer: q.correct_answer,
          })))
        } else {
          setQuestions(FALLBACK_QUESTIONS)
        }
      }
      setGameStarted(true)
    } catch (error) {
      setQuestions(FALLBACK_QUESTIONS)
      setGameStarted(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGameEnd = async (coinsWon) => {
    if (childId) {
      try {
        const { data: gameState } = await supabase.from('game_states').select('coins, diamonds').eq('user_id', childId).single()
        if (gameState) {
          await supabase.from('game_states').update({
            coins: gameState.coins + coinsWon,
            diamonds: gameState.diamonds + 1,
          }).eq('user_id', childId)
        }
        await supabase.from('mini_game_scores').insert({
          user_id: childId,
          game_id: selectedGame.id,
          score: coinsWon,
          coins_won: coinsWon,
          diamonds_won: 1,
        })
      } catch (error) {
        // Ignore - still show success to user
      }
    }
    toast.success(`+${coinsWon} moedas ganhas!`)
    setGameStarted(false)
    setSelectedGame(null)
  }

  if (gameStarted && selectedGame) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{selectedGame.name}</h2>
          <button onClick={() => { setGameStarted(false); setSelectedGame(null) }} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
        </div>
        {selectedGame.id === 'quiz_duel' && <QuizDuelGame opponent={opponent} onEnd={handleGameEnd} questions={questions} />}
        {selectedGame.id === 'memory_match' && <MemoryMatchGame onGameEnd={handleGameEnd} />}
        {selectedGame.id === 'speed_math' && <SpeedMathGame onGameEnd={handleGameEnd} />}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Gamepad2 className="text-[hsl(35,92%,45%)]" size={28} />
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Mini-Jogos</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
      </div>
      <p className="text-slate-500 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>Escolhe um jogo e ganha moedas extras!</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.values(MINIGAMES).map(game => (
          <MiniGameCard key={game.id} game={game} onSelect={startGame} disabled={loading} />
        ))}
      </div>
    </div>
  )
}

export default MiniGamesHub
