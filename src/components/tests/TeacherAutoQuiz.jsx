import { useState, useEffect } from 'react'
import { Zap, CheckSquare, Square, Loader2, Users } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { toast } from 'sonner'

const SUBJECTS = ['Matemática', 'Português', 'Estudo do Meio', 'História', 'Geografia', 'Ciências', 'Inglês'];

export default function TeacherAutoQuiz({ myStudents }) {
  const [mode, setMode] = useState('list') // list | create
  const [disciplines, setDisciplines] = useState([])
  const [mode2, setMode2] = useState('random') // random | curated
  const [questionCount, setQuestionCount] = useState(10)
  const [attempts, setAttempts] = useState(1)
  const [timeLimit, setTimeLimit] = useState('')
  const [targetClass, setTargetClass] = useState('')
  const [targetStudent, setTargetStudent] = useState('')
  const [pool, setPool] = useState([])
  const [selected, setSelected] = useState([])
  const [loadingPool, setLoadingPool] = useState(false)
  const [title, setTitle] = useState('')
  const [quizTests, setQuizTests] = useState([])
  const [instances, setInstances] = useState([])

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

  const fetchData = async () => {
    const { data: u } = await supabase.auth.getUser()
    if (!u?.user) return
    const [{ data: t }, { data: i }] = await Promise.all([
      supabase.from('quiz_tests').select('*').eq('teacher_id', u.user.id).order('created_at', { ascending: false }),
      supabase.from('quiz_test_instances').select('*').eq('status', 'submitted').order('submitted_at', { ascending: false }),
    ])
    setQuizTests(t || [])
    setInstances(i || [])
  }

  useEffect(() => { fetchData() }, [])

  const toggleDiscipline = async (d) => {
    let next = disciplines.includes(d) ? disciplines.filter(x => x !== d) : [...disciplines, d]
    setDisciplines(next)
    setSelected([])
    setPool([])
    if (mode2 === 'curated') await loadPool(next)
  }

  const switchMode2 = async (m) => {
    setMode2(m)
    setSelected([])
    if (m === 'curated') await loadPool(disciplines)
    else setPool([])
  }

  const loadPool = async (dis) => {
    if (dis.length === 0) { setPool([]); return }
    setLoadingPool(true)
    const { data } = await supabase.from('quiz_questions').select('id, question, subject').in('subject', dis).limit(400)
    setPool(data || [])
    setLoadingPool(false)
  }

  const toggleQuestion = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const canSave = title.trim() &&
    disciplines.length > 0 &&
    (targetClass || targetStudent) &&
    (mode2 === 'random' || selected.length === questionCount * 2)

  const save = async () => {
    const { data: u } = await supabase.auth.getUser()
    if (!u?.user) return
    const year = new Date().getFullYear()
    const month = new Date().getMonth() + 1
    // retém até ao início do ano letivo seguinte (setembro)
    const retain = month >= 9 ? `${year + 1}-09-01` : `${year}-09-01`
    const { error } = await supabase.from('quiz_tests').insert({
      title: title.trim(),
      disciplines,
      mode: mode2,
      question_count: questionCount,
      pool_question_ids: mode2 === 'curated' ? selected : [],
      attempts_allowed: attempts,
      time_limit_minutes: timeLimit ? Number(timeLimit) : null,
      target_class: targetStudent ? null : targetClass,
      target_student_id: targetStudent || null,
      school_id: (myStudents || [])[0]?.student_profiles?.school_id || null,
      teacher_name: u.user.user_metadata?.full_name || u.user.email || '',
      retain_until: retain,
    })
    if (error) { toast.error(error.message); return }
    toast.success('Teste automático atribuído! Cada aluno receberá perguntas diferentes, sorteadas automaticamente.')
    setMode('list')
    setTitle('')
    setDisciplines([])
    setSelected([])
    fetchData()
  }

  if (mode === 'create') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-3xl shadow-lg p-5">
          <h4 className="font-bold text-slate-800 mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            <Zap size={18} className="inline mr-1 text-amber-500" /> Novo Teste Automático
          </h4>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Título do teste *" className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none mb-3" />

          <label className="text-xs font-bold text-slate-600 block mb-1">Matérias da disciplina (1 ou mais)</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUBJECTS.map(d => (
              <button key={d} onClick={() => toggleDiscipline(d)}
                className={`px-3 py-1.5 rounded-full text-sm font-bold transition ${disciplines.includes(d) ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {disciplines.includes(d) ? <CheckSquare size={13} className="inline mr-1" /> : <Square size={13} className="inline mr-1" />}
                {d}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Perguntas por aluno</label>
              <input type="number" min="3" max="20" value={questionCount}
                onChange={e => setQuestionCount(Math.max(3, Math.min(20, Number(e.target.value) || 10)))}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tentativas</label>
              <select value={attempts} onChange={e => setAttempts(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tempo máximo (min)</label>
              <input type="number" min="1" max="240" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
                placeholder="vazio = sem limite" className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Turma</label>
              <select value={targetClass} onChange={e => { setTargetClass(e.target.value); setTargetStudent('') }}
                className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none">
                <option value="">— escolher —</option>
                {Object.keys(classGroups).map(c => <option key={c} value={c}>{classGroups[c].label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">…ou aluno específico</label>
              <select value={targetStudent} onChange={e => { setTargetStudent(e.target.value); setTargetClass('') }}
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

          <div className="flex gap-2 mb-3">
            <button onClick={() => switchMode2('random')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${mode2 === 'random' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Perguntas aleatórias (sem validação prévia)
            </button>
            <button onClick={() => switchMode2('curated')}
              className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition ${mode2 === 'curated' ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
              Selecionar perguntas (validação prévia)
            </button>
          </div>

          {mode2 === 'curated' && (
            <div className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200 mb-3">
              <p className={`text-sm font-bold mb-2 ${selected.length === questionCount * 2 ? 'text-emerald-600' : 'text-red-500'}`}>
                Selecionadas: {selected.length} de {questionCount * 2} (o sistema distribui {questionCount} diferentes a cada aluno)
              </p>
              {loadingPool ? (
                <p className="text-slate-400 text-sm flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> A carregar perguntas…</p>
              ) : pool.length === 0 ? (
                <p className="text-slate-400 text-sm">Escolhe matérias acima para ver as perguntas propostas.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {pool.map(q => (
                    <button key={q.id} onClick={() => toggleQuestion(q.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl border-2 text-sm transition ${selected.includes(q.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                      <span className="text-xs text-slate-400">[{q.subject}]</span> {q.question}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={save} disabled={!canSave}
              className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-40">
              Atribuir teste automático
            </button>
            <button onClick={() => setMode('list')}
              className="px-6 py-3 bg-slate-200 font-bold rounded-xl hover:bg-slate-300 transition">Cancelar</button>
          </div>
        </div>
      </div>
    )
  }

  // lista de testes automáticos + respostas dos alunos
  return (
    <div className="space-y-3">
      <button onClick={() => setMode('create')}
        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 text-sm">
        <Zap size={17} /> Novo teste automático
      </button>
      {quizTests.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-4">Ainda sem testes automáticos. Cria um e cada aluno recebe perguntas sorteadas automaticamente.</p>
      ) : quizTests.map(t => {
        const subs = instances.filter(i => i.test_id === t.id)
        return (
          <div key={t.id} className="bg-slate-50 rounded-2xl p-4 border-2 border-slate-200">
            <p className="font-bold text-slate-800">{t.title}</p>
            <p className="text-xs text-slate-500">
              {t.disciplines.join(', ')} · {t.mode === 'random' ? 'aleatórias' : 'pré-selecionadas'}
              {' · '}{t.question_count} perguntas/aluno · {t.attempts_allowed} tentativa(s)
              {' · '}{t.time_limit_minutes ? `${t.time_limit_minutes} min` : 'sem cronómetro'}
              {' · guardado até '}{t.retain_until}
            </p>
            {subs.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {subs.map(s => {
                  const student = (myStudents || []).find(l => l.student_profiles?.user_id === s.student_id)?.student_profiles
                  return (
                    <div key={s.id} className="flex items-center justify-between bg-white rounded-xl p-2.5 text-sm">
                      <div>
                        <span className="font-semibold text-slate-700">{student?.nickname || 'Aluno'}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {s.correct_count}/{t.question_count} acertos
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.score_percent >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                        {s.score_percent}%
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {subs.length === 0 && (
              <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Users size={12} /> Sem respostas ainda.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
