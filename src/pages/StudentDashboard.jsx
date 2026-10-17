import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Castle, Coins, Gem, Trophy, LogOut, BookOpen, Home, Users, Gamepad2,
  Calendar, Award, Zap, Brain, ChevronRight, Star, TrendingUp, Settings,
  Plus, Check, X, Timer, Flame, Shield, Sword, Wrench
} from 'lucide-react'
import IsometricCity from '../components/IsometricCity'
import BattleAndSocial from '../components/BattleAndSocial'
import DailyStreak from '../components/DailyStreak'
import WeeklyChallenges from '../components/WeeklyChallenges'
import MonthlyLeagues from '../components/MonthlyLeagues'
import AchievementsSystem from '../components/AchievementsSystem'
import MiniGamesHub from '../components/MiniGamesHub'
import SchoolCalendar from '../components/SchoolCalendar'
import AccessibilityPanel from '../components/AccessibilityPanel'
import InteractiveTutorial from '../components/InteractiveTutorial'
import { OnlineStatusIndicator } from '../components/OfflineComponents'

const TABS = [
  { id: 'city', name: 'A Minha Cidade', icon: Castle },
  { id: 'quiz', name: 'Perguntas', icon: BookOpen },
  { id: 'social', name: 'Amigos e Batalhas', icon: Users },
  { id: 'minigames', name: 'Mini-Jogos', icon: Gamepad2 },
  { id: 'achievements', name: 'Conquistas', icon: Award },
  { id: 'calendar', name: 'Calendário', icon: Calendar },
  { id: 'settings', name: 'Definições', icon: Settings },
]

const SUBJECTS = [
  { id: 'matematica', name: 'Matemática', icon: 'math', color: 'from-blue-500 to-cyan-600' },
  { id: 'portugues', name: 'Português', icon: 'language', color: 'from-green-500 to-emerald-600' },
  { id: 'estudo_meio', name: 'Estudo do Meio', icon: 'science', color: 'from-amber-500 to-orange-600' },
  { id: 'historia', name: 'História', icon: 'history', color: 'from-red-500 to-rose-600' },
  { id: 'geografia', name: 'Geografia', icon: 'geography', color: 'from-teal-500 to-cyan-600' },
  { id: 'ciencias', name: 'Ciências', icon: 'biology', color: 'from-purple-500 to-violet-600' },
  { id: 'ingles', name: 'Inglês', icon: 'english', color: 'from-pink-500 to-rose-600' },
]

const QUIZ_TOPICS = {
  matematica: ['Soma e Subtração', 'Multiplicação', 'Divisão', 'Frações', 'Geometria', 'Problemas'],
  portugues: ['Gramática', 'Compreensão de Texto', 'Vocabulário', 'Ortografia', 'Sinónimos'],
  estudo_meio: ['Natureza', 'Saúde', 'Sociedade', 'Ambiente', 'Tecnologia'],
  historia: ['Idade Média', 'Descobrimentos', 'História de Portugal', 'Civilizações'],
  geografia: ['Portugal', 'Europa', 'Clima', 'Rios', 'Montanhas'],
  ciencias: ['Corpo Humano', 'Plantas', 'Animais', 'Energia', 'Materiais'],
  ingles: ['Vocabulary', 'Grammar', 'Numbers', 'Colors', 'Animals'],
}

const generateQuizQuestions = (subject, year, count = 10) => {
  const questions = []
  const topics = QUIZ_TOPICS[subject] || ['Geral']
  for (let i = 0; i < count; i++) {
    const topic = topics[Math.floor(Math.random() * topics.length)]
    if (subject === 'matematica') {
      const a = Math.floor(Math.random() * (year * 5 + 10)) + 1
      const b = Math.floor(Math.random() * (year * 5 + 10)) + 1
      const ops = ['+', '-', '×']
      const op = ops[Math.floor(Math.random() * ops.length)]
      let answer
      if (op === '+') answer = a + b
      else if (op === '-') answer = a - b
      else answer = a * b
      const options = [answer]
      while (options.length < 4) {
        const offset = Math.floor(Math.random() * 10) - 5
        const wrong = answer + offset + (offset === 0 ? 1 : 0)
        if (!options.includes(wrong)) options.push(wrong)
      }
      options.sort(() => Math.random() - 0.5)
      questions.push({
        question: `Quanto é ${a} ${op} ${b}?`,
        options: options.map(String),
        correct_answer: options.indexOf(answer),
        subject,
        topic,
      })
    } else if (subject === 'ingles') {
      const vocab = [
        { q: 'Como se diz "cão" em inglês?', opts: ['Cat', 'Dog', 'Bird', 'Fish'], a: 1 },
        { q: 'Como se diz "casa" em inglês?', opts: ['House', 'Car', 'Tree', 'Door'], a: 0 },
        { q: 'Como se diz "vermelho" em inglês?', opts: ['Blue', 'Green', 'Red', 'Yellow'], a: 2 },
        { q: 'What is "1" in English?', opts: ['One', 'Two', 'Three', 'Four'], a: 0 },
        { q: 'How do you say "olá" in English?', opts: ['Goodbye', 'Hello', 'Thanks', 'Sorry'], a: 1 },
      ]
      const item = vocab[Math.floor(Math.random() * vocab.length)]
      questions.push({ question: item.q, options: item.opts, correct_answer: item.a, subject, topic })
    } else {
      const generalQs = [
        { q: 'Qual é a capital de Portugal?', opts: ['Porto', 'Lisboa', 'Braga', 'Faro'], a: 1 },
        { q: 'Quantos dias tem uma semana?', opts: ['5', '6', '7', '8'], a: 2 },
        { q: 'Qual é o maior planeta do sistema solar?', opts: ['Terra', 'Marte', 'Júpiter', 'Vénus'], a: 2 },
        { q: 'Quantos continentes existem?', opts: ['5', '6', '7', '8'], a: 2 },
        { q: 'Qual é o oceano que banha Portugal?', opts: ['Pacífico', 'Índico', 'Atlântico', 'Ártico'], a: 2 },
        { q: 'Quem escreveu "Os Lusíadas"?', opts: ['Pessoa', 'Camões', 'Saramago', 'Eça'], a: 1 },
        { q: 'Quantos minutos tem uma hora?', opts: ['50', '60', '70', '100'], a: 1 },
        { q: 'Qual é a estação mais quente?', opts: ['Inverno', 'Outono', 'Primavera', 'Verão'], a: 3 },
      ]
      const item = generalQs[Math.floor(Math.random() * generalQs.length)]
      questions.push({ question: item.q, options: item.opts, correct_answer: item.a, subject, topic })
    }
  }
  return questions
}

