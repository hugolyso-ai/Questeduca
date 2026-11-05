import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { generateClassReport, ExportReportButton } from '../components/ReportExport'
import {
  Castle, LogOut, Users, School, TrendingUp, DollarSign,
  Check, X, Eye, BarChart3, Building2, Coins, Trophy, FileText, Printer, Ban, Gift, Ticket, Wallet
} from 'lucide-react'

const AdminDashboard = () => {
  const { user, profile, logout } = useAuth()
  const [stats, setStats] = useState({ users: 0, students: 0, parents: 0, associations: 0, revenue: 0 })
  const [pendingAssociations, setPendingAssociations] = useState([])
  const [pendingTeachers, setPendingTeachers] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [classStudents, setClassStudents] = useState([])
  const [giftcards, setGiftcards] = useState([])
  const [giftcardPlan, setGiftcardPlan] = useState('monthly')
  const [giftcardQty, setGiftcardQty] = useState(1)
  const [commissions, setCommissions] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchAdminData = useCallback(async () => {
    try {
      const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true })
      const { count: studentsCount } = await supabase.from('student_profiles').select('*', { count: 'exact', head: true })
      const { count: parentsCount } = await supabase.from('parent_profiles').select('*', { count: 'exact', head: true })
      const { count: assocCount } = await supabase.from('association_profiles').select('*', { count: 'exact', head: true })
      const { data: pending } = await supabase.from('association_profiles').select('*').eq('approved', false)
      const { data: pendingRoles } = await supabase
        .from('role_selection_requests')
        .select('*')
        .in('chosen_role', ['teacher', 'association'])
        .is('reviewed_at', null)
      const { data: users } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(20)
      const { data: cards } = await supabase.from('giftcards').select('*').order('created_at', { ascending: false }).limit(50)
      const { data: comms } = await supabase.from('commissions').select('*, association_profiles(association_name)').order('created_at', { ascending: false }).limit(50)
      const { data: subs } = await supabase.from('subscriptions').select('*, user_profiles(email, name)').order('created_at', { ascending: false }).limit(50)
      setStats({ users: usersCount || 0, students: studentsCount || 0, parents: parentsCount || 0, associations: assocCount || 0, revenue: (subs || []).filter(s => s.status === 'active').reduce((sum, s) => sum + (s.type === 'annual' ? 69.90 : 6.99), 0) })
      setPendingAssociations(pending || [])
      setPendingTeachers((pendingRoles || []).filter(r => r.chosen_role === 'teacher'))
      setRecentUsers(users || [])
      setGiftcards(cards || [])
      setCommissions(comms || [])
      setSubscriptions(subs || [])

      // Alunos com resumo de jogo, para o relatório de turma
      const { data: students } = await supabase
        .from('student_profiles')
        .select('user_id, nickname, school_year, school_name, class_name, game_states(level, xp, current_streak, last_quiz_date)')
        .order('nickname')
        .limit(200)
      setClassStudents((students || []).map(s => ({
        ...s,
        ...(Array.isArray(s.game_states) ? s.game_states[0] : s.game_states) || {},
      })))
    } catch (error) {
      toast.error('Erro ao carregar dados administrativos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAdminData()
  }, [fetchAdminData])

  const approveAssociation = async (id) => {
    try {
      await supabase.from('association_profiles').update({ approved: true }).eq('id', id)
      toast.success('Associação aprovada!')
      fetchAdminData()
    } catch (error) {
      toast.error('Erro ao aprovar')
    }
  }

  const runAdminAction = async (rpc, params, successMessage) => {
    try {
      const { error } = await supabase.rpc(rpc, params)
      if (error) throw error
      toast.success(successMessage)
      fetchAdminData()
    } catch (error) {
      toast.error(error.message || 'Erro ao executar ação')
    }
  }

  const toggleBlocked = (u) => runAdminAction(
    'admin_set_user_blocked',
    { p_user_id: u.id, p_blocked: u.is_active !== false },
    u.is_active !== false ? 'Conta bloqueada.' : 'Conta desbloqueada.',
  )

  const setApproval = (u, status) => runAdminAction(
    'admin_set_approval',
    { p_user_id: u.id, p_status: status },
    status === 'approved' ? 'Conta aprovada.' : 'Conta rejeitada.',
  )

  const grantSubscription = (u, plan) => runAdminAction(
    'admin_grant_subscription',
    { p_user_id: u.id, p_plan: plan },
    plan === 'annual' ? 'Subscrição anual oferecida.' : 'Subscrição mensal oferecida.',
  )

  const createGiftcards = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_create_giftcard', { p_plan: giftcardPlan, p_quantity: giftcardQty })
      if (error) throw error
      toast.success(`${(data || []).length} gift card(s) criado(s).`)
      fetchAdminData()
    } catch (error) {
      toast.error(error.message || 'Erro ao criar gift cards')
    }
  }

  const markCommissionPaid = (id) => runAdminAction(
    'admin_mark_commission_paid',
    { p_commission_id: id },
    'Comissão marcada como paga.',
  )

  const reviewRoleRequest = async (userId, approve) => {
    try {
      let reason = null
      if (!approve) {
        reason = window.prompt('Motivo da rejeição (opcional):')
      }
      const { data, error } = await supabase.rpc('approve_role_request', {
        p_user_id: userId,
        p_approve: approve,
        p_reason: reason,
      })
      if (error) throw error
      toast.success(approve ? 'Aprovado! O utilizador já pode entrar.' : 'Pedido rejeitado.')
      fetchAdminData()
    } catch (error) {
      toast.error(error.message || 'Erro ao processar o pedido')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="w-16 h-16 border-4 border-[hsl(35,92%,50%)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Castle className="h-8 w-8 text-[hsl(35,92%,45%)]" strokeWidth={2.5} />
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>QUESTEDUCA Admin</span>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-900/50 text-red-400 rounded-xl transition"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800 rounded-xl p-1">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'overview' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('associations')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'associations' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>Associações</button>
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'pending' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>
            Pendentes{pendingTeachers.length > 0 ? ` (${pendingTeachers.length})` : ''}
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'users' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>Utilizadores</button>
          <button onClick={() => setActiveTab('class')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'class' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>Turma</button>
          <button onClick={() => setActiveTab('giftcards')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'giftcards' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>Gift Cards</button>
          <button onClick={() => setActiveTab('revenue')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'revenue' ? 'bg-[hsl(35,92%,50%)] text-white' : 'text-slate-400 hover:text-white'}`}>Receita</button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <Users className="text-[hsl(38,95%,60%)] mb-3" size={28} />
              <p className="text-3xl font-bold text-white">{stats.users}</p>
              <p className="text-slate-400 text-sm">Total Utilizadores</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <Trophy className="text-blue-400 mb-3" size={28} />
              <p className="text-3xl font-bold text-white">{stats.students}</p>
              <p className="text-slate-400 text-sm">Alunos</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <Building2 className="text-amber-400 mb-3" size={28} />
              <p className="text-3xl font-bold text-white">{stats.associations}</p>
              <p className="text-slate-400 text-sm">Associações</p>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <DollarSign className="text-[hsl(38,95%,60%)] mb-3" size={28} />
              <p className="text-3xl font-bold text-white">{stats.revenue}€</p>
              <p className="text-slate-400 text-sm">Receita Total</p>
            </div>
          </div>
        )}

        {activeTab === 'associations' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Associações Pendentes</h2>
            {pendingAssociations.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhuma associação pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingAssociations.map(assoc => (
                  <div key={assoc.id} className="bg-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{assoc.association_name}</p>
                      <p className="text-sm text-slate-400">{assoc.school_name} - {assoc.municipality}</p>
                      <p className="text-xs text-slate-500">Código: {assoc.association_code}</p>
                    </div>
                    <button onClick={() => approveAssociation(assoc.id)} className="px-4 py-2 bg-[hsl(35,92%,50%)] text-white font-semibold rounded-xl hover:bg-[hsl(33,90%,45%)] transition flex items-center gap-2"><Check size={18} /> Aprovar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Pedidos Pendentes (Professores)</h2>
            {pendingTeachers.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Nenhum pedido pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingTeachers.map(req => (
                  <div key={req.user_id} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{req.email}</p>
                        <p className="text-sm text-slate-400">
                          {req.teacher_kind === 'explicador' ? 'Explicador' : 'Tutelar'}
                          {req.disciplines?.length ? ` · ${req.disciplines.join(', ')}` : ''}
                        </p>
                        <p className="text-xs text-slate-500">Móvel: {req.mobile_phone || '—'} · Escola: {req.school_name || '—'}</p>
                        <p className="text-xs text-slate-500">Comprovativo: {req.proof_document_name || '—'}</p>
                      </div>
                      <div className="flex gap-2">
                        {req.proof_document_url && (
                          <button
                            onClick={async () => {
                              const { data, error } = await supabase.storage.from('proofs').createSignedUrl(req.proof_document_url, 300)
                              if (!error && data) window.open(data.signedUrl, '_blank')
                              else toast.error('Não foi possível abrir o comprovativo')
                            }}
                            className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-xl hover:bg-slate-500 transition flex items-center gap-2"
                          ><Eye size={18} /> Ver</button>
                        )}
                        <button onClick={() => reviewRoleRequest(req.user_id, true)} className="px-4 py-2 bg-[hsl(35,92%,50%)] text-white font-semibold rounded-xl hover:bg-[hsl(33,90%,45%)] transition flex items-center gap-2"><Check size={18} /> Aprovar</button>
                        <button onClick={() => reviewRoleRequest(req.user_id, false)} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition flex items-center gap-2"><X size={18} /> Rejeitar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Utilizadores Recentes</h2>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="bg-slate-700/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{u.name} {u.is_active === false && <span className="text-xs text-red-400">(bloqueada)</span>}</p>
                    <p className="text-sm text-slate-400">{u.email}</p>
                    <p className="text-xs text-slate-500">Aprovação: {u.approval_status || '—'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : u.role === 'association' ? 'bg-amber-500/20 text-amber-400' : u.role === 'parent' ? 'bg-[hsl(35,92%,50%)]/20 text-blue-400' : 'bg-[hsl(35,92%,50%)]/20 text-[hsl(38,95%,60%)]'}`}>{u.role}</span>
                    {u.approval_status !== 'approved' && (
                      <button onClick={() => setApproval(u, 'approved')} className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-1"><Check size={14} /> Aprovar</button>
                    )}
                    {u.approval_status !== 'rejected' && u.role !== 'admin' && (
                      <button onClick={() => setApproval(u, 'rejected')} className="px-3 py-1 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-500 transition flex items-center gap-1"><X size={14} /> Rejeitar</button>
                    )}
                    <button onClick={() => grantSubscription(u, 'monthly')} className="px-3 py-1 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-500 transition flex items-center gap-1"><Gift size={14} /> Mensal</button>
                    <button onClick={() => grantSubscription(u, 'annual')} className="px-3 py-1 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-500 transition flex items-center gap-1"><Gift size={14} /> Anual</button>
                    {u.role !== 'admin' && (
                      <button onClick={() => toggleBlocked(u)} className={`px-3 py-1 text-white text-sm font-semibold rounded-lg transition flex items-center gap-1 ${u.is_active === false ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}><Ban size={14} /> {u.is_active === false ? 'Desbloquear' : 'Bloquear'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'class' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Cinzel, serif' }}>Relatórios dos Alunos</h2>
                <p className="text-slate-400 text-sm mt-1">Gera relatórios em PDF do progresso de cada aluno ou da turma inteira.</p>
              </div>
              <button
                onClick={() => {
                  const html = generateClassReport('Turma', classStudents)
                  const w = window.open('', '_blank')
                  w.document.write(html)
                  w.document.close()
                  setTimeout(() => w.print(), 500)
                  toast.success('Relatório de turma gerado! Use "Guardar como PDF".')
                }}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[hsl(35,92%,50%)] to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition"
              >
                <Printer size={18} /> Relatório da Turma (PDF)
              </button>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Alunos ({classStudents.length})</h3>
              {classStudents.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sem alunos registados ainda.</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map(s => (
                    <div key={s.user_id} className="bg-slate-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-[hsl(24,70%,42%)] flex items-center justify-center text-white font-bold">{s.nickname?.[0]?.toUpperCase() || '?'}</div>
                        <div>
                          <p className="font-semibold text-white">{s.nickname || 'Sem nome'}</p>
                          <p className="text-xs text-slate-400">{s.school_year ? `${s.school_year}º ano` : ''}{s.class_name ? ` · ${s.class_name}` : ''}{s.school_name ? ` · ${s.school_name}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-white font-bold">{s.xp || 0} XP</p>
                          <p className="text-xs text-slate-400">Nível {s.level || 1} · {s.current_streak || 0} dias</p>
                        </div>
                        <ExportReportButton
                          studentData={{ user_id: s.user_id, nickname: s.nickname, school_year: s.school_year }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'giftcards' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}><Ticket size={22} /> Gerar Gift Cards</h2>
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Plano</label>
                  <select value={giftcardPlan} onChange={e => setGiftcardPlan(e.target.value)} className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600">
                    <option value="monthly">Mensal (6,99€)</option>
                    <option value="annual">Anual (69,90€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Quantidade</label>
                  <input type="number" min={1} max={100} value={giftcardQty} onChange={e => setGiftcardQty(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} className="bg-slate-700 text-white rounded-lg px-3 py-2 border border-slate-600 w-24" />
                </div>
                <button onClick={createGiftcards} className="px-5 py-2 bg-[hsl(35,92%,50%)] text-white font-semibold rounded-xl hover:bg-[hsl(33,90%,45%)] transition flex items-center gap-2"><Gift size={18} /> Gerar</button>
              </div>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>Gift Cards ({giftcards.length})</h3>
              {giftcards.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nenhum gift card criado.</p>
              ) : (
                <div className="space-y-2">
                  {giftcards.map(gc => (
                    <div key={gc.id} className="bg-slate-700/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono font-bold text-white text-lg">{gc.code}</p>
                        <p className="text-xs text-slate-400">{gc.plan === 'annual' ? 'Anual' : 'Mensal'} · {Number(gc.amount).toFixed(2)}€ · {gc.status}{gc.redeemed_by ? ' · resgatado' : ''}</p>
                      </div>
                      <button onClick={() => { navigator.clipboard?.writeText(gc.code); toast.success('Código copiado') }} className="px-3 py-1 bg-slate-600 text-white text-sm font-semibold rounded-lg hover:bg-slate-500 transition">Copiar</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}><Wallet size={22} /> Subscrições ({subscriptions.length})</h2>
              {subscriptions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nenhuma subscrição registada.</p>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map(s => (
                    <div key={s.id} className="bg-slate-700/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{s.user_profiles?.email || '—'}</p>
                        <p className="text-xs text-slate-400">{s.user_profiles?.name} · {s.type === 'annual' ? 'Anual' : 'Mensal'} · {s.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Início</p>
                        <p className="text-sm text-white">{new Date(s.start_date).toLocaleDateString('pt-PT')}</p>
                        {s.end_date && <p className="text-xs text-slate-500">Até {new Date(s.end_date).toLocaleDateString('pt-PT')}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}><Coins size={22} /> Comissões de Associações ({commissions.length})</h2>
              {commissions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Nenhuma comissão registada.</p>
              ) : (
                <div className="space-y-2">
                  {commissions.map(c => (
                    <div key={c.id} className="bg-slate-700/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{c.association_profiles?.association_name || 'Associação'}</p>
                        <p className="text-xs text-slate-400">{Number(c.amount).toFixed(2)}€ · {c.paid ? 'Paga' : 'Pendente'}{c.paid_at ? ` · ${new Date(c.paid_at).toLocaleDateString('pt-PT')}` : ''}</p>
                      </div>
                      {!c.paid && (
                        <button onClick={() => markCommissionPaid(c.id)} className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition flex items-center gap-1"><Check size={14} /> Marcar paga</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
