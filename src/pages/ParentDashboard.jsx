import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Castle, LogOut, Plus, Users, CreditCard, TrendingUp, Trophy,
  Coins, Gem, BookOpen, Calendar, Star, Eye, Download, X,
  Check, AlertCircle, Crown, Heart, UserPlus, FileText
} from 'lucide-react'
import ReportExport, { ExportReportButton } from '../components/ReportExport'
import { OnlineStatusIndicator } from '../components/OfflineComponents'

const ParentDashboard = () => {
  const { user, profile, logout } = useAuth()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [childGameData, setChildGameData] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddChild, setShowAddChild] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [subscription, setSubscription] = useState(null)
  const [newChild, setNewChild] = useState({ nickname: '', school_year: 1, school_id: '' })

  const fetchChildren = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase.from('student_profiles').select('*').eq('parent_id', user.id)
      if (error) throw error
      setChildren(data || [])
      if (data && data.length > 0 && !selectedChild) {
        setSelectedChild(data[0])
      }
      const { data: subData } = await supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').single()
      setSubscription(subData)
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  useEffect(() => {
    const fetchChildGame = async () => {
      if (!selectedChild) return
      const { data: gs } = await supabase.from('game_states').select('*').eq('user_id', selectedChild.user_id).single()
      const { data: quizzes } = await supabase.from('quiz_answers').select('*').eq('user_id', selectedChild.user_id).order('created_at', { ascending: false }).limit(10)
      setChildGameData({ gameState: gs, quizHistory: quizzes || [] })
    }
    fetchChildGame()
  }, [selectedChild])

  const handleAddChild = async (e) => {
    e.preventDefault()
    if (!newChild.nickname.trim()) {
      toast.error('Indique um nickname')
      return
    }
    try {
      const randomEmail = `child_${Date.now()}@questeduca.pt`
      const randomPassword = Math.random().toString(36).slice(2) + 'A1!'
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: randomEmail,
        password: randomPassword,
        options: { data: { name: newChild.nickname, role: 'student' } }
      })
      if (authError) throw authError

      const childId = authData.user.id
      await supabase.from('user_profiles').insert({
        id: childId,
        email: randomEmail,
        name: newChild.nickname,
        role: 'student',
      })
      await supabase.from('student_profiles').insert({
        user_id: childId,
        parent_id: user.id,
        nickname: newChild.nickname,
        school_year: parseInt(newChild.school_year),
        school_id: newChild.school_id || null,
      })
      await supabase.from('game_states').insert({
        user_id: childId,
        coins: 100,
        diamonds: 10,
        xp: 0,
        level: 1,
        resources: { wood: 50, stone: 50, food: 50, gold: 20 },
        buildings: [],
        roads: [],
        population: 0,
        max_population: 10,
        defense_power: 0,
        attack_power: 0,
        production_timers: {},
        quizzes_today: 0,
        last_quiz_date: new Date().toISOString().split('T')[0],
        current_streak: 0,
        longest_streak: 0,
        streak_claimed_today: false,
        city_name: 'Aldeia do ' + newChild.nickname,
      })

      toast.success(`${newChild.nickname} foi adicionado!`)
      setShowAddChild(false)
      setNewChild({ nickname: '', school_year: 1, school_id: '' })
      fetchChildren()
    } catch (error) {
      toast.error('Erro ao adicionar filho: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-slate-50">
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Castle className="h-8 w-8 text-green-500" strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>QUESTEDUCA</span>
              <span className="text-sm text-slate-500 ml-2">Pai/Encarregado</span>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <OnlineStatusIndicator />
              <button onClick={logout} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"><LogOut size={20} /></button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Subscription banner */}
        {!subscription && (
          <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 text-white mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Conta Grátis</h3>
              <p className="text-white/90 text-sm">Faz upgrade para Premium e desbloqueia tudo!</p>
            </div>
            <button onClick={() => toast.info('Pagamentos em breve!')} className="px-6 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-slate-50 transition">Upgrade</button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Children List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Os Meus Filhos</h2>
                <button onClick={() => setShowAddChild(true)} className="p-2 bg-green-100 text-green-600 rounded-xl hover:bg-green-200 transition"><Plus size={20} /></button>
              </div>
              {children.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 mb-4">Ainda não adicionaste nenhum filho</p>
                  <button onClick={() => setShowAddChild(true)} className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition flex items-center gap-2 mx-auto"><Plus size={20} /> Adicionar Filho</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {children.map(child => (
                    <button key={child.user_id} onClick={() => setSelectedChild(child)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition text-left ${selectedChild?.user_id === child.user_id ? 'bg-green-50 border-2 border-green-200' : 'hover:bg-slate-50'}`}>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-lg">{child.nickname?.[0]?.toUpperCase() || '?'}</div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{child.nickname}</p>
                        <p className="text-sm text-slate-500">{child.school_year}º Ano</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Child Detail */}
          <div className="lg:col-span-2">
            {selectedChild ? (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">{selectedChild.nickname?.[0]?.toUpperCase()}</div>
                      <div>
                        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>{selectedChild.nickname}</h2>
                        <p className="text-slate-500">{selectedChild.school_year}º Ano</p>
                      </div>
                    </div>
                    <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition"><FileText size={18} /> Relatório</button>
                  </div>

                  {childGameData.gameState && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-amber-50 rounded-xl p-4 text-center"><Coins className="mx-auto text-amber-500 mb-2" size={24} /><p className="text-2xl font-bold text-amber-700">{childGameData.gameState.coins}</p><p className="text-xs text-slate-500">Moedas</p></div>
                      <div className="bg-cyan-50 rounded-xl p-4 text-center"><Gem className="mx-auto text-cyan-500 mb-2" size={24} /><p className="text-2xl font-bold text-cyan-700">{childGameData.gameState.diamonds}</p><p className="text-xs text-slate-500">Diamantes</p></div>
                      <div className="bg-green-50 rounded-xl p-4 text-center"><TrendingUp className="mx-auto text-green-500 mb-2" size={24} /><p className="text-2xl font-bold text-green-700">{childGameData.gameState.xp}</p><p className="text-xs text-slate-500">XP Total</p></div>
                      <div className="bg-purple-50 rounded-xl p-4 text-center"><Trophy className="mx-auto text-purple-500 mb-2" size={24} /><p className="text-2xl font-bold text-purple-700">{childGameData.gameState.current_streak}</p><p className="text-xs text-slate-500">Dias Seguidos</p></div>
                    </div>
                  )}

                  {/* Quiz History */}
                  <div>
                    <h3 className="font-bold text-lg mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>Histórico de Quizzes</h3>
                    {childGameData.quizHistory && childGameData.quizHistory.length > 0 ? (
                      <div className="space-y-2">
                        {childGameData.quizHistory.map((quiz, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                            <div className="flex items-center gap-3">
                              <BookOpen className="text-blue-500" size={20} />
                              <div>
                                <p className="font-semibold text-slate-700">{quiz.subject}</p>
                                <p className="text-xs text-slate-400">{new Date(quiz.created_at).toLocaleDateString('pt-PT')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-slate-700">{quiz.correct_answers}/{quiz.total_questions}</p>
                              <p className="text-xs text-green-600">{Math.round((quiz.correct_answers / quiz.total_questions) * 100)}% acerto</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-center py-4">Sem quizzes completados ainda</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
                <Castle className="mx-auto text-slate-300 mb-4" size={64} />
                <p className="text-slate-500">Seleciona um filho para ver o progresso</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Child Modal */}
      {showAddChild && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddChild(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Adicionar Filho</h2>
              <button onClick={() => setShowAddChild(false)} className="p-2 hover:bg-slate-100 rounded-xl"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddChild} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nickname</label>
                <input type="text" value={newChild.nickname} onChange={e => setNewChild({ ...newChild, nickname: e.target.value })} required className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition" placeholder="Ex: João" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Ano Escolar</label>
                <select value={newChild.school_year} onChange={e => setNewChild({ ...newChild, school_year: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(y => <option key={y} value={y}>{y}º Ano</option>)}
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition">Adicionar</button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && selectedChild && (
        <ReportExport isOpen={showReport} onClose={() => setShowReport(false)} studentData={{ ...selectedChild, ...childGameData.gameState, user_id: selectedChild.user_id }} />
      )}
    </div>
  )
}

export default ParentDashboard
