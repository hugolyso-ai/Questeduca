import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Trophy, RotateCcw, Sparkles } from 'lucide-react';

// Emojis para as cartas
const CARD_SYMBOLS = ['🎓', '📚', '🎨', '🔬', '🌍', '🎵', '🧮', '🏆', '⭐', '🚀', '🌈', '🎯'];

// Componente de Carta
const MemoryCard = ({ card, isFlipped, isMatched, onClick }) => {
  return (
    <div
      className={`relative w-full aspect-square cursor-pointer transition-all duration-300 ${
        isMatched ? 'opacity-50 pointer-events-none' : ''
      }`}
      onClick={() => !isFlipped && !isMatched && onClick()}
      style={{ perspective: '1000px' }}
    >
      <div
        className={`relative w-full h-full transition-transform duration-500 ${
          isFlipped || isMatched ? 'rotate-y-180' : ''
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped || isMatched ? 'rotateY(180deg)' : 'rotateY(0)'
        }}
      >
        {/* Frente (virada para baixo) */}
        <div
          className="absolute w-full h-full bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-4xl">❓</span>
        </div>
        
        {/* Verso (símbolo) */}
        <div
          className={`absolute w-full h-full rounded-xl flex items-center justify-center shadow-lg ${
            isMatched ? 'bg-green-100 border-2 border-green-400' : 'bg-white border-2 border-slate-200'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <span className="text-4xl">{card.symbol}</span>
        </div>
      </div>
    </div>
  );
};

// Componente principal do jogo
const MemoryMatchGame = ({ onGameEnd, difficulty = 'medium' }) => {
  // Configuração de dificuldade
  const DIFFICULTY_CONFIG = {
    easy: { pairs: 6, gridCols: 3, timeLimit: 60 },
    medium: { pairs: 8, gridCols: 4, timeLimit: 90 },
    hard: { pairs: 12, gridCols: 4, timeLimit: 120 }
  };
  
  const config = DIFFICULTY_CONFIG[difficulty];
  
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [isChecking, setIsChecking] = useState(false);

  // Inicializar cartas
  const initializeGame = useCallback(() => {
    const symbols = CARD_SYMBOLS.slice(0, config.pairs);
    const cardPairs = [...symbols, ...symbols]
      .map((symbol, index) => ({ id: index, symbol, pairId: symbols.indexOf(symbol) }))
      .sort(() => Math.random() - 0.5);
    
    setCards(cardPairs);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimeLeft(config.timeLimit);
    setGameStatus('playing');
  }, [config.pairs, config.timeLimit]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'playing') return;
    
    if (timeLeft <= 0) {
      setGameStatus('lost');
      return;
    }

    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameStatus]);

  // Verificar vitória
  useEffect(() => {
    if (matchedPairs.length === config.pairs && gameStatus === 'playing') {
      setGameStatus('won');
    }
  }, [matchedPairs, config.pairs, gameStatus]);

  // Verificar par
  useEffect(() => {
    if (flippedIndices.length === 2 && !isChecking) {
      setIsChecking(true);
      const [first, second] = flippedIndices;
      
      setTimeout(() => {
        if (cards[first].pairId === cards[second].pairId) {
          // Par encontrado!
          setMatchedPairs(prev => [...prev, cards[first].pairId]);
        }
        setFlippedIndices([]);
        setIsChecking(false);
      }, 800);
    }
  }, [flippedIndices, cards, isChecking]);

  const handleCardClick = (index) => {
    if (isChecking || flippedIndices.length >= 2 || flippedIndices.includes(index)) return;
    
    setFlippedIndices(prev => [...prev, index]);
    setMoves(m => m + 1);
  };

  const isCardFlipped = (index) => flippedIndices.includes(index);
  const isCardMatched = (index) => matchedPairs.includes(cards[index]?.pairId);

  // Calcular pontuação
  const calculateScore = () => {
    if (gameStatus !== 'won') return 0;
    
    const baseScore = 100;
    const timeBonus = Math.floor(timeLeft * 2);
    const movePenalty = Math.max(0, moves - config.pairs * 2) * 2;
    
    return Math.max(10, baseScore + timeBonus - movePenalty);
  };

  // Tela de resultado
  if (gameStatus !== 'playing') {
    const score = calculateScore();
    const coinsWon = gameStatus === 'won' ? Math.floor(score / 2) : 10;
    
    return (
      <div className="text-center py-8">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${
          gameStatus === 'won' 
            ? 'bg-gradient-to-br from-yellow-400 to-amber-500' 
            : 'bg-gradient-to-br from-slate-400 to-slate-600'
        }`}>
          {gameStatus === 'won' ? (
            <Trophy className="text-white" size={48} />
          ) : (
            <Clock className="text-white" size={48} />
          )}
        </div>
        
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          {gameStatus === 'won' ? '🎉 Parabéns!' : '⏰ Tempo Esgotado!'}
        </h2>
        
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
          <div className="bg-slate-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-purple-600">{moves}</p>
            <p className="text-xs text-slate-500">Jogadas</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-blue-600">{matchedPairs.length}</p>
            <p className="text-xs text-slate-500">Pares</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-green-600">{score}</p>
            <p className="text-xs text-slate-500">Pontos</p>
          </div>
        </div>
        
        <p className="text-lg text-green-600 font-semibold mb-6">
          +{coinsWon} moedas ganhas!
        </p>
        
        <div className="flex gap-3 justify-center">
          <button
            onClick={initializeGame}
            className="px-6 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition flex items-center gap-2"
          >
            <RotateCcw size={18} />
            Jogar Novamente
          </button>
          <button
            onClick={() => onGameEnd(coinsWon)}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header com info do jogo */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 px-4 py-2 rounded-xl">
            <span className="text-sm text-purple-600">Jogadas</span>
            <p className="text-xl font-bold text-purple-700">{moves}</p>
          </div>
          <div className="bg-green-100 px-4 py-2 rounded-xl">
            <span className="text-sm text-green-600">Pares</span>
            <p className="text-xl font-bold text-green-700">{matchedPairs.length}/{config.pairs}</p>
          </div>
        </div>
        
        <div className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 ${
          timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-amber-100 text-amber-700'
        }`}>
          <Clock size={20} />
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Grelha de cartas */}
      <div 
        className={`grid gap-3`}
        style={{ gridTemplateColumns: `repeat(${config.gridCols}, 1fr)` }}
      >
        {cards.map((card, index) => (
          <MemoryCard
            key={card.id}
            card={card}
            isFlipped={isCardFlipped(index)}
            isMatched={isCardMatched(index)}
            onClick={() => handleCardClick(index)}
          />
        ))}
      </div>

      {/* Dica */}
      <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-sm">
        <Sparkles size={16} />
        Encontra todos os pares antes do tempo acabar!
      </div>
    </div>
  );
};

export default MemoryMatchGame;
