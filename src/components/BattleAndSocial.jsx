import React, { useState, useEffect } from 'react';
import {
  Sword, Shield, Trophy, X, Users, Gift, Eye,
  ChevronRight, Clock, Check, AlertTriangle, Coins,
  TreePine, Mountain, Pickaxe, Wheat, Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Battle Result Modal
const BattleResultModal = ({ result, onClose }) => {
  if (!result) return null;

  const isVictory = result.victory;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className={`p-8 text-white text-center ${isVictory ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-red-500 to-rose-600'}`}>
          <div className="text-6xl mb-4">{isVictory ? '⚔️🏆' : '🛡️💨'}</div>
          <h2 className="text-3xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {isVictory ? 'VITÓRIA!' : 'DERROTA!'}
          </h2>
          <p className="text-white/80 mt-2">{result.message}</p>
        </div>

        {/* Battle Stats */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <Sword className="text-red-500 mx-auto mb-2" size={24} />
              <p className="text-sm text-slate-500">Teu Ataque</p>
              <p className="text-2xl font-bold text-red-600">{result.attack_roll}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <Shield className="text-blue-500 mx-auto mb-2" size={24} />
              <p className="text-sm text-slate-500">Defesa Inimiga</p>
              <p className="text-2xl font-bold text-blue-600">{result.defense_roll}</p>
            </div>
          </div>

          {/* Loot */}
          {isVictory && result.loot && (
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 mb-3">Recursos Saqueados:</h3>
              <div className="grid grid-cols-3 gap-2">
                {result.loot.coins > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Coins size={16} className="text-yellow-500" /> +{result.loot.coins}
                  </div>
                )}
                {result.loot.wood > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <TreePine size={16} className="text-amber-600" /> +{result.loot.wood}
                  </div>
                )}
                {result.loot.stone > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Mountain size={16} className="text-slate-500" /> +{result.loot.stone}
                  </div>
                )}
                {result.loot.iron > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Pickaxe size={16} className="text-zinc-600" /> +{result.loot.iron}
                  </div>
                )}
                {result.loot.food > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    <Wheat size={16} className="text-lime-500" /> +{result.loot.food}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className={`w-full py-3 font-bold rounded-xl text-white transition ${
              isVictory ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            Continuar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

// Raid History Component
const RaidHistory = ({ raids, currentUserId }) => {
  if (!raids || raids.length === 0) {
    return (
      <div className="bg-slate-50 rounded-xl p-6 text-center">
        <Sword className="text-slate-300 mx-auto mb-2" size={48} />
        <p className="text-slate-500">Ainda não participaste em nenhuma batalha.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {raids.map(raid => {
        const wasAttacker = raid.attacker_id === currentUserId;
        const won = (wasAttacker && raid.victory) || (!wasAttacker && !raid.victory);

        return (
          <div
            key={raid.id}
            className={`p-4 rounded-xl border-l-4 ${won ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${won ? 'bg-green-200' : 'bg-red-200'}`}>
                  {wasAttacker ? <Sword size={20} /> : <Shield size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {wasAttacker ? `Atacaste ${raid.defender_name || 'uma cidade'}` : `${raid.attacker_name || 'Alguém'} atacou-te`}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(raid.created_at).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${won ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                {won ? 'Vitória' : 'Derrota'}
              </div>
            </div>

            {raid.loot && raid.victory && wasAttacker && (
              <div className="mt-2 flex gap-2 text-xs text-slate-600">
                {raid.loot.coins > 0 && <span>+{raid.loot.coins} moedas</span>}
                {raid.loot.wood > 0 && <span>+{raid.loot.wood} madeira</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Send Gift Modal
const SendGiftModal = ({ isOpen, onClose, friendId, friendName, gameState, onSuccess }) => {
  const { user, profile } = useAuth();
  const [giftType, setGiftType] = useState('coins');
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Validate sender has enough resources
      if (giftType === 'coins') {
        if ((gameState?.coins || 0) < amount) {
          toast.error('Não tens moedas suficientes!');
          return;
        }
      } else {
        const res = gameState?.resources || {};
        if ((res[giftType] || 0) < amount) {
          toast.error('Não tens recursos suficientes!');
          return;
        }
      }

      // Deduct from sender
      let senderUpdate = {};
      if (giftType === 'coins') {
        senderUpdate.coins = (gameState?.coins || 0) - amount;
      } else {
        const res = gameState?.resources || {};
        senderUpdate.resources = { ...res, [giftType]: (res[giftType] || 0) - amount };
      }
      const { error: senderError } = await supabase
        .from('game_states')
        .update(senderUpdate)
        .eq('user_id', user.id);
      if (senderError) throw senderError;

      // Add to receiver
      const { data: receiverState, error: recvError } = await supabase
        .from('game_states')
        .select('*')
        .eq('user_id', friendId)
        .single();

      if (!recvError && receiverState) {
        let receiverUpdate = {};
        if (giftType === 'coins') {
          receiverUpdate.coins = (receiverState.coins || 0) + amount;
        } else {
          const recvRes = receiverState.resources || {};
          receiverUpdate.resources = { ...recvRes, [giftType]: (recvRes[giftType] || 0) + amount };
        }
        await supabase
          .from('game_states')
          .update(receiverUpdate)
          .eq('user_id', friendId);
      }

      // Insert notification for receiver
      const senderName = profile?.name || 'Alguém';
      const giftNames = { coins: 'moedas', wood: 'madeira', stone: 'pedra', iron: 'ferro', food: 'comida' };
      await supabase.from('notifications').insert({
        user_id: friendId,
        type: 'gift',
        message: `Recebeste ${amount} ${giftNames[giftType] || giftType} de ${senderName}!`,
      });

      toast.success(`Presente enviado para ${friendName}!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Erro ao enviar presente');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const giftOptions = [
    { id: 'coins', name: 'Moedas', icon: Coins, color: 'text-yellow-500' },
    { id: 'wood', name: 'Madeira', icon: TreePine, color: 'text-amber-600' },
    { id: 'stone', name: 'Pedra', icon: Mountain, color: 'text-slate-500' },
    { id: 'iron', name: 'Ferro', icon: Pickaxe, color: 'text-zinc-600' },
    { id: 'food', name: 'Comida', icon: Wheat, color: 'text-lime-500' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift size={28} />
              <div>
                <h2 className="text-xl font-bold">Enviar Presente</h2>
                <p className="text-white/80 text-sm">Para {friendName}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Presente</label>
            <div className="grid grid-cols-5 gap-2">
              {giftOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setGiftType(opt.id)}
                  className={`p-3 rounded-xl flex flex-col items-center gap-1 transition ${
                    giftType === opt.id ? 'bg-pink-100 border-2 border-pink-500' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <opt.icon className={opt.color} size={24} />
                  <span className="text-xs">{opt.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quantidade</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
              min="1"
              max="50"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500"
            />
            <p className="text-xs text-slate-500 mt-1">Máximo: 50</p>
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Send size={18} />
            {loading ? 'A enviar...' : 'Enviar Presente'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Battle & Social Component
const BattleAndSocial = ({ friends, currentUserId, gameState, onRefresh }) => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('battle');
  const [raids, setRaids] = useState([]);
  const [visitPermissions, setVisitPermissions] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(false);
  const [battleResult, setBattleResult] = useState(null);
  const [giftModal, setGiftModal] = useState({ open: false, friendId: null, friendName: '' });

  // Fetch raid history
  const fetchRaids = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('raids')
        .select('*')
        .or(`attacker_id.eq.${user.id},defender_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setRaids(data || []);
    } catch (error) {
      console.error('Error fetching raids:', error);
    }
  };

  // Fetch visit permissions
  const fetchVisitPermissions = async () => {
    if (!user) return;
    try {
      const [sentRes, receivedRes] = await Promise.all([
        supabase
          .from('visit_permissions')
          .select('*')
          .eq('visitor_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('visit_permissions')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false }),
      ]);
      setVisitPermissions({
        sent: sentRes.data || [],
        received: receivedRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  useEffect(() => {
    fetchRaids();
    fetchVisitPermissions();
  }, [user?.id]);

  // Send raid
  const handleSendRaid = async (targetUserId) => {
    if (!user) return;
    setLoading(true);
    try {
      const attackPower = gameState?.attack_power || 0;
      const attackerName = profile?.name || user?.email || 'Anónimo';

      // Fetch defender's game state
      const { data: defenderState, error: defError } = await supabase
        .from('game_states')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (defError || !defenderState) {
        toast.error('Não foi possível encontrar a cidade do adversário');
        return;
      }

      const defensePower = defenderState.defense_power || 0;
      const friend = friends?.find((f) => f.friend_id === targetUserId);
      const defenderName = friend?.name || 'Aventureiro';

      // Battle rolls (d20 + power, highest wins)
      const attackRoll = Math.floor(Math.random() * 20) + 1 + attackPower;
      const defenseRoll = Math.floor(Math.random() * 20) + 1 + defensePower;
      const victory = attackRoll > defenseRoll;

      let loot = null;
      if (victory) {
        const defRes = defenderState.resources || {};
        loot = {
          coins: Math.floor((defenderState.coins || 0) * 0.1),
          wood: Math.floor((defRes.wood || 0) * 0.1),
          stone: Math.floor((defRes.stone || 0) * 0.1),
          iron: Math.floor((defRes.iron || 0) * 0.1),
          food: Math.floor((defRes.food || 0) * 0.1),
        };

        // Deduct loot from defender
        const defNewRes = {
          ...defRes,
          wood: (defRes.wood || 0) - loot.wood,
          stone: (defRes.stone || 0) - loot.stone,
          iron: (defRes.iron || 0) - loot.iron,
          food: (defRes.food || 0) - loot.food,
        };
        await supabase
          .from('game_states')
          .update({
            coins: (defenderState.coins || 0) - loot.coins,
            resources: defNewRes,
          })
          .eq('user_id', targetUserId);

        // Add loot to attacker
        const myRes = gameState?.resources || {};
        const myNewRes = {
          ...myRes,
          wood: (myRes.wood || 0) + loot.wood,
          stone: (myRes.stone || 0) + loot.stone,
          iron: (myRes.iron || 0) + loot.iron,
          food: (myRes.food || 0) + loot.food,
        };
        await supabase
          .from('game_states')
          .update({
            coins: (gameState?.coins || 0) + loot.coins,
            resources: myNewRes,
          })
          .eq('user_id', user.id);
      }

      // Insert raid record
      await supabase.from('raids').insert({
        attacker_id: user.id,
        attacker_name: attackerName,
        defender_id: targetUserId,
        defender_name: defenderName,
        attack_power: attackPower,
        defense_power: defensePower,
        attack_roll: attackRoll,
        defense_roll: defenseRoll,
        victory,
        loot,
      });

      // Notify defender
      await supabase.from('notifications').insert({
        user_id: targetUserId,
        type: 'raid',
        message: victory
          ? `${attackerName} atacou a tua cidade e venceu! Perdeste recursos.`
          : `${attackerName} atacou a tua cidade mas a tua defesa resistiu!`,
      });

      setBattleResult({
        victory,
        attack_roll: attackRoll,
        defense_roll: defenseRoll,
        loot,
        message: victory ? 'Saqueaste recursos com sucesso!' : 'A defesa inimiga foi demasiado forte!',
      });

      fetchRaids();
      onRefresh?.();
    } catch (error) {
      toast.error(error.message || 'Erro ao enviar ataque');
    } finally {
      setLoading(false);
    }
  };

  // Request visit
  const handleRequestVisit = async (friendUserId) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('visit_permissions').insert({
        visitor_id: user.id,
        owner_id: friendUserId,
        visitor_name: profile?.name || 'Anónimo',
        status: 'pending',
      });
      if (error) throw error;
      toast.success('Pedido de visita enviado!');
      fetchVisitPermissions();
    } catch (error) {
      toast.error(error.message || 'Erro ao pedir visita');
    }
  };

  // Respond to visit request
  const handleVisitResponse = async (requestId, approve) => {
    try {
      const { error } = await supabase
        .from('visit_permissions')
        .update({ status: approve ? 'approved' : 'rejected' })
        .eq('id', requestId);
      if (error) throw error;
      toast.success(approve ? 'Visita aprovada!' : 'Visita recusada');
      fetchVisitPermissions();
    } catch (error) {
      toast.error(error.message || 'Erro ao responder');
    }
  };

  const attackPower = gameState?.attack_power || 0;
  const defensePower = gameState?.defense_power || 0;

  return (
    <div className="space-y-6">
      {/* Battle Result Modal */}
      <BattleResultModal result={battleResult} onClose={() => setBattleResult(null)} />

      {/* Gift Modal */}
      <SendGiftModal
        isOpen={giftModal.open}
        onClose={() => setGiftModal({ open: false, friendId: null, friendName: '' })}
        friendId={giftModal.friendId}
        friendName={giftModal.friendName}
        gameState={gameState}
        onSuccess={onRefresh}
      />

      {/* Stats Header */}
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Batalha & Social ⚔️
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-red-500 p-3 rounded-xl">
              <Sword className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Poder de Ataque</p>
              <p className="text-2xl font-bold text-red-600">{attackPower}</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-xl">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500">Poder de Defesa</p>
              <p className="text-2xl font-bold text-blue-600">{defensePower}</p>
            </div>
          </div>
        </div>

        {attackPower < 5 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <p className="text-amber-700 text-sm">
              Precisas de pelo menos 5 de ataque para fazer raids. Melhora o Quartel!
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="flex border-b">
          {[
            { id: 'battle', label: 'Atacar', icon: Sword },
            { id: 'history', label: 'Histórico', icon: Clock },
            { id: 'visits', label: 'Visitas', icon: Eye },
            { id: 'gifts', label: 'Presentes', icon: Gift },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 font-semibold transition ${
                activeTab === tab.id
                  ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Attack Tab */}
          {activeTab === 'battle' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Escolhe um jogador para atacar e saquear recursos!
              </p>

              {friends && friends.length > 0 ? (
                <div className="space-y-3">
                  {friends.map(friend => (
                    <div
                      key={friend.friend_id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {friend.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{friend.name}</p>
                          <p className="text-sm text-slate-500">{friend.district || 'Portugal'}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendRaid(friend.friend_id)}
                        disabled={loading || attackPower < 5}
                        className="px-4 py-2 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Sword size={16} />
                        Atacar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <Users className="text-slate-300 mx-auto mb-2" size={48} />
                  <p className="text-slate-500">Adiciona amigos para poderes atacar!</p>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <RaidHistory raids={raids} currentUserId={currentUserId || user?.id} />
          )}

          {/* Visits Tab */}
          {activeTab === 'visits' && (
            <div className="space-y-6">
              {/* Pending requests received */}
              {visitPermissions.received.filter(r => r.status === 'pending').length > 0 && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3">Pedidos Recebidos</h3>
                  <div className="space-y-2">
                    {visitPermissions.received.filter(r => r.status === 'pending').map(req => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                        <span className="font-medium">{req.visitor_name} quer visitar a tua cidade</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleVisitResponse(req.id, true)}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleVisitResponse(req.id, false)}
                            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request visit from friends */}
              <div>
                <h3 className="font-bold text-slate-800 mb-3">Pedir Visita</h3>
                {friends && friends.length > 0 ? (
                  <div className="space-y-2">
                    {friends.map(friend => {
                      const permission = visitPermissions.sent.find(p => p.owner_id === friend.friend_id);
                      const status = permission?.status;

                      return (
                        <div key={friend.friend_id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                          <span className="font-medium">{friend.name}</span>
                          {status === 'approved' ? (
                            <span className="text-green-600 text-sm font-semibold">✓ Aprovado</span>
                          ) : status === 'pending' ? (
                            <span className="text-amber-600 text-sm">Pendente...</span>
                          ) : (
                            <button
                              onClick={() => handleRequestVisit(friend.friend_id)}
                              className="px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600"
                            >
                              Pedir Visita
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Adiciona amigos primeiro!</p>
                )}
              </div>
            </div>
          )}

          {/* Gifts Tab */}
          {activeTab === 'gifts' && (
            <div className="space-y-4">
              <p className="text-slate-600">Envia presentes aos teus amigos para os ajudar!</p>

              {friends && friends.length > 0 ? (
                <div className="space-y-2">
                  {friends.map(friend => (
                    <div key={friend.friend_id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center text-white font-bold">
                          {friend.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium">{friend.name}</span>
                      </div>
                      <button
                        onClick={() => setGiftModal({ open: true, friendId: friend.friend_id, friendName: friend.name })}
                        className="px-4 py-2 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition flex items-center gap-2"
                      >
                        <Gift size={16} />
                        Enviar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-6 text-center">
                  <Gift className="text-slate-300 mx-auto mb-2" size={48} />
                  <p className="text-slate-500">Adiciona amigos para enviares presentes!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BattleAndSocial;
