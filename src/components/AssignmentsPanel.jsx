import { useState, useEffect } from 'react'
import { ClipboardList, BookOpen, Lightbulb, FileText, ChevronDown } from 'lucide-react'
import { supabase } from '../lib/supabase'

const KIND_META = {
  quiz: { label: 'Teste', icon: FileText, color: 'from-indigo-500 to-blue-600' },
  book: { label: 'Livro', icon: BookOpen, color: 'from-emerald-500 to-teal-600' },
  tip: { label: 'Dica de Livro', icon: Lightbulb, color: 'from-amber-500 to-orange-600' },
}

export default function AssignmentsPanel() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    supabase
      .from('teacher_assignments')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setAssignments(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="text-center text-slate-400 py-8">A carregar atribuições...</div>
  }

  if (assignments.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
        <ClipboardList size={44} className="mx-auto text-slate-300 mb-3" />
        <h4 className="font-bold text-slate-700 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>Sem atribuições por agora</h4>
        <p className="text-sm text-slate-400">Quando o teu professor enviar testes, livros ou dicas, aparecem aqui.</p>
      </div>
      )
  }

  return (
    <div className="space-y-3">
      {assignments.map(a => {
        const meta = KIND_META[a.kind] || KIND_META.quiz
        const Icon = meta.icon
        const open = !!expanded[a.id]
        return (
          <div key={a.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [a.id]: !open }))}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition"
            >
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${meta.color} text-white shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 truncate" style={{ fontFamily: 'Cinzel, serif' }}>{a.title}</p>
                <p className="text-xs text-slate-500">{meta.label} · {new Date(a.created_at).toLocaleDateString('pt-PT')}</p>
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && a.description && (
              <div className="px-4 pb-4">
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 leading-relaxed">
                  {a.description}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
