import { useState, useEffect } from 'react'
import { FilePlus2, Printer, Pencil, Trash2, CheckCircle2, PauseCircle, Save, ClipboardList } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'
import { PrintTestSheet, printNow } from './PrintTestSheet'
import { emptyQuestion, autoGrade, computedTotal } from './testUtils'

const KIND_LABEL = { quiz: 'Teste', book: 'Livro', tip: 'Dica' }

export default function TeacherTestsPanel({ teacherProfile, myStudents }) {
  const [view, setView] = useState('list') // list | create | grade
  const [tests, setTests] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [editing, setEditing] = useState(null) // teste em edição (create)
  const [grading, setGrading] = useState(null) // { test, submission } (grade)
  const [teacherName, setTeacherName] = useState('')

  const classGroups = (() => {
    const groups = {}
    ;(myStudents || []).forEach(link => {
      const raw = (link.student_profiles?.class_name || '').trim()
      if (!raw) return
      const key = raw.toUpperCase()
      groups[key] = groups[key] || { label: raw, students: [] }
      groups[key].students.push(link.student_profiles)
    })
    return groups
  })()

  const fetchAll = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return
    const uid = userData.user.id
    setTeacherName(userData.user.user_metadata?.full_name || userData.user.email || '')
    const [{ data: t }, { data: s }] = await Promise.all([
      supabase.from('teacher_custom_tests').select('*').eq('teacher_id', uid).order('created_at', { ascending: false }),
      supabase.from('custom_test_submissions').select('*').neq('status', 'in_progress').order('submitted_at', { ascending: false }),
    ])
    setTests(t || [])
    setSubmissions(s || [])
  }

  useEffect(() => { fetchAll() }, [])

  // ---------- criação / edição ----------
  const startCreate = () => {
    setEditing({
      title: '',
      discipline: teacherProfile?.disciplines?.[0] || '',
      intro_text: '',
      questions: [emptyQuestion()],
      attempts_allowed: 1,
      time_limit_minutes: null,
      target_class: '',
      target_student_id: '',
    })
    setView('create')
  }

  const startEdit = (t) => {
    setEditing({
      ...t,
      questions: (t.questions || []).map(q => ({
        ...q,
        options: q.options || ['', '', '', ''],
        correctMultiple: q.correctMultiple || [],
      })),
      target_class: t.target_class || '',
      target_student_id: t.target_student_id || '',
    })
    setView('create')
  }

  const updateQ = (i, patch) => {
    setEditing(prev => ({
      ...prev,
      questions: prev.questions.map((q, j) => j === i ? { ...q, ...patch } : q),
    }))
  }

  const pointsSum = editing ? editing.questions.reduce((s, q) => s + Number(q.points || 0), 0) : 0

  const saveTest = async () => {
    if (!editing.title.trim()) { toast.error('Indica o título do teste.'); return }
    if (editing.questions.some(q => !q.text.trim())) { toast.error('Todas as perguntas precisam de texto.'); return }
    if (editing.questions.some(q => q.type !== 'open' && q.options.some(o => !o.trim()))) {
      toast.error('Preenche todas as opções das perguntas de escolha.'); return
    }
    if (pointsSum !== 100) { toast.error(`A soma dos pontos das perguntas deve ser 100 (agora: ${pointsSum}).`); return }
    if (!editing.target_class && !editing.target_student_id) { toast.error('Escolhe uma turma ou um aluno específico.'); return }

    const payload = {
      title: editing.title.trim(),
      discipline: editing.discipline || null,
      intro_text: editing.intro_text.trim() || null,
      questions: editing.questions.map(q => ({
        type: q.type,
        text: q.text.trim(),
        options: q.type === 'open' ? null : q.options.map(o => o.trim()),
        correct: q.type === 'single' ? q.correct : undefined,
        correctMultiple: q.type === 'multiple' ? (q.correctMultiple || []) : undefined,
        answerText: q.type === 'open' ? (q.answerText || '') : undefined,
        points: Number(q.points),
      })),
      total_points: 100,
      attempts_allowed: Number(editing.attempts_allowed) || 1,
      time_limit_minutes: editing.time_limit_minutes ? Number(editing.time_limit_minutes) : null,
      target_class: editing.target_student_id ? null : editing.target_class.toUpperCase(),
      target_student_id: editing.target_student_id || null,
      school_id: teacherProfile?.school_id || null,
    }
    const { error } = editing.id
      ? await supabase.from('teacher_custom_tests').update(payload).eq('id', editing.id)
      : await supabase.from('teacher_custom_tests').insert(payload)
    if (error) { toast.error(error.message); return }
    toast.success(editing.id ? 'Teste atualizado!' : 'Teste criado e atribuído!')
    setEditing(null)
    setView('list')
    fetchAll()
  }

  const deleteTest = async (id) => {
    if (!window.confirm('Apagar este teste e todas as suas tentativas?')) return
    await supabase.from('teacher_custom_tests').delete().eq('id', id)
    toast.success('Teste apagado.')
    fetchAll()
  }

  // ---------- impressão ----------
  const [printing, setPrinting] = useState(null) // { test, answers, corrections, grade, observations, studentName, className }
  const printBlank = (test) => {
    setPrinting({ test: normalizeForPrint(test), answers: [], corrections: null })
    setTimeout(printNow, 150)
  }
  const printSubmission = (test, sub) => {
    const student = myStudents.find(l => l.student_profiles?.user_id === sub.student_id)?.student_profiles
    setPrinting({
      test: normalizeForPrint(test),
      answers: sub.answers || [],
      corrections: sub.corrections || null,
      finalGrade: sub.corrections ? computedTotal(test, sub.corrections) : null,
      observations: sub.teacher_observations || '',
      studentName: student?.nickname || '',
      className: student?.class_name || '',
    })
    setTimeout(printNow, 150)
  }
  const normalizeForPrint = (t) => ({
    ...t,
    questions: (t.questions || []).map(q => ({
      ...q,
      options: q.type === 'open' ? null : (q.options || []),
    })),
  })

  // ---------- correção ----------
  const openGrading = (test, sub) => {
    const auto = autoGrade(test, sub.answers || [])
    const existing = sub.corrections || []
    const merged = test.questions.map((_, i) => {
      const found = existing.find(c => c.index === i)
      if (found) return found
      const a = auto.find(c => c.index === i)
      return a && a.auto ? { index: i, percent: a.percent, comment: '' } : { index: i, percent: null, comment: '' }
    })
    setGrading({ test, submission: sub, corrections: merged, observations: sub.teacher_observations || '' })
    setView('grade')
  }

  const saveGrading = async (finish) => {
    const { submission, corrections, observations } = grading
    const payload = {
      corrections,
      teacher_observations: observations || null,
      status: finish ? 'corrected' : 'correcting',
      corrected_at: finish ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('custom_test_submissions').update(payload).eq('id', submission.id)
    if (error) { toast.error(error.message); return }
    if (finish) {
      const total = computedTotal(grading.test, corrections)
      await supabase.from('notifications').insert({
        user_id: submission.student_id,
        type: 'custom_test',
        title: 'Teste corrigido!',
        message: `"${grading.test.title}" foi corrigido. A tua nota: ${total}%.${total < 60 ? ' Sugestão: faz um novo teste para melhorar!' : ''}`,
      })
      toast.success(`Correção terminada — nota final: ${total}%.`)
    } else {
      toast.success('Correção guardada em pausa. Podes continuar até 5 dias depois da entrega.')
    }
    setGrading(null)
    setView('list')
    fetchAll()
  }

  const deadlineOver = (sub) => sub.submitted_at && (Date.now() - new Date(sub.submitted_at).getTime() > 5 * 24 * 3600 * 1000) && sub.status !== 'corrected'

  // ---------- render ----------
  if (view === 'create' && editing) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h4 className="font-bold text-slate-800 mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            {editing.id ? 'Editar Teste' : 'Novo Teste Personalizado'}
          </h4>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <input type="text" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
              placeholder="Título do teste *" className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
            <input type="text" value={editing.discipline} onChange={e => setEditing({ ...editing, discipline: e.target.value })}
              placeholder="Disciplina (ex.: Matemática)" className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <textarea value={editing.intro_text} onChange={e => setEditing({ ...editing, intro_text: e.target.value })}
            placeholder="Texto de introdução (opcional) — aparece no topo do teste" rows={2}
            className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none mb-3" />
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tentativas</label>
              <select value={editing.attempts_allowed} onChange={e => setEditing({ ...editing, attempts_allowed: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tempo máximo (min)</label>
              <input type="number" min="1" max="240" value={editing.time_limit_minutes || ''}
                onChange={e => setEditing({ ...editing, time_limit_minutes: e.target.value || null })}
                placeholder="vazio = sem limite" className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Turma</label>
              <select value={editing.target_class} onChange={e => setEditing({ ...editing, target_class: e.target.value, target_student_id: '' })}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                <option value="">— escolher —</option>
                {Object.keys(classGroups).map(c => <option key={c} value={c}>{classGroups[c].label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">…ou aluno específico</label>
              <select value={editing.target_student_id} onChange={e => setEditing({ ...editing, target_student_id: e.target.value, target_class: '' })}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                <option value="">— escolher —</option>
                {(myStudents || []).map(l => (
                  <option key={l.student_profiles?.user_id} value={l.student_profiles?.user_id}>
                    {l.student_profiles?.nickname} {l.student_profiles?.class_name ? `(Turma ${l.student_profiles.class_name})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-bold ${pointsSum === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
              Soma dos pontos: {pointsSum} / 100
            </span>
            <button onClick={() => setEditing({ ...editing, questions: [...editing.questions, emptyQuestion()] })}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-xl hover:bg-indigo-100 transition text-sm">
              + Adicionar pergunta
            </button>
          </div>

          <div className="space-y-3">
            {editing.questions.map((q, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-slate-700 text-sm">P{i + 1}.</span>
                  <select value={q.type} onChange={e => updateQ(i, { type: e.target.value })}
                    className="px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none">
                    <option value="single">Resposta única</option>
                    <option value="multiple">Escolha múltipla</option>
                    <option value="open">Resposta aberta</option>
                  </select>
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-xs text-slate-500">vale</span>
                    <input type="number" min="1" max="100" value={q.points}
                      onChange={e => updateQ(i, { points: e.target.value })}
                      className="w-16 px-2 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                    <span className="text-xs text-slate-500">pts</span>
                    {editing.questions.length > 1 && (
                      <button onClick={() => setEditing({ ...editing, questions: editing.questions.filter((_, j) => j !== i) })}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition ml-1"><Trash2 size={15} /></button>
                    )}
                  </div>
                </div>
                <input type="text" value={q.text} onChange={e => updateQ(i, { text: e.target.value })}
                  placeholder={`Texto da pergunta ${i + 1} *`}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none mb-2" />
                {q.type === 'single' && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {q.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${i}`} checked={q.correct === j} onChange={() => updateQ(i, { correct: j })}
                          className="accent-emerald-600" title="Marcar como correta" />
                        <input type="text" value={opt} onChange={e => updateQ(i, { options: q.options.map((o, k) => k === j ? e.target.value : o) })}
                          placeholder={`Opção ${String.fromCharCode(65 + j)}`}
                          className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'multiple' && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {q.options.map((opt, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <input type="checkbox" checked={(q.correctMultiple || []).includes(j)}
                          onChange={e => updateQ(i, { correctMultiple: e.target.checked
                            ? [...(q.correctMultiple || []), j]
                            : (q.correctMultiple || []).filter(k => k !== j) })}
                          className="accent-emerald-600" title="Marcar como correta" />
                        <input type="text" value={opt} onChange={e => updateQ(i, { options: q.options.map((o, k) => k === j ? e.target.value : o) })}
                          placeholder={`Opção ${String.fromCharCode(65 + j)}`}
                          className="flex-1 px-2 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'open' && (
                  <textarea value={q.answerText} onChange={e => updateQ(i, { answerText: e.target.value })}
                    placeholder="Resposta esperada (guia para a tua correção manual)" rows={2}
                    className="w-full px-3 py-2 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={saveTest} disabled={pointsSum !== 100}
              className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-40">
              Guardar e atribuir teste
            </button>
            <button onClick={() => { setEditing(null); setView('list') }}
              className="px-6 py-3 bg-slate-200 font-bold rounded-xl hover:bg-slate-300 transition">Cancelar</button>
          </div>
        </div>
      </div>
    )
  }

  if (view === 'grade' && grading) {
    const total = computedTotal(grading.test, grading.corrections)
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-slate-800" style={{ fontFamily: 'Cinzel, serif' }}>Corrigir: {grading.test.title}</h4>
            <span className={`text-lg font-extrabold ${total >= 60 ? 'text-emerald-600' : 'text-red-500'}`}>{total}%</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">As perguntas de escolha já foram corrigidas automaticamente. Ajusta as percentagens se precisares (80% numa pergunta de 10 pts conta 8 pts para o total).</p>
          <div className="space-y-3">
            {grading.test.questions.map((q, i) => {
              const c = grading.corrections.find(x => x.index === i)
              const answer = (grading.submission.answers || [])[i]
              return (
                <div key={i} className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-sm font-bold text-slate-700">{i + 1}. {q.text} <span className="font-normal text-slate-400">({q.points} pts)</span></p>
                    {c && c.percent !== null && <span className="text-xs font-bold text-slate-500 whitespace-nowrap">{c.percent}% → {Math.round(q.points * c.percent / 100 * 10) / 10} pts</span>}
                  </div>
                  {q.type === 'open' ? (
                    <div className="bg-white rounded-lg p-3 text-sm text-slate-600 mb-2 border border-slate-200">
                      <strong>Resposta do aluno:</strong> {answer ? String(answer) : <em className="text-slate-400">(sem resposta)</em>}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mb-2">
                      Resposta do aluno: {q.type === 'single'
                        ? (typeof answer === 'number' ? String.fromCharCode(65 + answer) : '—')
                        : ((Array.isArray(answer) && answer.length) ? answer.map(a => String.fromCharCode(65 + a)).join(', ') : '—')}
                      {' · '}Correta: {q.type === 'single' ? String.fromCharCode(65 + q.correct) : (q.correctMultiple || []).map(a => String.fromCharCode(65 + a)).join(', ')}
                    </div>
                  )}
                  {q.type === 'open' && q.answerText && (
                    <div className="text-xs text-slate-400 mb-2">Resposta esperada: {q.answerText}</div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="text-xs font-bold text-slate-600">% atribuído:</label>
                    <input type="number" min="0" max="100" value={c?.percent ?? ''}
                      onChange={e => setGrading(g => ({
                        ...g,
                        corrections: g.corrections.map(x => x.index === i ? { ...x, percent: e.target.value === '' ? null : Number(e.target.value) } : x),
                      }))}
                      className="w-20 px-2 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                    {[0, 50, 100].map(p => (
                      <button key={p} onClick={() => setGrading(g => ({ ...g, corrections: g.corrections.map(x => x.index === i ? { ...x, percent: p } : x) }))}
                        className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition">{p}%</button>
                    ))}
                    <input type="text" value={c?.comment || ''} onChange={e => setGrading(g => ({
                      ...g,
                      corrections: g.corrections.map(x => x.index === i ? { ...x, comment: e.target.value } : x),
                    }))}
                      placeholder="Observação (certo/errado, comentário)" className="flex-1 min-w-[180px] px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-sm focus:border-indigo-500 focus:outline-none" />
                  </div>
                </div>
              )
            })}
          </div>
          <textarea value={grading.observations} onChange={e => setGrading(g => ({ ...g, observations: e.target.value }))}
            placeholder="Observações globais (aparecem no final da folha impressa)" rows={2}
            className="w-full mt-4 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
          <div className="flex gap-2 mt-4">
            <button onClick={() => saveGrading(false)}
              className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2">
              <PauseCircle size={18} /> Guardar em pausa
            </button>
            <button onClick={() => saveGrading(true)} disabled={!grading.corrections.every(c => c.percent !== null)}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-40 flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> Terminar correção
            </button>
            <button onClick={() => { setGrading(null); setView('list') }}
              className="px-6 py-3 bg-slate-200 font-bold rounded-xl hover:bg-slate-300 transition">Voltar</button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Tens 5 dias após a entrega para terminar a correção. As respostas do aluno não podem ser alteradas.</p>
        </div>
      </div>
    )
  }

  // ---------- lista ----------
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-slate-800" style={{ fontFamily: 'Cinzel, serif' }}>Meus Testes Personalizados ({tests.length})</h4>
          <button onClick={startCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center gap-2 text-sm">
            <FilePlus2 size={17} /> Novo teste
          </button>
        </div>
        {tests.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">
            Ainda sem testes personalizados. Cria um com perguntas de resposta única, escolha múltipla ou abertas.
          </p>
        ) : (
          <div className="space-y-3">
            {tests.map(t => {
              const subs = submissions.filter(s => s.test_id === t.id)
              const pending = subs.filter(s => s.status === 'submitted')
              const paused = subs.filter(s => s.status === 'correcting')
              return (
                <div key={t.id} className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800">{t.title}</p>
                      <p className="text-xs text-slate-500">
                        {t.discipline ? `${t.discipline} · ` : ''}{t.questions.length} perguntas · {t.total_points} pts
                        {' · '}{t.attempts_allowed} tentativa(s)
                        {' · '}{t.time_limit_minutes ? `${t.time_limit_minutes} min` : 'sem cronómetro'}
                        {' · '}{t.target_student_id ? 'Aluno específico' : `Turma ${t.target_class}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => printBlank(t)} title="Imprimir teste em branco (A4)"
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition"><Printer size={16} /></button>
                      <button onClick={() => startEdit(t)} title="Editar"
                        className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition"><Pencil size={16} /></button>
                      <button onClick={() => deleteTest(t.id)} title="Apagar"
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  {subs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {subs.map(s => {
                        const student = myStudents.find(l => l.student_profiles?.user_id === s.student_id)?.student_profiles
                        const isOver = deadlineOver(s)
                        return (
                          <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-2.5 text-sm">
                            <div>
                              <span className="font-semibold text-slate-700">{student?.nickname || 'Aluno'}</span>
                              <span className="text-xs text-slate-400 ml-2">
                                Tentativa {s.attempt} · {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('pt-PT') : ''}
                              </span>
                              {s.status === 'corrected' && (
                                <span className="ml-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                                  {computedTotal(t, s.corrections || [])}%
                                </span>
                              )}
                              {s.status === 'correcting' && (
                                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">em correção</span>
                              )}
                              {isOver && <span className="ml-2 text-xs text-red-400 font-bold">prazo de 5 dias excedido</span>}
                            </div>
                            <div className="flex gap-1">
                              {s.status !== 'corrected' && !isOver && (
                                <button onClick={() => openGrading(t, s)}
                                  className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-bold hover:opacity-90 transition">
                                  {s.status === 'correcting' ? 'Continuar correção' : 'Corrigir'}
                                </button>
                              )}
                              <button onClick={() => printSubmission(t, s)} title="Imprimir (A4)"
                                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition"><Printer size={15} /></button>
                            </div>
                          </div>
                        )
                      })}
                      {pending.length > 0 && (
                        <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                          <ClipboardList size={13} /> {pending.length} entrega(s) à espera de correção (5 dias)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      {printing && (
        <div className="print-only">
          <PrintTestSheet teacher={teacherName} test={printing.test} studentName={printing.studentName || ''}
            className={printing.className || ''} answers={printing.answers} corrections={printing.corrections}
            finalGrade={printing.finalGrade} observations={printing.observations} />
        </div>
      )}
    </div>
  )
}
