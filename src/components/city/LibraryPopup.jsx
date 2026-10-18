import React, { useState, useEffect, useCallback } from 'react';
import { X, BookOpen, FileText, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import LibraryRoom3D from './LibraryRoom3D';

const SHELF_SUBJECTS = [
  { id: 'Matemática', icon: '∑' },
  { id: 'Português', icon: 'A' },
  { id: 'Estudo do Meio', icon: '🌍' },
  { id: 'História', icon: '🏛' },
  { id: 'Geografia', icon: '🗺' },
  { id: 'Ciências', icon: '🔬' },
  { id: 'Inglês', icon: 'EN' },
  { id: 'Outros', icon: '📚' },
];

const subjectOf = (book) => {
  const s = (book.subject || '').trim();
  return SHELF_SUBJECTS.some(sh => sh.id === s) ? s : 'Outros';
};

// Livro físico numa prateleira (loombo de livro)
const BookSpine = ({ book, isNew, read, onOpen }) => {
  const hasFile = book.book_type === 'digital' && !!book.file_url;
  const hue = 28 + ((book.title?.length || 3) * 13) % 300;
  const spineColors = [
    'linear-gradient(180deg,#5d3a1a,#3e2410)',
    'linear-gradient(180deg,#6b2737,#40161f)',
    'linear-gradient(180deg,#274a63,#16293a)',
    'linear-gradient(180deg,#3d5a27,#223316)',
    'linear-gradient(180deg,#5a3a5e,#331d36)',
  ];
  const bg = spineColors[(book.title?.charCodeAt(0) || 65) % spineColors.length];

  return (
    <button
      onClick={() => onOpen(book)}
      title={`${book.title}${book.author ? ` — ${book.author}` : ''}`}
      className="relative group/spine rounded-t-sm border-l-2 border-r-2 border-black/40 overflow-hidden transition-transform hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      style={{
        width: 30,
        height: 78 + ((book.title?.length || 5) % 4) * 6,
        background: bg,
        filter: hasFile ? 'none' : 'blur(2.5px) brightness(0.85)',
      }}
      data-testid={`library-book-${book.id}`}
    >
      {/* Ouro no lombo */}
      <div className="absolute inset-x-1 top-2 h-[2px] bg-amber-400/70 rounded" />
      <div className="absolute inset-x-1 bottom-2 h-[2px] bg-amber-400/70 rounded" />
      <span
        className="absolute inset-0 flex items-center justify-center text-amber-200 font-bold"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', fontSize: 9, fontFamily: 'Cinzel, serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
      >
        {book.title}
      </span>
      {isNew && !read && (
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border border-emerald-200 shadow animate-pulse" title="Novo">
          <span className="absolute inset-0 rounded-full animate-ping bg-emerald-300 opacity-75" />
        </span>
      )}
      {!hasFile && (
        <span className="absolute inset-x-0 bottom-0.5 text-center text-[8px] text-amber-100/90">🔒</span>
      )}
    </button>
  );
};

