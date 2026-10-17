import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Trophy, RotateCcw, Sparkles, BookOpen } from 'lucide-react';

// Emojis para as cartas
const CARD_SYMBOLS = ['🎓', '📚', '🎨', '🔬', '🌍', '🎵', '🧮', '🏆', '⭐', '🚀', '🌈', '🎯'];

// Pares curriculares por disciplina: [conceito, definição/resposta]
const EDUCATIONAL_PAIRS = {
  matematica: [
    ['7 × 8', '56'], ['9 × 6', '54'], ['½', '0,5'], ['Perímetro', 'Soma dos lados'],
    ['100 ÷ 4', '25'], ['Triângulo', '3 lados'], ['12 × 12', '144'], ['Quadrado', '4 lados iguais'],
  ],
  portugues: [
    ['Sinónimo de "feliz"', 'Contente'], ['Plural de "pão"', 'Pães'], ['Antónimo de "alto"', 'Baixo'],
    ['Sujeito', 'Quem faz a ação'], ['"cão" rima com', 'Pão'], ['Adjetivo', 'Característica do nome'],
    ['Plural de "cidadão"', 'Cidadãos'], ['Interrogação', 'Sinal de pergunta ?'],
  ],
  ciencias: [
    ['Fotossíntese', 'Plantas produzem alimento'], ['Coração', 'Bombeia o sangue'], ['Marte', 'Planeta vermelho'],
    ['H2O', 'Água'], ['Esqueleto', 'Sustenta o corpo'], ['Polinização', 'Abelhas ajudam plantas'],
    ['Pulmões', 'Respiração'], ['Solar', 'Energia do Sol'],
  ],
  historia: [
    ['1498', 'Chegada à Índia'], ['D. Afonso Henriques', '1.º rei de Portugal'], ['1143', 'Nascimento de Portugal'],
    ['Vasco da Gama', 'Descobridor do caminho marítimo'], ['Romana', 'Civilização do Coliseu'],
    ['Lusíadas', 'Poema de Camões'], ['Castelo', 'Fortaleza medieval'], ['Egitânia', 'Nome antigo de Idanha'],
  ],
  geografia: [
    ['Lisboa', 'Capital de Portugal'], ['Atlântico', 'Oceano de Portugal'], ['Tejo', 'Rio mais extenso da PP'],
    ['Serra da Estrela', 'Montanha mais alta da PP'], ['Espanha', 'Único vizinho da PP'],
    ['Madrid', 'Capital de Espanha'], ['Algarve', 'Região mais a sul'], ['Minho', 'Região mais a norte'],
  ],
  ingles: [
    ['Dog', 'Cão'], ['House', 'Casa'], ['Red', 'Vermelho'], ['Seven', 'Sete'],
    ['Book', 'Livro'], ['Sun', 'Sol'], ['Friend', 'Amigo'], ['Water', 'Água'],
  ],
};
const EDU_SUBJECTS = [
  { id: 'matematica', name: 'Matemática', emoji: '🧮' },
  { id: 'portugues', name: 'Português', emoji: '📖' },
  { id: 'ciencias', name: 'Ciências', emoji: '🔬' },
  { id: 'historia', name: 'História', emoji: '🏰' },
  { id: 'geografia', name: 'Geografia', emoji: '🗺️' },
  { id: 'ingles', name: 'Inglês', emoji: '🇬🇧' },
];

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
          className="absolute w-full h-full bg-gradient-to-br from-purple-500 to-[hsl(24,70%,42%)] rounded-xl flex items-center justify-center shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span className="text-4xl">❓</span>
        </div>
        
        {/* Verso (símbolo ou conceito) */}
        <div
          className={`absolute w-full h-full rounded-xl flex items-center justify-center shadow-lg p-1 text-center ${
            isMatched ? 'bg-[hsl(142,45%,88%)] border-2 border-green-400' : 'bg-white border-2 border-slate-200'
          }`}
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {card.text ? (
            <span className="text-[11px] font-bold text-slate-700 leading-tight">{card.text}</span>
          ) : (
            <span className="text-4xl">{card.symbol}</span>
          )}
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
  const [eduSubject, setEduSubject] = useState(null); // null = modo emoji clássico
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimit);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, won, lost
  const [isChecking, setIsChecking] = useState(false);

  // Inicializar cartas
  const initializeGame = useCallback(() => {
    let cardPairs;
    if (eduSubject) {
      // Modo curricular: par conceito <-> resposta
      const pairs = [...EDUCATIONAL_PAIRS[eduSubject]].sort(() => Math.random() - 0.5).slice(0, config.pairs);
      cardPairs = pairs.flatMap(([concept, answer], pi) => ([
        { id: pi * 2, text: concept, pairId: pi },
        { id: pi * 2 + 1, text: answer, pairId: pi },
      ])).sort(() => Math.random() - 0.5);
    } else {
      const symbols = CARD_SYMBOLS.slice(0, config.pairs);
      cardPairs = [...symbols, ...symbols]
        .map((symbol, index) => ({ id: index, symbol, pairId: symbols.indexOf(symbol) }))
        .sort(() => Math.random() - 0.5);
    }
    setCards(cardPairs);
    setFlippedIndices([]);
    setMatchedPairs([]);
    setMoves(0);
    setTimeLeft(config.timeLimit);
    setGameStatus('playing');
  }, [config.pairs, config.timeLimit, eduSubject]);

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
        
        <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
          {gameStatus === 'won' ? '🎉 Parabéns!' : '⏰ Tempo Esgotado!'}
        </h2>
        
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-6">
          <div className="bg-slate-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-purple-600">{moves}</p>
            <p className="text-xs text-slate-500">Jogadas</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-[hsl(28,85%,40%)]">{matchedPairs.length}</p>
            <p className="text-xs text-slate-500">Pares</p>
          </div>
          <div className="bg-slate-100 rounded-xl p-3">
            <p className="text-2xl font-bold text-[hsl(28,85%,40%)]">{score}</p>
            <p className="text-xs text-slate-500">Pontos</p>
          </div>
        </div>
        
        <p className="text-lg text-[hsl(28,85%,40%)] font-semibold mb-6">
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
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-[hsl(24,70%,42%)] text-white font-bold rounded-xl hover:opacity-90 transition"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Seletor de modo */}
      <div className="mb-5">
        <p className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-2">
          <BookOpen size={16} />
          Modo de jogo: {eduSubject ? `curricular — ${EDU_SUBJECTS.find(s => s.id === eduSubject)?.name}` : 'clássico (emojis)'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setEduSubject(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              eduSubject === null ? 'bg-purple-500 text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🎨 Clássico
          </button>
          {EDU_SUBJECTS.map(s => (
            <button
              key={s.id}
              onClick={() => setEduSubject(s.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                eduSubject === s.id ? 'bg-[hsl(35,92%,50%)] text-white shadow' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.emoji} {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Header com info do jogo */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-purple-100 px-4 py-2 rounded-xl">
            <span className="text-sm text-purple-600">Jogadas</span>
            <p className="text-xl font-bold text-purple-700">{moves}</p>
          </div>
          <div className="bg-[hsl(142,45%,88%)] px-4 py-2 rounded-xl">
            <span className="text-sm text-[hsl(28,85%,40%)]">Pares</span>
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
        {eduSubject
          ? 'Encontra cada conceito e a sua resposta antes do tempo acabar!'
          : 'Encontra todos os pares antes do tempo acabar!'}
      </div>
    </div>
  );
};

export default MemoryMatchGame;
