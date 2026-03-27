import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Coins, Diamond, Star, Building2, BookOpen, 
  Trophy, Clock, ChevronUp, Play, Check, X, Sparkles,
  Home, School, Library, Store, TreePine, Award, Medal,
  Crown, Users, MapPin, Search, UserPlus, Settings, Eye, Calendar
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { PortugalFriendMap } from '../components/PortugalMap';
import AccessibilityPanel from '../components/AccessibilityPanel';
import { AchievementsList } from '../components/AchievementsSystem';
import WeeklyChallenges from '../components/WeeklyChallenges';
import MonthlyLeagues from '../components/MonthlyLeagues';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Configuração dos edifícios da cidade
const BUILDINGS_CONFIG = {
  town_hall: {
    name: "Câmara Municipal",
    icon: Building2,
    color: "from-amber-400 to-orange-500",
    description: "Centro da tua cidade. Melhora para desbloquear mais edifícios!",
    baseCost: 0,
    upgradeCost: [0, 100, 250, 500, 1000],
    benefits: ["Nível base", "+5% moedas", "+10% moedas", "+15% moedas", "+20% moedas"]
  },
  school: {
    name: "Escola",
    icon: School,
    color: "from-blue-400 to-blue-600",
    description: "Onde aprendes! Melhora para ganhar mais XP.",
    baseCost: 50,
    upgradeCost: [50, 150, 300, 600, 1200],
    benefits: ["XP base", "+10% XP", "+20% XP", "+30% XP", "+50% XP"]
  },
  library: {
    name: "Biblioteca",
    icon: Library,
    color: "from-purple-400 to-purple-600",
    description: "Conhecimento é poder! Desbloqueia dicas nos quizzes.",
    baseCost: 100,
    upgradeCost: [100, 200, 400, 800, 1500],
    benefits: ["Sem dicas", "1 dica/quiz", "2 dicas/quiz", "3 dicas/quiz", "Dicas ilimitadas"]
  },
  market: {
    name: "Mercado",
    icon: Store,
    color: "from-green-400 to-emerald-600",
    description: "Troca e comércio! Descontos em upgrades.",
    baseCost: 150,
    upgradeCost: [150, 300, 500, 900, 1800],
    benefits: ["Preço normal", "-5% custo", "-10% custo", "-15% custo", "-20% custo"]
  },
  house: {
    name: "Casa",
    icon: Home,
    color: "from-rose-400 to-pink-600",
    description: "O teu lar! Mais conforto = mais energia para quizzes.",
    baseCost: 75,
    upgradeCost: [75, 175, 350, 700, 1400],
    benefits: ["3 quizzes/dia", "5 quizzes/dia", "7 quizzes/dia", "10 quizzes/dia", "Ilimitado"]
  },
  garden: {
    name: "Jardim",
    icon: TreePine,
    color: "from-lime-400 to-green-600",
    description: "Natureza e beleza! Ganha diamantes bónus.",
    baseCost: 200,
    upgradeCost: [200, 400, 700, 1200, 2000],
    benefits: ["Sem bónus", "+1 💎/dia", "+2 💎/dia", "+3 💎/dia", "+5 💎/dia"]
  }
};

// Níveis da cidade
const SETTLEMENT_LEVELS = {
  village: { name: "Aldeia", minLevel: 0, color: "text-amber-600" },
  town: { name: "Vila", minLevel: 10, color: "text-blue-600" },
  city: { name: "Cidade", minLevel: 25, color: "text-purple-600" },
  metropolis: { name: "Metrópole", minLevel: 50, color: "text-yellow-500" }
};

