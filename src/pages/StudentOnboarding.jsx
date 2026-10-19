import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Cake, School, Sparkles, Loader2, Users } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import SchoolPicker from '../components/SchoolPicker'

// Página de configuração inicial do aluno: data de nascimento → idade/ano escolar automático + escola.
// É mostrada após o primeiro login de um aluno que ainda não tem data de nascimento.
const StudentOnboarding = () => {
  const navigate = useNavigate()
  const { user, profile, setProfile } = useAuth()
  const [birthDate, setBirthDate] = useState('')
  const [school, setSchool] = useState({ district: '', municipality: '', locality: '', school_id: '', school_name: '' })
  const [saving, setSaving] = useState(false)
  const [previewYear, setPreviewYear] = useState(null)

  useEffect(() => {
    const run = async () => {
      // Ano automático de pré-visualização: chamada à função do servidor com data hipotética não é possível;
      // replicamos a regra (idade em 31/12 do ano letivo; 6 anos → 1.º ano).
      if (!birthDate) { setPreviewYear(null); return }
      const [y, m] = birthDate.split('-').map(Number)
      const now = new Date()
      const refYear = now.getMonth() + 1 >= 9 ? now.getFullYear() : now.getFullYear() - 1
      const ageAtRef = refYear - y
      setPreviewYear(ageAtRef >= 6 ? Math.min(ageAtRef - 5, 12) : null)
    }
    run()
  }, [birthDate])

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return
      const { data } = await supabase
        .from('student_profiles')
        .select('birth_date, school_id, school_name, district, municipality, locality')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        if (data.birth_date) {
          setBirthDate(data.birth_date)
        }
        if (data.school_id || data.district) {
          setSchool({
            district: data.district || '',
            municipality: data.municipality || '',
            locality: data.locality || '',
            school_id: data.school_id || '',
            school_name: data.school_name || '',
          })
        }
      }
    }
    run()
  }, [user?.id])

  const [className, setClassName] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!birthDate) {
      toast.error('Indique a data de nascimento')
      return
    }
    if (!school.school_id) {
      toast.error('Escolha a sua escola')
      return
    }
    if (!className.trim()) {
      toast.error('Indica a tua turma (ex.: 5ºA)')
      return
    }
    setSaving(true)
    try {
      const { data: yearData, error: rpcErr } = await supabase.rpc('complete_student_signup', {
        p_birth_date: birthDate,
      })
      if (rpcErr) throw rpcErr

      const { error: updErr } = await supabase
        .from('student_profiles')
        .update({
          school_id: school.school_id,
          school_name: school.school_name,
          district: school.district,
          municipality: school.municipality,
          locality: school.locality,
          class_name: className.trim().toUpperCase(),
        })
        .eq('user_id', user.id)
      if (updErr) throw updErr

      toast.success(previewYear ? `Tudo pronto! Estás no ${previewYear}º ano.` : 'Tudo pronto!')
      if (setProfile && profile) setProfile({ ...profile, birth_date: birthDate, school_id: school.school_id })
      navigate('/student/dashboard')
    } catch (err) {
      toast.error(err.message || 'Erro ao guardar')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
  const labelStyle = { fontFamily: 'Nunito, sans-serif' }

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
          <p className="text-slate-600 mt-2" style={labelStyle}>Falta pouco! Diz-nos quando nasceste e qual é a tua escola.</p>
        </div>

        <div className="parchment rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-[hsl(24,10%,18%)] mb-6" style={{ fontFamily: 'Cinzel, serif' }}>
            Os teus dados escolares
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2" style={labelStyle}>
                Data de nascimento
              </label>
              <div className="relative">
                <Cake className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-12 pr-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all"
                  style={labelStyle}
                />
              </div>
              {previewYear && (
                <div className="mt-3 flex items-center gap-2 bg-[hsl(38,95%,92%)] border border-[hsl(35,60%,80%)] rounded-xl p-3">
                  <Sparkles className="text-[hsl(28,85%,40%)] flex-shrink-0" size={18} />
                  <p className="text-sm text-[hsl(24,10%,25%)] font-semibold" style={labelStyle}>
                    Idade: {new Date().getFullYear() - new Date(birthDate).getFullYear()} anos → {previewYear}º ano (calculado automaticamente; os teus pais podem alterá-lo)
                  </p>
                </div>
              )}
              {birthDate && !previewYear && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2" style={labelStyle}>
                  Ainda não tens idade para o 1.º ano — os teus pais podem indicar o ano manualmente mais tarde.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5" style={labelStyle}>
                <School size={16} /> A tua escola
              </label>
              <SchoolPicker value={school} onChange={setSchool} showLocality />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5" style={labelStyle}>
                <Users size={16} /> A tua turma (obrigatória)
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value.toUpperCase())}
                maxLength={10}
                required
                placeholder="Ex.: 5ºA"
                className={inputCls}
                style={labelStyle}
              />
              <p className="text-xs text-slate-400 mt-1" style={labelStyle}>
                É pela turma que recebes testes e livros do teu professor.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full px-8 py-4 rounded-xl font-bold text-white text-lg btn-gold hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={labelStyle}
            >
              {saving ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={20} /> A guardar...</span> : 'Começar a aventura!'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default StudentOnboarding
