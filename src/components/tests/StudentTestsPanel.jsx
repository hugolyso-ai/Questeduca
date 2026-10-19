import { useState, useEffect, useRef } from 'react'
import { FileText, Play, Clock, Printer, AlertTriangle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { PrintTestSheet, printNow } from './PrintTestSheet'
import { computedTotal } from './testUtils'

export default function StudentTestsPanel() {
  const [tests, setTests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [active, setActive] = useState(null) // { test, submissionId, answers, startedAt }
  const [timeLeft, setTimeLeft] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const submitRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u?.user) return
      const [{ data: t }, { data: s }, { data: sp }] = await Promise.all([
        supabase.from('teacher_custom_tests').select('*').order('created_at', { ascending: false }),
        supabase.from('custom_test_submissions').select('*').order('submitted_at', { ascending: false }),
        supabase.from('student_profiles').select('nickname, class_name, school_id').eq('user_id', u.user.id).maybeSingle(),
      ])
      setTests(t || [])
      setSubmissions(s || [])
      setStudentProfile(sp)
      setLoading(false)

      // retoma tentativa em curso
      const ongoing = (s || []).find(x => x.status === 'in_progress' && (t || []).some(tt => tt.id === x.test_id))
      if (ongoing) {
        const test = t.find(tt => tt.id === ongoing.test_id)
        resume(test, ongoing)
      }
    }
    load()
  }, [])

  const resume = (test, sub) => {
    if (!test) return
    setActive({ test, submissionId: sub.id, attempt: sub.attempt, answers: sub.answers || [], startedAt: sub.started_at })
    if (test.time_limit_minutes) {
      const elapsed = (Date.now() - new Date(sub.started_at).getTime()) / 1000
      setTimeLeft(Math.max(0, Math.round(test.time_limit_minutes * 60 - elapsed)))
    }
  }

  const startAttempt = async (test) => {
    try {
      const { data, error } = await supabase.rpc('start_custom_test_attempt', { p_test_id: test.id })
      if (error) throw error
      setActive({ test, submissionId: data.submission_id, attempt: data.attempt, answers: [], startedAt: data.started_at })
      if (test.time_limit_minutes) setTimeLeft(test.time_limit_minutes * 60)
      toast.info(`Tentativa ${data.attempt} iniciada. Boa sorte!`)
    } catch (e) {
      toast.error(e.message)
    }
  }

  const submit = async () => {
    if (!active || submitRef.current) return
    if (!window.confirm('Entregar o teste? Não poderás alterar as respostas.')) return
    submitRef.current = true
    try {
      const { error } = await supabase.rpc('submit_custom_test_answers', {
        p_submission_id: active.submissionId,
        p_answers: active.answers,
      })
      if (error) throw error
      toast.success('Teste entregue! O professor vai corrigi-lo (tem 5 dias).')
      setActive(null)
      setTimeLeft(null)
      const { data: s } = await supabase.from('custom_test_submissions').select('*').order('submitted_at', { ascending: false })
      setSubmissions(s || [])
    } catch (e) {
      toast.error(e.message)
      submitRef.current = false
    }
  }

  // cronómetro
  useEffect(() => {
    if (!active || timeLeft === null) return
    if (timeLeft <= 0) { submit(); return }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [active, timeLeft])

  const usedAttempts = (testId) => submissions.filter(s => s.test_id === testId && s.status !== 'in_progress').length
  const myPrintProfile = {
    nickname: studentProfile?.nickname || '',
    className: studentProfile?.class_name || '',
  }
  const [printing, setPrinting] = useState(null)

  const printWithAnswers = (test, sub) => {
    setPrinting({
      test,
      answers: sub.answers || [],
      corrections: sub.corrections || null,
      finalGrade: sub.corrections ? computedTotal(test, sub.corrections || []) : null,
      observations: sub.teacher_observations || '',
    })
    setTimeout(printNow, 150)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (loading) return <div className="text-center text-slate-400 py-8">A carregar testes...</div>

  // ---------- a fazer o teste ----------
  if (active) {
    const q = active.test
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800" style={{ fontFamily: 'Cinzel, serif' }}>{q.title}</h4>
            {timeLeft !== null && (
              <span className={`px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                <Clock size={14} /> {fmt(timeLeft)}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Tentativa {active.attempt} de {q.attempts_allowed} · {q.questions.length} perguntas · {q.total_points} pts
          </p>
          {q.intro_text && <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 mb-4 whitespace-pre-wrap">{q.intro_text}</div>}
          <div className="space-y-3">
            {q.questions.map((question, i) => {
              const a = active.answers[i]
              return (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                  <p className="text-sm font-bold text-slate-700 mb-2">{i + 1}. {question.text} <span className="font-normal text-slate-400">({question.points} pts)</span></p>
                  {question.type === 'single' && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(question.options || []).map((opt, j) => (
                        <button key={j} onClick={() => setActive(prev => ({ ...prev, answers: { ...prev.answers, [i]: j } }))}
                          className={`text-left px-3 py-2 rounded-xl border-2 text-sm transition ${a === j ? 'border-indigo-500 bg-indigo-50 font-bold' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          {String.fromCharCode(65 + j)}) {opt}
                        </button>
                      ))}
                    </div>
                  )}
                  {question.type === 'multiple' && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(question.options || []).map((opt, j) => {
                        const chosen = Array.isArray(a) && a.includes(j)
                        return (
                          <button key={j}
                            onClick={() => setActive(prev => {
                              const cur = Array.isArray(prev.answers[i]) ? prev.answers[i] : []
                              const next = chosen ? cur.filter(k => k !== j) : [...cur, j]
                              return { ...prev, answers: { ...prev.answers, [i]: next } }
                            })}
                            className={`text-left px-3 py-2 rounded-xl border-2 text-sm transition ${chosen ? 'border-indigo-500 bg-indigo-50 font-bold' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            {String.fromCharCode(65 + j)}) {opt} {chosen ? '✓' : ''}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {question.type === 'open' && (
                    <textarea value={typeof a === 'string' ? a : ''} rows={3}
                      onChange={e => setActive(prev => ({ ...prev, answers: { ...prev.answers, [i]: e.target.value } }))}
                      placeholder="Escreve a tua resposta..."
                      className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:outline-none" />
                  )}
                </div>
              )
            })}
          </div>
          <button onClick={submit}
            className="w-full mt-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:opacity-90 transition">
            Entregar teste
          </button>
        </div>
      </div>
    )
  }

  // ---------- lista ----------
  return (
    <div className="space-y-3">
      {tests.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <FileText size={44} className="mx-auto text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>Sem testes por agora</h4>
          <p className="text-sm text-slate-400">Quando um professor te atribuir um teste personalizado, aparece aqui.</p>
        </div>
      ) : (
        tests.map(t => {
          const subs = submissions.filter(s => s.test_id === t.id)
          const ongoing = subs.find(s => s.status === 'in_progress')
          const corrected = subs.filter(s => s.status === 'corrected')
          const best = corrected.length ? Math.max(...corrected.map(s => computedTotal(t, s.corrections || []))) : null
          const exhausted = usedAttempts(t.id) >= t.attempts_allowed
          return (
            <div key={t.id} className="bg-white rounded-2xl shadow-md p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-800" style={{ fontFamily: 'Cinzel, serif' }}>{t.title}</p>
                  <p className="text-xs text-slate-500">
                    {t.discipline ? `${t.discipline} · ` : ''}{t.questions.length} perguntas · {t.total_points} pts
                    {' · '}{t.attempts_allowed} tentativa(s)
                    {' · '}{t.time_limit_minutes ? `${t.time_limit_minutes} min` : 'sem cronómetro'}
                  </p>
                </div>
                {best !== null && (
                  <span className={`px-3 py-1 rounded-full text-sm font-extrabold shrink-0 ${best >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                    {best}%
                  </span>
                )}
              </div>

              {best !== null && best < 60 && exhausted && (
                <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-700 flex items-start gap-2">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  Nota abaixo de 60% — sugestão: pede ao teu professor um novo teste para melhorar!
                </div>
              )}

              <div className="mt-3 flex gap-2 flex-wrap">
                {ongoing ? (
                  <button onClick={() => resume(t, ongoing)}
                    className="px-4 py-2 bg-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition text-sm">
                    Continuar tentativa {ongoing.attempt}
                  </button>
                ) : !exhausted && (
                  <button onClick={() => startAttempt(t)}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition text-sm flex items-center gap-1.5">
                    <Play size={14} /> Começar (tentativa {usedAttempts(t.id) + 1})
                  </button>
                )}
                {corrected.map(s => (
                  <button key={s.id} onClick={() => printWithAnswers(t, s)}
                    className="px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm flex items-center gap-1.5">
                    <Printer size={14} /> Imprimir corrigido ({computedTotal(t, s.corrections || [])}%)
                  </button>
                ))}
                {!exhausted && (
                  <button onClick={() => { setPrinting({ test: t, answers: [], corrections: null }); setTimeout(printNow, 150) }}
                    className="px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm flex items-center gap-1.5">
                    <Printer size={14} /> Imprimir em branco
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
      {printing && (
        <div className="print-only">
          <PrintTestSheet teacher="" test={printing.test} studentName={myPrintProfile.nickname}
            className={myPrintProfile.className} answers={printing.answers} corrections={printing.corrections}
            finalGrade={printing.finalGrade} observations={printing.observations} />
        </div>
      )}
    </div>
  )
}
