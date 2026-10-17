import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Castle, School as StudentIcon, Users, GraduationCap, Building2, Phone, Paperclip, Clock } from 'lucide-react'

const RoleChoicePage = () => {
  const navigate = useNavigate()
  const { user, fetchProfile, setProfile } = useAuth()
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState('')
  const [proofFile, setProofFile] = useState(null)

  const uploadProof = async (file) => {
    const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('proofs').upload(path, file)
    if (error) throw error
    return path
  }

  const submitRole = async () => {
    if (!role) return
    if ((role === 'teacher' || role === 'association')) {
      if (!mobile.trim()) {
        toast.error('Indique o contacto móvel')
        return
      }
      if (!proofFile) {
        toast.error('Anexe o comprovativo')
        return
      }
    }
    setLoading(true)
    try {
      const proofPath = (role === 'teacher' || role === 'association') ? await uploadProof(proofFile) : null
      const { data, error } = await supabase.rpc('submit_google_role_request', {
        p_chosen_role: role,
        p_mobile_phone: (role === 'teacher' || role === 'association') ? mobile.trim() : null,
        p_proof_name: (role === 'teacher' || role === 'association') ? proofFile.name : null,
        p_proof_url: proofPath,
      })
      if (error) throw error

      if (data === 'student' || data === 'parent') {
        toast.success('Conta criada com sucesso!')
        await fetchProfile(user.id)
        navigate(data === 'student' ? '/student/dashboard' : '/parent/dashboard')
      } else {
        await fetchProfile(user.id)
        toast.success('Pedido submetido! A conta fica pendente de aprovação do administrador. Será notificado por email.', { duration: 10000 })
        navigate('/pending-approval')
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao submeter o pedido')
    } finally {
      setLoading(false)
    }
  }

  const ROLES = [
    { id: 'student', label: 'Sou Aluno', desc: 'Vou aprender e jogar no QUESTEDUCA', icon: StudentIcon, needsAuth: true },
    { id: 'parent', label: 'Sou Pai/Mãe', desc: 'Vou acompanhar o progresso dos meus filhos', icon: Users, needsAuth: false },
    { id: 'teacher', label: 'Sou Professor', desc: 'Titular da turma ou explicador (requer aprovação)', icon: GraduationCap, needsAuth: false },
    { id: 'association', label: 'Associação de Pais', desc: 'Represento uma associação de pais (requer aprovação)', icon: Building2, needsAuth: false },
  ]

  const needsProof = role === 'teacher' || role === 'association'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <Castle className="h-12 w-12 text-green-500" strokeWidth={2.5} />
            <span className="text-4xl font-bold text-slate-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              QUESTEDUCA
            </span>
          </Link>
          <p className="text-slate-600 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Para continuarmos, indica-nos quem és
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border-b-4 border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Escolhe o teu papel
          </h2>

          <div className="space-y-3 mb-6">
            {ROLES.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition ${
                  role === r.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === r.id ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <r.icon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{r.label}</p>
                  <p className="text-xs text-slate-500">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {needsProof && (
            <div className="space-y-4 mb-6 pt-4 border-t-2 border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Contacto Móvel
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                    placeholder="9XXXXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {role === 'teacher' ? 'Comprovativo (cédula profissional ou declaração da escola)' : 'Comprovativo da atividade (estatutos ou recibo de constituição)'}
                </label>
                <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-400 transition">
                  <Paperclip className="text-slate-400" size={20} />
                  <span className="text-sm text-slate-600 truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {proofFile ? proofFile.name : 'Anexar ficheiro (PDF ou imagem)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => setProofFile(e.target.files[0] || null)}
                  />
                </label>
              </div>
            </div>
          )}

          {role === 'student' && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Para seres aluno, o teu email tem de ter sido autorizado primeiro por um pai/encarregado no painel de pais.
            </p>
          )}

          <button
            type="button"
            onClick={submitRole}
            disabled={loading || !role}
            className="w-full px-8 py-4 rounded-full font-bold text-white text-lg bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all border-b-4 border-green-600 active:translate-y-0 active:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            {loading ? 'A submeter...' : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}

const PendingApprovalPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-green-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center border-b-4 border-slate-200">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
        <Clock className="text-amber-500" size={40} />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
        Conta em análise
      </h1>
      <p className="text-slate-600 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
        O teu registo foi submetido com sucesso e está a aguardar aprovação do administrador do QUESTEDUCA.
        Serás notificado por email assim que for analisado.
      </p>
      <a href="/" className="text-green-600 font-bold hover:text-green-700">
        Voltar ao início
      </a>
    </div>
  </div>
)

export { RoleChoicePage, PendingApprovalPage }
