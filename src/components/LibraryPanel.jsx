import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, FileText, MapPin, Download, ExternalLink, Library } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const LibraryPanel = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [readBookIds, setReadBookIds] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBooks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('library_books')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBooks(data || []);

      const { data: reads } = await supabase.from('book_reads').select('book_id').eq('user_id', user.id);
      setReadBookIds((reads || []).map(r => r.book_id));
    } catch {
      /* silencioso */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const markRead = async (bookId) => {
    if (readBookIds.includes(bookId)) return;
    const { error } = await supabase.from('book_reads').insert({ book_id: bookId, user_id: user.id });
    if (!error) setReadBookIds(prev => [...prev, bookId]);
  };

  const openBook = (book) => {
    if (book.book_type === 'digital' && book.file_url) {
      setViewer(book);
      markRead(book.id);
    } else {
      toast.info(`"${book.title}" é uma sugestão de livro físico — procura na biblioteca ou livraria!`);
      markRead(book.id);
    }
  };

  if (loading) {
    return <div className="text-center text-slate-400 py-8">A carregar a biblioteca...</div>;
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
        <Library size={40} className="mx-auto text-slate-300 mb-3" />
        <h4 className="font-bold text-slate-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>A tua biblioteca está vazia</h4>
        <p className="text-slate-400 text-sm mt-1">Quando os teus professores adicionarem ou sugerirem livros, aparecem aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Leitor de livro digital */}
      {viewer && (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen size={20} />
              <div>
                <p className="font-bold text-sm" style={{ fontFamily: 'Fredoka, sans-serif' }}>{viewer.title}</p>
                {viewer.author && <p className="text-white/70 text-xs">{viewer.author}</p>}
              </div>
            </div>
            <button onClick={() => setViewer(null)} className="text-white/80 hover:text-white text-xl leading-none px-2">✕</button>
          </div>
          <div className="p-4">
            <div className="rounded-xl border-2 border-slate-200 bg-slate-50 overflow-hidden" style={{ height: 420 }}>
              <iframe src={viewer.file_url} title={viewer.title} className="w-full h-full" />
            </div>
            <div className="flex gap-2 mt-3">
              <a
                href={viewer.file_url}
                download
                target="_blank"
                rel="noreferrer"
                onClick={() => markRead(viewer.id)}
                className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition"
              >
                <Download size={16} /> Descarregar
              </a>
              <a
                href={viewer.file_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm flex items-center gap-2 hover:bg-slate-200 transition"
              >
                <ExternalLink size={16} /> Abrir à parte
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lista de livros */}
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          <Library size={20} className="text-amber-500" /> A Minha Biblioteca ({books.length})
        </h4>
        <div className="grid md:grid-cols-2 gap-3">
          {books.map(book => {
            const read = readBookIds.includes(book.id);
            return (
              <div key={book.id} className={`rounded-2xl border-2 p-4 transition ${read ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${book.book_type === 'digital' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                    {book.book_type === 'digital'
                      ? <FileText size={22} className="text-blue-600" />
                      : <BookOpen size={22} className="text-amber-600" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 text-sm truncate">{book.title}</p>
                    {book.author && <p className="text-xs text-slate-500 truncate">{book.author}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">{book.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${book.book_type === 'digital' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {book.book_type === 'digital' ? 'Digital' : 'Físico'}
                      </span>
                      {read && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">Lido</span>}
                    </div>
                    {book.notes && (
                      <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2 italic">"{book.notes}"</p>
                    )}
                    <button
                      onClick={() => openBook(book)}
                      className="mt-2.5 px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-lg text-xs hover:opacity-90 transition flex items-center gap-1.5"
                    >
                      {book.book_type === 'digital' ? <><BookOpen size={13} /> Ler / Descarregar</> : <><MapPin size={13} /> Sugestão de leitura</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LibraryPanel;
