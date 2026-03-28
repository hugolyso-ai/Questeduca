import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Settings, LogOut, TrendingUp, Award, Plus, X, School, BookOpen, User, Bell, Gift, Check, Gamepad2, FileText, Download, Calendar } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import MiniGamesHub from '../components/MiniGamesHub';
import { ReportExportModal, ExportReportButton } from '../components/ReportExport';
import InteractiveTutorial from '../components/InteractiveTutorial';
import SchoolCalendar from '../components/SchoolCalendar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Notification Bell Component
const NotificationBell = ({ notifications, onMarkRead }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition"
        data-testid="notification-bell"
      >
        <Bell size={22} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50">
          <div className="p-3 border-b border-slate-100 bg-slate-50">
            <h4 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Notificações
            </h4>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-slate-500 text-sm">
                Sem notificações
              </p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.notification_id}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition ${!notif.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${notif.type === 'association_registered' ? 'bg-green-100' : 'bg-blue-100'}`}>
                      <Gift size={16} className={notif.type === 'association_registered' ? 'text-green-600' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 text-sm">{notif.title}</p>
                      <p className="text-slate-600 text-xs mt-1">{notif.message}</p>
                      {notif.association_code && (
                        <p className="text-xs mt-2 font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                          Código: {notif.association_code}
                        </p>
                      )}
                    </div>
                    {!notif.read && (
                      <button
                        onClick={() => onMarkRead(notif.notification_id)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Modal component for adding children
const AddChildModal = ({ isOpen, onClose, onSuccess, districts }) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    nickname: '',
    school_year: '1',
    district: '',
    school_name: ''
  });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch schools when district or school_year changes
  useEffect(() => {
    const fetchSchools = async () => {
      if (formData.district) {
        try {
          const response = await axios.get(`${API}/schools`, {
            params: { 
              district: formData.district,
              school_year: formData.school_year
            }
          });
          setSchools(response.data);
          // Reset school selection when district changes
          setFormData(prev => ({ ...prev, school_name: '' }));
        } catch (error) {
          console.error('Error fetching schools:', error);
        }
      }
    };
    fetchSchools();
  }, [formData.district, formData.school_year]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.name || !formData.nickname || !formData.district || !formData.school_name) {
      toast.error('Por favor preencha todos os campos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/students`, formData, {
        withCredentials: true
      });
      
      // Show success with temporary password
      if (response.data.temp_password) {
        toast.success(
          <div>
            <p className="font-bold">Conta criada com sucesso!</p>
            <p className="text-sm mt-1">Password temporária: <span className="font-mono bg-slate-100 px-1 rounded">{response.data.temp_password}</span></p>
            <p className="text-xs mt-1 text-slate-500">Guarde esta password para o primeiro login do aluno.</p>
          </div>,
          { duration: 10000 }
        );
      } else {
        toast.success('Conta de aluno criada com sucesso!');
      }
      
      onSuccess(response.data);
      onClose();
      setFormData({
        email: '',
        name: '',
        nickname: '',
        school_year: '1',
        district: '',
        school_name: ''
      });
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao criar conta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const schoolYears = [
    { value: '1', label: '1º Ano', cycle: '1º Ciclo' },
    { value: '2', label: '2º Ano', cycle: '1º Ciclo' },
    { value: '3', label: '3º Ano', cycle: '1º Ciclo' },
    { value: '4', label: '4º Ano', cycle: '1º Ciclo' },
    { value: '5', label: '5º Ano', cycle: '2º Ciclo' },
    { value: '6', label: '6º Ano', cycle: '2º Ciclo' },
    { value: '7', label: '7º Ano', cycle: '3º Ciclo' },
    { value: '8', label: '8º Ano', cycle: '3º Ciclo' },
    { value: '9', label: '9º Ano', cycle: '3º Ciclo' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Adicionar Filho
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
            data-testid="close-modal-btn"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-12 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
                placeholder="Nome do seu filho(a)"
                data-testid="child-name-input"
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Nome de Utilizador (para o jogo)
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
              placeholder="Escolha um nickname divertido"
              data-testid="child-nickname-input"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Email (para login do aluno)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition"
              placeholder="email@exemplo.com"
              data-testid="child-email-input"
            />
          </div>

          {/* School Year */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <BookOpen className="inline mr-2" size={16} />
              Ano Escolar
            </label>
            <select
              value={formData.school_year}
              onChange={(e) => setFormData({ ...formData, school_year: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition bg-white"
              data-testid="child-year-select"
            >
              {schoolYears.map(year => (
                <option key={year.value} value={year.value}>
                  {year.label} ({year.cycle})
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Distrito
            </label>
            <select
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition bg-white"
              data-testid="child-district-select"
            >
              <option value="">Selecione o distrito</option>
              {districts.map(d => (
                <option key={d.district_id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* School */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
              <School className="inline mr-2" size={16} />
              Escola
            </label>
            <select
              value={formData.school_name}
              onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none transition bg-white"
              disabled={!formData.district}
              data-testid="child-school-select"
            >
              <option value="">{formData.district ? 'Selecione a escola' : 'Primeiro selecione o distrito'}</option>
              {schools.map(s => (
                <option key={s.school_id} value={s.name}>{s.name}</option>
              ))}
            </select>
            {formData.district && schools.length === 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Não foram encontradas escolas para este distrito/ano escolar. Pode escrever o nome manualmente.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            data-testid="create-child-btn"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Plus size={20} />
                Criar Conta do Aluno
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const ParentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [subscriptionPrices, setSubscriptionPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [associationCode, setAssociationCode] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [codeRegistering, setCodeRegistering] = useState(false);
  const [parentProfile, setParentProfile] = useState({ credit_balance: 0 });
  const [showMiniGames, setShowMiniGames] = useState(false);
  const [selectedChildForGame, setSelectedChildForGame] = useState(null);
  // P5: Tutorial and Report Export state
  const [showTutorial, setShowTutorial] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedChildForReport, setSelectedChildForReport] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pricesRes, districtsRes, childrenRes, notificationsRes, profileRes] = await Promise.all([
          axios.get(`${API}/subscriptions/prices`),
          axios.get(`${API}/districts`),
          axios.get(`${API}/parents/me/children`, { withCredentials: true }),
          axios.get(`${API}/parents/me/notifications`, { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get(`${API}/parents/me`, { withCredentials: true }).catch(() => ({ data: { credit_balance: 0 } }))
        ]);
        setSubscriptionPrices(pricesRes.data);
        setDistricts(districtsRes.data);
        setChildren(childrenRes.data || []);
        setNotifications(notificationsRes.data || []);
        setParentProfile(profileRes.data || { credit_balance: 0 });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleChildCreated = (newChild) => {
    setChildren(prev => [...prev, newChild]);
  };

  const handleMarkNotificationRead = async (notificationId) => {
    try {
      await axios.put(`${API}/parents/me/notifications/${notificationId}/read`, {}, { withCredentials: true });
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleRegisterAssociationCode = async () => {
    if (!associationCode.trim()) {
      toast.error('Por favor insira um código de associação');
      return;
    }

    setCodeRegistering(true);
    try {
      const response = await axios.post(
        `${API}/parents/me/association-code?code=${encodeURIComponent(associationCode)}`,
        {},
        { withCredentials: true }
      );
      
      toast.success(
        <div>
          <p className="font-bold">{response.data.association_name}</p>
          <p className="text-sm mt-1">{response.data.message}</p>
        </div>,
        { duration: 8000 }
      );
      
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao registar código';
      toast.error(message);
    } finally {
      setCodeRegistering(false);
    }
  };

  // Handle Stripe checkout
  const handleSubscribe = async (packageId) => {
    setCheckoutLoading(packageId);
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(`${API}/payments/checkout`, {
        package_id: packageId,
        origin_url: originUrl,
        association_code: associationCode || null
      }, {
        withCredentials: true
      });
      
      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.detail || 'Erro ao iniciar pagamento');
    } finally {
      setCheckoutLoading(null);
    }
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
              Dashboard Pais
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCalendar(true)}
                className="p-2 hover:bg-slate-100 rounded-full transition"
                data-testid="parent-calendar-btn"
                title="Calendário Escolar"
              >
                <Calendar size={20} className="text-slate-600" />
              </button>
              <NotificationBell 
                notifications={notifications} 
                onMarkRead={handleMarkNotificationRead} 
              />
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
              { id: 'children', label: 'Meus Filhos', icon: Users },
              { id: 'subscription', label: 'Subscrição', icon: CreditCard },
              { id: 'giftcards', label: 'Giftcards', icon: Gift },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition border-b-3 ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-blue-500' 
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Children Quick View */}
            <div className="bg-white rounded-3xl p-6 shadow-lg border-b-4 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="text-blue-600" size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Filhos
                </h3>
              </div>
              <p className="text-3xl font-bold text-blue-600 mb-2">{children.length}</p>
              <p className="text-slate-600 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {children.length === 0 ? 'Nenhum filho registado' : 'Contas de alunos registadas'}
              </p>
              <button
                data-testid="manage-children-btn"
                onClick={() => setActiveTab('children')}
                className="w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Gerir Filhos
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
                onClick={() => setActiveTab('subscription')}
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
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Gestão de Filhos
              </h2>
              <button
                onClick={() => setShowAddChildModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full hover:opacity-90 transition shadow-lg"
                data-testid="add-child-btn"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <Plus size={20} />
                Adicionar Filho
              </button>
            </div>

            {children.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-lg">
                <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                  <Users className="text-blue-500" size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Ainda não tem filhos registados
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Crie uma conta de aluno para o seu filho começar a aprender e jogar no QUESTEDUCA!
                </p>
                <button
                  onClick={() => setShowAddChildModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-full hover:opacity-90 transition"
                  data-testid="add-first-child-btn"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  Adicionar Primeiro Filho
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {children.map(child => (
                  <div key={child.student_id} className="bg-white rounded-3xl p-6 shadow-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-400 to-purple-500 rounded-full w-14 h-14 flex items-center justify-center text-white text-xl font-bold">
                        {child.nickname?.[0]?.toUpperCase() || child.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                          {child.nickname}
                        </h4>
                        <p className="text-sm text-slate-500">{child.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ano:</span>
                        <span className="font-semibold text-slate-700">{child.school_year}º Ano</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Escola:</span>
                        <span className="font-semibold text-slate-700 text-right max-w-[60%] truncate">{child.school_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nível:</span>
                        <span className="font-semibold text-blue-600">Nível {child.level || 1}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedChildForReport(child);
                            setShowReportModal(true);
                          }}
                          className="flex-1 py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition text-sm flex items-center justify-center gap-1"
                          data-testid={`export-report-${child.student_id}`}
                        >
                          <FileText size={16} />
                          Relatório PDF
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedChildForGame(child);
                            setShowMiniGames(true);
                          }}
                          className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold rounded-lg hover:opacity-90 transition text-sm flex items-center justify-center gap-1"
                          data-testid={`play-with-${child.student_id}`}
                        >
                          <Gamepad2 size={16} />
                          Jogar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Planos de Subscrição
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Individual Plan */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border-2 border-slate-200 hover:border-blue-300 transition">
                <div className="text-center mb-6">
                  <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                    Individual
                  </span>
                  <h3 className="text-3xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    €{subscriptionPrices.individual_monthly}<span className="text-lg text-slate-500">/mês</span>
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    ou €{subscriptionPrices.individual_annual}/ano (10% desconto)
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> 1 conta de aluno
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> +15% moedas em quizzes
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> Mini-jogos exclusivos
                  </li>
                  <li className="flex items-center gap-2 text-slate-700">
                    <span className="text-green-500">✓</span> Suporte prioritário
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('individual_monthly')}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="subscribe-individual-btn"
                >
                  {checkoutLoading === 'individual_monthly' ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    'Subscrever Mensal'
                  )}
                </button>
                <button
                  onClick={() => handleSubscribe('individual_annual')}
                  disabled={checkoutLoading}
                  className="w-full py-3 mt-2 border-2 border-blue-200 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition disabled:opacity-50"
                  data-testid="subscribe-individual-annual-btn"
                >
                  {checkoutLoading === 'individual_annual' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 inline-block" />
                  ) : (
                    'Subscrever Anual (-10%)'
                  )}
                </button>
              </div>

              {/* Family Plan */}
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">
                  MAIS POPULAR
                </div>
                <div className="text-center mb-6">
                  <span className="inline-block px-4 py-1 bg-white/20 text-white rounded-full text-sm font-semibold mb-4">
                    Familiar
                  </span>
                  <h3 className="text-3xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    €{subscriptionPrices.family_monthly}<span className="text-lg text-white/70">/mês</span>
                  </h3>
                  <p className="text-sm text-white/70 mt-1">
                    ou €{subscriptionPrices.family_annual}/ano (10% desconto)
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-300">✓</span> Até 3 contas de alunos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-300">✓</span> +15% moedas em quizzes
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-300">✓</span> Mini-jogos exclusivos
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-300">✓</span> Suporte prioritário
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-yellow-300">✓</span> Batalhas familiares
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe('family_monthly')}
                  disabled={checkoutLoading}
                  className="w-full py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-slate-100 transition disabled:opacity-50 flex items-center justify-center gap-2"
                  data-testid="subscribe-family-btn"
                >
                  {checkoutLoading === 'family_monthly' ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                  ) : (
                    'Subscrever Mensal'
                  )}
                </button>
                <button
                  onClick={() => handleSubscribe('family_annual')}
                  disabled={checkoutLoading}
                  className="w-full py-3 mt-2 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition disabled:opacity-50"
                  data-testid="subscribe-family-annual-btn"
                >
                  {checkoutLoading === 'family_annual' ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block" />
                  ) : (
                    'Subscrever Anual (-10%)'
                  )}
                </button>
              </div>
            </div>

            {/* Info about association codes */}
            <div className="mt-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl p-6 text-white">
              <h4 className="text-lg font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Tem um código de Associação de Pais?
              </h4>
              <p className="text-white/90 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Registe o código e 10% vai para a associação! Se registar até 10 dias após a subscrição, 
                a comissão aplica-se retroativamente. Depois disso, aplica-se às próximas subscrições.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={associationCode}
                  onChange={(e) => setAssociationCode(e.target.value.toUpperCase())}
                  placeholder="Código da Associação (ex: ASSOC-ABC123)"
                  className="flex-1 px-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400"
                  data-testid="association-code-input"
                />
                <button 
                  onClick={handleRegisterAssociationCode}
                  disabled={codeRegistering || !associationCode}
                  className="px-6 py-3 bg-white/20 rounded-xl font-semibold hover:bg-white/30 transition disabled:opacity-50 flex items-center gap-2"
                  data-testid="register-code-btn"
                >
                  {codeRegistering ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    'Registar Código'
                  )}
                </button>
              </div>
              {associationCode && (
                <p className="mt-2 text-sm text-white/80">
                  O código será permanentemente associado à sua conta para todas as subscrições futuras.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Giftcards Tab */}
        {activeTab === 'giftcards' && (
          <div>
            {/* Header */}
            <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Gift className="inline mr-2 text-purple-500" size={28} />
                Giftcards
              </h2>
              <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Compre giftcards para oferecer ou adicione crédito à sua conta resgatando um código.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Buy Giftcard */}
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Comprar Giftcard
                </h3>
                <p className="text-white/80 mb-6 text-sm">
                  Escolha um valor e receba um código único para partilhar.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[5, 10, 20].map(amount => (
                    <button
                      key={amount}
                      onClick={async () => {
                        try {
                          const response = await axios.post(`${API}/giftcards/purchase`, 
                            { amount, origin_url: window.location.origin },
                            { withCredentials: true }
                          );
                          if (response.data.url) {
                            window.location.href = response.data.url;
                          }
                        } catch (error) {
                          toast.error(error.response?.data?.detail || 'Erro ao processar compra');
                        }
                      }}
                      className="bg-white/20 hover:bg-white/30 rounded-xl py-4 font-bold text-lg transition"
                      data-testid={`buy-giftcard-${amount}`}
                    >
                      €{amount}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-white/60 text-center">
                  Pagamento seguro via Stripe
                </p>
              </div>

              {/* Redeem Giftcard */}
              <div className="bg-white rounded-3xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Resgatar Giftcard
                </h3>
                <p className="text-slate-600 text-sm mb-4">
                  Introduza o código do giftcard para adicionar crédito à sua conta.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="GIFT-XXXXXXXX"
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono uppercase"
                    data-testid="redeem-code-input"
                    id="redeem-code-input"
                  />
                  <button
                    onClick={async () => {
                      const code = document.getElementById('redeem-code-input').value;
                      if (!code) {
                        toast.error('Introduza um código');
                        return;
                      }
                      try {
                        const response = await axios.post(`${API}/giftcards/redeem`, 
                          { code },
                          { withCredentials: true }
                        );
                        toast.success(response.data.message || 'Giftcard resgatado com sucesso!');
                        document.getElementById('redeem-code-input').value = '';
                      } catch (error) {
                        toast.error(error.response?.data?.detail || 'Código inválido ou já utilizado');
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
                    data-testid="redeem-btn"
                  >
                    Resgatar
                  </button>
                </div>
              </div>
            </div>

            {/* Credit Balance */}
            <div className="mt-6 bg-gradient-to-r from-amber-400 to-orange-500 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Saldo da Conta
                  </h3>
                  <p className="text-white/80 text-sm">
                    Crédito disponível para subscrições
                  </p>
                </div>
                <div className="text-4xl font-bold">
                  €{parentProfile?.credit_balance?.toFixed(2) || '0.00'}
                </div>
              </div>
            </div>

            {/* My Purchased Giftcards */}
            <div className="mt-6 bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Giftcards Comprados
                </h3>
              </div>
              <div className="p-6">
                <p className="text-slate-500 text-center py-8">
                  Os giftcards que comprar aparecerão aqui com os respetivos códigos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards (only on overview) */}
        {activeTab === 'overview' && (
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
        )}
      </div>

      {/* Add Child Modal */}
      <AddChildModal
        isOpen={showAddChildModal}
        onClose={() => setShowAddChildModal(false)}
        onSuccess={handleChildCreated}
        districts={districts}
      />

      {/* Mini Games Modal */}
      {showMiniGames && (
        <MiniGamesHub
          childId={selectedChildForGame?.user_id}
          childName={selectedChildForGame?.nickname}
          onClose={() => {
            setShowMiniGames(false);
            setSelectedChildForGame(null);
          }}
        />
      )}

      {/* Report Export Modal */}
      <ReportExportModal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedChildForReport(null);
        }}
      >
        {selectedChildForReport}
      </ReportExportModal>

      {/* Interactive Tutorial for Parents */}
      {showTutorial && (
        <InteractiveTutorial
          userRole="parent"
          onComplete={() => setShowTutorial(false)}
        />
      )}

      {/* School Calendar */}
      <SchoolCalendar
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        userRole="parent"
      />
    </div>
  );
};

export default ParentDashboard;