const QuizView = ({ gameState, setGameState, userId, schoolYear }) => {
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizActive, setQuizActive] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const startQuiz = (subjectId) => {
    setSelectedSubject(subjectId)
    const generated = generateQuizQuestions(subjectId, schoolYear || 5, 10)
    setQuestions(generated)
    setCurrentQuestion(0)
    setScore(0)
    setCorrectCount(0)
    setAnswered(false)
    setSelectedAnswer(null)
    setQuizActive(true)
    setQuizComplete(false)
  }

  const handleAnswer = (index) => {
    if (answered) return
    setSelectedAnswer(index)
    setAnswered(true)
    const question = questions[currentQuestion]
    const isCorrect = index === question.correct_answer
    if (isCorrect) {
      setScore(s => s + 10)
      setCorrectCount(c => c + 1)
    }
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setAnswered(false)
        setSelectedAnswer(null)
      } else {
        finishQuiz()
      }
    }, 1500)
  }

  const finishQuiz = async () => {
    const coinsEarned = correctCount * 5
    const xpEarned = correctCount * 10
    setQuizActive(false)
    setQuizComplete(true)
    if (userId) {
      try {
        const { data: gs } = await supabase.from('game_states').select('*').eq('user_id', userId).single()
        if (gs) {
          const today = new Date().toISOString().split('T')[0]
          const isNewDay = gs.last_quiz_date !== today
          await supabase.from('game_states').update({
            coins: gs.coins + coinsEarned,
            xp: gs.xp + xpEarned,
            quizzes_today: isNewDay ? 1 : (gs.quizzes_today || 0) + 1,
            last_quiz_date: today,
          }).eq('user_id', userId)
        }
        await supabase.from('quiz_answers').insert({
          user_id: userId,
          subject: selectedSubject,
          total_questions: questions.length,
          correct_answers: correctCount,
          score: score,
        })
      } catch (error) { /* ignore */ }
    }
    toast.success(`Quiz completo! ${correctCount}/${questions.length} corretas. +${coinsEarned} moedas!`)
  }

  if (quizComplete) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Quiz Completo!</h2>
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-blue-50 rounded-xl p-4"><p className="text-3xl font-bold text-blue-600">{correctCount}</p><p className="text-xs text-slate-500">Corretas</p></div>
          <div className="bg-green-50 rounded-xl p-4"><p className="text-3xl font-bold text-green-600">{score}</p><p className="text-xs text-slate-500">Pontos</p></div>
          <div className="bg-amber-50 rounded-xl p-4"><p className="text-3xl font-bold text-amber-600">{correctCount * 5}</p><p className="text-xs text-slate-500">Moedas</p></div>
        </div>
        <button onClick={() => { setQuizComplete(false); setSelectedSubject(null) }} className="px-8 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">Voltar aos Quizzes</button>
      </div>
    )
  }

  if (quizActive && questions.length > 0) {
    const question = questions[currentQuestion]
    return (
      <div className="bg-white rounded-3xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 px-4 py-2 rounded-xl"><span className="text-sm text-blue-600">Pergunta</span><p className="text-xl font-bold text-blue-700">{currentQuestion + 1}/{questions.length}</p></div>
            <div className="bg-green-100 px-4 py-2 rounded-xl"><span className="text-sm text-green-600">Pontos</span><p className="text-xl font-bold text-green-700">{score}</p></div>
          </div>
          <button onClick={() => { setQuizActive(false); setSelectedSubject(null) }} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-8 text-white text-center mb-6">
          <p className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>{question.question}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option, index) => {
            let buttonClass = 'bg-white border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50'
            if (answered) {
              if (index === question.correct_answer) buttonClass = 'bg-green-100 border-2 border-green-500'
              else if (index === selectedAnswer) buttonClass = 'bg-red-100 border-2 border-red-500'
              else buttonClass = 'bg-slate-100 border-2 border-slate-200 opacity-50'
            }
            return (
              <button key={index} onClick={() => handleAnswer(index)} disabled={answered} className={`p-4 rounded-xl font-medium transition ${buttonClass}`}>
                <span className="text-base">{option}</span>
                {answered && index === question.correct_answer && <Check className="inline ml-2 text-green-600" size={18} />}
                {answered && index === selectedAnswer && index !== question.correct_answer && <X className="inline ml-2 text-red-600" size={18} />}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <BookOpen className="text-blue-500" size={28} />
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Escolhe uma Disciplina</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SUBJECTS.map(subject => (
          <button key={subject.id} onClick={() => startQuiz(subject.id)} className={`bg-gradient-to-br ${subject.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all`}>
            <BookOpen className="mx-auto mb-3" size={32} />
            <h3 className="font-bold text-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>{subject.name}</h3>
            <p className="text-white/80 text-sm mt-1">10 perguntas</p>
          </button>
        ))}
      </div>
    </div>
  )
}

const StudentDashboard = () => {
  const { user, profile, logout } = useAuth()
  const [gameState, setGameState] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('city')
  const [showTutorial, setShowTutorial] = useState(false)
  const [showAccessibility, setShowAccessibility] = useState(false)

  const fetchGameData = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data: gs, error: gsError } = await supabase.from('game_states').select('*').eq('user_id', user.id).single()
      if (gsError && gsError.code === 'PGRST116') {
        const { data: newGs, error: insertError } = await supabase.from('game_states').insert({
          user_id: user.id,
          coins: 100,
          diamonds: 10,
          xp: 0,
          level: 1,
          resources: { wood: 50, stone: 50, food: 50, gold: 20 },
          buildings: [],
          roads: [],
          population: 0,
          max_population: 10,
          defense_power: 0,
          attack_power: 0,
          production_timers: {},
          quizzes_today: 0,
          last_quiz_date: new Date().toISOString().split('T')[0],
          current_streak: 0,
          longest_streak: 0,
          streak_claimed_today: false,
          city_name: 'A Minha Aldeia',
        }).select().single()
        if (!insertError) setGameState(newGs)
      } else if (gs) {
        setGameState(gs)
      }

      const { data: sp } = await supabase.from('student_profiles').select('*').eq('user_id', user.id).single()
      if (sp) setStudentProfile(sp)
    } catch (error) { /* ignore */ }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => {
    fetchGameData()
    if (!localStorage.getItem('questeduca_tutorial_seen')) {
      setShowTutorial(true)
    }
  }, [fetchGameData])

  const updateGameState = async (updates) => {
    if (!user?.id || !gameState) return
    setGameState(prev => ({ ...prev, ...updates }))
    try {
      await supabase.from('game_states').update(updates).eq('user_id', user.id)
    } catch (error) { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">A carregar a tua aventura...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-slate-50">
      {/* Top Bar */}
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Castle className="h-8 w-8 text-green-500" strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>QUESTEDUCA</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              {gameState && (
                <>
                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                    <Coins className="text-amber-500" size={16} />
                    <span className="font-bold text-amber-700 text-sm">{gameState.coins}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-cyan-50 px-3 py-1.5 rounded-full">
                    <Gem className="text-cyan-500" size={16} />
                    <span className="font-bold text-cyan-700 text-sm">{gameState.diamonds}</span>
                  </div>
                </>
              )}
              <OnlineStatusIndicator />
              <button onClick={() => setShowAccessibility(true)} className="p-2 hover:bg-slate-100 rounded-xl transition"><Settings size={20} /></button>
              <button onClick={logout} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition ${activeTab === tab.id ? 'border-green-500 text-green-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                  <Icon size={16} />{tab.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'city' && gameState && (
          <IsometricCity gameState={gameState} updateGameState={updateGameState} userId={user.id} />
        )}
        {activeTab === 'quiz' && (
          <QuizView gameState={gameState} setGameState={setGameState} userId={user.id} schoolYear={studentProfile?.school_year} />
        )}
        {activeTab === 'social' && (
          <BattleAndSocial gameState={gameState} userId={user.id} />
        )}
        {activeTab === 'minigames' && (
          <MiniGamesHub childId={user.id} childName={profile?.name} onClose={() => setActiveTab('city')} />
        )}
        {activeTab === 'achievements' && (
          <AchievementsSystem gameState={gameState} userId={user.id} />
        )}
        {activeTab === 'calendar' && (
          <SchoolCalendar schoolYear={studentProfile?.school_year} />
        )}
        {activeTab === 'settings' && (
          <AccessibilityPanel />
        )}
      </div>

      {showTutorial && (
        <InteractiveTutorial onClose={() => { setShowTutorial(false); localStorage.setItem('questeduca_tutorial_seen', '1') }} />
      )}
      {showAccessibility && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAccessibility(false)}>
          <div className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <AccessibilityPanel />
            <button onClick={() => setShowAccessibility(false)} className="w-full mt-4 py-3 bg-slate-200 rounded-xl font-semibold">Fechar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard
