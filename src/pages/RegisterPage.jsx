import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Swords, Mail, Lock, User, Building2, MapPin, School, Users, Plus, Trash2, Paperclip, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'parent',
    nickname: ''
  })

  const [teacherData, setTeacherData] = useState({
    disciplines: [],
    school_id: '',
    school_name: '',
    class_name: '',
    teacher_kind: 'tutelar',
    mobile_phone: '',
    proof_file: null
  })

  const [associationData, setAssociationData] = useState({
    association_name: '',
    district: '',
    municipality: '',
    locality: '',
    school_id: '',
    school_name: '',
    iban: '',
    responsible_names: [''],
    mobile_phone: '',
    proof_file: null
  })

  const [loading, setLoading] = useState(false)
  const [districts, setDistricts] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [localities, setLocalities] = useState([])
  const [schools, setSchools] = useState([])

  useEffect(() => {
    const fetchDistricts = async () => {
      const { data } = await supabase.from('districts').select('*').order('name')
      if (data) setDistricts(data)
    }
    fetchDistricts()
  }, [])

  useEffect(() => {
    if (!associationData.district) return
    const fetchMunicipalities = async () => {
      const { data } = await supabase
        .from('schools')
        .select('municipality')
        .eq('district', associationData.district)
        .order('municipality')
      const unique = [...new Set(data?.map(s => s.municipality) || [])]
      setMunicipalities(unique)
      setAssociationData(prev => ({ ...prev, municipality: '', locality: '', school_id: '', school_name: '' }))
      setLocalities([])
      setSchools([])
    }
    fetchMunicipalities()
  }, [associationData.district])

  useEffect(() => {
    if (!associationData.municipality) return
    const fetchLocalities = async () => {
      const { data } = await supabase
        .from('schools')
        .select('locality')
        .eq('district', associationData.district)
        .eq('municipality', associationData.municipality)
        .order('locality')
      const unique = [...new Set(data?.map(s => s.locality).filter(Boolean) || [])]
      setLocalities(unique)
      setAssociationData(prev => ({ ...prev, locality: '', school_id: '', school_name: '' }))
      setSchools([])
    }
    fetchLocalities()
  }, [associationData.municipality])

  useEffect(() => {
    if (!associationData.locality) return
    const fetchSchools = async () => {
      const { data } = await supabase
        .from('schools')
        .select('*')
        .eq('district', associationData.district)
        .eq('municipality', associationData.municipality)
        .eq('locality', associationData.locality)
        .order('name')
      setSchools(data || [])
      setAssociationData(prev => ({ ...prev, school_id: '', school_name: '' }))
    }
    fetchSchools()
  }, [associationData.locality])

  const handleSchoolSelect = (schoolId) => {
    const school = schools.find(s => s.school_id === schoolId)
    if (school) {
      setAssociationData(prev => ({ ...prev, school_id: school.school_id, school_name: school.name }))
    }
  }

  const addResponsible = () => {
    setAssociationData(prev => ({ ...prev, responsible_names: [...prev.responsible_names, ''] }))
  }

  const updateResponsible = (index, value) => {
    setAssociationData(prev => {
      const newNames = [...prev.responsible_names]
      newNames[index] = value
      return { ...prev, responsible_names: newNames }
    })
  }

  const removeResponsible = (index) => {
    if (associationData.responsible_names.length > 1) {
      setAssociationData(prev => ({ ...prev, responsible_names: prev.responsible_names.filter((_, i) => i !== index) }))
    }
  }

  const generateAssociationCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const TEACHER_SUBJECTS = ['Matemática', 'Português', 'Estudo do Meio', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física', 'Educação Musical', 'Educação Visual']

  const toggleDiscipline = (d) => {
    setTeacherData(prev => ({
      ...prev,
      disciplines: prev.disciplines.includes(d)
        ? prev.disciplines.filter(x => x !== d)
        : [...prev.disciplines, d]
    }))
  }

  const uploadProof = async (userId, file) => {
    const path = `${userId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('proofs').upload(path, file)
    if (error) throw error
    return path
  }

  const handleTeacherRegister = async () => {
    if (teacherData.disciplines.length === 0) {
      toast.error('Selecione pelo menos uma disciplina')
      return
    }
    if (!teacherData.mobile_phone.trim()) {
      toast.error('Indique o contacto móvel')
      return
    }
    if (!teacherData.proof_file) {
      toast.error('Anexe o comprovativo (cédula profissional ou declaração da escola)')
      return
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: { data: { name: formData.name, role: 'pending_teacher' } }
    })
    if (authError) throw authError

    const userId = authData.user.id
    const proofPath = await uploadProof(userId, teacherData.proof_file)

    await supabase.from('user_profiles').insert({
      id: userId,
      email: formData.email,
      name: formData.name,
      role: 'pending_teacher',
      mobile_phone: teacherData.mobile_phone.trim(),
      proof_document_name: teacherData.proof_file.name,
      proof_document_url: proofPath,
      approval_status: 'pending',
    })
    await supabase.from('role_selection_requests').insert({
      user_id: userId,
      email: formData.email,
      chosen_role: 'teacher',
      mobile_phone: teacherData.mobile_phone.trim(),
      proof_document_name: teacherData.proof_file.name,
      proof_document_url: proofPath,
      school_id: teacherData.school_id || null,
      school_name: teacherData.school_name || null,
      class_name: teacherData.class_name || null,
      teacher_kind: teacherData.teacher_kind,
      disciplines: teacherData.disciplines,
    })
  }

  const isStrongPassword = (pwd) =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isStrongPassword(formData.password)) {
      toast.error('A password deve ter pelo menos 8 caracteres, incluindo maiúscula, minúscula e um caractere especial (ex.: ! ? #)')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('As passwords não coincidem')
      return
    }

    setLoading(true)

    try {
      if (formData.role === 'association') {
        if (!associationData.association_name || !associationData.school_id || !associationData.iban) {
          toast.error('Por favor preencha todos os campos obrigatórios')
          setLoading(false)
          return
        }
        if (!associationData.mobile_phone.trim()) {
          toast.error('Indique o contacto móvel')
          setLoading(false)
          return
        }
        if (!associationData.proof_file) {
          toast.error('Anexe o comprovativo da atividade da associação (estatutos ou recibo de constituição)')
          setLoading(false)
          return
        }

        const responsibleNames = associationData.responsible_names.filter(n => n.trim())
        if (responsibleNames.length === 0) {
          toast.error('Adicione pelo menos um responsável')
          setLoading(false)
          return
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name, role: 'pending_association' } }
        })
        if (authError) throw authError

        const userId = authData.user.id
        const associationCode = generateAssociationCode()
        const proofPath = await uploadProof(userId, associationData.proof_file)

        await supabase.from('user_profiles').insert({
          id: userId,
          email: formData.email,
          name: formData.name,
          role: 'pending_association',
          mobile_phone: associationData.mobile_phone.trim(),
          proof_document_name: associationData.proof_file.name,
          proof_document_url: proofPath,
          approval_status: 'pending',
        })

        await supabase.from('role_selection_requests').insert({
          user_id: userId,
          email: formData.email,
          chosen_role: 'association',
          mobile_phone: associationData.mobile_phone.trim(),
          proof_document_name: associationData.proof_file.name,
          proof_document_url: proofPath,
          association_name: associationData.association_name,
          district: associationData.district,
          municipality: associationData.municipality,
          locality: associationData.locality,
          school_id: associationData.school_id,
          school_name: associationData.school_name,
          iban: associationData.iban,
          responsible_names: responsibleNames,
          association_code: associationCode,
        })

        toast.success(
          `Registo submetido! A conta fica pendente de aprovação do administrador. Código da associação: ${associationCode}`,
          { duration: 15000 }
        )
        navigate('/login')
      } else if (formData.role === 'teacher') {
        await handleTeacherRegister()
        toast.success('Registo submetido! A conta fica pendente de aprovação do administrador. Será notificado por email.', { duration: 10000 })
        navigate('/login')
      } else {
        await register(formData.email, formData.password, formData.name, formData.role, formData.nickname)
        toast.success('Registo bem-sucedido! Por favor, faça login.')
        navigate('/login')
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao registar')
    } finally {
      setLoading(false)
    }
  }

  const isAssociation = formData.role === 'association'
  const isTeacher = formData.role === 'teacher'
  const isStudent = formData.role === 'student'
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
            {isAssociation ? 'Registe a sua Associação de Pais' : 'Cria a tua conta e começa a aventura!'}
          </p>
        </div>

        <div className="parchment rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[hsl(24,10%,18%)] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
            Registar
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Tipo de Conta
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <option value="parent">Pai/Encarregado de Educação</option>
                <option value="student">Aluno</option>
                <option value="teacher">Professor</option>
                <option value="association">Associação de Pais</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {isAssociation ? 'Nome do Representante' : 'Nome Completo'}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="João Silva"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Mínimo 8 caracteres, com maiúscula, minúscula e caractere especial (ex.: Aa1!)
                </p>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Confirmar
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isStudent && (
              <div className="pt-4 border-t-2 border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  O teu nickname no jogo
                </label>
                <p className="text-xs text-slate-500 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  Escolhe o teu nickname (sem espaços). Os teus pais podem alterá-lo depois no painel de pais.
                </p>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value.replace(/\s/g, '') })}
                  required
                  className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                  placeholder="Ex.: SuperAna"
                />
              </div>
            )}

            {isTeacher && (
              <div className="space-y-5 pt-4 border-t-2 border-slate-100">                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Tipo de Professor
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTeacherData({ ...teacherData, teacher_kind: 'tutelar' })}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        teacherData.teacher_kind === 'tutelar'
                          ? 'border-[hsl(35,92%,50%)] bg-[hsl(38,95%,92%)]'
                          : 'border-[hsl(35,25%,85%)] hover:border-[hsl(35,40%,75%)]'
                      }`}
                    >
                      <p className="font-bold text-[hsl(24,10%,18%)] text-sm">Professor Tutelar</p>
                      <p className="text-xs text-slate-500 mt-1">Titular da turma, acompanha o progresso completo.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeacherData({ ...teacherData, teacher_kind: 'explicador' })}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        teacherData.teacher_kind === 'explicador'
                          ? 'border-[hsl(35,92%,50%)] bg-[hsl(38,95%,92%)]'
                          : 'border-[hsl(35,25%,85%)] hover:border-[hsl(35,40%,75%)]'
                      }`}
                    >
                      <p className="font-bold text-[hsl(24,10%,18%)] text-sm">Explicador / Centro de Estudos</p>
                      <p className="text-xs text-slate-500 mt-1">Apoio em disciplinas específicas.</p>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Cada disciplina pode ter um professor tutelar e um explicador.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Disciplinas que leciona
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TEACHER_SUBJECTS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDiscipline(d)}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                          teacherData.disciplines.includes(d)
                            ? 'bg-[hsl(35,92%,50%)] text-white shadow'
                            : 'bg-[hsl(36,33%,91%)] text-[hsl(25,10%,40%)] hover:bg-[hsl(36,33%,86%)]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Escola (opcional)
                    </label>
                    <input
                      type="text"
                      value={teacherData.school_name}
                      onChange={(e) => setTeacherData({ ...teacherData, school_name: e.target.value })}
                      className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                      placeholder="Nome da escola"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Turma (opcional)
                    </label>
                    <input
                      type="text"
                      value={teacherData.class_name}
                      onChange={(e) => setTeacherData({ ...teacherData, class_name: e.target.value })}
                      className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                      placeholder="Ex: 5ºA"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Contacto Móvel
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="tel"
                      value={teacherData.mobile_phone}
                      onChange={(e) => setTeacherData({ ...teacherData, mobile_phone: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                      placeholder="9XXXXXXXX"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Comprovativo (cédula profissional ou declaração da escola)
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[hsl(35,60%,60%)] transition">
                    <Paperclip className="text-[hsl(25,10%,45%)]" size={20} />
                    <span className="text-sm text-[hsl(25,10%,35%)] truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {teacherData.proof_file ? teacherData.proof_file.name : 'Anexar ficheiro (PDF ou imagem)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setTeacherData({ ...teacherData, proof_file: e.target.files[0] || null })}
                    />
                  </label>
                </div>
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  O seu registo fica pendente até ser aprovado pelo administrador. Será notificado por email após a análise.
                </p>
              </div>
            )}

            {isAssociation && (
              <div className="space-y-5 pt-4 border-t-2 border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Nome da Associação
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      value={associationData.association_name}
                      onChange={(e) => setAssociationData({ ...associationData, association_name: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                      placeholder="Associação de Pais - Escola X"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Distrito
                    </label>
                    <select
                      value={associationData.district}
                      onChange={(e) => setAssociationData({ ...associationData, district: e.target.value })}
                      required
                      className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      <option value="">Selecionar...</option>
                      {districts.map(d => (
                        <option key={d.district_id} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Concelho
                    </label>
                    <select
                      value={associationData.municipality}
                      onChange={(e) => setAssociationData({ ...associationData, municipality: e.target.value })}
                      required
                      disabled={!associationData.district}
                      className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all disabled:opacity-50"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      <option value="">Selecionar...</option>
                      {municipalities.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Localidade
                    </label>
                    <select
                      value={associationData.locality}
                      onChange={(e) => setAssociationData({ ...associationData, locality: e.target.value })}
                      required
                      disabled={!associationData.municipality}
                      className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all disabled:opacity-50"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      <option value="">Selecionar...</option>
                      {localities.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      Escola
                    </label>
                    <select
                      value={associationData.school_id}
                      onChange={(e) => handleSchoolSelect(e.target.value)}
                      required
                      disabled={!associationData.locality}
                      className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all disabled:opacity-50"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      <option value="">Selecionar...</option>
                      {schools.map(s => (
                        <option key={s.school_id} value={s.school_id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    IBAN
                  </label>
                  <input
                    type="text"
                    value={associationData.iban}
                    onChange={(e) => setAssociationData({ ...associationData, iban: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                    style={{ fontFamily: 'Nunito, sans-serif' }}
                    placeholder="PT50 0000 0000 0000 0000 0000 0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Responsáveis
                  </label>
                  {associationData.responsible_names.map((name, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => updateResponsible(index, e.target.value)}
                        className="flex-1 px-4 py-2 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                        style={{ fontFamily: 'Nunito, sans-serif' }}
                        placeholder="Nome do responsável"
                      />
                      {associationData.responsible_names.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeResponsible(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addResponsible}
                    className="text-[hsl(28,85%,40%)] font-bold text-sm flex items-center gap-1 hover:text-[hsl(28,85%,32%)]"
                  >
                    <Plus size={16} /> Adicionar responsável
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Contacto Móvel
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="tel"
                      value={associationData.mobile_phone}
                      onChange={(e) => setAssociationData({ ...associationData, mobile_phone: e.target.value })}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                      placeholder="9XXXXXXXX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    Comprovativo da atividade (estatutos ou comprovativo de constituição)
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-[hsl(35,60%,60%)] transition">
                    <Paperclip className="text-[hsl(25,10%,45%)]" size={20} />
                    <span className="text-sm text-[hsl(25,10%,35%)] truncate" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {associationData.proof_file ? associationData.proof_file.name : 'Anexar ficheiro (PDF ou imagem)'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={(e) => setAssociationData({ ...associationData, proof_file: e.target.files[0] || null })}
                    />
                  </label>
                </div>

                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  O seu registo fica pendente até ser aprovado pelo administrador. Será notificado por email após a análise.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 rounded-xl font-bold text-white text-lg btn-gold hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              {loading ? 'A registar...' : 'Registar'}
            </button>
          </form>

          <p className="text-center mt-6 text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Já tens conta?{' '}
            <Link to="/login" className="text-[hsl(28,85%,40%)] font-bold hover:text-[hsl(28,85%,32%)]">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
