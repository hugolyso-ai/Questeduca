import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Coins, Diamond, Trophy, Users, Map, LogOut, Settings, Gamepad2, MessageSquare } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGameState = async () => {
      try {
        const response = await axios.get(`${API}/game/state`, {
          withCredentials: true
        });
        setGameState(response.data);
      } catch (error) {
        console.error('Error fetching game state:', error);
        toast.error('Erro ao carregar estado do jogo');
      } finally {
        setLoading(false);
      }
    };

    fetchGameState();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-slate-700">A carregar...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url('https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/a511f6a84aa96847cf9839b7f9051d3f17b66366e11e7dd56f51afaea128730d.png')`,
        backgroundColor: '#f0f9ff'
      }}
    >
      {/* Top Navigation Bar */}
      <nav className="bg-white/90 backdrop-blur-xl border-b-4 border-green-200 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                🏰 QUESTEDUCA
              </h1>
              
              {/* Resources */}
              <div className="flex items-center gap-6">
                <div data-testid="coins-display" className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full border-2 border-yellow-300">
                  <Coins className="text-yellow-600" size={20} strokeWidth={2.5} />
                  <span className="font-bold text-yellow-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {gameState?.coins || 0}
                  </span>
                </div>
                
                <div data-testid="diamonds-display" className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full border-2 border-blue-300">
                  <Diamond className="text-blue-600" size={20} strokeWidth={2.5} />
                  <span className="font-bold text-blue-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {gameState?.diamonds || 0}
                  </span>
                </div>
                
                <div data-testid="level-display" className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-full border-2 border-purple-300">
                  <Trophy className="text-purple-600" size={20} strokeWidth={2.5} />
                  <span className="font-bold text-purple-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Nível {gameState?.level || 1}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {gameState?.is_premium && (
                <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-bold rounded-full text-sm">
                  ⭐ PREMIUM
                </span>
              )}
              <button
                data-testid="logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition"
              >
                <LogOut size={20} className="text-slate-600" />
                <span className="text-slate-700 font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Sair
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-xl border-b-4 border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                A Minha Aldeia
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>Nível:</span>
                  <span className="font-bold text-slate-900">{gameState?.settlement_level || 'Aldeia'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>Construções:</span>
                  <span className="font-bold text-slate-900">{gameState?.buildings?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <button
                data-testid="quizzes-btn"
                onClick={() => navigate('/student/quizzes')}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-4 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-3"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <Gamepad2 size={24} />
                Fazer Quizzes
              </button>
              
              <button
                data-testid="friends-btn"
                onClick={() => navigate('/student/friends')}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-3"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <Users size={24} />
                Procurar Amigos
              </button>
              
              <button
                data-testid="mini-games-btn"
                onClick={() => navigate('/student/mini-games')}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl p-4 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all flex items-center gap-3"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <Trophy size={24} />
                Mini-Jogos
              </button>
            </div>
          </div>

          {/* Center - Game Canvas */}
          <div className="lg:col-span-2">
            <div 
              data-testid="game-canvas"
              className="bg-white rounded-3xl shadow-2xl border-b-4 border-green-300 overflow-hidden"
              style={{ minHeight: '600px' }}
            >
              <div className="bg-gradient-to-r from-green-500 to-blue-500 p-4 text-white">
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  🏰 A Tua Aldeia
                </h2>
              </div>
              
              <div className="relative w-full h-[550px] bg-gradient-to-br from-green-100 to-blue-100">
                {/* Game Canvas Area */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <img
                      src="https://static.prod-images.emergentagent.com/jobs/1c04fa23-329a-417f-8b99-b41bfcdab50b/images/e7147ab3cacc2a4855073e805a2e1474d108e5955baccdf1629637b660e95571.png"
                      alt="Vila"
                      className="w-full max-w-2xl mx-auto rounded-2xl shadow-xl mb-4"
                    />
                    <p className="text-lg text-slate-600 font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Responde a quizzes para ganhar moedas e construir a tua aldeia!
                    </p>
                    <button
                      onClick={() => navigate('/student/quizzes')}
                      className="mt-6 px-8 py-4 bg-green-500 text-white font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      Começar Quizzes 🎯
                    </button>
                  </div>
                </div>

                {/* Building Grid (simplified) */}
                {gameState?.buildings && gameState.buildings.length > 0 && (
                  <div className="absolute bottom-4 left-4 bg-white/90 rounded-2xl p-4 shadow-lg">
                    <p className="text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Construções Ativas:
                    </p>
                    <div className="space-y-1">
                      {gameState.buildings.slice(0, 3).map((building, idx) => (
                        <div key={idx} className="text-xs text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          🏠 {building.type}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
