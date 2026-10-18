import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Eye, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const MAX_PAIRS = 40;

/**
 * Monitorização parental: leitura de todas as conversas de chat de cada filho.
 * Escolhe um filho -> vê os contactos com quem trocou mensagens -> lê a conversa.
 * Apenas leitura, garantida pelas políticas RLS no servidor.
 */
const ChildChatMonitor = ({ children }) => {
  const [selectedChild, setSelectedChild] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchContacts = useCallback(async (childId) => {
    if (!childId) { setContacts([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data: msgs, error: err } = await supabase
        .from('chat_messages')
        .select('sender_id, recipient_id, created_at')
        .or(`sender_id.eq.${childId},recipient_id.eq.${childId}`)
        .order('created_at', { ascending: false })
        .limit(400);
      if (err) throw err;
      const rows = msgs || [];
      if (rows.length === 0) { setContacts([]); return; }
      // Outro participante de cada conversa
      const contactMap = new Map();
      rows.forEach(m => {
        const other = m.sender_id === childId ? m.recipient_id : m.sender_id;
        if (!contactMap.has(other)) contactMap.set(other, m.created_at);
      });
      const ids = [...contactMap.keys()];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', ids);
      const nameMap = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.name; });
      setContacts([...contactMap.entries()].map(([id, lastAt]) => ({
        id, name: nameMap[id] || 'Utilizador', lastAt,
      })).slice(0, MAX_PAIRS));
    } catch (e) {
      setError('Não foi possível carregar as conversas.');
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts(selectedChild?.user_id);
    setActiveContact(null);
  }, [selectedChild, fetchContacts]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChild || !activeContact) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('chat_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${activeContact.id},recipient_id.eq.${selectedChild.user_id}),and(sender_id.eq.${selectedChild.user_id},recipient_id.eq.${activeContact.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200);
      if (err) throw err;
      setMessages(data || []);
    } catch {
      setError('Não foi possível carregar esta conversa.');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedChild, activeContact]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  if (!children || children.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>💬 Conversas dos Filhos</h2>
        <p className="text-sm text-slate-500">Adiciona um filho para poderes acompanhar as conversas dele.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="flex items-center gap-2 mb-1">
        <MessageCircle className="text-[hsl(35,92%,45%)]" size={22} />
        <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>💬 Conversas dos Filhos</h2>
      </div>
      <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
        <Eye size={12} /> Leitura supervisionada: podes ler todas as mensagens trocadas pelos teus filhos.
      </p>

      {/* Escolha do filho */}
      <div className="flex gap-2 flex-wrap mb-4">
        {children.map(c => (
          <button
            key={c.user_id}
            onClick={() => { setSelectedChild(c); setActiveContact(null); }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition border-2 ${
              selectedChild?.user_id === c.user_id
                ? 'bg-amber-50 border-amber-400 text-amber-700'
                : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300'
            }`}
            data-testid={`monitor-child-${c.user_id}`}
          >
            {c.nickname}
          </button>
        ))}
      </div>

      {!selectedChild && (
        <p className="text-sm text-slate-400 py-4">Escolhe um filho acima para ver as conversas dele.</p>
      )}

      {selectedChild && !activeContact && (
        <div className="space-y-2">
          {loading && <p className="text-xs text-slate-400 py-2">A carregar contactos...</p>}
          {error && <p className="text-sm text-red-500 py-2">{error}</p>}
          {!loading && !error && contacts.length === 0 && (
            <p className="text-sm text-slate-400 py-2">Este filho ainda não trocou mensagens com nenhum amigo.</p>
          )}
          {contacts.map(ct => (
            <button
              key={ct.id}
              onClick={() => setActiveContact(ct)}
              className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-100 hover:border-amber-300 hover:bg-amber-50/50 transition text-left"
              data-testid={`monitor-contact-${ct.id}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold">
                {ct.name?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{ct.name}</p>
                <p className="text-xs text-slate-400">Última mensagem: {new Date(ct.lastAt).toLocaleString('pt-PT')}</p>
              </div>
              <Eye className="text-slate-300" size={18} />
            </button>
          ))}
        </div>
      )}

      {selectedChild && activeContact && (
        <div>
          <button
            onClick={() => setActiveContact(null)}
            className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition"
            data-testid="monitor-back"
          >
            <ArrowLeft size={16} /> Voltar aos contactos
          </button>
          <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold">
              {activeContact.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-bold text-slate-800">{activeContact.name} ⇄ {selectedChild.nickname}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1"><Eye size={12} /> Apenas leitura</p>
            </div>
          </div>
          <div className="h-72 overflow-y-auto bg-slate-50 rounded-2xl p-3 space-y-2" data-testid="monitor-messages">
            {loading && <p className="text-center text-xs text-slate-400 py-4">A carregar mensagens...</p>}
            {!loading && messages.length === 0 && <p className="text-center text-xs text-slate-400 py-8">Sem mensagens.</p>}
            {messages.map(m => {
              const fromChild = m.sender_id === selectedChild.user_id;
              return (
                <div key={m.id} className={`flex ${fromChild ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words ${
                    fromChild
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-br-sm'
                      : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                  }`}>
                    <p className="text-[10px] font-bold opacity-70 mb-0.5">{fromChild ? selectedChild.nickname : activeContact.name}</p>
                    {m.body}
                    <p className={`text-[10px] mt-0.5 ${fromChild ? 'text-white/70' : 'text-slate-300'}`}>
                      {new Date(m.created_at).toLocaleString('pt-PT')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildChatMonitor;
