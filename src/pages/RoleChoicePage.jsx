import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { Swords, School as StudentIcon, Users, GraduationCap, Building2, Phone, Paperclip, Clock, Plus, Trash2 } from 'lucide-react'
import SchoolPicker from '../components/SchoolPicker'

const RoleChoicePage = () => {
  const navigate = useNavigate()
  const { user, fetchProfile, setProfile } = useAuth()
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState('')
  const [proofFile, setProofFile] = useState(null)
  const [teacherKind, setTeacherKind] = useState('tutelar')
  const [disciplines, setDisciplines] = useState([])
  const [teachingYears, setTeachingYears] = useState([])
  const [teacherSchools, setTeacherSchools] = useState([])
  const [schoolDraft, setSchoolDraft] = useState({ district: '', municipality: '', locality: '', school_id: '', school_name: '' })

  const TEACHER_SUBJECTS = ['Matemática', 'Português', 'Estudo do Meio', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física', 'Educação Musical', 'Educação Visual']

  const toggleDiscipline = (d) => setDisciplines(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  const toggleYear = (y) => setTeachingYears(prev => prev.includes(y) ? prev.filter(x => x !== y).sort() : [...prev, y].sort())

  const addSchool = () => {
    if (!schoolDraft.school_id) { toast.error('Escolha a escola (distrito, concelho e escola)'); return }
    if (teacherSchools.some(s => s.school_id === schoolDraft.school_id)) { toast.error('Essa escola já foi adicionada'); return }
    setTeacherSchools(prev => [...prev, { ...schoolDraft }])
    setSchoolDraft({ district: '', municipality: '', locality: '', school_id: '', school_name: '' })
  }

  const removeSchool = (id) => setTeacherSchools(prev => prev.filter(s => s.school_id !== id))

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
    if (role === 'teacher') {
      if (disciplines.length === 0) { toast.error('Selecione pelo menos uma disciplina'); return }
      if (teachingYears.length === 0) { toast.error('Selecione pelo menos um ano que leciona'); return }
      if (teacherSchools.length === 0) { toast.error('Adicione pelo menos uma escola'); return }
    }
    setLoading(true)
    try {
      const proofPath = (role === 'teacher' || role === 'association') ? await uploadProof(proofFile) : null
      const { data, error } = await supabase.rpc('submit_google_role_request', {
        p_chosen_role: role,
        p_mobile_phone: (role === 'teacher' || role === 'association') ? mobile.trim() : null,
        p_proof_name: (role === 'teacher' || role === 'association') ? proofFile.name : null,
        p_proof_url: proofPath,
        p_school_id: role === 'teacher' ? teacherSchools[0]?.school_id || null : null,
        p_school_name: role === 'teacher' ? teacherSchools[0]?.school_name || null : null,
        p_teacher_kind: role === 'teacher' ? teacherKind : null,
        p_disciplines: role === 'teacher' ? disciplines : null,
        p_teaching_years: role === 'teacher' ? teachingYears : null,
        p_schools: role === 'teacher' ? teacherSchools : null,
      })
      if (error) throw error

      if (data === 'student' || data === 'parent') {
        toast.success('Conta criada com sucesso!')
        await fetchProfile(user.id)
        navigate(data === 'student' ? '/student/onboarding' : '/parent/dashboard')
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
    <div className="min-h-screen bg-[hsl(40,33%,96%)] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <img src="/logo.png" alt="QUESTEDUCA" className="h-16 w-auto drop-shadow-md" />
            <span className="text-3xl font-bold text-[hsl(24,10%,18%)] tracking-wide" style={{ fontFamily: 'Cinzel, serif' }}>
              QUESTEDUCA
            </span>
          </Link>
          <p className="text-slate-600 mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Para continuarmos, indica-nos quem és
          </p>
        </div>

        <div className="parchment rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[hsl(24,10%,18%)] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
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
                    ? 'border-[hsl(35,92%,50%)] bg-[hsl(38,95%,92%)]'
                    : 'border-[hsl(35,25%,85%)] hover:border-[hsl(35,40%,75%)]'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === r.id ? 'bg-[hsl(35,92%,50%)] text-white' : 'bg-[hsl(36,33%,91%)] text-[hsl(25,10%,45%)]'}`}>
                  <r.icon size={24} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[hsl(24,10%,18%)]">{r.label}</p>
                  <p className="text-xs text-slate-500">{r.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {needsProof && (
            <div className="space-y-4 mb-6 pt-4 border-t-2 border-slate-100">
              {role === 'teacher' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Tipo de Professor</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setTeacherKind('tutelar')} className={`p-3 rounded-xl border-2 text-left transition ${teacherKind === 'tutelar' ? 'border-[hsl(35,92%,50%)] bg-[hsl(38,95%,92%)]' : 'border-[hsl(35,25%,85%)]'}`}>
                        <p className="font-bold text-sm">Professor Tutelar</p>
                        <p className="text-xs text-slate-500">Titular da turma</p>
                      </button>
                      <button type="button" onClick={() => setTeacherKind('explicador')} className={`p-3 rounded-xl border-2 text-left transition ${teacherKind === 'explicador' ? 'border-[hsl(35,92%,50%)] bg-[hsl(38,95%,92%)]' : 'border-[hsl(35,25%,85%)]'}`}>
                        <p className="font-bold text-sm">Explicador / Centro</p>
                        <p className="text-xs text-slate-500">Apoio em disciplinas</p>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Disciplinas que leciona</label>
                    <div className="flex flex-wrap gap-2">
                      {TEACHER_SUBJECTS.map(d => (
                        <button key={d} type="button" onClick={() => toggleDiscipline(d)} className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${disciplines.includes(d) ? 'bg-[hsl(35,92%,50%)] text-white shadow' : 'bg-[hsl(36,33%,91%)] text-[hsl(25,10%,40%)] hover:bg-[hsl(36,33%,86%)]'}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Anos que leciona</label>
                    <div className="flex flex-wrap gap-2">
                      {[1,2,3,4,5,6,7,8,9].map(y => (
                        <button key={y} type="button" onClick={() => toggleYear(y)} className={`w-11 h-9 rounded-lg text-sm font-bold transition ${teachingYears.includes(y) ? 'bg-[hsl(35,92%,50%)] text-white shadow' : 'bg-[hsl(36,33%,91%)] text-[hsl(25,10%,40%)] hover:bg-[hsl(36,33%,86%)]'}`}>{y}º</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>Escolas onde leciona (pode adicionar várias)</label>
                    <div className="p-4 bg-[hsl(36,33%,95%)] rounded-xl border-2 border-dashed border-[hsl(35,25%,85%)]">
                      <SchoolPicker value={schoolDraft} onChange={setSchoolDraft} showLocality />
                      <button type="button" onClick={addSchool} className="mt-3 w-full py-2.5 bg-[hsl(142,45%,80%)] text-[hsl(28,85%,30%)] font-bold rounded-xl hover:bg-[hsl(142,45%,75%)] transition flex items-center justify-center gap-2">
                        <Plus size={16} /> Adicionar escola
                      </button>
                    </div>
                    {teacherSchools.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {teacherSchools.map(s => (
                          <div key={s.school_id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-slate-200">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{s.school_name}</p>
                              <p className="text-xs text-slate-500">{[s.locality, s.municipality, s.district].filter(Boolean).join(', ')}</p>
                            </div>
                            <button type="button" onClick={() => removeSchool(s.school_id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
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
                    className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                    placeholder="9XXXXXXXX"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {role === 'teacher' ? 'Comprovativo (cédula profissional ou declaração da escola)' : 'Comprovativo da atividade (estatutos ou recibo de constituição)'}
                </label>
                <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[hsl(35,60%,60%)] transition">
                  <Paperclip className="text-[hsl(25,10%,45%)]" size={20} />
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
            className="w-full px-8 py-4 rounded-xl font-bold text-white text-lg btn-gold hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
  <div className="min-h-screen bg-[hsl(40,33%,96%)] flex items-center justify-center p-4">
    <div className="parchment rounded-3xl shadow-xl p-10 max-w-md text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[hsl(38,95%,88%)] flex items-center justify-center">
        <Clock className="text-[hsl(28,85%,42%)]" size={40} />
      </div>
      <h1 className="text-2xl font-bold text-[hsl(24,10%,18%)] mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
        Conta em análise
      </h1>
      <p className="text-[hsl(25,10%,35%)] mb-6">
        O teu registo foi submetido com sucesso e está a aguardar aprovação do administrador do QUESTEDUCA.
        Serás notificado por email assim que for analisado.
      </p>
      <a href="/" className="text-[hsl(28,85%,40%)] font-bold hover:text-[hsl(28,85%,32%)]">
        Voltar ao início
      </a>
    </div>
  </div>
)

export { RoleChoicePage, PendingApprovalPage }
