import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Trophy, Zap, Check, X, RotateCcw, Calculator } from 'lucide-react';

// Gerar problema matemático com base na dificuldade
const generateProblem = (difficulty, streak) => {
  const operations = ['+', '-', '×'];
  
  let maxNum, includeMultiply, allowNegative;
  
  // Ajustar dificuldade baseado no streak
  const adjustedDiff = Math.min(streak + 1, 5);
  
  switch (difficulty) {
    case 'easy':
      maxNum = 10 + adjustedDiff * 2;
      includeMultiply = adjustedDiff > 2;
      allowNegative = false;
      break;
    case 'medium':
      maxNum = 20 + adjustedDiff * 5;
      includeMultiply = true;
      allowNegative = adjustedDiff > 3;
      break;
    case 'hard':
      maxNum = 50 + adjustedDiff * 10;
      includeMultiply = true;
      allowNegative = true;
      break;
    default:
      maxNum = 20;
      includeMultiply = true;
      allowNegative = false;
  }
  
  const ops = includeMultiply ? operations : operations.slice(0, 2);
  const op = ops[Math.floor(Math.random() * ops.length)];
  
  let a, b, answer;
  
  if (op === '×') {
    a = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
    b = Math.floor(Math.random() * Math.min(maxNum, 12)) + 1;
    answer = a * b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * maxNum) + 1;
    b = Math.floor(Math.random() * (allowNegative ? maxNum : a)) + 1;
    answer = a - b;
  } else {
    a = Math.floor(Math.random() * maxNum) + 1;
    b = Math.floor(Math.random() * maxNum) + 1;
    answer = a + b;
  }
  
  // Gerar opções de resposta
  const options = [answer];
  while (options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const wrongAnswer = answer + offset + (offset === 0 ? 1 : 0);
    if (!options.includes(wrongAnswer)) {
      options.push(wrongAnswer);
    }
  }
  
  // Baralhar opções
  options.sort(() => Math.random() - 0.5);
  
  return {
    question: `${a} ${op} ${b} = ?`,
    answer,
    options,
    timeLimit: Math.max(5, 10 - Math.floor(streak / 3)) // Menos tempo com mais streak
  };
};

