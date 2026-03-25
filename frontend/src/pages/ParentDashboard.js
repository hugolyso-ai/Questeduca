import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Settings, LogOut, TrendingUp, Award } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscriptionPrices, setSubscriptionPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(`${API}/subscriptions/prices`);
        setSubscriptionPrices(response.data);
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              👨‍👩‍👧‍👦 Dashboard Pais
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {user?.name}
              </span>
              <button
                data-testid="parent-logout-btn"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition"
              >
                <LogOut size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Children Management */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="text-blue-600" size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Filhos
              </h3>
            </div>
            <p className="text-slate-600 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Gerir contas dos educandos
            </p>
            <button
              data-testid="manage-children-btn"
              className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Ver Filhos
            </button>
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <CreditCard className="text-green-600" size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Subscrição
              </h3>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Individual Mensal:</span>
                <span className="font-bold text-slate-900">€{subscriptionPrices.individual_monthly}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Familiar Mensal:</span>
                <span className="font-bold text-slate-900">€{subscriptionPrices.family_monthly}</span>
              </div>
            </div>
            <button
              data-testid="manage-subscription-btn"
              className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Subscrever Premium
            </button>
          </div>

          {/* Analytics */}
          <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <TrendingUp className="text-purple-600" size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Progresso
              </h3>
            </div>
            <p className="text-slate-600 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Acompanhar desempenho dos filhos
            </p>
            <button
              data-testid="view-analytics-btn"
              className="w-full px-6 py-3 bg-purple-500 text-white font-bold rounded-full hover:bg-purple-600 transition"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              Ver Estatísticas
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Controlo Parental Total
            </h3>
            <p className="text-white/90" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Monitorize chats, aprove pedidos de amizade e defina prioridades de disciplinas para cada filho.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-teal-500 rounded-3xl p-8 text-white shadow-xl">
            <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Vantagens Premium
            </h3>
            <ul className="space-y-2 text-white/90" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <li>✔️ +15% ganhos em quizzes</li>
              <li>✔️ Mini-jogos exclusivos</li>
              <li>✔️ Suporte prioritário</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;