const LibraryPopup = ({ onClose }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [readBookIds, setReadBookIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeShelf, setActiveShelf] = useState(null); // null = vista geral
  const [viewer, setViewer] = useState(null);

  const fetchBooks = useCallback(async () => {
    if (!user) return;
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

  // Um livro é "novo" se foi publicado nos últimos 7 dias e ainda não foi lido
  const isNewBook = (book) => {
    const published = new Date(book.created_at);
    const days = (Date.now() - published.getTime()) / 86400000;
    return days <= 7 && !readBookIds.includes(book.id);
  };

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
      toast.info(`"${book.title}" ainda não tem ficheiro disponível — o professor vai acrescentar em breve.`, { duration: 6000 });
    }
  };

  const shelfBooks = (shelfId) => books.filter(b => subjectOf(b) === shelfId);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-6"
      data-testid="library-popup"
    >
      {/* Fundo: sala antiga de biblioteca */}
      <div className="absolute inset-0" onClick={onClose} style={{ background: 'rgba(10,6,2,0.85)' }} />
      {/* Interior 3D da biblioteca — sempre visível, com ou sem livros */}
      <LibraryRoom3D />
      {/* Velas/quente glow nas bordas */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 180px rgba(0,0,0,0.9), inset 0 0 60px rgba(255,170,60,0.08)' }} />

      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl border-4 flex flex-col"
        style={{
          borderColor: 'rgba(107,74,31,0.85)',
          background: 'linear-gradient(180deg, rgba(43,28,12,0.82) 0%, rgba(30,19,10,0.88) 60%, rgba(23,14,6,0.92) 100%)',
          backdropFilter: 'blur(3px)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,200,120,0.15)',
        }}
      >
        {/* Cabeçalho em madeira entalhada */}
        <div
          className="relative px-6 py-5 flex items-center justify-between border-b-2"
          style={{ borderColor: '#6b4a1f', background: 'linear-gradient(180deg,#3a250f,#241708)' }}
        >
          <div className="flex items-center gap-3">
            <BookOpen size={30} className="text-amber-300" />
            <div>
              <h2
                className="text-2xl font-bold text-amber-200 tracking-wide"
                style={{ fontFamily: 'Cinzel, serif', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                Biblioteca Antiga
              </h2>
              <p className="text-amber-100/60 text-xs italic" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Livros deixados pelos professores — toca num livro para o abrir
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-amber-900/50 hover:bg-amber-800/70 text-amber-200 transition border border-amber-700/60"
            data-testid="library-close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-7" style={{ scrollbarWidth: 'thin', scrollbarColor: '#6b4a1f #1a120a' }}>
          {loading && (
            <p className="text-center text-amber-200/60 py-10 italic" style={{ fontFamily: 'Nunito, sans-serif' }}>
              A acender as velas da biblioteca...
            </p>
          )}

          {!loading && books.length === 0 && (
            <div className="text-center py-10">
              <Sparkles size={40} className="mx-auto text-amber-500/60 mb-4" />
              <p className="text-amber-200 font-bold text-lg" style={{ fontFamily: 'Cinzel, serif' }}>
                As prateleiras esperam pelos primeiros livros
              </p>
              <p className="text-amber-100/50 text-sm mt-2 italic" style={{ fontFamily: 'Nunito, sans-serif' }}>
                Quando os teus professores publicarem envios, os livros aparecem aqui com um selo verde de "novo".
              </p>
            </div>
          )}

          {!loading && books.length > 0 && activeShelf === null && (
            <div className="grid sm:grid-cols-2 gap-5">
              {SHELF_SUBJECTS.filter(sh => shelfBooks(sh.id).length > 0).map(shelf => {
                const shelfList = shelfBooks(shelf.id);
                const shelfNew = shelfList.filter(isNewBook).length;
                return (
                  <button
                    key={shelf.id}
                    onClick={() => setActiveShelf(shelf.id)}
                    className="group relative text-left rounded-2xl border-2 p-4 transition-transform hover:-translate-y-1"
                    style={{
                      borderColor: '#6b4a1f',
                      background: 'linear-gradient(180deg,#33210e,#221507)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                    data-testid={`library-shelf-${shelf.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{shelf.icon}</span>
                        <span className="text-amber-200 font-bold" style={{ fontFamily: 'Cinzel, serif' }}>{shelf.id}</span>
                      </div>
                      {shelfNew > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/90 text-white text-[10px] font-black flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> {shelfNew} NOVO{shelfNew > 1 ? 'S' : ''}
                        </span>
                      )}
                    </div>
                    {/* Prateleira de madeira com lombos em miniatura */}
                    <div className="relative pb-2">
                      <div className="flex items-end gap-1 h-14 overflow-hidden px-1">
                        {shelfList.slice(0, 12).map(book => (
                          <div
                            key={book.id}
                            className="rounded-t-sm"
                            style={{
                              width: 12,
                              height: 34 + ((book.title?.length || 3) % 4) * 5,
                              background: ['linear-gradient(180deg,#5d3a1a,#3e2410)','linear-gradient(180deg,#6b2737,#40161f)','linear-gradient(180deg,#274a63,#16293a)','linear-gradient(180deg,#3d5a27,#223316)','linear-gradient(180deg,#5a3a5e,#331d36)'][(book.title?.charCodeAt(0) || 65) % 5],
                              filter: (book.book_type === 'digital' && book.file_url) ? 'none' : 'blur(2px) brightness(0.8)',
                            }}
                          />
                        ))}
                      </div>
                      <div className="h-2 rounded-b mt-0" style={{ background: 'linear-gradient(180deg,#8a5a28,#5d3a1a)', boxShadow: '0 3px 6px rgba(0,0,0,0.6)' }} />
                    </div>
                    <p className="text-amber-100/50 text-xs mt-2">{shelfList.length} livro{shelfList.length > 1 ? 's' : ''} nesta prateleira</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Vista de uma prateleira: livros grandes + painel de detalhes */}
          {!loading && activeShelf !== null && (
            <div>
              <button
                onClick={() => setActiveShelf(null)}
                className="mb-4 px-4 py-2 rounded-xl bg-amber-900/50 hover:bg-amber-800/70 text-amber-200 text-sm font-bold border border-amber-700/60 transition"
              >
                ← Voltar às prateleiras
              </button>
              <h3 className="text-amber-200 font-bold text-lg mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                {SHELF_SUBJECTS.find(s => s.id === activeShelf)?.icon} Prateleira de {activeShelf}
              </h3>
              <p className="text-amber-100/50 text-xs mb-4 italic">
                Livros desfocados ainda não têm ficheiro — toca neles para saber mais.
              </p>

              {/* A prateleira em si */}
              <div className="relative mb-8">
                <div className="flex items-end gap-2 overflow-x-auto pb-1 px-2 min-h-[100px]" data-testid="library-shelf-books">
                  {shelfBooks(activeShelf).map(book => (
                    <BookSpine key={book.id} book={book} isNew={isNewBook(book)} read={readBookIds.includes(book.id)} onOpen={openBook} />
                  ))}
                </div>
                <div className="h-3 rounded-b" style={{ background: 'linear-gradient(180deg,#8a5a28,#4a2e12)', boxShadow: '0 6px 12px rgba(0,0,0,0.7)' }} />
              </div>

              {/* Detalhes de todos os livros da prateleira */}
              <div className="space-y-3">
                {shelfBooks(activeShelf).map(book => {
                  const hasFile = book.book_type === 'digital' && !!book.file_url;
                  const isNew = isNewBook(book);
                  return (
                    <div
                      key={book.id}
                      className="rounded-2xl border-2 p-4 flex items-start gap-3 cursor-pointer transition hover:border-amber-400"
                      style={{ borderColor: '#6b4a1f', background: 'rgba(43,28,12,0.7)' }}
                      onClick={() => openBook(book)}
                      data-testid={`library-detail-${book.id}`}
                    >
                      <div className="p-2 rounded-xl bg-amber-900/50 border border-amber-700/50 shrink-0">
                        {hasFile ? <FileText size={20} className="text-amber-300" /> : <BookOpen size={20} className="text-amber-500/70" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-amber-100 font-bold text-sm" style={{ fontFamily: 'Cinzel, serif' }}>{book.title}</p>
                          {isNew && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> NOVO
                            </span>
                          )}
                          {!hasFile && <span className="text-[10px] text-amber-100/50 italic">sem ficheiro</span>}
                        </div>
                        {book.author && <p className="text-amber-100/60 text-xs">{book.author}</p>}
                        {book.notes && <p className="text-amber-100/50 text-xs mt-1.5 italic">"{book.notes}"</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Leitor de livro digital sobreposto */}
        {viewer && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-4" style={{ background: 'rgba(10,6,2,0.92)' }}>
            <div className="w-full max-w-3xl rounded-2xl overflow-hidden border-4" style={{ borderColor: '#6b4a1f', background: '#241708' }}>
              <div className="px-5 py-3 flex items-center justify-between" style={{ background: 'linear-gradient(180deg,#3a250f,#241708)' }}>
                <p className="text-amber-200 font-bold text-sm truncate" style={{ fontFamily: 'Cinzel, serif' }}>{viewer.title}</p>
                <button onClick={() => setViewer(null)} className="p-1.5 rounded-full bg-amber-900/50 hover:bg-amber-800/70 text-amber-200 transition">
                  <X size={18} />
                </button>
              </div>
              <iframe src={viewer.file_url} title={viewer.title} className="w-full" style={{ height: '60vh', background: '#fff8ec' }} />
              <div className="p-3 flex gap-2">
                <a
                  href={viewer.file_url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-sm text-center hover:opacity-90 transition"
                >
                  Descarregar
                </a>
                <a
                  href={viewer.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 bg-amber-900/60 text-amber-200 font-bold rounded-xl text-sm hover:bg-amber-800/70 transition"
                >
                  Abrir à parte
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPopup;
