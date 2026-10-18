import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Castle, Coins, Gem, Trophy, LogOut, BookOpen, Home, Users, Gamepad2,
  Calendar, Award, Zap, Brain, ChevronRight, Star, TrendingUp, Settings,
  Plus, Check, X, Timer, Flame, Shield, Sword, Wrench, LibraryBig
} from 'lucide-react'
import IsometricCity from '../components/IsometricCity'
import BattleAndSocial from '../components/BattleAndSocial'
import { PortugalFriendMap } from '../components/PortugalMap'
import SchoolRanking from '../components/SchoolRanking'
import WeeklyCurricularMission from '../components/WeeklyCurricularMission'
import ProfileSettingsPanel from '../components/ProfileSettingsPanel'
import QuizDuels from '../components/QuizDuels'
import DailyStreak from '../components/DailyStreak'
import WeeklyChallenges from '../components/WeeklyChallenges'
import MonthlyLeagues from '../components/MonthlyLeagues'
import AchievementsSystem from '../components/AchievementsSystem'
import MiniGamesHub from '../components/MiniGamesHub'
import SchoolCalendar from '../components/SchoolCalendar'
import AccessibilityPanel from '../components/AccessibilityPanel'
import InteractiveTutorial from '../components/InteractiveTutorial'
import { OnlineStatusIndicator } from '../components/OfflineComponents'
import LibraryPanel from '../components/LibraryPanel'

const TABS = [
  { id: 'city', name: 'A Minha Cidade', icon: Castle },
  { id: 'quiz', name: 'Perguntas', icon: BookOpen },
  { id: 'social', name: 'Amigos e Batalhas', icon: Users },
  { id: 'ranking', name: 'Classificações', icon: Trophy },
  { id: 'minigames', name: 'Mini-Jogos', icon: Gamepad2 },
  { id: 'achievements', name: 'Conquistas', icon: Award },
  { id: 'library', name: 'Biblioteca', icon: LibraryBig },
  { id: 'calendar', name: 'Calendário', icon: Calendar },
  { id: 'settings', name: 'Definições', icon: Settings },
]

