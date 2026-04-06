import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, CreditCard, Building2, BarChart3, LogOut, Settings, 
  TrendingUp, DollarSign, BookOpen, School, Search, ChevronLeft,
  ChevronRight, Check, X, Eye, EyeOff, Lock, AlertTriangle,
  Gift, Edit, Trash2, Plus, RefreshCw, Download, Filter,
  GraduationCap, UserCheck, Calendar
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
            <input
              type={showPasswords ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
              required
            />
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

// Generic Edit Modal
const EditModal = ({ isOpen, onClose, title, fields, onSave, loading }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (isOpen && fields) {
      const initialData = {};
      fields.forEach(f => { initialData[f.name] = f.value || ''; });
      setFormData(initialData);
    }
  }, [isOpen, fields]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white rounded-t-2xl sticky top-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="p-6 space-y-4">
          {fields?.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  disabled={field.disabled}
                >
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <input
                  type="checkbox"
                  checked={formData[field.name] || false}
                  onChange={(e) => setFormData({...formData, [field.name]: e.target.checked})}
                  className="rounded"
                  disabled={field.disabled}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({...formData, [field.name]: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  disabled={field.disabled}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Issue Giftcard Modal
const IssueGiftcardModal = ({ isOpen, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(10);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/giftcards/issue`, null, {
        params: { amount, quantity, notes: notes || undefined },
        withCredentials: true
      });
      setResult(response.data);
      toast.success(response.data.message);
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao emitir giftcards');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setAmount(10);
    setQuantity(1);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift size={28} />
              <div>
                <h2 className="text-xl font-bold">Emitir Giftcards</h2>
                <p className="text-white/80 text-sm">Criar giftcards manualmente</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        
        {result ? (
          <div className="p-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
              <p className="text-emerald-700 font-semibold mb-2">Giftcards criados com sucesso!</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {result.giftcards.map((gc, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                    <code className="font-mono text-lg font-bold text-emerald-600">{gc.code}</code>
                    <span className="text-slate-600">€{gc.amount}</span>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-full py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Valor por Giftcard</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 50].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`py-3 rounded-xl font-bold transition ${
                      amount === val 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    €{val}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                min="1"
                max="100"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Prémio concurso..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-slate-600">
                Total: <span className="font-bold text-slate-800">{quantity} giftcard(s)</span> × 
                <span className="font-bold text-emerald-600"> €{amount}</span> = 
                <span className="font-bold text-xl text-slate-800 ml-2">€{quantity * amount}</span>
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'A emitir...' : 'Emitir Giftcards'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// Create Subscription Modal
const CreateSubscriptionModal = ({ isOpen, onClose, onSuccess, users }) => {
  const [userId, setUserId] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('individual_monthly');
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Selecione um utilizador');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/admin/subscriptions/create`, null, {
        params: { 
          user_id: userId, 
          subscription_type: subscriptionType, 
          duration_days: duration,
          notes: notes || undefined 
        },
        withCredentials: true
      });
      toast.success('Subscrição criada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar subscrição');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter only parent users
  const parentUsers = users?.filter(u => u.role === 'parent') || [];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard size={28} />
              <div>
                <h2 className="text-xl font-bold">Criar Subscrição</h2>
                <p className="text-white/80 text-sm">Atribuir subscrição manualmente</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Utilizador (Pai)</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Selecionar utilizador...</option>
              {parentUsers.map(u => (
                <option key={u.user_id} value={u.user_id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Subscrição</label>
            <select
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
            >
              <option value="individual_monthly">Individual Mensal</option>
              <option value="individual_annual">Individual Anual</option>
              <option value="family_monthly">Família Mensal</option>
              <option value="family_annual">Família Anual</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Duração (dias)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              min="1"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Prémio, cortesia..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'A criar...' : 'Criar Subscrição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Create School Modal
const CreateSchoolModal = ({ isOpen, onClose, onSuccess, districts }) => {
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [locality, setLocality] = useState('');
  const [cycle, setCycle] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/admin/schools`, null, {
        params: { name, district, municipality, locality: locality || undefined, cycle: cycle || undefined },
        withCredentials: true
      });
      toast.success('Escola criada com sucesso!');
      onSuccess();
      onClose();
      setName(''); setDistrict(''); setMunicipality(''); setLocality(''); setCycle('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar escola');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <School size={28} />
              <div>
                <h2 className="text-xl font-bold">Adicionar Escola</h2>
                <p className="text-white/80 text-sm">Registar nova escola</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
              <X size={20} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Escola *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Distrito *</label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                required
              >
                <option value="">Selecionar...</option>
                {districts?.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Concelho *</label>
              <input
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Localidade</label>
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ciclo</label>
              <select
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Selecionar...</option>
                <option value="1">1º Ciclo</option>
                <option value="2">2º Ciclo</option>
                <option value="3">3º Ciclo</option>
                <option value="1,2">1º e 2º Ciclo</option>
                <option value="2,3">2º e 3º Ciclo</option>
                <option value="1,2,3">Todos os Ciclos</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'A criar...' : 'Criar Escola'}
            </button>
          </div>
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

// Pagination Component
const Pagination = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.pages <= 1) return null;
  
  return (
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
  );
};

// Main Admin Dashboard Component
const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState(null);
  const [associations, setAssociations] = useState([]);
  const [associationsPagination, setAssociationsPagination] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscriptionsPagination, setSubscriptionsPagination] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [giftcards, setGiftcards] = useState([]);
  const [giftcardStats, setGiftcardStats] = useState(null);
  const [giftcardsPagination, setGiftcardsPagination] = useState(null);
  const [schools, setSchools] = useState([]);
  const [schoolsPagination, setSchoolsPagination] = useState(null);
  const [schoolDistricts, setSchoolDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  
  // Modals
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showIssueGiftcard, setShowIssueGiftcard] = useState(false);
  const [showCreateSubscription, setShowCreateSubscription] = useState(false);
  const [showCreateSchool, setShowCreateSchool] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, type: null, data: null });
  const [actionLoading, setActionLoading] = useState(false);

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
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API}/admin/users`, { params, withCredentials: true });
      setUsers(response.data.users);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [roleFilter, searchQuery]);

  // Fetch associations
  const fetchAssociations = useCallback(async (page = 1) => {
    try {
      const response = await axios.get(`${API}/admin/associations`, { 
        params: { page, limit: 20 },
        withCredentials: true 
      });
      setAssociations(response.data.associations);
      setAssociationsPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching associations:', error);
    }
  }, []);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      
      const response = await axios.get(`${API}/admin/subscriptions`, { params, withCredentials: true });
      setSubscriptions(response.data.subscriptions);
      setSubscriptionsPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  }, [statusFilter]);

  // Fetch giftcards
  const fetchGiftcards = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      
      const response = await axios.get(`${API}/admin/giftcards`, { params, withCredentials: true });
      setGiftcards(response.data.giftcards);
      setGiftcardStats(response.data.stats);
      setGiftcardsPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching giftcards:', error);
    }
  }, [statusFilter]);

  // Fetch schools
  const fetchSchools = useCallback(async (page = 1) => {
    try {
      const params = { page, limit: 50 };
      if (districtFilter) params.district = districtFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API}/admin/schools`, { params, withCredentials: true });
      setSchools(response.data.schools);
      setSchoolsPagination(response.data.pagination);
      setSchoolDistricts(response.data.districts || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  }, [districtFilter, searchQuery]);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/transactions`, { withCredentials: true });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'associations') fetchAssociations();
    if (activeTab === 'subscriptions') fetchSubscriptions();
    if (activeTab === 'giftcards') fetchGiftcards();
    if (activeTab === 'schools') fetchSchools();
    if (activeTab === 'transactions') fetchTransactions();
  }, [activeTab, fetchUsers, fetchAssociations, fetchSubscriptions, fetchGiftcards, fetchSchools, fetchTransactions]);

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

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem a certeza que quer eliminar este utilizador?')) return;
    try {
      await axios.delete(`${API}/admin/users/${userId}`, { withCredentials: true });
      toast.success('Utilizador eliminado');
      fetchUsers(usersPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao eliminar');
    }
  };

  // Update user
  const handleUpdateUser = async (data) => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/admin/users/${editModal.data.user_id}`, null, { 
        params: data,
        withCredentials: true 
      });
      toast.success('Utilizador atualizado');
      setEditModal({ open: false, type: null, data: null });
      fetchUsers(usersPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  };

  // Update subscription
  const handleUpdateSubscription = async (data) => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/admin/subscriptions/${editModal.data.subscription_id}`, null, { 
        params: data,
        withCredentials: true 
      });
      toast.success('Subscrição atualizada');
      setEditModal({ open: false, type: null, data: null });
      fetchSubscriptions(subscriptionsPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  };

  // Update association
  const handleUpdateAssociation = async (data) => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/admin/associations/${editModal.data.association_id}`, null, { 
        params: data,
        withCredentials: true 
      });
      toast.success('Associação atualizada');
      setEditModal({ open: false, type: null, data: null });
      fetchAssociations(associationsPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete association
  const handleDeleteAssociation = async (associationId) => {
    if (!window.confirm('Tem a certeza que quer eliminar esta associação?')) return;
    try {
      await axios.delete(`${API}/admin/associations/${associationId}`, { withCredentials: true });
      toast.success('Associação eliminada');
      fetchAssociations(associationsPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao eliminar');
    }
  };

  // Update school
  const handleUpdateSchool = async (data) => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/admin/schools/${editModal.data.school_id}`, null, { 
        params: data,
        withCredentials: true 
      });
      toast.success('Escola atualizada');
      setEditModal({ open: false, type: null, data: null });
      fetchSchools(schoolsPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete school
  const handleDeleteSchool = async (schoolId) => {
    if (!window.confirm('Tem a certeza que quer eliminar esta escola?')) return;
    try {
      await axios.delete(`${API}/admin/schools/${schoolId}`, { withCredentials: true });
      toast.success('Escola eliminada');
      fetchSchools(schoolsPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao eliminar');
    }
  };

  // Deactivate giftcard
  const handleDeactivateGiftcard = async (giftcardId) => {
    if (!window.confirm('Tem a certeza que quer desativar este giftcard?')) return;
    try {
      await axios.put(`${API}/admin/giftcards/${giftcardId}/deactivate`, null, { withCredentials: true });
      toast.success('Giftcard desativado');
      fetchGiftcards(giftcardsPagination?.page || 1);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao desativar');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Get edit fields based on type
  const getEditFields = () => {
    if (!editModal.data) return [];
    
    switch (editModal.type) {
      case 'user':
        return [
          { name: 'name', label: 'Nome', value: editModal.data.name },
          { name: 'email', label: 'Email', value: editModal.data.email },
          { name: 'role', label: 'Role', type: 'select', value: editModal.data.role, 
            options: [
              { value: 'parent', label: 'Pai' },
              { value: 'student', label: 'Aluno' },
              { value: 'association', label: 'Associação' }
            ]
          },
          { name: 'is_active', label: 'Ativo', type: 'checkbox', value: editModal.data.is_active !== false }
        ];
      case 'subscription':
        return [
          { name: 'user_id', label: 'User ID', value: editModal.data.user_id, disabled: true },
          { name: 'type', label: 'Tipo', value: editModal.data.type, disabled: true },
          { name: 'status', label: 'Estado', type: 'select', value: editModal.data.status,
            options: [
              { value: 'active', label: 'Ativo' },
              { value: 'cancelled', label: 'Cancelado' },
              { value: 'expired', label: 'Expirado' }
            ]
          },
          { name: 'end_date', label: 'Data de Fim (YYYY-MM-DD)', value: editModal.data.end_date?.split('T')[0] }
        ];
      case 'association':
        return [
          { name: 'association_name', label: 'Nome da Associação', value: editModal.data.association_name },
          { name: 'school_name', label: 'Escola', value: editModal.data.school_name },
          { name: 'iban', label: 'IBAN', value: editModal.data.iban },
          { name: 'approved', label: 'Aprovada', type: 'checkbox', value: editModal.data.approved }
        ];
      case 'school':
        return [
          { name: 'name', label: 'Nome', value: editModal.data.name },
          { name: 'district', label: 'Distrito', value: editModal.data.district },
          { name: 'municipality', label: 'Concelho', value: editModal.data.municipality },
          { name: 'locality', label: 'Localidade', value: editModal.data.locality || '' },
          { name: 'cycle', label: 'Ciclo', value: editModal.data.cycle || '' }
        ];
      default:
        return [];
    }
  };

  const handleEditSave = (data) => {
    switch (editModal.type) {
      case 'user': handleUpdateUser(data); break;
      case 'subscription': handleUpdateSubscription(data); break;
      case 'association': handleUpdateAssociation(data); break;
      case 'school': handleUpdateSchool(data); break;
      default: break;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-red-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'users', label: 'Utilizadores', icon: Users },
    { id: 'subscriptions', label: 'Subscrições', icon: CreditCard },
    { id: 'giftcards', label: 'Giftcards', icon: Gift },
    { id: 'associations', label: 'Associações', icon: Building2 },
    { id: 'schools', label: 'Escolas', icon: School },
    { id: 'transactions', label: 'Transações', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Modals */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => !user?.must_change_password && setShowChangePassword(false)}
        onSuccess={() => {
          setShowChangePassword(false);
          toast.success('Password alterada! Por favor faça login novamente.');
          handleLogout();
        }}
      />
      
      <IssueGiftcardModal
        isOpen={showIssueGiftcard}
        onClose={() => setShowIssueGiftcard(false)}
        onSuccess={() => fetchGiftcards()}
      />
      
      <CreateSubscriptionModal
        isOpen={showCreateSubscription}
        onClose={() => setShowCreateSubscription(false)}
        onSuccess={() => fetchSubscriptions()}
        users={users}
      />
      
      <CreateSchoolModal
        isOpen={showCreateSchool}
        onClose={() => setShowCreateSchool(false)}
        onSuccess={() => fetchSchools()}
        districts={schoolDistricts}
      />
      
      <EditModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, type: null, data: null })}
        title={`Editar ${editModal.type === 'user' ? 'Utilizador' : editModal.type === 'subscription' ? 'Subscrição' : editModal.type === 'association' ? 'Associação' : 'Escola'}`}
        fields={getEditFields()}
        onSave={handleEditSave}
        loading={actionLoading}
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
      <nav className="bg-white shadow-sm border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setStatusFilter(''); setDistrictFilter(''); }}
                className={`flex items-center gap-2 px-4 py-4 font-semibold transition border-b-2 whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-red-600 border-red-500' 
                    : 'text-slate-500 border-transparent hover:text-slate-700'
                }`}
              >
                <tab.icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
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
              <StatCard title="Total Utilizadores" value={stats.users.total} icon={Users} color="bg-blue-500" subtext={`+${stats.users.recent_7_days} últimos 7 dias`} />
              <StatCard title="Alunos" value={stats.users.students} icon={GraduationCap} color="bg-green-500" />
              <StatCard title="Subscrições Ativas" value={stats.subscriptions.active} icon={CreditCard} color="bg-purple-500" />
              <StatCard title="Receita Total" value={`€${stats.revenue.total.toFixed(2)}`} icon={DollarSign} color="bg-amber-500" />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Utilizadores por Tipo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-600">Pais</span><span className="font-bold text-blue-600">{stats.users.parents}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Alunos</span><span className="font-bold text-green-600">{stats.users.students}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Associações</span><span className="font-bold text-purple-600">{stats.users.associations}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Comissões</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-600">Total Pago</span><span className="font-bold text-green-600">€{stats.revenue.commissions_paid.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-slate-600">Pendente</span><span className="font-bold text-amber-600">€{stats.revenue.pending_payouts.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-bold text-slate-800 mb-4">Conteúdo</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-slate-600">Perguntas</span><span className="font-bold text-blue-600">{stats.content.questions}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Utilizadores</h2>
              
              <div className="flex flex-wrap gap-3">
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
                  onChange={(e) => { setRoleFilter(e.target.value); setTimeout(() => fetchUsers(), 100); }}
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
                    {users.map(u => (
                      <tr key={u.user_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{u.name}</p>
                          <p className="text-sm text-slate-500">{u.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            u.role === 'admin' ? 'bg-red-100 text-red-700' :
                            u.role === 'parent' ? 'bg-blue-100 text-blue-700' :
                            u.role === 'student' ? 'bg-green-100 text-green-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(u.created_at).toLocaleDateString('pt-PT')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.is_active !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {u.role !== 'admin' && (
                            <div className="flex gap-2">
                              <button onClick={() => setEditModal({ open: true, type: 'user', data: u })} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="Editar"><Edit size={16} /></button>
                              <button onClick={() => handleToggleActive(u.user_id)} className={`p-2 rounded-lg transition ${u.is_active !== false ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`} title={u.is_active !== false ? 'Desativar' : 'Ativar'}>{u.is_active !== false ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                              <button onClick={() => handleDeleteUser(u.user_id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200" title="Eliminar"><Trash2 size={16} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={usersPagination} onPageChange={fetchUsers} />
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Subscrições Premium</h2>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTimeout(() => fetchSubscriptions(), 100); }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Todos os estados</option>
                  <option value="active">Ativo</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="expired">Expirado</option>
                </select>
                <button onClick={() => { fetchUsers(); setShowCreateSubscription(true); }} className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition">
                  <Plus size={18} /> Nova Subscrição
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Utilizador</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Válido até</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptions.map(sub => (
                      <tr key={sub.subscription_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4"><code className="text-xs bg-slate-100 px-2 py-1 rounded">{sub.subscription_id}</code></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{sub.user_id}</td>
                        <td className="px-6 py-4"><span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">{sub.type}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            sub.status === 'active' ? 'bg-green-100 text-green-700' :
                            sub.status === 'expired' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>{sub.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{sub.end_date ? new Date(sub.end_date).toLocaleDateString('pt-PT') : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <button onClick={() => setEditModal({ open: true, type: 'subscription', data: sub })} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="Editar"><Edit size={16} /></button>
                        </td>
                      </tr>
                    ))}
                    {subscriptions.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Nenhuma subscrição encontrada</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={subscriptionsPagination} onPageChange={fetchSubscriptions} />
            </div>
          </div>
        )}

        {/* Giftcards Tab */}
        {activeTab === 'giftcards' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Giftcards</h2>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setTimeout(() => fetchGiftcards(), 100); }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Todos os estados</option>
                  <option value="active">Ativo</option>
                  <option value="redeemed">Resgatado</option>
                  <option value="pending">Pendente</option>
                </select>
                <button onClick={() => setShowIssueGiftcard(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition">
                  <Plus size={18} /> Emitir Giftcard
                </button>
              </div>
            </div>
            
            {giftcardStats && (
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-bold text-slate-800">{giftcardStats.total}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 shadow">
                  <p className="text-sm text-emerald-600">Ativos</p>
                  <p className="text-2xl font-bold text-emerald-700">{giftcardStats.active}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 shadow">
                  <p className="text-sm text-blue-600">Resgatados</p>
                  <p className="text-2xl font-bold text-blue-700">{giftcardStats.redeemed}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 shadow">
                  <p className="text-sm text-amber-600">Valor Ativo</p>
                  <p className="text-2xl font-bold text-amber-700">€{(giftcardStats.active_value || 0).toFixed(2)}</p>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Código</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Valor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Estado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Criado</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Notas</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {giftcards.map(gc => (
                      <tr key={gc.giftcard_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4"><code className="font-mono font-bold text-emerald-600">{gc.code}</code></td>
                        <td className="px-6 py-4 font-semibold">€{gc.amount}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            gc.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                            gc.status === 'redeemed' ? 'bg-blue-100 text-blue-700' :
                            gc.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{gc.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(gc.created_at).toLocaleDateString('pt-PT')}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{gc.notes || '-'}</td>
                        <td className="px-6 py-4">
                          {gc.status === 'active' && (
                            <button onClick={() => handleDeactivateGiftcard(gc.giftcard_id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200" title="Desativar"><X size={16} /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {giftcards.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Nenhum giftcard encontrado</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={giftcardsPagination} onPageChange={fetchGiftcards} />
            </div>
          </div>
        )}

        {/* Associations Tab */}
        {activeTab === 'associations' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Associações de Pais</h2>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Associação</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Código</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">IBAN</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Comissões</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Pendente</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Aprovada</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {associations.map(assoc => (
                      <tr key={assoc.association_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-800">{assoc.association_name}</p>
                          <p className="text-sm text-slate-500">{assoc.school_name}</p>
                        </td>
                        <td className="px-6 py-4"><code className="bg-slate-100 px-2 py-1 rounded text-sm">{assoc.association_code}</code></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{assoc.iban || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-green-600">€{(assoc.total_commissions || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 font-semibold text-amber-600">€{(assoc.pending_payout || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${assoc.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {assoc.approved ? 'Sim' : 'Não'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => setEditModal({ open: true, type: 'association', data: assoc })} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="Editar"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteAssociation(assoc.association_id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200" title="Eliminar"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {associations.length === 0 && <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Nenhuma associação registada</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={associationsPagination} onPageChange={fetchAssociations} />
            </div>
          </div>
        )}

        {/* Schools Tab */}
        {activeTab === 'schools' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Escolas</h2>
              <div className="flex flex-wrap gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder="Pesquisar escola..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchSchools()}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <select
                  value={districtFilter}
                  onChange={(e) => { setDistrictFilter(e.target.value); setTimeout(() => fetchSchools(), 100); }}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Todos os distritos</option>
                  {schoolDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button onClick={() => setShowCreateSchool(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition">
                  <Plus size={18} /> Adicionar Escola
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Nome</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Distrito</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Concelho</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Localidade</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ciclo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {schools.map(school => (
                      <tr key={school.school_id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-semibold text-slate-800">{school.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{school.district}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{school.municipality}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{school.locality || '-'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{school.cycle || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button onClick={() => setEditModal({ open: true, type: 'school', data: school })} className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="Editar"><Edit size={16} /></button>
                            <button onClick={() => handleDeleteSchool(school.school_id)} className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200" title="Eliminar"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {schools.length === 0 && <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Nenhuma escola encontrada</td></tr>}
                  </tbody>
                </table>
              </div>
              <Pagination pagination={schoolsPagination} onPageChange={fetchSchools} />
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Transações</h2>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
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
                        <td className="px-6 py-4"><code className="text-xs bg-slate-100 px-2 py-1 rounded">{tx.transaction_id}</code></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{tx.package_id || tx.type || 'N/A'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">€{(tx.amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'completed' ? 'bg-green-100 text-green-700' :
                            tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>{tx.status}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{tx.created_at ? new Date(tx.created_at).toLocaleDateString('pt-PT') : 'N/A'}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Nenhuma transação registada</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
