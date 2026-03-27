import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, Building2, BarChart3, LogOut, Settings, 
  TrendingUp, DollarSign, BookOpen, School, Search, ChevronLeft,
  ChevronRight, Check, X, Eye, EyeOff, Lock, AlertTriangle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Change Password Modal
const ChangePasswordModal = ({ isOpen, onClose, onSuccess }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As passwords não coincidem');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('A password deve ter pelo menos 8 caracteres');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API}/auth/change-password`, null, {
        params: { old_password: oldPassword, new_password: newPassword },
        withCredentials: true
      });
      toast.success('Password alterada com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao alterar password');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Lock size={28} />
            <div>
              <h2 className="text-xl font-bold">Alterar Password</h2>
              <p className="text-white/80 text-sm">Por segurança, altere a sua password</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password Atual</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
              required
              minLength={8}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar Nova Password</label>
            <input
              type={showPasswords ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
              required
            />
          </div>
          
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="rounded"
            />
            Mostrar passwords
          </label>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'A alterar...' : 'Alterar Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="text-white" size={24} />
      </div>
    </div>
    <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
    <p className="text-slate-500 text-sm">{title}</p>
    {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
  </div>
);

// Users Table Component
const UsersTable = ({ users, onToggleActive, pagination, onPageChange }) => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Utilizador</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Role</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Criado</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map(user => (
            <tr key={user.user_id} className="hover:bg-slate-50">
              <td className="px-6 py-4">
                <div>
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' :
                  user.role === 'parent' ? 'bg-blue-100 text-blue-700' :
                  user.role === 'student' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {user.role}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {new Date(user.created_at).toLocaleDateString('pt-PT')}
              </td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.is_active !== false ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td className="px-6 py-4">
                {user.role !== 'admin' && (
                  <button
                    onClick={() => onToggleActive(user.user_id)}
                    className={`p-2 rounded-lg transition ${
                      user.is_active !== false 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={user.is_active !== false ? 'Desativar' : 'Ativar'}
                  >
                    {user.is_active !== false ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {/* Pagination */}
    {pagination && pagination.pages > 1 && (
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
        <p className="text-sm text-slate-500">
          Página {pagination.page} de {pagination.pages} ({pagination.total} total)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    )}
  </div>
);

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Check if must change password
  useEffect(() => {
    if (user?.must_change_password) {
      setShowChangePassword(true);
    }
  }, [user]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes] = await Promise.all([
          axios.get(`${API}/admin/dashboard`, { withCredentials: true })
        ]);
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        if (error.response?.status === 403) {
          toast.error('Acesso negado');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Fetch users
  const fetchUsers = async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API}/admin/users`, { 
        params,
        withCredentials: true 
      });
      setUsers(response.data.users);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch associations
  const fetchAssociations = async () => {
    try {
      const response = await axios.get(`${API}/admin/associations`, { withCredentials: true });
      setAssociations(response.data.associations);
    } catch (error) {
      console.error('Error fetching associations:', error);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API}/admin/transactions`, { withCredentials: true });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'associations') fetchAssociations();
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab]);

  // Toggle user active status
  const handleToggleActive = async (userId) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/toggle-active`, null, { withCredentials: true });
      toast.success('Estado do utilizador alterado');
      fetchUsers(usersPagination?.page || 1);
    } catch (error) {
      toast.error('Erro ao alterar estado');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => !user?.must_change_password && setShowChangePassword(false)}
        onSuccess={() => {
          setShowChangePassword(false);
          toast.success('Password alterada! Por favor faça login novamente.');
          handleLogout();
        }}
      />

      {/* Must change password warning */}
      {user?.must_change_password && (
        <div className="bg-red-500 text-white py-3 px-4 text-center font-semibold">
          <AlertTriangle className="inline mr-2" size={18} />
          Deve alterar a sua password antes de continuar
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-500 p-2 rounded-xl">
                <Settings size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">QUESTEDUCA Admin</h1>
                <p className="text-slate-400 text-sm">{user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
                title="Alterar Password"
              >
                <Lock size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'users', label: 'Utilizadores', icon: Users },
              { id: 'associations', label: 'Associações', icon: Building2 },
              { id: 'transactions', label: 'Transações', icon: CreditCard },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition border-b-2 ${
                  activeTab === tab.id 
                    ? 'text-red-600 border-red-500' 
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Utilizadores"
                value={stats.users.total}
                icon={Users}
                color="bg-blue-500"
                subtext={`+${stats.users.recent_7_days} últimos 7 dias`}
              />
              <StatCard
                title="Alunos"
                value={stats.users.students}
                icon={School}
                color="bg-green-500"
              />
              <StatCard
                title="Subscrições Ativas"
                value={stats.subscriptions.active}
                icon={CreditCard}
                color="bg-purple-500"
              />
              <StatCard
                title="Receita Total"
                value={`€${stats.revenue.total.toFixed(2)}`}
                icon={DollarSign}
                color="bg-amber-500"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Utilizadores por Tipo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Pais</span>
                    <span className="font-bold text-blue-600">{stats.users.parents}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Alunos</span>
                    <span className="font-bold text-green-600">{stats.users.students}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Associações</span>
                    <span className="font-bold text-purple-600">{stats.users.associations}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Comissões</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Pago</span>
                    <span className="font-bold text-green-600">€{stats.revenue.commissions_paid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Pendente</span>
                    <span className="font-bold text-amber-600">€{stats.revenue.pending_payouts.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Conteúdo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Perguntas</span>
                    <span className="font-bold text-blue-600">{stats.content.questions}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Utilizadores</h2>
              
              <div className="flex gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => {
                    setRoleFilter(e.target.value);
                    setTimeout(() => fetchUsers(), 100);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Todos os roles</option>
                  <option value="parent">Pais</option>
                  <option value="student">Alunos</option>
                  <option value="association">Associações</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>
            
            <UsersTable
              users={users}
              onToggleActive={handleToggleActive}
              pagination={usersPagination}
              onPageChange={fetchUsers}
            />
          </div>
        )}

        {/* Associations Tab */}
        {activeTab === 'associations' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Associações de Pais</h2>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Associação</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Código</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Comissões</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Pendente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {associations.map(assoc => (
                    <tr key={assoc.association_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">{assoc.association_name}</p>
                          <p className="text-sm text-slate-500">{assoc.school_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="bg-slate-100 px-2 py-1 rounded text-sm">{assoc.association_code}</code>
                      </td>
                      <td className="px-6 py-4 font-semibold text-green-600">
                        €{(assoc.total_commissions || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-amber-600">
                        €{(assoc.pending_payout || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {associations.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                        Nenhuma associação registada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Transações</h2>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Valor</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <tr key={tx.transaction_id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded">{tx.transaction_id}</code>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {tx.package_id || tx.type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        €{(tx.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                          tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('pt-PT') : 'N/A'}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        Nenhuma transação registada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
