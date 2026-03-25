import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp, Download, LogOut, PieChart } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssociationDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [commissionData, setCommissionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      try {
        const response = await axios.get(`${API}/associations/me/commissions`, {
          withCredentials: true
        });
        setCommissionData(response.data);
      } catch (error) {
        console.error('Error fetching commissions:', error);
        toast.error('Erro ao carregar comissões');
      } finally {
        setLoading(false);
      }
    };

    fetchCommissions();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              🏢 Dashboard Associação
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {user?.name}
              </span>
              <button
                data-testid="association-logout-btn"
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
        {/* Commission Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="text-green-600" size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>Total Comissões</p>
                <p data-testid="total-commissions" className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  €{(commissionData?.total_commissions || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-yellow-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-yellow-100 rounded-full p-3">
                <TrendingUp className="text-yellow-600" size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>Pendente Pagamento</p>
                <p data-testid="pending-payout" className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  €{(commissionData?.pending_payout || 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-100 rounded-full p-3">
                <PieChart className="text-blue-600" size={28} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>Subscrições Ativas</p>
                <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {commissionData?.commissions?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-r from-blue-500 to-green-500 rounded-3xl p-8 text-white shadow-xl mb-8">
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            🎉 Como Funciona
          </h2>
          <div className="space-y-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <p>• Recebe 10% de comissão por cada subscrição com o teu código</p>
            <p>• Pagamentos automáticos a cada €100 ou no final do ano letivo</p>
            <p>• Tracking em tempo real das tuas comissões</p>
          </div>
        </div>

        {/* Recent Commissions */}
        <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Comissões Recentes
            </h3>
            <button
              data-testid="export-btn"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <Download size={18} />
              <span className="font-medium" style={{ fontFamily: 'Nunito, sans-serif' }}>Exportar</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 px-4 font-bold text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>Data</th>
                  <th className="text-left py-3 px-4 font-bold text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>Tipo</th>
                  <th className="text-right py-3 px-4 font-bold text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>Valor</th>
                  <th className="text-center py-3 px-4 font-bold text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {commissionData?.commissions?.slice(0, 10).map((commission, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {new Date(commission.created_at).toLocaleDateString('pt-PT')}
                    </td>
                    <td className="py-3 px-4 text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Subscrição
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      €{commission.amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        commission.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {commission.paid ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Ainda não há comissões registadas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssociationDashboard;