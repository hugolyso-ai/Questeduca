import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Mail, Check, X, Trash2, HeartHandshake } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ParentAuthorizations = () => {
  const { user } = useAuth();
  const [authorizations, setAuthorizations] = useState([]);
  const [pendingFriendRequests, setPendingFriendRequests] = useState([]);
  const [newAuth, setNewAuth] = useState({ email: '' });
  const [childIds, setChildIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    try {
      const { data: auths } = await supabase
        .from('student_authorizations')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });
      setAuthorizations(auths || []);

      // Pedidos de amizade dos filhos (em envio ou receção) pendentes de autorização parental
      const { data: children } = await supabase
        .from('student_profiles')
        .select('user_id, nickname')
        .eq('parent_id', user.id);
      const childIdsFetched = (children || []).map(c => c.user_id);
      setChildIds(childIdsFetched);

      if (childIdsFetched.length > 0) {
        const { data: reqs } = await supabase
          .from('friend_requests')
          .select('*')
          .or(`from_user_id.in.(${childIds.join(',')}),to_user_id.in.(${childIds.join(',')})`)
          .in('status', ['pending', 'approved', 'pending_parent_req', 'pending_parent_rcp'])
          .order('created_at', { ascending: false });
        setPendingFriendRequests(reqs || []);
      }
    } catch (e) { /* ignore */ }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const addAuthorization = async (e) => {
    e.preventDefault();
    if (!newAuth.email.trim()) {
      toast.error('Preencha o email do filho');
      return;
    }
    setLoading(true);
    try {
      // Preenche o nickname com a parte do email; será substituído pelo escolhido pelo aluno no registo
      const { error } = await supabase.from('student_authorizations').insert({
        parent_id: user.id,
        student_email: newAuth.email.trim().toLowerCase(),
        nickname: newAuth.email.trim().toLowerCase().split('@')[0],
        status: 'authorized',
      });
      if (error) throw error;
      toast.success(`Autorização criada! O seu filho já pode registar-se com ${newAuth.email}.`);
      setNewAuth({ email: '' });
      fetchAll();
    } catch (err) {
      toast.error(err.code === '23505' ? 'Esse email já foi autorizado por si.' : 'Erro ao criar autorização.');
    } finally {
      setLoading(false);
    }
  };

  const revoke = async (id) => {
    await supabase.from('student_authorizations').update({ status: 'revoked' }).eq('id', id);
    toast.success('Autorização revogada.');
    fetchAll();
  };

  const approveFriendRequest = async (req) => {
    try {
      const { data, error } = await supabase.rpc('parent_approve_friend_request', { p_request_id: req.id });
      if (error) throw error;
      if (data === 'accepted') {
        toast.success('Amizade confirmada! Os dois filhos já são amigos no jogo.');
      } else if (data === 'waiting_other') {
        toast.success('Autorizado! Falta a autorização dos pais do outro aluno.');
      } else if (data === 'already') {
        toast.info('Já tinha autorizado este pedido.');
      } else {
        toast.info('Este pedido já não está ativo.');
      }
      fetchAll();
    } catch {
      toast.error('Erro ao autorizar pedido.');
    }
  };

  const rejectFriendRequest = async (req) => {
    await supabase.rpc('parent_reject_friend_request', { p_request_id: req.id });
    toast.success('Pedido rejeitado.');
    fetchAll();
  };

  return (
    <div className="space-y-6">
      {/* Autorizar filho */}
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[hsl(35,92%,50%)] to-indigo-600 p-5 text-white flex items-center gap-3">
          <div className="bg-white/20 p-2.5 rounded-xl"><ShieldCheck size={24} /></div>
          <div>
            <h3 className="text-lg font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Autorizar Filho para a App</h3>
            <p className="text-white/80 text-xs">Registe o email que o seu filho vai usar. Só quem estiver aqui autorizado pode criar conta de aluno.</p>
          </div>
        </div>
        <form onSubmit={addAuthorization} className="p-5 grid md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 mb-1"><Mail size={14} /> Email do filho</label>
            <input
              type="email"
              value={newAuth.email}
              onChange={e => setNewAuth({ ...newAuth, email: e.target.value })}
              placeholder="filho@email.com"
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-[hsl(35,92%,50%)] focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-[hsl(35,92%,50%)] to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'A guardar...' : 'Autorizar'}
          </button>
        </form>
      </div>

      {/* Lista de autorizações */}
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <h4 className="font-bold text-slate-800 mb-3" style={{ fontFamily: 'Cinzel, serif' }}>Filhos Autorizados ({authorizations.length})</h4>
        {authorizations.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Ainda não autorizou nenhum filho. Adicione acima para que possa registar-se.</p>
        ) : (
          <div className="space-y-2">
            {authorizations.map(a => {
              const hasAccount = a.status === 'registered' || !!a.authorized_user_id;
              return (
              <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{a.nickname}</p>
                  <p className="text-xs text-slate-500">{a.student_email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    hasAccount ? 'bg-[hsl(142,45%,80%)] text-green-800' :
                    a.status === 'authorized' ? 'bg-[hsl(142,45%,88%)] text-green-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {hasAccount ? 'Autorizado · conta criada' : a.status === 'authorized' ? 'Autorizado' : 'Revogado'}
                  </span>
                  {!hasAccount && (
                    <button onClick={() => revoke(a.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Revogar">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pedidos de amizade à espera da sua autorização */}
      <div className="bg-white rounded-3xl shadow-lg p-5">
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
          <HeartHandshake size={20} className="text-pink-500" />
          Pedidos de Amizade a Autorizar ({pendingFriendRequests.length})
        </h4>
        {pendingFriendRequests.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sem pedidos de amizade à espera da sua aprovação.</p>
        ) : (
          <div className="space-y-2">
            {pendingFriendRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-pink-50 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {r.from_nickname} ↔ {r.to_nickname}
                  </p>
                  <p className="text-xs text-slate-500">
                    {childIds.includes(r.from_user_id) ? 'Pedido enviado pelo seu filho' : 'Pedido recebido pelo seu filho'} · à espera de autorização parental
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => approveFriendRequest(r)} className="p-2 bg-[hsl(35,92%,50%)] text-white rounded-lg hover:bg-[hsl(33,90%,45%)] transition"><Check size={16} /></button>
                  <button onClick={() => rejectFriendRequest(r)} className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition"><X size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentAuthorizations;