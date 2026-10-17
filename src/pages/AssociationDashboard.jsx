import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import {
  Castle, LogOut, Building2, Users, School, DollarSign,
  Copy, Check, TrendingUp, Coins
} from 'lucide-react'

const AssociationDashboard = () => {
  const { user, profile, logout } = useAuth()
  const [assocData, setAssocData] = useState(null)
  const [linkedParents, setLinkedParents] = useState([])
  const [commissions, setCommissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchAssocData = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data: assoc, error } = await supabase.from('association_profiles').select('*').eq('user_id', user.id).single()
      if (error) throw error
      setAssocData(assoc)

      if (assoc?.school_id) {
        const { data: parents } = await supabase.from('parent_profiles').select('*, user_profiles!inner(name, email)').eq('school_id', assoc.school_id)
        setLinkedParents(parents || [])
      }

      const { data: comms } = await supabase.from('commissions').select('*').eq('association_id', assoc.id).order('created_at', { ascending: false }).limit(10)
      setCommissions(comms || [])
    } catch (error) {
      toast.error('Erro ao carregar dados da associação')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAssocData()
  }, [fetchAssocData])

  const copyCode = () => {
    if (assocData?.association_code) {
      navigator.clipboard.writeText(assocData.association_code)
      setCopied(true)
      toast.success('Código copiado!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!assocData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <p className="text-slate-500">Associação não encontrada</p>
      </div>
    )
  }

  const totalCommission = commissions.reduce((sum, c) => sum + (c.amount || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50">
      <nav className="backdrop-blur-xl bg-white/80 border-b border-slate-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-500" strokeWidth={2.5} />
              <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>{assocData.association_name}</span>
            </div>
            <button onClick={logout} className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {!assocData.approved && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl"><TrendingUp className="text-amber-600" size={20} /></div>
            <p className="text-amber-800">A sua associação está a aguardar aprovação do administrador.</p>
          </div>
        )}

        {/* Association Code */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-3xl p-6 text-white mb-6">
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>Código da Associação</h2>
          <p className="text-white/80 text-sm mb-4">Partilhe este código com os pais da escola para se associarem.</p>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-6 py-3 rounded-xl font-mono text-2xl font-bold tracking-wider">{assocData.association_code}</div>
            <button onClick={copyCode} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition">{copied ? <Check size={20} /> : <Copy size={20} />}</button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Users className="text-blue-500 mb-3" size={28} />
            <p className="text-3xl font-bold text-slate-800">{linkedParents.length}</p>
            <p className="text-slate-500 text-sm">Pais Associados</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <School className="text-green-500 mb-3" size={28} />
            <p className="text-lg font-bold text-slate-800">{assocData.school_name}</p>
            <p className="text-slate-500 text-sm">{assocData.municipality}, {assocData.district}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <Coins className="text-amber-500 mb-3" size={28} />
            <p className="text-3xl font-bold text-slate-800">{totalCommission.toFixed(2)}€</p>
            <p className="text-slate-500 text-sm">Comissões Totais</p>
          </div>
        </div>

        {/* Linked Parents */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Pais Associados</h2>
          {linkedParents.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Nenhum pai associado ainda. Partilhe o seu código!</p>
          ) : (
            <div className="space-y-2">
              {linkedParents.map(parent => (
                <div key={parent.user_id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-green-500 flex items-center justify-center text-white font-bold">{parent.user_profiles?.name?.[0]?.toUpperCase() || '?'}</div>
                    <div>
                      <p className="font-semibold text-slate-700">{parent.user_profiles?.name || 'N/A'}</p>
                      <p className="text-sm text-slate-400">{parent.user_profiles?.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Commission History */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>Histórico de Comissões</h2>
          {commissions.length === 0 ? (
            <p className="text-slate-400 text-center py-8">Sem comissões registadas</p>
          ) : (
            <div className="space-y-2">
              {commissions.map(comm => (
                <div key={comm.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                  <div>
                    <p className="font-semibold text-slate-700">{comm.description || 'Comissão'}</p>
                    <p className="text-xs text-slate-400">{new Date(comm.created_at).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <p className="font-bold text-green-600">+{comm.amount?.toFixed(2)}€</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AssociationDashboard
