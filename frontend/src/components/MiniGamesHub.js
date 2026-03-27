import React, { useState, useEffect, useCallback } from 'react';
import { Users, Trophy, Gamepad2, Zap, Brain, Clock, Star, X, Check, ArrowRight, Crown, Calculator } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import MemoryMatchGame from './MemoryMatchGame';
import SpeedMathGame from './SpeedMathGame';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Lista de mini-jogos disponíveis
const MINIGAMES = {
  quiz_duel: {
    id: 'quiz_duel',
    name: 'Duelo de Conhecimento',
    description: 'Responde mais rápido que o teu adversário!',
    icon: Brain,
    color: 'from-purple-500 to-blue-600',
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
    color: 'from-green-500 to-teal-600',
    players: 1,
    duration: '1 min',
    rewards: { winner: 35, loser: 10 }
  }
};

// Componente de Card de Mini-jogo
const MiniGameCard = ({ game, onSelect, disabled }) => {
  const Icon = game.icon;
  
  return (
    <div 
      className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-2 border-transparent hover:border-purple-200 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={() => !disabled && onSelect(game)}
      data-testid={`minigame-${game.id}`}
    >
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center mb-4 mx-auto`}>
        <Icon className="text-white" size={32} />
      </div>
      
      <h3 className="font-bold text-lg text-slate-800 text-center mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
        {game.name}
      </h3>
      
      <p className="text-sm text-slate-500 text-center mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
        {game.description}
      </p>
      
      <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {game.players} jogadores
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {game.duration}
        </span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex justify-between text-sm">
          <span className="text-green-600 font-semibold">
            <Trophy size={14} className="inline mr-1" />
            +{game.rewards.winner} 💰
          </span>
          <span className="text-slate-400">
            Participação: +{game.rewards.loser} 💰
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente de Duelo de Quiz
const QuizDuelGame = ({ opponent, onEnd, questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && !answered) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !answered) {
      // Tempo esgotado - simular resposta do oponente
      handleTimeUp();
    }
  }, [timeLeft, answered]);

  const handleTimeUp = () => {
    setAnswered(true);
    // Simular que o oponente acertou
    setOpponentScore(prev => prev + 1);
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleAnswer = (index) => {
    if (answered) return;
    
    setSelectedAnswer(index);
    setAnswered(true);
    
    const question = questions[currentQuestion];
    const isCorrect = index === question.correct_answer;
    
    if (isCorrect) {
      setPlayerScore(prev => prev + 1);
    }
    
    // Simular resposta do oponente (50% chance de acertar)
    if (Math.random() > 0.5) {
      setOpponentScore(prev => prev + 1);
    }
    
    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer(null);
      setTimeLeft(10);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    const won = playerScore > opponentScore;
    const tie = playerScore === opponentScore;
    
    return (
      <div className="text-center py-12">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
          won ? 'bg-gradient-to-br from-yellow-400 to-amber-500' : 
          tie ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
          'bg-gradient-to-br from-slate-400 to-slate-600'
        }`}>
          {won ? <Crown className="text-white" size={48} /> : <Trophy className="text-white" size={48} />}
        </div>
        
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          {won ? '🎉 Vitória!' : tie ? '🤝 Empate!' : 'Boa Tentativa!'}
        </h2>
        
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-sm text-slate-500">Tu</p>
            <p className="text-4xl font-bold text-purple-600">{playerScore}</p>
          </div>
          <div className="text-2xl font-bold text-slate-300 self-center">VS</div>
          <div className="text-center">
            <p className="text-sm text-slate-500">{opponent}</p>
            <p className="text-4xl font-bold text-slate-600">{opponentScore}</p>
          </div>
        </div>
        
        <p className="text-lg text-green-600 font-semibold mb-6">
          +{won ? 50 : tie ? 25 : 10} moedas ganhas!
        </p>
        
        <button
          onClick={() => onEnd(won ? 50 : tie ? 25 : 10)}
          className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition"
        >
          Continuar
        </button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div>
      {/* Header com placar */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-center">
          <p className="text-xs text-slate-500">Tu</p>
          <p className="text-2xl font-bold text-purple-600">{playerScore}</p>
        </div>
        
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
            timeLeft <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-700'
          }`}>
            {timeLeft}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {currentQuestion + 1}/{questions.length}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-xs text-slate-500">{opponent}</p>
          <p className="text-2xl font-bold text-slate-600">{opponentScore}</p>
        </div>
      </div>

      {/* Pergunta */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-6 text-white mb-6">
        <p className="text-lg font-semibold" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {question.question_text}
        </p>
      </div>

      {/* Opções */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option, index) => {
          let buttonClass = 'bg-white border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50';
          
          if (answered) {
            if (index === question.correct_answer) {
              buttonClass = 'bg-green-100 border-2 border-green-500';
            } else if (index === selectedAnswer) {
              buttonClass = 'bg-red-100 border-2 border-red-500';
            } else {
              buttonClass = 'bg-slate-100 border-2 border-slate-200 opacity-50';
            }
          }
          
          return (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              className={`p-4 rounded-xl font-medium transition ${buttonClass}`}
            >
              <span className="text-sm">{option}</span>
              {answered && index === question.correct_answer && (
                <Check className="inline ml-2 text-green-600" size={18} />
              )}
              {answered && index === selectedAnswer && index !== question.correct_answer && (
                <X className="inline ml-2 text-red-600" size={18} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Componente Principal de Mini-jogos
const MiniGamesHub = ({ childId, childName, onClose }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const startGame = async (game) => {
    setSelectedGame(game);
    setLoading(true);
    
    try {
      // Buscar perguntas para o quiz duel
      if (game.id === 'quiz_duel') {
        const response = await axios.get(`${API}/minigames/quiz-questions`, {
          params: { count: 5 },
          withCredentials: true
        });
        setQuestions(response.data);
      }
      setGameStarted(true);
    } catch (error) {
      console.error('Error starting game:', error);
      // Usar perguntas de fallback
      setQuestions([
        { question_text: "Qual é a capital de Portugal?", options: ["Lisboa", "Porto", "Braga", "Coimbra"], correct_answer: 0 },
        { question_text: "Quanto é 7 x 8?", options: ["54", "56", "58", "62"], correct_answer: 1 },
        { question_text: "Quem escreveu 'Os Lusíadas'?", options: ["Fernando Pessoa", "Camões", "Eça de Queirós", "Saramago"], correct_answer: 1 },
        { question_text: "Qual é o maior planeta do Sistema Solar?", options: ["Terra", "Marte", "Júpiter", "Saturno"], correct_answer: 2 },
        { question_text: "Em que ano foi o 25 de Abril?", options: ["1970", "1972", "1974", "1976"], correct_answer: 2 }
      ]);
      setGameStarted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGameEnd = async (coinsWon) => {
    try {
      // Registar resultado do jogo
      await axios.post(`${API}/minigames/result`, {
        game_id: selectedGame.id,
        opponent_id: childId,
        coins_won: coinsWon
      }, { withCredentials: true });
      
      toast.success(`+${coinsWon} moedas! Jogo registado.`);
    } catch (error) {
      console.error('Error saving game result:', error);
    }
    
    setGameStarted(false);
    setSelectedGame(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Gamepad2 className="inline mr-2" size={28} />
                Mini-Jogos
              </h2>
              {childName && (
                <p className="text-white/80 text-sm mt-1">
                  A jogar com {childName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition"
              data-testid="close-minigames-btn"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500 mx-auto"></div>
              <p className="mt-4 text-slate-500">A preparar o jogo...</p>
            </div>
          ) : gameStarted && selectedGame ? (
            // Área do jogo ativo
            <div>
              {selectedGame.id === 'quiz_duel' && (
                <QuizDuelGame
                  opponent={childName || 'Filho'}
                  questions={questions}
                  onEnd={handleGameEnd}
                />
              )}
              
              {selectedGame.id === 'memory_match' && (
                <MemoryMatchGame
                  onGameEnd={handleGameEnd}
                  difficulty="medium"
                />
              )}
              
              {selectedGame.id === 'speed_math' && (
                <SpeedMathGame
                  onGameEnd={handleGameEnd}
                  difficulty="medium"
                />
              )}
            </div>
          ) : (
            // Lista de jogos
            <div>
              <p className="text-slate-600 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Escolhe um jogo para desafiar o teu filho! Ambos ganham moedas no final.
              </p>
              
              <div className="grid md:grid-cols-3 gap-4">
                {Object.values(MINIGAMES).map(game => (
                  <MiniGameCard
                    key={game.id}
                    game={game}
                    onSelect={startGame}
                    disabled={false}
                  />
                ))}
              </div>
              
              {/* Histórico de jogos */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  <Trophy className="inline mr-2 text-yellow-500" size={20} />
                  Últimos Jogos
                </h3>
                <div className="text-center py-4 text-slate-400 text-sm">
                  Nenhum jogo registado ainda. Começa a jogar!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiniGamesHub;
