import React, { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { toast } from 'sonner'
import { MessageCircle, Send, X, Users, CheckCheck } from 'lucide-react'

// Chat direto entre professores e alunos. Cada linha da tabela
// teacher_student_messages tem teacher_id + student_id; a conversa é
// identificada pelo par (professor, aluno).
const TeacherStudentChat = ({ role }) => {
  const { user, profile } = useAuth()
  const [contacts, setContacts] = useState([])
  const [activeContact, setActiveContact] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [contactNames, setContactNames] = useState({})
  const [studentClasses, setStudentClasses] = useState({})
  const bottomRef = useRef(null)

  const isTeacher = role === 'teacher'

  // Lista de contactos com quem já conversei (ou, para professores, todos os
  // alunos autorizados da minha escola/turmas)
  const loadContacts = useCallback(async () => {
    if (!user?.id) return
    try {
      const { data: threads } = await supabase
        .from('teacher_student_messages')
        .select('teacher_id, student_id, created_at, sender_role')
        .or(isTeacher ? `teacher_id.eq.${user.id}` : `student_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
      const rows = threads || []
      const ids = [...new Set(rows.map(r => (isTeacher ? r.student_id : r.teacher_id)))]
      if (ids.length === 0) { setContacts([]); return }

      const { data: profiles } = await supabase.from('user_profiles').select('id, name').in('id', ids)
      const nameMap = {}
      ;(profiles || []).forEach(p => { nameMap[p.id] = p.name })
      setContactNames(prev => ({ ...prev, ...nameMap }))

      if (isTeacher) {
        const { data: students } = await supabase
          .from('student_profiles')
          .select('user_id, class_name')
          .in('user_id', ids)
        const classMap = {}
        ;(students || []).forEach(s => { classMap[s.user_id] = s.class_name })
        setStudentClasses(classMap)
      }

      setContacts(ids.map(id => ({ id, lastAt: rows.find(r => (isTeacher ? r.student_id : r.teacher_id) === id)?.created_at })))
    } catch (e) {
      console.error('Erro ao carregar contactos', e)
    }
  }, [user?.id, isTeacher])

  useEffect(() => { loadContacts() }, [loadContacts])

  // Mensagens da conversa ativa + atualizações em tempo real
  useEffect(() => {
    if (!user?.id || !activeContact) return
    const teacherId = isTeacher ? user.id : activeContact.id
    const studentId = isTeacher ? activeContact.id : user.id

    let channel = null
    const load = async () => {
      try {
        const { data } = await supabase
          .from('teacher_student_messages')
          .select('*')
          .eq('teacher_id', teacherId)
          .eq('student_id', studentId)
          .order('created_at', { ascending: true })
          .limit(200)
        setMessages(data || [])
        // Marca as mensagens do outro lado como lidas
        const unread = (data || []).filter(m => m.sender_role !== (isTeacher ? 'teacher' : 'student') && !m.read_at)
        if (unread.length > 0) {
          await supabase
            .from('teacher_student_messages')
            .update({ read_at: new Date().toISOString() })
            .in('id', unread.map(m => m.id))
        }
      } catch (e) {
        console.error('Erro ao carregar mensagens', e)
      }
    }
    load()

    channel = supabase
      .channel(`chat-${teacherId}-${studentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'teacher_student_messages',
        filter: `teacher_id=eq.${teacherId}`,
      }, (payload) => {
        if (payload.new.student_id === studentId) setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [user?.id, activeContact, isTeacher])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const body = newMessage.trim()
    if (!body || !activeContact || sending) return
    setSending(true)
    try {
      const teacherId = isTeacher ? user.id : activeContact.id
      const studentId = isTeacher ? activeContact.id : user.id
      const { error } = await supabase.from('teacher_student_messages').insert({
        teacher_id: teacherId,
        student_id: studentId,
        sender_role: isTeacher ? 'teacher' : 'student',
        body,
      })
      if (error) throw error
      setNewMessage('')
      loadContacts()
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div className="bg-white rounded-3xl shadow-lg overflow-hidden" data-testid="teacher-student-chat">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-5 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-2xl"><MessageCircle size={24} /></div>
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>
              {isTeacher ? 'Chat com Alunos' : 'Chat com o Professor'}
            </h2>
            <p className="text-white/80 text-sm">
              {isTeacher ? 'Conversa diretamente com os teus alunos' : 'Podes enviar dúvidas ao teu professor aqui'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Lista de contactos */}
        <div className="max-h-72 md:max-h-96 overflow-y-auto p-3">
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">
              {isTeacher ? 'Sem conversas ainda. As conversas aparecem quando um aluno te enviar a primeira mensagem.' : 'Ainda não conversaste com nenhum professor.'}
            </p>
          ) : (
            contacts.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveContact(c)}
                className={`w-full text-left p-3 rounded-xl mb-1 transition ${activeContact?.id === c.id ? 'bg-blue-50 border-2 border-blue-200' : 'hover:bg-slate-50'}`}
              >
                <p className="font-semibold text-slate-800 text-sm">{contactNames[c.id] || 'Utilizador'}</p>
                {isTeacher && studentClasses[c.id] && (
                  <p className="text-xs text-slate-500">Turma {studentClasses[c.id]}</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Janela de conversa */}
        <div className="md:col-span-2 flex flex-col h-72 md:h-96">
          {!activeContact ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <Users size={28} className="mr-2" /> Escolhe uma conversa
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="font-bold text-slate-700 text-sm">{contactNames[activeContact.id] || 'Conversa'}</span>
                <button onClick={() => { setActiveContact(null); setMessages([]) }} className="p-1.5 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.map(m => {
                  const mine = isTeacher ? m.sender_role === 'teacher' : m.sender_role === 'student'
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(m.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          {mine && m.read_at && <CheckCheck size={11} className="inline ml-1" />}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
              <div className="flex gap-2 p-3 border-t border-slate-100">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Escreve a tua mensagem..."
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button
                  onClick={send}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TeacherStudentChat
