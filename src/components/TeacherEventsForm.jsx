import React, { useState, useEffect, useCallback } from 'react';
import { CalendarPlus, Trash2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const EVENT_LABELS = {
  test: 'Teste',
  homework: 'Questão de Aula',
  class: 'Aula',
};

/**
 * Formulário para o professor marcar testes e questões de aula para os seus alunos.
 * Os eventos aparecem no calendário do aluno, com alertas 7/3/2/1 dias antes.
 */
const TeacherEventsForm = () => {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    event_type: 'test',
    event_date: '',
    subject: 'Matemática',
    target_student: '', // vazio = todos os meus alunos
  });

  const load = useCallback(async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from('teacher_students')
      .select('student_id, subject, student_profiles!teacher_students_student_id_fkey(nickname, school_year, user_id)')
      .eq('teacher_id', user.id);
    setStudents(links || []);
    const { data: evts } = await supabase
      .from('teacher_events')
      .select('*')
      .eq('teacher_id', user.id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true });
    setEvents(evts || []);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const addEvent = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) {
      toast.error('Indica o título e a data do evento.');
      return;
    }
    setLoading(true);
    try {
      const targets = form.target_student ? [form.target_student] : students.map(s => s.student_id);
      if (targets.length === 0) {
        toast.error('Não tens alunos para atribuir.');
        return;
      }
      const rows = targets.map((sid) => ({
        teacher_id: user.id,
        student_id: sid,
        title: form.title.trim(),
        event_type: form.event_type,
        event_date: form.event_date,
        subject: form.subject,
      }));
      const { error } = await supabase.from('teacher_events').insert(rows);
      if (error) throw error;

      await supabase.from('notifications').insert(rows.map((r) => {
        const d = new Date(r.event_date + 'T12:00:00');
        return {
          user_id: r.student_id,
          type: 'event',
          title: r.event_type === 'test' ? 'Novo Teste Marcado!' : 'Nova Questão de Aula',
          message: `${r.title} — ${DAYS[d.getDay()]}, ${d.toLocaleDateString('pt-PT')} (${r.subject}).`,
        };
      }));

      toast.success('Evento criado! Os alunos foram notificados.');
      setForm({ title: '', event_type: form.event_type, event_date: '', subject: form.subject, target_student: '' });
      load();
    } catch {
      toast.error('Erro ao criar evento.');
    } finally {
      setLoading(false);
    }
  };

  const removeEvent = async (eventId) => {
    await supabase.from('teacher_events').delete().eq('id', eventId);
    toast.success('Evento removido.');
    load();
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-indigo-600 p-5 text-white flex items-center gap-3">
          <div className="bg-white/20 p-2.5 rounded-xl"><CalendarPlus size={24} /></div>
          <div>
            <h4 className="font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Marcar Teste ou Questão de Aula</h4>
            <p className="text-white/80 text-xs">
              Aparece no calendário do aluno com alertas 7 e 3 dias antes e diariamente nos 2 dias anteriores.
            </p>
          </div>
        </div>
        <form onSubmit={addEvent} className="p-5 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="Título (ex.: Teste de Frações) *"
              className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition"
            />
            <input
              type="date"
              value={form.event_date}
              onChange={e => setForm({ ...form, event_date: e.target.value })}
              required
              className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            <select
              value={form.event_type}
              onChange={e => setForm({ ...form, event_type: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition"
            >
              <option value="test">Teste</option>
              <option value="homework">Questão de Aula</option>
              <option value="class">Aula</option>
            </select>
            <select
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition"
            >
              {['Matemática', 'Português', 'Estudo do Meio', 'História', 'Geografia', 'Ciências', 'Inglês'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={form.target_student}
              onChange={e => setForm({ ...form, target_student: e.target.value })}
              className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:outline-none transition"
            >
              <option value="">Todos os meus alunos</option>
              {students.map(s => (
                <option key={s.student_id} value={s.student_id}>
                  {s.student_profiles?.nickname || 'Aluno'}{s.subject ? ` (${s.subject})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'A criar...' : 'Marcar Evento'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-5">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <Users size={20} /> Eventos Marcados ({events.length})
        </h4>
        {events.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sem eventos futuros. Marca o primeiro acima!</p>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{ev.title}</p>
                  <p className="text-xs text-slate-500">
                    {EVENT_LABELS[ev.event_type] || ev.event_type} · {ev.subject} · {new Date(ev.event_date + 'T12:00:00').toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <button onClick={() => removeEvent(ev.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Remover">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherEventsForm;
