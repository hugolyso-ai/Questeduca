import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, ArrowLeft, Eye, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_LEN = 500;

// Lista de amigos com quem há (ou pode haver) conversa
const FriendChatList = ({ friends, onOpen, lastUnread }) => (
  <div className="space-y-2">
    {friends.length === 0 && (
      <div className="text-center py-10 text-slate-400">
        <MessageCircle className="mx-auto mb-3" size={40} />
        <p className="text-sm">Ainda não tens amigos. Adiciona amigos no mapa de Portugal!</p>
      </div>
    )}
    {friends.map(f => (
      <button
        key={f.friend_id}
        onClick={() => onOpen(f)}
        className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition text-left"
        data-testid={`chat-open-${f.friend_id}`}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold">
          {f.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate">{f.name}</p>
          <p className="text-xs text-slate-400">Amigo desde {new Date(f.since || Date.now()).toLocaleDateString('pt-PT')}</p>
        </div>
        {lastUnread[f.friend_id] > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
            {lastUnread[f.friend_id]}
          </span>
        )}
      </button>
    ))}
  </div>
);

const Conversation = ({ me, other, messages, onSend, readOnly, loading }) => {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white font-bold">
          {other?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800">{other?.name || 'Conversa'}</p>
          {readOnly && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Eye size={12} /> Modo de leitura (pai/encarregado)
            </p>
          )}
        </div>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck size={12} /> Os pais podem ler
        </span>
      </div>

      <div className="h-72 overflow-y-auto bg-slate-50 rounded-2xl p-3 space-y-2 mb-3" data-testid="chat-messages">
        {loading && <p className="text-center text-xs text-slate-400 py-4">A carregar mensagens...</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-xs text-slate-400 py-8">
            {readOnly ? 'Ainda não há mensagens nesta conversa.' : 'Diz olá! A primeira mensagem abre a conversa.'}
          </p>
        )}
        {messages.map(m => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                  mine
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                }`}
              >
                {!mine && !readOnly && (
                  <p className="text-[10px] text-slate-400 mb-0.5">{other?.name}</p>
                )}
                {m.body}
                <p className={`text-[10px] mt-0.5 ${mine ? 'text-white/70' : 'text-slate-300'}`}>
                  {new Date(m.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {!readOnly && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            maxLength={MAX_LEN}
            placeholder="Escreve uma mensagem..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-amber-500 focus:outline-none transition text-sm"
            data-testid="chat-input"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold disabled:opacity-40 hover:opacity-90 transition"
            data-testid="chat-send"
          >
            <Send size={18} />
          </button>
        </form>
      )}
    </div>
  );
};

/**
 * Chat entre amigos.
 * - readOnly: mostra uma única conversa sem poder escrever (painel dos pais).
 * - friends: lista de amigos {friend_id, name, since} (só no modo aluno).
 */
const FriendChat = ({ currentUserId, readOnly = false, friend = null, onBack = null }) => {
  const [friends, setFriends] = useState([]);
  const [active, setActive] = useState(friend);
  const [messages, setMessages] = useState([]);
  const [unread, setUnread] = useState({});
  const [loading, setLoading] = useState(false);

  // No modo aluno: carrega amigos
  useEffect(() => {
    if (readOnly || !currentUserId) return;
    (async () => {
      const { data: rows } = await supabase
        .from('friendships')
        .select('user1_id, user2_id, created_at')
        .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);
      const ids = (rows || []).map(r => (r.user1_id === currentUserId ? r.user2_id : r.user1_id));
      if (ids.length === 0) { setFriends([]); return; }
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', ids);
      const nameMap = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.name; });
      setFriends(rows.map(r => {
        const otherId = r.user1_id === currentUserId ? r.user2_id : r.user1_id;
        return { friend_id: otherId, name: nameMap[otherId] || 'Aventureiro', since: r.created_at };
      }));
    })();
  }, [readOnly, currentUserId]);

  // Carrega mensagens da conversa ativa + tempo real
  const loadMessages = useCallback(async () => {
    if (!active || !currentUserId) return;
    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${active.friend_id},recipient_id.eq.${currentUserId}),and(sender_id.eq.${currentUserId},recipient_id.eq.${active.friend_id})`)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages(data || []);
    setLoading(false);
    // Marca como lidas as mensagens recebidas por mim
    const unreadIds = (data || []).filter(m => m.sender_id !== currentUserId && !m.read_at).map(m => m.id);
    if (unreadIds.length > 0) {
      await supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds);
      setUnread(u => ({ ...u, [active.friend_id]: 0 }));
    }
  }, [active, currentUserId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    if (!active || !currentUserId) return;
    const filter = `recipient_id=eq.${currentUserId}&sender_id=eq.${active.friend_id}`;
    const channel = supabase
      .channel(`chat:${currentUserId}:${active.friend_id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter },
        (payload) => {
          setMessages(prev => prev.some(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
          setUnread(u => ({ ...u, [active.friend_id]: 0 }));
          supabase.from('chat_messages').update({ read_at: new Date().toISOString() }).eq('id', payload.new.id);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [active, currentUserId]);

  // Contagem global de não lidas (lista de amigos)
  useEffect(() => {
    if (readOnly || !currentUserId || active) return;
    (async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('sender_id')
        .eq('recipient_id', currentUserId)
        .is('read_at', null);
      const counts = {};
      (data || []).forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
      setUnread(counts);
    })();
  }, [readOnly, currentUserId, active, messages.length]);

  const handleSend = async (text) => {
    if (!active) return;
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ sender_id: currentUserId, recipient_id: active.friend_id, body: text })
      .select()
      .single();
    if (error) {
      alert('Não foi possível enviar a mensagem. Verifica se ainda são amigos.');
      return;
    }
    setMessages(prev => prev.some(m => m.id === data.id) ? prev : [...prev, data]);
  };

  if (readOnly) {
    return <Conversation me={currentUserId} other={friend} messages={messages} onSend={() => {}} readOnly loading={loading} />;
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
        💬 Chat entre Amigos
      </h2>
      <p className="text-xs text-slate-400 mb-4">
        Mensagens curtas (máx. {MAX_LEN} caracteres). Os pais de ambos podem ler todas as conversas.
      </p>

      {active ? (
        <div>
          <button
            onClick={() => { setActive(null); }}
            className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition"
            data-testid="chat-back"
          >
            <ArrowLeft size={16} /> Voltar aos amigos
          </button>
          <Conversation
            me={currentUserId}
            other={active}
            messages={messages}
            onSend={handleSend}
            loading={loading}
          />
        </div>
      ) : (
        <FriendChatList friends={friends} onOpen={setActive} lastUnread={unread} />
      )}
    </div>
  );
};

export default FriendChat;
