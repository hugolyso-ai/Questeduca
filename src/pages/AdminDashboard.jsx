import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { generateClassReport, ExportReportButton } from '../components/ReportExport'
import {
  Castle, LogOut, Users, School, TrendingUp, DollarSign,
  Check, X, Eye, BarChart3, Building2, Coins, Trophy, FileText, Printer
} from 'lucide-react'

const AdminDashboard = () => {
  const { user, profile, logout } = useAuth()
  const [stats, setStats] = useState({ users: 0, students: 0, parents: 0, associations: 0, revenue: 0 })
  const [pendingAssociations, setPendingAssociations] = useState([])
  const [recentUsers, setRecentUsers] = useState([])
  const [classStudents, setClassStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchAdminData = useCallback(async () => {
    try {
      const { count: usersCount } = await supabase.from('user_profiles').select('*', { count: 'exact', head: true })
      const { count: studentsCount } = await supabase.from('student_profiles').select('*', { count: 'exact', head: true })
      const { count: parentsCount } = await supabase.from('parent_profiles').select('*', { count: 'exact', head: true })
      const { count: assocCount } = await supabase.from('association_profiles').select('*', { count: 'exact', head: true })
      const { data: pending } = await supabase.from('association_profiles').select('*').eq('approved', false)
      const { data: users } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false }).limit(20)
      setStats({ users: usersCount || 0, students: studentsCount || 0, parents: parentsCount || 0, associations: assocCount || 0, revenue: 0 })
      setPendingAssociations(pending || [])
      setRecentUsers(users || [])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <nav className="backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Castle className="h-8 w-8 text-green-500" strokeWidth={2.5} />
              <span className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>QUESTEDUCA Admin</span>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-900/50 text-red-400 rounded-xl transition"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-800 rounded-xl p-1">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'overview' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('associations')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'associations' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}>Associações</button>
          <button onClick={() => setActiveTab('users')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'users' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}>Utilizadores</button>
          <button onClick={() => setActiveTab('class')} className={`px-6 py-2 rounded-lg font-semibold transition ${activeTab === 'class' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}>Turma</button>
        </div>

        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <Users className="text-green-400 mb-3" size={28} />
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
              <DollarSign className="text-green-400 mb-3" size={28} />
              <p className="text-3xl font-bold text-white">{stats.revenue}€</p>
              <p className="text-slate-400 text-sm">Receita Total</p>
            </div>
          </div>
        )}

        {activeTab === 'associations' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Associações Pendentes</h2>
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
                    <button onClick={() => approveAssociation(assoc.id)} className="px-4 py-2 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition flex items-center gap-2"><Check size={18} /> Aprovar</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Utilizadores Recentes</h2>
            <div className="space-y-2">
              {recentUsers.map(u => (
                <div key={u.id} className="bg-slate-700/50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{u.name}</p>
                    <p className="text-sm text-slate-400">{u.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' : u.role === 'association' ? 'bg-amber-500/20 text-amber-400' : u.role === 'parent' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'class' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>Relatórios dos Alunos</h2>
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
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition"
              >
                <Printer size={18} /> Relatório da Turma (PDF)
              </button>
            </div>

            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Alunos ({classStudents.length})</h3>
              {classStudents.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sem alunos registados ainda.</p>
              ) : (
                <div className="space-y-2">
                  {classStudents.map(s => (
                    <div key={s.user_id} className="bg-slate-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">{s.nickname?.[0]?.toUpperCase() || '?'}</div>
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
      </div>
    </div>
  )
}

export default AdminDashboard
