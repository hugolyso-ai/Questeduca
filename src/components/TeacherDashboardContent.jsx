import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, UserPlus, BookPlus, Trash2, Users, BookOpen, FileText, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const SUBJECTS = ['Matemática', 'Português', 'Estudo do Meio', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física', 'Educação Musical', 'Educação Visual'];

const TeacherDashboardContent = () => {
  const { user, profile } = useAuth();
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [myStudents, setMyStudents] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [addNickname, setAddNickname] = useState('');
  const [addSubject, setAddSubject] = useState(SUBJECTS[0]);
  const [bookForm, setBookForm] = useState({ title: '', author: '', subject: SUBJECTS[0], book_type: 'digital', file_url: '', notes: '', target_nickname: '' });
  const [tab, setTab] = useState('students');
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const { data: tp } = await supabase.from('teacher_profiles').select('*').eq('user_id', user.id).maybeSingle();
      setTeacherProfile(tp);

      const { data: links } = await supabase
        .from('teacher_students')
        .select('id, student_id, subject, student_profiles!teacher_students_student_id_fkey(nickname, school_year, user_id)')
        .eq('teacher_id', user.id);
      setMyStudents(links || []);

      const { data: books } = await supabase
        .from('library_books')
        .select('*, book_reads(count)')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      setMyBooks(books || []);
    } catch (e) { /* ignore */ }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addStudent = async (e) => {
    e.preventDefault();
    if (!addNickname.trim()) return;
    setLoading(true);
    try {
      const { data: student, error } = await supabase.rpc('find_student_by_nickname', { p_nickname: addNickname.trim() });
      if (error) throw error;
      const match = Array.isArray(student) ? student[0] : student;
      if (!match) {
        toast.error(`Nenhum aluno com o nickname "${addNickname.trim()}". Verifica com o aluno.`);
        return;
      }
      const { error: linkErr } = await supabase.from('teacher_students').insert({
        teacher_id: user.id,
        student_id: match.user_id,
        subject: addSubject,
      });
      if (linkErr) {
        toast.error(linkErr.code === '23505' ? 'Esse aluno já está na tua lista.' : 'Erro ao adicionar aluno.');
        return;
      }
      await supabase.from('notifications').insert({
        user_id: student.user_id,
        type: 'teacher',
        title: 'Novo Professor',
        message: `${profile?.name || 'O teu professor'} adicionou-te à disciplina de ${addSubject}!`,
      });
      toast.success('Aluno adicionado!');
      setAddNickname('');
      fetchAll();
    } catch {
      toast.error('Erro ao adicionar aluno.');
    } finally {
      setLoading(false);
    }
  };

  const removeStudent = async (linkId) => {
    await supabase.from('teacher_students').delete().eq('id', linkId);
    toast.success('Aluno removido da tua lista.');
    fetchAll();
  };

  const addBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title.trim()) {
      toast.error('Indica o nome do livro.');
      return;
    }
    setLoading(true);
    try {
      let targetUserId = null;
      if (bookForm.target_nickname.trim()) {
        const { data: student, error } = await supabase.rpc('find_student_by_nickname', { p_nickname: bookForm.target_nickname.trim() });
        if (error) throw error;
        const match = Array.isArray(student) ? student[0] : student;
        if (!match) {
          toast.error(`Nenhum aluno com o nickname "${bookForm.target_nickname.trim()}". Deixa vazio para toda a turma.`);
          return;
        }
        targetUserId = match.user_id;
      }

      const { data: book, error } = await supabase.from('library_books').insert({
        teacher_id: user.id,
        title: bookForm.title.trim(),
        author: bookForm.author.trim() || null,
        subject: bookForm.subject,
        book_type: bookForm.book_type,
        file_url: bookForm.book_type === 'digital' ? (bookForm.file_url.trim() || null) : null,
        notes: bookForm.notes.trim() || null,
        target_user_id: targetUserId,
      }).select().single();
      if (error) throw error;

      // Notificar alunos no jogo + pais (via tabela notifications de cada um)
      const targets = targetUserId
        ? [{ user_id: targetUserId }]
        : (await supabase.from('teacher_students').select('student_id').eq('teacher_id', user.id)).data || [];
      const notifs = targets.map(t => ({
        user_id: t.student_id || t.user_id,
        type: 'library',
        title: 'Novo Livro na Biblioteca!',
        message: `${bookForm.title} (${bookForm.subject}) — sugerido por ${profile?.name || 'o teu professor'}.${bookForm.notes ? ` Nota: ${bookForm.notes}` : ''}`,
      }));
      if (notifs.length > 0) await supabase.from('notifications').insert(notifs);

      // Notificar pais por email (tabela email_queue processada pelo sistema)
      const parentEmails = [];
      for (const t of targets) {
        const uid = t.student_id || t.user_id;
        const { data: sp } = await supabase.from('student_profiles').select('parent_id, user_id').eq('user_id', uid).maybeSingle();
        if (sp) {
          const { data: pp } = await supabase.from('user_profiles').select('email').eq('id', sp.parent_id).maybeSingle();
          if (pp?.email) parentEmails.push(pp.email);
        }
      }
      const uniqueEmails = [...new Set(parentEmails)];
      if (uniqueEmails.length > 0) {
        await supabase.from('email_queue').insert(uniqueEmails.map(email => ({
          to_email: email,
          subject: `Novo livro sugerido: ${bookForm.title}`,
          body: `O professor ${profile?.name || ''} sugeriu o livro "${bookForm.title}" (${bookForm.subject}) para o seu filho.${bookForm.notes ? `\n\nObservações: ${bookForm.notes}` : ''}\n\nO download está disponível apenas dentro da app QUESTEDUCA.`,
        })));
      }

      toast.success('Livro adicionado! Alunos e pais foram notificados.');
      setBookForm({ title: '', author: '', subject: SUBJECTS[0], book_type: 'digital', file_url: '', notes: '', target_nickname: '' });
      fetchAll();
    } catch {
      toast.error('Erro ao adicionar livro.');
    } finally {
      setLoading(false);
    }
  };

  const removeBook = async (id) => {
    await supabase.from('library_books').delete().eq('id', id);
    toast.success('Livro removido.');
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl"><GraduationCap size={30} /></div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Painel do Professor</h2>
            <p className="text-white/80 text-sm">
              {teacherProfile?.disciplines?.join(', ') || 'Sem disciplinas'}{teacherProfile?.class_name ? ` · Turma ${teacherProfile.class_name}` : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'students', label: 'Meus Alunos', icon: Users },
          { id: 'library', label: 'Biblioteca', icon: BookOpen },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center gap-2 ${
              tab === t.id ? 'bg-indigo-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'students' && (
        <div className="space-y-4">
          {/* Adicionar por nickname */}
          <div className="bg-white rounded-3xl shadow-lg p-5">
            <h4 className="font-bold text-slate-800 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>Adicionar Aluno pelo Nickname</h4>
            <form onSubmit={addStudent} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1"><Search size={14} /> Nickname do aluno</label>
                <input
                  type="text"
                  value={addNickname}
                  onChange={e => setAddNickname(e.target.value)}
                  placeholder="Ex.: SuperPedro"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Disciplina</label>
                <select
                  value={addSubject}
                  onChange={e => setAddSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                <UserPlus size={16} /> Adicionar
              </button>
            </form>
          </div>

          {/* Lista de alunos */}
          <div className="bg-white rounded-3xl shadow-lg p-5">
            <h4 className="font-bold text-slate-800 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>Os Meus Alunos ({myStudents.length})</h4>
            {myStudents.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Ainda não tens alunos. Adiciona-os pelo nickname acima.</p>
            ) : (
              <div className="space-y-2">
                {myStudents.map(link => {
                  const s = link.student_profiles;
                  return (
                    <div key={link.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-bold">
                          {s?.nickname?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{s?.nickname || 'Sem nome'}</p>
                          <p className="text-xs text-slate-500">{link.subject}{s?.school_year ? ` · ${s.school_year}º ano` : ''}</p>
                        </div>
                      </div>
                      <button onClick={() => removeStudent(link.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Remover">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'library' && (
        <div className="space-y-4">
          {/* Adicionar livro */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl"><BookPlus size={24} /></div>
              <div>
                <h4 className="font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>Adicionar / Sugerir Livro</h4>
                <p className="text-white/80 text-xs">Alunos e pais são notificados no jogo e por email. Downloads apenas dentro da app.</p>
              </div>
            </div>
            <form onSubmit={addBook} className="p-5 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={bookForm.title}
                  onChange={e => setBookForm({ ...bookForm, title: e.target.value })}
                  placeholder="Título do livro *"
                  className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                />
                <input
                  type="text"
                  value={bookForm.author}
                  onChange={e => setBookForm({ ...bookForm, author: e.target.value })}
                  placeholder="Autor"
                  className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <select
                  value={bookForm.subject}
                  onChange={e => setBookForm({ ...bookForm, subject: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={bookForm.book_type}
                  onChange={e => setBookForm({ ...bookForm, book_type: e.target.value })}
                  className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                >
                  <option value="digital">Digital (disponível na app)</option>
                  <option value="physical">Livro físico (sugestão)</option>
                </select>
                <input
                  type="text"
                  value={bookForm.target_nickname}
                  onChange={e => setBookForm({ ...bookForm, target_nickname: e.target.value })}
                  placeholder="Nickname específico (vazio = turma)"
                  className="px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                />
              </div>
              {bookForm.book_type === 'digital' && (
                <input
                  type="url"
                  value={bookForm.file_url}
                  onChange={e => setBookForm({ ...bookForm, file_url: e.target.value })}
                  placeholder="URL do ficheiro digital (PDF/eBook)"
                  className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
                />
              )}
              <textarea
                value={bookForm.notes}
                onChange={e => setBookForm({ ...bookForm, notes: e.target.value })}
                placeholder="Observações para o aluno e pais (ex.: 'Leitura até ao fim do mês')"
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <BookPlus size={18} />
                {loading ? 'A adicionar...' : 'Adicionar à Biblioteca'}
              </button>
            </form>
          </div>

          {/* Lista de livros */}
          <div className="bg-white rounded-3xl shadow-lg p-5">
            <h4 className="font-bold text-slate-800 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>Livros da Minha Biblioteca ({myBooks.length})</h4>
            {myBooks.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">Ainda sem livros na biblioteca.</p>
            ) : (
              <div className="space-y-2">
                {myBooks.map(b => (
                  <div key={b.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${b.book_type === 'digital' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                        <FileText size={18} className={b.book_type === 'digital' ? 'text-blue-600' : 'text-amber-600'} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{b.title}{b.author ? ` — ${b.author}` : ''}</p>
                        <p className="text-xs text-slate-500">
                          {b.subject} · {b.book_type === 'digital' ? 'Digital' : 'Físico'} · {b.target_user_id ? 'Aluno específico' : 'Turma'} · {b.book_reads?.[0]?.count || 0} leituras
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeBook(b.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardContent;