// Componente principal
const SpeedMathGame = ({ onGameEnd, difficulty = 'medium' }) => {
  const [problem, setProblem] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60); // Tempo total do jogo
  const [questionTimeLeft, setQuestionTimeLeft] = useState(10);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [gameStatus, setGameStatus] = useState('playing');
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const inputRef = useRef(null);

  // Gerar novo problema
  const nextProblem = useCallback(() => {
    const newProblem = generateProblem(difficulty, streak);
    setProblem(newProblem);
    setQuestionTimeLeft(newProblem.timeLimit);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(false);
  }, [difficulty, streak]);

  // Iniciar jogo
  useEffect(() => {
    nextProblem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer do jogo
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    if (timeLeft <= 0) {
      setGameStatus('finished');
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameStatus]);

  // Timer da pergunta
  useEffect(() => {
    if (gameStatus !== 'playing' || answered) return;
    
    if (questionTimeLeft <= 0) {
      // Tempo esgotado para esta pergunta
      setAnswered(true);
      setIsCorrect(false);
      setStreak(0);
      
      setTimeout(() => {
        setQuestionsAnswered(q => q + 1);
        nextProblem();
      }, 1000);
      return;
    }

    const timer = setTimeout(() => setQuestionTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [questionTimeLeft, gameStatus, answered, nextProblem]);

  // Responder
  const handleAnswer = (answer) => {
    if (answered) return;
    
    setAnswered(true);
    setSelectedAnswer(answer);
    const correct = answer === problem.answer;
    setIsCorrect(correct);
    
    if (correct) {
      const bonus = Math.floor(questionTimeLeft * 10) + streak * 5;
      setScore(s => s + 10 + bonus);
      setStreak(s => s + 1);
      setBestStreak(b => Math.max(b, streak + 1));
    } else {
      setStreak(0);
    }
    
    setTimeout(() => {
      setQuestionsAnswered(q => q + 1);
      nextProblem();
    }, 800);
  };

  // Calcular recompensas
  const calculateRewards = () => {
    const baseCoins = Math.floor(score / 10);
    const streakBonus = bestStreak * 2;
    return Math.max(10, baseCoins + streakBonus);
  };

  // Tela de resultado
  if (gameStatus === 'finished') {
    const coinsWon = calculateRewards();
    const accuracy = questionsAnswered > 0 
      ? Math.round((score / (questionsAnswered * 10)) * 100) 
      : 0;
    
    return (
      <div className="text-center py-8">
        <div className="w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 bg-gradient-to-br from-[hsl(38,95%,60%)] to-emerald-600">
          <Calculator className="text-white" size={48} />
        </div>
        
        <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          🧮 Tempo Esgotado!
        </h2>
        <p className="text-slate-500 mb-6">Aqui estão os teus resultados:</p>
        
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-[hsl(28,80%,38%)] rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">{score}</p>
            <p className="text-xs text-white/80">Pontuação</p>
          </div>
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-4 text-white">
            <p className="text-3xl font-bold">{bestStreak}</p>
            <p className="text-xs text-white/80">Melhor Streak</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-700">{questionsAnswered}</p>
            <p className="text-xs text-slate-500">Perguntas</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-slate-700">{accuracy}%</p>
            <p className="text-xs text-slate-500">Precisão</p>
          </div>
        </div>
        
        <p className="text-lg text-[hsl(28,85%,40%)] font-semibold mb-6">
          +{coinsWon} moedas ganhas!
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => {
              setScore(0);
              setStreak(0);
              setBestStreak(0);
              setTimeLeft(60);
              setQuestionsAnswered(0);
              setGameStatus('playing');
              nextProblem();
            }}
            className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Jogar Novamente
          </button>
          <button
            onClick={() => onGameEnd(coinsWon)}
            className="px-8 py-3 bg-gradient-to-r from-[hsl(35,92%,50%)] to-emerald-600 text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 px-4 py-2 rounded-xl">
            <span className="text-sm text-purple-600">Pontos</span>
            <p className="text-xl font-bold text-purple-700">{score}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl ${
            streak >= 3 ? 'bg-orange-100' : 'bg-slate-100'
          }`}>
            <span className="text-sm text-slate-600">Streak</span>
            <p className={`text-xl font-bold ${
              streak >= 3 ? 'text-orange-600' : 'text-slate-700'
            }`}>
              {streak >= 3 ? `🔥 ${streak}` : streak}
            </p>
          </div>
        </div>
        
        {/* Tempo total */}
        <div className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 ${
          timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[hsl(200,55%,88%)] text-[hsl(28,85%,32%)]'
        }`}>
          <Clock size={20} />
          {timeLeft}s
        </div>
      </div>

      {/* Timer da pergunta */}
      <div className="mb-4">
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              questionTimeLeft <= 3 ? 'bg-red-500' : 'bg-[hsl(35,92%,50%)]'
            }`}
            style={{ width: `${(questionTimeLeft / problem.timeLimit) * 100}%` }}
          />
        </div>
      </div>

      {/* Pergunta */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white text-center mb-6">
        <p className="text-5xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>
          {problem.question}
        </p>
        {streak >= 3 && (
          <p className="text-white/80 text-sm">
            <Zap className="inline mr-1" size={14} />
            Streak de {streak}! Bónus ativo!
          </p>
        )}
      </div>

      {/* Opções */}
      <div className="grid grid-cols-2 gap-3">
        {problem.options.map((option, index) => {
          let buttonClass = 'bg-white border-2 border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-slate-800';
          
          if (answered) {
            if (option === problem.answer) {
              buttonClass = 'bg-[hsl(142,45%,88%)] border-2 border-[hsl(35,92%,50%)] text-[hsl(28,85%,32%)]';
            } else if (option === selectedAnswer) {
              buttonClass = 'bg-red-100 border-2 border-red-500 text-red-800';
            } else {
              buttonClass = 'bg-slate-100 border-2 border-slate-200 text-slate-400';
            }
          }
          
          return (
            <button
              key={index}
              onClick={() => handleAnswer(option)}
              disabled={answered}
              className={`p-6 rounded-2xl font-bold text-2xl transition ${buttonClass}`}
            >
              {option}
              {answered && option === problem.answer && (
                <Check className="inline ml-2 text-[hsl(28,85%,40%)]" size={24} />
              )}
              {answered && option === selectedAnswer && option !== problem.answer && (
                <X className="inline ml-2 text-red-600" size={24} />
              )}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {answered && (
        <div className={`mt-4 p-3 rounded-xl text-center font-semibold ${
          isCorrect ? 'bg-[hsl(142,45%,88%)] text-[hsl(28,85%,32%)]' : 'bg-red-100 text-red-700'
        }`}>
          {isCorrect ? (
            <>
              <Check className="inline mr-2" size={18} />
              Correto! +{10 + Math.floor(questionTimeLeft * 10) + (streak > 0 ? streak * 5 : 0)} pontos
            </>
          ) : (
            <>
              <X className="inline mr-2" size={18} />
              Resposta correta: {problem.answer}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SpeedMathGame;
