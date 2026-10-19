import { useState, useEffect } from 'react'
import { GraduationCap, Printer, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { PrintTestSheet, printNow } from './PrintTestSheet'

// Aba "Professores" do aluno: todos os testes enviados por professores
// (automáticos e personalizados), agrupados por professor/disciplina, A4.
export default function StudentTeachersTab() {
  const [rows, setRows] = useState([]) // { key, teacherName, discipline, tests: [...] }
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState({})
  const [printing, setPrinting] = useState(null) // { test, answers, corrections, grade, observations }
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u?.user) { setLoading(false); return }

      const [{ data: sp }, { data: auto }, { data: custom }] = await Promise.all([
        supabase.from('student_profiles').select('nickname, class_name').eq('user_id', u.user.id).maybeSingle(),
        supabase.from('quiz_tests').select('*').order('created_at', { ascending: false }),
        supabase.from('teacher_custom_tests').select('*').order('created_at', { ascending: false }),
      ])
      setProfile(sp)

      // instâncias automáticas já respondidas (com nota)
      const { data: instances } = await supabase.from('quiz_test_instances').select('*').eq('status', 'submitted')
      const instByTestId = {}
      ;(instances || []).forEach(i => { (instByTestId[i.test_id] = instByTestId[i.test_id] || []).push(i) })

      // respostas a testes personalizados
      const { data: submissions } = await supabase.from('custom_test_submissions').select('*').neq('status', 'in_progress')
      const subByTestId = {}
      ;(submissions || []).forEach(s => { (subByTestId[s.test_id] = subByTestId[s.test_id] || []).push(s) })

      // perguntas usadas nas instâncias automáticas
      const autoIds = new Set()
      ;(auto || []).forEach(t => (t.pool_question_ids || []).length > 0 && (t.pool_question_ids || []).forEach(id => autoIds.add(id)))
      const { data: poolQuestions } = await supabase.from('quiz_questions').select('id, question, options, correct_answer').limit(1000)
      const qById = {}
      ;(poolQuestions || []).forEach(q => { qById[q.id] = q })

      const groups = {}
      const push = (t, kind, discipline) => {
        const teacher = t.teacher_name || 'Professor'
        const disc = discipline || t.discipline || '—'
        const key = `${teacher}||${disc}`
        groups[key] = groups[key] || { key, teacherName: teacher, discipline: disc, tests: [] }
        groups[key].tests.push({
          id: t.id,
          kind,
          title: t.title,
          test: t,
          attemptsAllowed: t.attempts_allowed || 1,
          questionCount: kind === 'auto' ? t.question_count : (t.questions || []).length,
          instances: kind === 'auto' ? (instByTestId[t.id] || []) : (subByTestId[t.id] || []),
        })
      }
      ;(auto || []).forEach(t => push(t, 'auto', null))
      ;(custom || []).forEach(t => push(t, 'custom', null))

      const list = Object.values(groups).sort((a, b) => a.teacherName.localeCompare(b.teacherName) || a.discipline.localeCompare(b.discipline))
      setRows(list)
      setLoading(false)
    })()
  }, [])

  const fmtQ = (n) => Math.round(n * 10) / 10

  const printAuto = (t, inst) => {
    const qs = (t.test.pool_question_ids || []).length > 0
      ? null : null // perguntas vêm sempre da base
    // para A4 precisamos das perguntas; guardamo-las na própria instância? Buscamo-las:
    setPrinting({ loading: true })
    supabase.from('quiz_questions').select('id, question, options, correct_answer').limit(1000).then(({ data }) => {
      const qById = {}
      ;(data || []).forEach(q => { qById[q.id] = q })
      const questions = (inst.question_ids || []).map(id => qById[id]).filter(Boolean).map((q, i) => ({
        type: 'single',
        text: q.question,
        options: (q.options || []).map(String),
        correct: q.correct_answer,
        points: fmtQ(100 / (inst.question_ids || []).length),
      }))
      const answers = {}
      ;(inst.question_ids || []).forEach((id, i) => { answers[i] = inst.answers?.[String(i)] ?? inst.answers?.[i] })
      const corrections = inst.score_percent !== null && inst.score_percent !== undefined ? questions.map((q, i) => ({
        index: i,
        percent: inst.answers?.[String(i)] ?? inst.answers?.[i] ?? null === q.correct ? 100 : 0,
        comment: '',
      })) : null
      setPrinting({
        test: { title: t.title, discipline: t.test.disciplines ? t.test.disciplines.join(', ') : '', intro_text: t.test.description || null, questions },
        answers,
        corrections: corrections && corrections.every(c => c.percent !== null) ? corrections : null,
        finalGrade: inst.score_percent,
        observations: '',
      })
      setTimeout(printNow, 150)
    })
  }

  const printCustom = (t, sub) => {
    const questions = (t.test.questions || []).map((q, i) => ({
      type: q.type,
      text: q.text,
      options: q.options || null,
      correct: q.type === 'single' ? q.correct : (q.correctMultiple || [])[0],
      points: q.points,
    }))
    const answers = (sub.answers || [])
    setPrinting({
      test: { title: t.title, discipline: t.test.discipline, intro_text: t.test.intro_text, questions },
      answers,
      corrections: sub.corrections || null,
      finalGrade: sub.corrections ? null : null,
      observations: sub.teacher_observations || '',
    })
    setTimeout(printNow, 150)
  }

  if (loading) return <div className="text-center text-slate-400 py-8 flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> A carregar…</div>

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
          <GraduationCap size={44} className="mx-auto text-slate-300 mb-3" />
          <h4 className="font-bold text-slate-700 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>Sem professores associados</h4>
          <p className="text-sm text-slate-400">Os testes que os teus professores enviarem aparecem aqui, por professor e disciplina.</p>
        </div>
      ) : rows.map(r => (
        <div key={r.key} className="bg-white rounded-2xl shadow-md overflow-hidden">
          <button onClick={() => setOpen(o => ({ ...o, [r.key]: !o[r.key] }))}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition">
            <div className="bg-indigo-50 p-2.5 rounded-xl"><GraduationCap size={22} className="text-indigo-600" /></div>
            <div className="flex-1">
              <p className="font-bold text-slate-800">{r.teacherName}</p>
              <p className="text-xs text-slate-500">{r.discipline} · {r.tests.length} teste(s)</p>
            </div>
            <span className="text-slate-400">{open[r.key] ? <EyeOff size={18} /> : <Eye size={18} />}</span>
          </button>
          {open[r.key] && r.tests.map(t => {
            const done = t.instances.filter(i => i.status === 'submitted')
            const best = done.length ? Math.max(...done.map(i => i.score_percent ?? 0)) : null
            return (
              <div key={t.id} className="mx-4 mb-3 bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.kind === 'auto' ? 'Teste automático' : 'Teste personalizado'} · {t.questionCount} perguntas
                      {best !== null && ` · nota: ${fmtQ(best)}%`}
                    </p>
                  </div>
                  {best !== null && (
                    <span className={`px-3 py-1 rounded-full text-sm font-extrabold shrink-0 ${best >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {fmtQ(best)}%
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  {t.kind === 'auto' && done.map(inst => (
                    <button key={inst.id} onClick={() => printAuto(t, inst)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm flex items-center gap-1.5">
                      <Printer size={14} /> Descarregar A4 ({inst.submitted_at ? new Date(inst.submitted_at).toLocaleDateString('pt-PT') : ''})
                    </button>
                  ))}
                  {t.kind === 'custom' && done.map(sub => (
                    <button key={sub.id} onClick={() => printCustom(t, sub)}
                      className="px-3 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition text-sm flex items-center gap-1.5">
                      <Printer size={14} /> Descarregar A4 ({sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('pt-PT') : ''})
                    </button>
                  ))}
                  {done.length === 0 && <span className="text-xs text-slate-400">Sem submissões concluídas.</span>}
                </div>
              </div>
            )
          })}
        </div>
      ))}
      {printing && !printing.loading && (
        <div className="print-only">
          <PrintTestSheet teacher={printing.teacherName || ''} test={printing.test}
            studentName={profile?.nickname || ''} className={profile?.class_name || ''}
            answers={printing.answers} corrections={printing.corrections}
            finalGrade={printing.finalGrade} observations={printing.observations} />
        </div>
      )}
    </div>
  )
}
