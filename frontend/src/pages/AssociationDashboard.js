import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Copy, Check, TrendingUp, Wallet, Users, 
  Calendar, Euro, FileText, Download, ExternalLink,
  Building2, School, MapPin
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AssociationDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [association, setAssociation] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [codeCopied, setCodeCopied] = useState(false);
  const [payoutRequesting, setPayoutRequesting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assocRes, commissionsRes] = await Promise.all([
          axios.get(`${API}/associations/me`, { withCredentials: true }),
          axios.get(`${API}/associations/me/commissions`, { withCredentials: true })
        ]);
        
        setAssociation(assocRes.data);
        setCommissions(commissionsRes.data.commissions || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados da associação');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopyCode = async () => {
    if (association?.association_code) {
      try {
        await navigator.clipboard.writeText(association.association_code);
        setCodeCopied(true);
        toast.success('Código copiado!');
        setTimeout(() => setCodeCopied(false), 3000);
      } catch (error) {
        toast.error('Erro ao copiar código');
      }
    }
  };

  const handleRequestPayout = async () => {
    if (!association?.pending_payout || association.pending_payout < 10) {
      toast.error('Valor mínimo para levantamento: €10');
      return;
    }

    setPayoutRequesting(true);
    try {
      await axios.post(`${API}/associations/me/payout-request`, {}, { withCredentials: true });
      toast.success('Pedido de pagamento enviado! Será processado em 5-7 dias úteis.');
      // Refresh data
      const res = await axios.get(`${API}/associations/me`, { withCredentials: true });
      setAssociation(res.data);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao solicitar pagamento');
    } finally {
      setPayoutRequesting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-slate-700">A carregar...</p>
        </div>
      </div>
    );
  }

  const totalCommissions = association?.total_commissions || 0;
  const pendingPayout = association?.pending_payout || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b-2 border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-3">
                <Building2 className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {association?.association_name || 'Associação de Pais'}
                </h1>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <School size={14} />
                  {association?.school_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 transition"
                data-testid="association-logout-btn"
              >
                <LogOut size={20} className="text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Code Card */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-3xl p-8 text-white shadow-xl mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                O Vosso Código de Associação
              </h2>
              <p className="text-white/80 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Partilhem este código com os pais! Quando usarem na subscrição, 
                10% vai para a vossa associação.
              </p>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MapPin size={14} />
                {association?.district} • {association?.municipality} • {association?.locality}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 min-w-[280px]">
              <p className="text-sm text-white/70 mb-2">Código:</p>
              <div className="flex items-center gap-3">
                <span 
                  className="font-mono text-3xl font-bold tracking-wider"
                  data-testid="association-code"
                >
                  {association?.association_code || 'ASSOC-XXXXXX'}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition"
                  data-testid="copy-code-btn"
                >
                  {codeCopied ? <Check size={24} /> : <Copy size={24} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Total Commissions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Total Ganho
              </h3>
            </div>
            <p className="text-4xl font-bold text-green-600 mb-1">
              €{totalCommissions.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500">
              Desde o início
            </p>
          </div>

          {/* Pending Payout */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-3">
                <Wallet className="text-blue-600" size={24} />
              </div>
              <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Disponível para Levantar
              </h3>
            </div>
            <p className="text-4xl font-bold text-blue-600 mb-1">
              €{pendingPayout.toFixed(2)}
            </p>
            <p className="text-sm text-slate-500">
              Mínimo: €10,00
            </p>
          </div>

          {/* Subscriptions */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-b-4 border-purple-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 rounded-full p-3">
                <Users className="text-purple-600" size={24} />
              </div>
              <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Subscrições Referidas
              </h3>
            </div>
            <p className="text-4xl font-bold text-purple-600 mb-1">
              {commissions.length}
            </p>
            <p className="text-sm text-slate-500">
              Famílias que usaram o código
            </p>
          </div>
        </div>

        {/* Payout Request */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Euro className="inline mr-2 text-green-500" size={20} />
                Solicitar Pagamento
              </h3>
              <p className="text-slate-600 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Valor disponível: €{pendingPayout.toFixed(2)} • IBAN: {association?.iban?.slice(0, 10)}...
              </p>
            </div>
            <button
              onClick={handleRequestPayout}
              disabled={payoutRequesting || pendingPayout < 10}
              className={`px-8 py-4 rounded-xl font-bold transition flex items-center gap-2 ${
                pendingPayout >= 10
                  ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:opacity-90'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
              data-testid="request-payout-btn"
            >
              {payoutRequesting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              ) : (
                <>
                  <Download size={20} />
                  Solicitar Transferência
                </>
              )}
            </button>
          </div>
        </div>

        {/* Commissions Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <FileText className="inline mr-2 text-slate-400" size={20} />
              Histórico de Comissões
            </h3>
          </div>
          
          {commissions.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto text-slate-300 mb-4" size={48} />
              <h4 className="font-bold text-slate-700 mb-2">Ainda sem comissões</h4>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Quando os pais usarem o vosso código ao subscrever o QUESTEDUCA, 
                as comissões aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">Data</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600">ID Subscrição</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-600">Comissão</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((commission, index) => (
                    <tr key={commission.commission_id || index} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {commission.created_at ? new Date(commission.created_at).toLocaleDateString('pt-PT') : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-slate-600">
                          {commission.subscription_id?.slice(0, 16) || '-'}...
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-green-600">
                          +€{(commission.amount || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Creditado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h4 className="font-bold text-lg mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Como funciona?
            </h4>
            <ul className="space-y-2 text-white/90 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <li>1. Partilhem o código com os pais da escola</li>
              <li>2. Quando subscrevem o QUESTEDUCA com o código</li>
              <li>3. 10% do valor vai para a associação</li>
              <li>4. Solicitem o levantamento quando atingirem €10</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
            <h4 className="font-bold text-lg mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Dicas para partilhar
            </h4>
            <ul className="space-y-2 text-white/90 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <li>• Partilhem nos grupos de WhatsApp da escola</li>
              <li>• Mencionem nas reuniões de pais</li>
              <li>• Coloquem cartazes na escola (com autorização)</li>
              <li>• Divulguem nas redes sociais da associação</li>
            </ul>
          </div>
        </div>

        {/* Responsible Members */}
        {association?.responsible_names && association.responsible_names.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="font-bold text-lg text-slate-800 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <Users className="inline mr-2 text-slate-400" size={20} />
              Responsáveis da Associação
            </h3>
            <div className="flex flex-wrap gap-3">
              {association.responsible_names.map((name, index) => (
                <div 
                  key={index}
                  className="bg-slate-100 px-4 py-2 rounded-full text-slate-700 font-medium"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociationDashboard;