const SUBJECTS = [
  { id: 'matematica', name: 'Matemática', icon: 'math', color: 'from-[hsl(35,92%,50%)] to-cyan-600' },
  { id: 'portugues', name: 'Português', icon: 'language', color: 'from-[hsl(35,92%,50%)] to-emerald-600' },
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
  const [mode, setMode] = useState(null) // null | 'treino' | 'desafio'
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [quizActive, setQuizActive] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [hintUsed, setHintUsed] = useState(false)
  const [hintsAvailable, setHintsAvailable] = useState(0)
  const [timeLeft, setTimeLeft] = useState(null)
  const [speakEnabled, setSpeakEnabled] = useState(() => localStorage.getItem('questeduca_speak') === 'true')

  // Bónus da cidade: Escola +XP, Biblioteca +dicas
  const schoolLevel = useMemo(() => {
    const b = gameState?.buildings
    return (b && b.school && b.school.placed) ? (b.school.level || 1) : 0
  }, [gameState?.buildings])
  const libraryLevel = useMemo(() => {
    const b = gameState?.buildings
    return (b && b.library && b.library.placed) ? (b.library.level || 1) : 0
  }, [gameState?.buildings])

  const speak = useCallback((text) => {
    if (!speakEnabled || !window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'pt-PT'
    utter.rate = 0.9
    window.speechSynthesis.speak(utter)
  }, [speakEnabled])

  useEffect(() => {
    if (quizActive && questions[currentQuestion]) {
      speak(questions[currentQuestion].question)
    }
  }, [quizActive, currentQuestion, questions, speak])

  // Cronómetro do modo desafio
  useEffect(() => {
    if (mode !== 'desafio' || !quizActive || quizComplete) return
    if (timeLeft === null || timeLeft <= 0) return
    const t = setTimeout(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000)
    return () => clearTimeout(t)
  }, [mode, quizActive, quizComplete, timeLeft])

  useEffect(() => {
    if (mode === 'desafio' && quizActive && timeLeft === 0 && !answered) {
      finishQuiz(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft])

  const startQuiz = async (subjectId, quizMode) => {
    setMode(quizMode)
    setSelectedSubject(subjectId)
    setLoadingQuiz(true)
    const year = schoolYear ? parseInt(schoolYear) : 5
    try {
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('subject', subjectId)
        .eq('school_year', year)
        .limit(60)
      let pool = data || []
      if (error || pool.length === 0) {
        const { data: fallback } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('subject', subjectId)
          .limit(60)
        pool = fallback || []
      }
      if (pool.length < 10) {
        setQuestions(generateQuizQuestions(subjectId, year, 10))
      } else {
        // Dificuldade progressiva: 2 fáceis, 4 médias, 4 difíceis (se houver)
        const easy = pool.filter(q => (q.difficulty || 1) <= 1).sort(() => Math.random() - 0.5)
        const mid = pool.filter(q => (q.difficulty || 1) === 2).sort(() => Math.random() - 0.5)
        const hard = pool.filter(q => (q.difficulty || 1) >= 3).sort(() => Math.random() - 0.5)
        const picked = [
          ...easy.slice(0, 2), ...mid.slice(0, 4), ...hard.slice(0, 4),
        ]
        while (picked.length < 10 && pool.length > picked.length) {
          const q = pool[Math.floor(Math.random() * pool.length)]
          if (!picked.includes(q)) picked.push(q)
        }
        setQuestions(picked.slice(0, 10).map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          subject: q.subject,
          difficulty: q.difficulty || 1,
        })))
      }
    } catch (e) {
      setQuestions(generateQuizQuestions(subjectId, year, 10))
    } finally {
      setCurrentQuestion(0)
      setScore(0)
      setCorrectCount(0)
      setStreak(0)
      setBestStreak(0)
      setHintUsed(false)
      setHintsAvailable(libraryLevel > 0 ? libraryLevel : 0)
      setAnswered(false)
      setSelectedAnswer(null)
      setQuizActive(true)
      setQuizComplete(false)
      setLoadingQuiz(false)
      if (quizMode === 'desafio') setTimeLeft(15 * 10)
      else setTimeLeft(null)
    }
  }

  const handleAnswer = (index) => {
    if (answered) return
    setSelectedAnswer(index)
    setAnswered(true)
    const question = questions[currentQuestion]
    const isCorrect = index === question.correct_answer
    if (isCorrect) {
      // Pontuação: dificuldade + streak x2 no desafio + bónus sem dica
      const diffMult = question.difficulty || 1
      const streakBonus = mode === 'desafio' && streak >= 2 ? 2 : 1
      const noHintBonus = hintUsed ? 1 : 1.25
      const points = Math.round(10 * diffMult * streakBonus * noHintBonus)
      setScore(s => s + points)
      setCorrectCount(c => c + 1)
      setStreak(s => s + 1)
      setBestStreak(b => Math.max(b, streak + 1))
    } else {
      setStreak(0)
    }
    if (isCorrect) speak('Correto!')
    else speak('Errado. A resposta certa é ' + question.options[question.correct_answer])
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
        setAnswered(false)
        setSelectedAnswer(null)
        setHintUsed(false)
      } else {
        finishQuiz(false)
      }
    }, 1500)
  }

  const useHint = () => {
    if (hintUsed || hintsAvailable <= 0 || answered) return
    const question = questions[currentQuestion]
    // Elimina 2 opções erradas aleatórias
    const wrongIdx = question.options
      .map((_, i) => i)
      .filter(i => i !== question.correct_answer)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    setEliminated(wrongIdx)
    setHintUsed(true)
    setHintsAvailable(h => h - 1)
    toast('Dica: duas opções erradas foram eliminadas!', { icon: '💡' })
  }
  const [eliminated, setEliminated] = useState([])

  const finishQuiz = async (timedOut = false) => {
    const schoolBonus = 1 + (schoolLevel * 0.1)
    const coinsEarned = Math.round(correctCount * 5 * (mode === 'desafio' ? 1.5 : 1) * schoolBonus)
    const xpEarned = Math.round(correctCount * 10 * (mode === 'desafio' ? 1.5 : 1) * schoolBonus)
    const perfect = correctCount === questions.length && questions.length > 0
    setQuizActive(false)
    setQuizComplete(true)
    setMode(mode)
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
        if (questions.length > 0) {
          const rows = questions.map((q, idx) => ({
            user_id: userId,
            quiz_id: `${selectedSubject}_${Date.now()}`,
            question_id: q.id ? String(q.id) : `gen_${idx}`,
            answer_index: idx,
            correct: idx < correctCount,
            subject: selectedSubject,
            school_year: String(schoolYear || 5),
          }))
          await supabase.from('quiz_answers').insert(rows)
        }
      } catch (error) { /* ignore */ }
    }
    if (perfect) toast.success(`PERFEITO! ${correctCount}/${questions.length}! +${coinsEarned} moedas, +${xpEarned} XP`, { icon: '🌟' })
    else if (timedOut) toast(`Tempo esgotado! ${correctCount}/${questions.length} corretas. +${coinsEarned} moedas`, { icon: '⏰' })
    else toast.success(`Quiz completo! ${correctCount}/${questions.length} corretas. +${coinsEarned} moedas!`)
  }

  if (quizComplete) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          {correctCount === questions.length ? 'PERFEITO! 🌟' : 'Quiz Completo!'}
        </h2>
        {bestStreak >= 3 && <p className="text-amber-600 font-bold mb-2">🔥 Sequência de {bestStreak} acertos!</p>}
        <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-6">
          <div className="bg-[hsl(38,80%,93%)] rounded-xl p-4"><p className="text-3xl font-bold text-[hsl(28,85%,40%)]">{correctCount}</p><p className="text-xs text-slate-500">Corretas</p></div>
          <div className="bg-[hsl(38,80%,93%)] rounded-xl p-4"><p className="text-3xl font-bold text-[hsl(28,85%,40%)]">{score}</p><p className="text-xs text-slate-500">Pontos</p></div>
          <div className="bg-amber-50 rounded-xl p-4"><p className="text-3xl font-bold text-amber-600">{correctCount * 5}</p><p className="text-xs text-slate-500">Moedas</p></div>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setQuizComplete(false); startQuiz(selectedSubject, mode) }} className="px-6 py-3 bg-[hsl(35,92%,50%)] text-white font-bold rounded-xl hover:bg-[hsl(24,70%,42%)] transition">Jogar Outro</button>
          <button onClick={() => { setQuizComplete(false); setMode(null); setSelectedSubject(null) }} className="px-6 py-3 bg-[hsl(35,92%,50%)] text-white font-bold rounded-xl hover:bg-[hsl(33,90%,45%)] transition">Voltar aos Quizzes</button>
        </div>
      </div>
    )
  }

  if (loadingQuiz) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-12 text-center">
        <div className="w-12 h-12 border-4 border-[hsl(35,92%,50%)] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 mt-4">A preparar as perguntas...</p>
      </div>
    )
  }

  if (quizActive && questions.length > 0) {
    const question = questions[currentQuestion]
    return (
      <div className="bg-white rounded-3xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-[hsl(200,55%,88%)] px-4 py-2 rounded-xl"><span className="text-sm text-[hsl(28,85%,40%)]">Pergunta</span><p className="text-xl font-bold text-blue-700">{currentQuestion + 1}/{questions.length}</p></div>
            <div className="bg-[hsl(142,45%,88%)] px-4 py-2 rounded-xl"><span className="text-sm text-[hsl(28,85%,40%)]">Pontos</span><p className="text-xl font-bold text-green-700">{score}</p></div>
            {streak >= 2 && <div className="bg-amber-100 px-4 py-2 rounded-xl animate-pulse"><span className="text-sm text-amber-600">Sequência</span><p className="text-xl font-bold text-amber-700">🔥 {streak}</p></div>}
            {mode === 'desafio' && timeLeft !== null && (
              <div className={`px-4 py-2 rounded-xl ${timeLeft <= 30 ? 'bg-red-100 animate-pulse' : 'bg-slate-100'}`}>
                <span className="text-sm text-slate-600">Tempo</span>
                <p className={`text-xl font-bold ${timeLeft <= 30 ? 'text-red-600' : 'text-slate-700'}`}>⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</p>
              </div>
            )}
          </div>
          <button onClick={() => { setQuizActive(false); setMode(null); setSelectedSubject(null) }} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
        </div>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className={`flex-1 bg-gradient-to-r rounded-2xl p-8 text-white text-center ${mode === 'desafio' ? 'from-orange-500 to-red-600' : 'from-[hsl(35,92%,50%)] to-cyan-600'}`}>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{question.question}</p>
            {(question.difficulty || 1) >= 3 && <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-bold">Difícil · vale mais pontos!</span>}
          </div>
          <button
            onClick={() => setSpeakEnabled(!speakEnabled)}
            className={`p-3 rounded-xl transition border-2 ${speakEnabled ? 'bg-[hsl(142,45%,88%)] border-green-400' : 'bg-slate-50 border-slate-200'}`}
            title="Ler a pergunta em voz alta"
          >
            {speakEnabled ? '🔊' : '🔇'}
          </button>
        </div>
        {hintsAvailable > 0 && !hintUsed && (
          <button onClick={useHint} className="mb-4 px-4 py-2 bg-yellow-100 text-yellow-800 font-bold rounded-xl hover:bg-yellow-200 transition flex items-center gap-2">
            💡 Usar dica da Biblioteca ({hintsAvailable} restantes)
          </button>
        )}
        {libraryLevel === 0 && (
          <p className="mb-4 text-xs text-slate-400">Constrói uma Biblioteca na cidade para ganhar dicas!</p>
        )}
        <div className="grid grid-cols-2 gap-3">
          {question.options.map((option, index) => {
            let buttonClass = 'bg-white border-2 border-slate-200 hover:border-[hsl(35,60%,60%)] hover:bg-[hsl(38,80%,93%)]'
            if (answered) {
              if (index === question.correct_answer) buttonClass = 'bg-[hsl(142,45%,88%)] border-2 border-[hsl(35,92%,50%)]'
              else if (index === selectedAnswer) buttonClass = 'bg-red-100 border-2 border-red-500'
              else buttonClass = 'bg-slate-100 border-2 border-slate-200 opacity-50'
            } else if (eliminated.includes(index)) {
              buttonClass = 'bg-slate-100 border-2 border-slate-200 opacity-30 line-through'
            }
            return (
              <button key={index} onClick={() => handleAnswer(index)} disabled={answered || eliminated.includes(index)} className={`p-4 rounded-xl font-medium transition ${buttonClass}`}>
                <span className="text-base">{option}</span>
                {answered && index === question.correct_answer && <Check className="inline ml-2 text-[hsl(28,85%,40%)]" size={18} />}
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="text-[hsl(35,92%,45%)]" size={28} />
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Escolhe uma Disciplina</h2>
        </div>
        {schoolLevel > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-[hsl(142,45%,88%)] px-4 py-2 rounded-xl">
            <span className="text-green-700 font-bold text-sm">🏫 Escola Nv.{schoolLevel}: +{schoolLevel * 10}% XP e moedas</span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {SUBJECTS.map(subject => (
          <div key={subject.id} className={`bg-gradient-to-br ${subject.color} rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all`}>
            <BookOpen className="mx-auto mb-2" size={28} />
            <h3 className="font-bold text-lg text-center" style={{ fontFamily: 'Cinzel, serif' }}>{subject.name}</h3>
            <p className="text-white/80 text-xs text-center mb-3">10 perguntas · {schoolYear ? `${schoolYear}º ano` : 'todos os níveis'}</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => startQuiz(subject.id, 'treino')} className="px-2 py-2 bg-white/25 hover:bg-white/40 rounded-lg font-bold text-sm transition">
                🎓 Treino
              </button>
              <button onClick={() => startQuiz(subject.id, 'desafio')} className="px-2 py-2 bg-red-600/70 hover:bg-red-600 rounded-lg font-bold text-sm transition">
                ⏱ Desafio
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-slate-400 mt-4">
        🎓 Treino: sem cronómetro, com dicas · ⏱ Desafio: cronómetro, pontos a dobrar com sequências de acertos
      </p>
    </div>
  )
}


const StudentDashboard = () => {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [gameState, setGameState] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('city')
  const [showTutorial, setShowTutorial] = useState(false)
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [quizRefreshKey, setQuizRefreshKey] = useState(0)

  const fetchGameData = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data: gs, error: gsError } = await supabase.from('game_states').select('*').eq('user_id', user.id).single()
      const { data: sp } = await supabase.from('student_profiles').select('*').eq('user_id', user.id).single()
      if (sp) setStudentProfile(sp)
      if (sp && !sp.birth_date) {
        navigate('/student/onboarding', { replace: true })
      }
      if (gsError && gsError.code === 'PGRST116') {
        const villageName = sp?.nickname || profile?.name || ''
        const { data: newGs, error: insertError } = await supabase.from('game_states').insert({
          user_id: user.id,
          coins: 300,
          diamonds: 10,
          xp: 0,
          level: 1,
          resources: { wood: 200, stone: 150, iron: 60, food: 200 },
          buildings: {
            town_hall: { x: 6, y: 6, level: 1, placed: true, producing: false },
            library: { x: 7, y: 7, level: 1, placed: true, producing: false },
          },
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
          city_name: villageName ? `Aldeia do ${villageName}` : 'A Minha Aldeia',
        }).select().single()
        if (!insertError) setGameState(newGs)
      } else if (gs) {
        setGameState(gs)
      }
    } catch (error) { /* ignore */ }
    finally { setLoading(false) }
  }, [user, profile?.name])

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[hsl(40,33%,96%)] to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[hsl(35,92%,50%)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold">A carregar a tua aventura...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,96%)] via-[hsl(40,33%,96%)] to-slate-50">
      {/* Top Bar */}
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 min-w-0">
              <Castle className="h-8 w-8 flex-shrink-0 text-[hsl(35,92%,45%)]" strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900 truncate" style={{ fontFamily: 'Cinzel, serif' }}>QUESTEDUCA</span>
            </div>
            <div className="flex items-center gap-1.5 md:gap-4 flex-shrink-0">
              {gameState && (
                <>
                  <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1.5 rounded-full">
                    <Coins className="text-amber-500" size={16} />
                    <span className="font-bold text-amber-700 text-sm">{gameState.coins}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-cyan-50 px-2.5 py-1.5 rounded-full">
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
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm whitespace-nowrap border-b-2 transition ${activeTab === tab.id ? 'border-[hsl(35,92%,50%)] text-[hsl(28,85%,40%)]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
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
          <IsometricCity gameState={gameState} onRefresh={fetchGameData} />
        )}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            <WeeklyCurricularMission refreshKey={quizRefreshKey} />
            <QuizView gameState={gameState} setGameState={setGameState} userId={user.id} schoolYear={studentProfile?.school_year} />
          </div>
        )}
        {activeTab === 'social' && (
          <div className="space-y-6">
            <PortugalFriendMap />
            <QuizDuels onRefresh={fetchGameData} />
            <BattleAndSocial gameState={gameState} userId={user.id} onRefresh={fetchGameData} />
          </div>
        )}
        {activeTab === 'ranking' && (
          <SchoolRanking studentProfile={studentProfile} />
        )}
        {activeTab === 'minigames' && (
          <MiniGamesHub childId={user.id} childName={profile?.name} onClose={() => setActiveTab('city')} />
        )}
        {activeTab === 'achievements' && (
          <AchievementsSystem gameState={gameState} userId={user.id} />
        )}
        {activeTab === 'library' && (
          <LibraryPanel />
        )}
        {activeTab === 'calendar' && (
          <SchoolCalendar schoolYear={studentProfile?.school_year} />
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <ProfileSettingsPanel studentProfile={studentProfile} onRefresh={fetchGameData} />
            <AccessibilityPanel />
          </div>
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