// Componente de Edifício
const BuildingCard = ({ buildingId, config, level, coins, onUpgrade, disabled }) => {
  const Icon = config.icon;
  const canAfford = coins >= config.upgradeCost[level];
  const isMaxLevel = level >= 5;
  
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-lg border-2 ${level > 0 ? 'border-slate-200' : 'border-dashed border-slate-300'} transition-all hover:shadow-xl`}>
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-3 mx-auto ${level === 0 ? 'opacity-50' : ''}`}>
        <Icon className="text-white" size={28} />
      </div>
      
      <h4 className="font-bold text-slate-800 text-center mb-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>
        {config.name}
      </h4>
      
      <div className="flex items-center justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <Star 
            key={i} 
            size={14} 
            className={i <= level ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
          />
        ))}
      </div>
      
      <p className="text-xs text-slate-500 text-center mb-3" style={{ fontFamily: 'Nunito, sans-serif' }}>
        {config.benefits[level]}
      </p>
      
      {!isMaxLevel ? (
        <button
          onClick={() => onUpgrade(buildingId)}
          disabled={disabled || !canAfford}
          className={`w-full py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-1 transition ${
            canAfford && !disabled
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white hover:opacity-90'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          data-testid={`upgrade-${buildingId}-btn`}
        >
          <ChevronUp size={16} />
          {level === 0 ? 'Construir' : 'Melhorar'} ({config.upgradeCost[level]} 💰)
        </button>
      ) : (
        <div className="w-full py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-lg font-semibold text-sm text-center">
          <Check size={16} className="inline mr-1" /> Máximo
        </div>
      )}
    </div>
  );
};

// Componente de Quiz
const QuizModal = ({ isOpen, quiz, onClose, onAnswer, currentQuestion, answered, selectedAnswer, isCorrect }) => {
  if (!isOpen || !quiz) return null;
  
  const question = quiz.questions[currentQuestion];
  if (!question) return null;
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm opacity-80">Pergunta {currentQuestion + 1} de {quiz.questions.length}</span>
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {quiz.subject}
              </h3>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Coins size={14} /> {question.coins_reward}
              </div>
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Star size={14} /> {question.xp_reward} XP
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-3 bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Question */}
        <div className="p-6">
          <p className="text-xl font-semibold text-slate-800 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {question.question_text}
          </p>
          
          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((option, index) => {
              let optionClass = "border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50";
              
              if (answered) {
                if (index === question.correct_answer) {
                  optionClass = "border-2 border-green-500 bg-green-50";
                } else if (index === selectedAnswer && !isCorrect) {
                  optionClass = "border-2 border-red-500 bg-red-50";
                } else {
                  optionClass = "border-2 border-slate-200 opacity-50";
                }
              }
              
              return (
                <button
                  key={index}
                  onClick={() => !answered && onAnswer(index)}
                  disabled={answered}
                  className={`p-4 rounded-xl text-left transition-all ${optionClass}`}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      answered && index === question.correct_answer
                        ? 'bg-green-500 text-white'
                        : answered && index === selectedAnswer && !isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium text-slate-700">{option}</span>
                    {answered && index === question.correct_answer && (
                      <Check className="ml-auto text-green-500" size={20} />
                    )}
                    {answered && index === selectedAnswer && !isCorrect && (
                      <X className="ml-auto text-red-500" size={20} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Explanation (shown after answering) */}
          {answered && question.explanation && (
            <div className={`mt-4 p-4 rounded-xl ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}>
              <p className="text-sm font-medium text-slate-700">
                <Sparkles className="inline mr-1" size={14} />
                {question.explanation}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-full font-semibold hover:bg-slate-300 transition"
          >
            {answered ? 'Próxima' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Principal
const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const { settings } = useAccessibility();
  const navigate = useNavigate();
  
  // Estado do jogo
  const [gameState, setGameState] = useState({
    coins: 100,
    diamonds: 5,
    xp: 0,
    level: 1,
    buildings: {
      town_hall: 1,
      school: 0,
      library: 0,
      market: 0,
      house: 0,
      garden: 0
    },
    quizzes_today: 0,
    last_quiz_date: null
  });
  
  const [studentProfile, setStudentProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('city');
  
  // Quiz state
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [quizResults, setQuizResults] = useState({ correct: 0, coins: 0, xp: 0 });

  // Rankings state
  const [rankings, setRankings] = useState({ school: null, district: null, national: null });
  const [rankingType, setRankingType] = useState('school');
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Friends state
  const [friends, setFriends] = useState([]);
  const [friendSearch, setFriendSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [showMapView, setShowMapView] = useState(true);

  // Accessibility state
  const [showAccessibility, setShowAccessibility] = useState(false);

  // Calcular nível total dos edifícios
  const totalBuildingLevel = Object.values(gameState.buildings).reduce((a, b) => a + b, 0);
  
  // Determinar nível da cidade
  const getSettlementLevel = () => {
    if (totalBuildingLevel >= 50) return SETTLEMENT_LEVELS.metropolis;
    if (totalBuildingLevel >= 25) return SETTLEMENT_LEVELS.city;
    if (totalBuildingLevel >= 10) return SETTLEMENT_LEVELS.town;
    return SETTLEMENT_LEVELS.village;
  };
  
  const settlement = getSettlementLevel();

  // Carregar dados do jogador
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, gameRes] = await Promise.all([
          axios.get(`${API}/students/me`, { withCredentials: true }),
          axios.get(`${API}/game/state`, { withCredentials: true }).catch(() => ({ data: null }))
        ]);
        
        setStudentProfile(profileRes.data);
        
        // Obter disciplinas para o ano escolar
        const year = profileRes.data.school_year;
        const subjectsRes = await axios.get(`${API}/subjects/${year}`);
        setSubjects(subjectsRes.data || []);
        
        if (gameRes.data) {
          setGameState(prev => ({
            ...prev,
            coins: gameRes.data.coins || 100,
            diamonds: gameRes.data.diamonds || 5,
            xp: gameRes.data.xp || 0,
            level: gameRes.data.level || 1,
            buildings: gameRes.data.buildings || prev.buildings
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Função para upgrade de edifício
  const handleUpgrade = useCallback(async (buildingId) => {
    const config = BUILDINGS_CONFIG[buildingId];
    const currentLevel = gameState.buildings[buildingId];
    const cost = config.upgradeCost[currentLevel];
    
    if (gameState.coins < cost || currentLevel >= 5) return;
    
    // Aplicar desconto do mercado
    const marketLevel = gameState.buildings.market;
    const discount = marketLevel * 0.05;
    const finalCost = Math.floor(cost * (1 - discount));
    
    setGameState(prev => ({
      ...prev,
      coins: prev.coins - finalCost,
      buildings: {
        ...prev.buildings,
        [buildingId]: currentLevel + 1
      }
    }));
    
    // Salvar no backend
    try {
      await axios.post(`${API}/game/upgrade`, {
        building_id: buildingId,
        cost: finalCost
      }, { withCredentials: true });
      
      toast.success(
        <div>
          <p className="font-bold">{config.name} melhorado!</p>
          <p className="text-sm">Nível {currentLevel + 1}</p>
        </div>
      );
    } catch (error) {
      console.error('Error upgrading:', error);
    }
  }, [gameState]);

  // Função para iniciar quiz
  const startQuiz = async (subject) => {
    setQuizLoading(true);
    try {
      const response = await axios.get(`${API}/quiz/generate`, {
        params: {
          school_year: studentProfile?.school_year || '1',
          subject: subject,
          count: 5
        },
        withCredentials: true
      });
      
      setCurrentQuiz(response.data);
      setCurrentQuestion(0);
      setAnswered(false);
      setSelectedAnswer(null);
      setQuizResults({ correct: 0, coins: 0, xp: 0 });
      
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Erro ao carregar quiz. Tenta novamente!');
    } finally {
      setQuizLoading(false);
    }
  };

  // Função para responder pergunta
  const handleAnswer = (answerIndex) => {
    const question = currentQuiz.questions[currentQuestion];
    const correct = answerIndex === question.correct_answer;
    
    setSelectedAnswer(answerIndex);
    setIsCorrect(correct);
    setAnswered(true);
    
    if (correct) {
      // Aplicar bónus da escola (XP) e câmara (moedas)
      const schoolBonus = 1 + (gameState.buildings.school * 0.1);
      const townHallBonus = 1 + (gameState.buildings.town_hall * 0.05);
      
      const coinsEarned = Math.floor(question.coins_reward * townHallBonus);
      const xpEarned = Math.floor(question.xp_reward * schoolBonus);
      
      setQuizResults(prev => ({
        correct: prev.correct + 1,
        coins: prev.coins + coinsEarned,
        xp: prev.xp + xpEarned
      }));
      
      setGameState(prev => ({
        ...prev,
        coins: prev.coins + coinsEarned,
        xp: prev.xp + xpEarned
      }));
    }
  };

  // Função para próxima pergunta ou fechar quiz
  const handleNextQuestion = () => {
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setAnswered(false);
      setSelectedAnswer(null);
    } else {
      // Quiz terminado
      toast.success(
        <div>
          <p className="font-bold">Quiz Completo!</p>
          <p className="text-sm">
            {quizResults.correct}/{currentQuiz.questions.length} corretas
          </p>
          <p className="text-sm">+{quizResults.coins} 💰 +{quizResults.xp} XP</p>
        </div>,
        { duration: 5000 }
      );
      setCurrentQuiz(null);
    }
  };

  // Fetch rankings data
  const fetchRankings = useCallback(async (type) => {
    if (!studentProfile) return;
    
    setRankingsLoading(true);
    try {
      let endpoint = '';
      if (type === 'school') {
        endpoint = `${API}/rankings/school/${studentProfile.school_id || 'default'}`;
      } else if (type === 'district') {
        endpoint = `${API}/rankings/district/${studentProfile.district}`;
      } else {
        endpoint = `${API}/rankings/national`;
      }
      
      const response = await axios.get(endpoint, { withCredentials: true });
      setRankings(prev => ({ ...prev, [type]: response.data }));
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast.error('Erro ao carregar rankings');
    } finally {
      setRankingsLoading(false);
    }
  }, [studentProfile]);

  // Fetch friends data
  const fetchFriends = useCallback(async () => {
    setFriendsLoading(true);
    try {
      const response = await axios.get(`${API}/friends/my`, { withCredentials: true });
      setFriends(response.data || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  }, []);

  // Search for friends
  const handleSearchFriends = async () => {
    if (!friendSearch.trim()) return;
    
    try {
      const response = await axios.get(`${API}/friends/search`, {
        params: { query: friendSearch },
        withCredentials: true
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Error searching friends:', error);
      toast.error('Erro ao pesquisar');
    }
  };

  // Send friend request
  const handleSendFriendRequest = async (toUserId) => {
    try {
      await axios.post(`${API}/friends/request`, null, {
        params: { to_user_id: toUserId },
        withCredentials: true
      });
      toast.success('Pedido de amizade enviado! O pai do aluno será notificado.');
      setSearchResults(prev => prev.filter(r => r.user_id !== toUserId));
    } catch (error) {
      console.error('Error sending friend request:', error);
      const msg = error.response?.data?.detail || 'Erro ao enviar pedido';
      toast.error(msg);
    }
  };

  // Load rankings when tab changes
  useEffect(() => {
    if (activeTab === 'rankings' && studentProfile) {
      fetchRankings(rankingType);
    }
  }, [activeTab, rankingType, studentProfile, fetchRankings]);

  // Load friends when tab changes
  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    }
  }, [activeTab, fetchFriends]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-slate-700">A carregar o teu mundo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-purple-100">
      {/* Top Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-white/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Player Info */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                {studentProfile?.nickname?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <h2 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {studentProfile?.nickname || 'Aventureiro'}
                </h2>
                <div className="flex items-center gap-1 text-sm">
                  <span className={`font-semibold ${settlement.color}`}>{settlement.name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">Nível {gameState.level}</span>
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
                <Coins className="text-yellow-900" size={18} />
                <span className="font-bold text-yellow-900">{gameState.coins}</span>
              </div>
              <div className="bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
                <Diamond className="text-white" size={18} />
                <span className="font-bold text-white">{gameState.diamonds}</span>
              </div>
              <div className="bg-gradient-to-r from-purple-400 to-pink-500 px-4 py-2 rounded-full flex items-center gap-2 shadow-md">
                <Star className="text-white" size={18} />
                <span className="font-bold text-white">{gameState.xp} XP</span>
              </div>
              <button
                onClick={() => setShowAccessibility(true)}
                className="p-2 hover:bg-slate-100 rounded-full transition"
                data-testid="accessibility-btn"
                title="Acessibilidade"
              >
                <Eye size={20} className="text-slate-600" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-100 rounded-full transition"
                data-testid="student-logout-btn"
              >
                <LogOut size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'city', label: 'Minha Cidade', icon: Building2 },
              { id: 'quiz', label: 'Aprender', icon: BookOpen },
              { id: 'challenges', label: 'Desafios', icon: Calendar },
              { id: 'league', label: 'Liga', icon: Crown },
              { id: 'rankings', label: 'Rankings', icon: Trophy },
              { id: 'friends', label: 'Amigos', icon: Users },
              { id: 'achievements', label: 'Conquistas', icon: Award },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-semibold transition border-b-3 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-purple-600 border-purple-500 bg-white/50' 
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        
        {/* City Tab */}
        {activeTab === 'city' && (
          <div>
            {/* Settlement Header */}
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-6 border-b-4 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-3xl font-bold ${settlement.color}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {settlement.name} de {studentProfile?.nickname || 'Aventureiro'}
                  </h2>
                  <p className="text-slate-600 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Nível total dos edifícios: {totalBuildingLevel}/30
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Próximo nível:</p>
                  <p className="font-bold text-purple-600">
                    {totalBuildingLevel < 10 ? 'Vila (10)' : 
                     totalBuildingLevel < 25 ? 'Cidade (25)' : 
                     totalBuildingLevel < 50 ? 'Metrópole (50)' : 'Máximo!'}
                  </p>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 bg-slate-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full h-3 transition-all"
                  style={{ width: `${Math.min((totalBuildingLevel / 50) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Buildings Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(BUILDINGS_CONFIG).map(([id, config]) => (
                <BuildingCard
                  key={id}
                  buildingId={id}
                  config={config}
                  level={gameState.buildings[id]}
                  coins={gameState.coins}
                  onUpgrade={handleUpgrade}
                  disabled={false}
                />
              ))}
            </div>

            {/* Tips */}
            <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Sparkles className="inline mr-2" size={20} />
                Dica do Dia
              </h3>
              <p style={{ fontFamily: 'Nunito, sans-serif' }}>
                Responde a quizzes para ganhar moedas e melhorar os teus edifícios! 
                Quanto mais alto o nível da Escola, mais XP ganhas em cada resposta certa.
              </p>
            </div>
          </div>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <div>
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <BookOpen className="inline mr-2 text-blue-500" />
                Aprender e Ganhar
              </h2>
              <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Escolhe uma disciplina e responde a perguntas para ganhar moedas!
              </p>
            </div>

            {/* Subjects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject, index) => (
                <div 
                  key={subject}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border-l-4"
                  style={{ borderColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'][index % 7] }}
                >
                  <h3 className="font-bold text-lg text-slate-800 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    {subject}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    5 perguntas • +50 moedas possíveis
                  </p>
                  <button
                    onClick={() => startQuiz(subject)}
                    disabled={quizLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
                    data-testid={`start-quiz-${subject.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    {quizLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    ) : (
                      <>
                        <Play size={18} />
                        Começar Quiz
                      </>
                    )}
                  </button>
                </div>
              ))}
              
              {subjects.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500">A carregar disciplinas...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rankings Tab */}
        {activeTab === 'rankings' && (
          <div>
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Trophy className="inline mr-2 text-yellow-500" />
                Rankings
              </h2>
              <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Vê como te comparas com outros alunos!
              </p>
            </div>

            {/* Ranking Type Selector */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'school', label: 'Minha Escola', icon: School },
                { id: 'district', label: 'Meu Distrito', icon: MapPin },
                { id: 'national', label: 'Nacional', icon: Crown },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setRankingType(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition ${
                    rankingType === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                      : 'bg-white text-slate-600 hover:bg-slate-50 shadow'
                  }`}
                  data-testid={`ranking-type-${tab.id}`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Rankings List */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              {rankingsLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-500 mx-auto"></div>
                  <p className="mt-4 text-slate-500">A carregar rankings...</p>
                </div>
              ) : rankings[rankingType]?.entries?.length > 0 ? (
                <div>
                  {/* User's Position Highlight */}
                  {rankings[rankingType]?.user_position && (
                    <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-700">A tua posição:</span>
                        <span className="text-2xl font-bold text-purple-600">
                          #{rankings[rankingType].user_position} de {rankings[rankingType].total_players}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Rankings Table */}
                  <div className="divide-y divide-slate-100">
                    {rankings[rankingType].entries.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={`flex items-center gap-4 p-4 ${
                          entry.user_id === studentProfile?.user_id
                            ? 'bg-purple-50'
                            : 'hover:bg-slate-50'
                        } transition`}
                      >
                        {/* Rank */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {index < 3 ? (
                            <Crown size={20} />
                          ) : (
                            entry.rank
                          )}
                        </div>

                        {/* Player Info */}
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            {entry.nickname}
                            {entry.user_id === studentProfile?.user_id && (
                              <span className="ml-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">Tu</span>
                            )}
                          </h4>
                          <p className="text-sm text-slate-500">
                            {entry.school_name} • {entry.district}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-purple-600 font-bold">
                            <Star size={16} className="text-yellow-500" />
                            {entry.xp} XP
                          </div>
                          <p className="text-xs text-slate-500 capitalize">
                            {entry.settlement_level === 'village' ? 'Aldeia' :
                             entry.settlement_level === 'town' ? 'Vila' :
                             entry.settlement_level === 'city' ? 'Cidade' : 'Metrópole'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Trophy className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500">Ainda não há rankings disponíveis.</p>
                  <p className="text-sm text-slate-400 mt-1">Completa quizzes para aparecer no ranking!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === 'friends' && (
          <div>
            <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    <Users className="inline mr-2 text-blue-500" />
                    Amigos
                  </h2>
                  <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Conecta-te com outros alunos e compara progressos!
                  </p>
                </div>
                {/* Toggle between Map and List view */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMapView(true)}
                    className={`px-4 py-2 rounded-xl font-semibold transition ${
                      showMapView
                        ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    data-testid="toggle-map-view"
                  >
                    <MapPin className="inline mr-2" size={18} />
                    Mapa
                  </button>
                  <button
                    onClick={() => setShowMapView(false)}
                    className={`px-4 py-2 rounded-xl font-semibold transition ${
                      !showMapView
                        ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    data-testid="toggle-list-view"
                  >
                    <Search className="inline mr-2" size={18} />
                    Pesquisa
                  </button>
                </div>
              </div>
            </div>

            {/* Map View */}
            {showMapView ? (
              <PortugalFriendMap
                onSearch={async ({ district, query }) => {
                  try {
                    const response = await axios.get(`${API}/friends/search`, {
                      params: { query: query || '', district },
                      withCredentials: true
                    });
                    setSearchResults(response.data || []);
                  } catch (error) {
                    console.error('Error searching:', error);
                    toast.error('Erro ao pesquisar');
                  }
                }}
                searchResults={searchResults}
                onSendRequest={handleSendFriendRequest}
                loading={friendsLoading}
              />
            ) : (
              <>
                {/* Search Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-lg mb-6">
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                      <input
                        type="text"
                        placeholder="Pesquisar por nome ou escola..."
                        value={friendSearch}
                        onChange={(e) => setFriendSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        data-testid="friend-search-input"
                      />
                    </div>
                    <button
                      onClick={handleSearchFriends}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
                      data-testid="friend-search-btn"
                    >
                      Pesquisar
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-xl mb-6 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                      <h3 className="font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                        Resultados da Pesquisa
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {searchResults.map(result => (
                        <div key={result.user_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {result.nickname?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{result.nickname}</h4>
                            <p className="text-sm text-slate-500">{result.school_name} • Nível {result.level}</p>
                          </div>
                          <button
                            onClick={() => handleSendFriendRequest(result.user_id)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                            data-testid={`add-friend-${result.user_id}`}
                          >
                            <UserPlus size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Friends List */}
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
                <h3 className="font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Os Meus Amigos ({friends.length})
                </h3>
              </div>

              {friendsLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500 mx-auto"></div>
                  <p className="mt-4 text-slate-500">A carregar amigos...</p>
                </div>
              ) : friends.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {friends.map(friend => (
                    <div key={friend.user_id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {friend.nickname?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800">{friend.nickname}</h4>
                        <p className="text-sm text-slate-500">{friend.school_name} • {friend.district}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-purple-600">Nível {friend.level}</span>
                        <p className="text-xs text-slate-500 capitalize">
                          {friend.settlement_level === 'village' ? 'Aldeia' :
                           friend.settlement_level === 'town' ? 'Vila' :
                           friend.settlement_level === 'city' ? 'Cidade' : 'Metrópole'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Users className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500">Ainda não tens amigos.</p>
                  <p className="text-sm text-slate-400 mt-1">Usa a pesquisa acima para encontrar colegas!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Challenges Tab */}
        {activeTab === 'challenges' && (
          <WeeklyChallenges />
        )}

        {/* League Tab */}
        {activeTab === 'league' && (
          <MonthlyLeagues />
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <AchievementsList 
            stats={{
              quizzesCompleted: gameState.quizzes_today || 0,
              perfectQuizzes: 0,
              longestStreak: 1,
              currentStreak: 1,
              totalBuildingLevel: totalBuildingLevel,
              maxLevelBuildings: Object.values(gameState.buildings).filter(l => l >= 5).length,
              allBuildingsLevel1: Object.values(gameState.buildings).every(l => l >= 1) && Object.values(gameState.buildings).length >= 6,
              settlementLevel: settlement.name.toLowerCase(),
              friendsCount: friends.length,
              minigamesPlayed: 0,
              minigamesWon: 0,
              totalCoinsEarned: gameState.coins,
              totalXp: gameState.xp
            }}
            unlockedIds={[]}
          />
        )}
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={!!currentQuiz}
        quiz={currentQuiz}
        onClose={handleNextQuestion}
        onAnswer={handleAnswer}
        currentQuestion={currentQuestion}
        answered={answered}
        selectedAnswer={selectedAnswer}
        isCorrect={isCorrect}
      />

      {/* Accessibility Panel */}
      <AccessibilityPanel
        isOpen={showAccessibility}
        onClose={() => setShowAccessibility(false)}
      />
    </div>
  );
};

export default StudentDashboard;
