import React, { useState } from 'react';
import { X, Coins, Gem, TreePine, Mountain, Pickaxe, Wheat, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SHOP_ITEMS = [
  { id: 'wood_small', resource: 'wood', qty: 50, coins: 30, diamonds: 0 },
  { id: 'wood_medium', resource: 'wood', qty: 150, coins: 75, diamonds: 0 },
  { id: 'wood_large', resource: 'wood', qty: 400, coins: 150, diamonds: 5 },
  { id: 'stone_small', resource: 'stone', qty: 50, coins: 35, diamonds: 0 },
  { id: 'stone_medium', resource: 'stone', qty: 150, coins: 85, diamonds: 0 },
  { id: 'stone_large', resource: 'stone', qty: 400, coins: 160, diamonds: 5 },
  { id: 'iron_small', resource: 'iron', qty: 30, coins: 45, diamonds: 0 },
  { id: 'iron_medium', resource: 'iron', qty: 90, coins: 110, diamonds: 0 },
  { id: 'iron_large', resource: 'iron', qty: 250, coins: 200, diamonds: 8 },
  { id: 'food_small', resource: 'food', qty: 50, coins: 20, diamonds: 0 },
  { id: 'food_medium', resource: 'food', qty: 150, coins: 55, diamonds: 0 },
  { id: 'food_large', resource: 'food', qty: 400, coins: 130, diamonds: 4 },
];

const RESOURCE_META = {
  wood: { name: 'Madeira', Icon: TreePine, color: 'text-amber-700', bg: 'bg-amber-100' },
  stone: { name: 'Pedra', Icon: Mountain, color: 'text-slate-700', bg: 'bg-slate-100' },
  iron: { name: 'Ferro', Icon: Pickaxe, color: 'text-zinc-700', bg: 'bg-zinc-100' },
  food: { name: 'Comida', Icon: Wheat, color: 'text-lime-700', bg: 'bg-lime-100' },
};

const SIZE_LABEL = { small: 'Pacote pequeno', medium: 'Pacote médio', large: 'Pacote grande' };

const ResourceShop = ({ gameState, onClose, onRefresh }) => {
  const { user } = useAuth();
  const [buying, setBuying] = useState(null);

  const balance = {
    coins: gameState?.coins || 0,
    diamonds: gameState?.diamonds || 0,
  };

  const handleBuy = async (item) => {
    if (!user || buying) return;
    setBuying(item.id);
    try {
      const { data, error } = await supabase.rpc('purchase_resources', { p_item: item.id });
      if (error) {
        const msg = /Moedas insuficientes/i.test(error.message)
          ? 'Não tens moedas suficientes!'
          : /Diamantes insuficientes/i.test(error.message)
            ? 'Não tens diamantes suficientes!'
            : error.message;
        toast.error(msg);
        return;
      }
      const res = data?.resources || {};
      toast.success(`+${item.qty} ${RESOURCE_META[item.resource].name}!`, { icon: '📦' });
      onRefresh?.(data);
      return data;
    } catch (e) {
      toast.error(e.message || 'Erro na compra');
    } finally {
      setBuying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 relative"
        onClick={(e) => e.stopPropagation()}
        data-testid="resource-shop-dialog"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-slate-100 transition text-slate-500"
          title="Fechar"
          data-testid="shop-close-btn"
        >
          <X size={22} />
        </button>

        <div className="p-6 pb-0">
          <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Cinzel, serif' }}>
            🛒 Loja de Materiais
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Troca as moedas e diamantes ganhos nos quizzes por materiais de construção.
          </p>

          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-200">
              <Coins className="text-amber-500" size={18} />
              <span className="font-bold text-amber-700">{balance.coins}</span>
              <span className="text-xs text-amber-600/70">moedas</span>
            </div>
            <div className="flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-xl border border-cyan-200">
              <Gem className="text-cyan-500" size={18} />
              <span className="font-bold text-cyan-700">{balance.diamonds}</span>
              <span className="text-xs text-cyan-600/70">diamantes</span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {SHOP_ITEMS.filter(it => it.id).map((item) => {
            const meta = RESOURCE_META[item.resource];
            const size = item.id.split('_')[1];
            const affordable = balance.coins >= item.coins && balance.diamonds >= item.diamonds;
            const sizeOrder = { small: 0, medium: 1, large: 2 };
            return (
              <div
                key={item.id}
                className={`rounded-2xl border-2 p-4 flex items-center gap-3 transition ${
                  affordable ? 'border-slate-200 bg-white hover:border-amber-300' : 'border-slate-100 bg-slate-50 opacity-75'
                }`}
              >
                <div className={`${meta.bg} p-3 rounded-xl`}>
                  <meta.Icon className={meta.color} size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">{meta.name} × {item.qty}</p>
                  <p className="text-xs text-slate-400">{SIZE_LABEL[size]}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm font-semibold">
                    <span className="flex items-center gap-1 text-amber-600">
                      <Coins size={14} /> {item.coins}
                    </span>
                    {item.diamonds > 0 && (
                      <span className="flex items-center gap-1 text-cyan-600">
                        <Gem size={14} /> {item.diamonds}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleBuy(item)}
                  disabled={buying === item.id}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition flex items-center gap-1 ${
                    affordable
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  data-testid={`buy-${item.id}`}
                >
                  {buying === item.id ? '...' : <Check size={16} />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition">
            Fechar loja
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceShop;
