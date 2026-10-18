import React from 'react';
import { Coins, Diamond, TreePine, Mountain, Pickaxe, Wheat, Home, Shield, Sword, ShoppingCart } from 'lucide-react';

const ResourceBar = ({ gameState, onOpenShop }) => {
  const resources = gameState?.resources || { wood: 0, stone: 0, iron: 0, food: 0 };

  return (
    <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 rounded-2xl p-1 shadow-2xl border border-amber-700/50" data-testid="resource-bar">
      <div className="bg-gradient-to-b from-amber-100 via-amber-50 to-white rounded-xl px-5 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {[
            { icon: <Coins size={22} />, value: gameState?.coins || 0, label: 'Ouro', bg: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-500/40' },
            { icon: <Diamond size={22} />, value: gameState?.diamonds || 0, label: 'Gemas', bg: 'from-purple-400 to-purple-600', shadow: 'shadow-purple-500/40' },
            { icon: <TreePine size={22} />, value: resources.wood, label: 'Madeira', bg: 'from-amber-600 to-amber-800', shadow: 'shadow-amber-700/40' },
            { icon: <Mountain size={22} />, value: resources.stone, label: 'Pedra', bg: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-500/40' },
            { icon: <Pickaxe size={22} />, value: resources.iron, label: 'Ferro', bg: 'from-zinc-500 to-zinc-700', shadow: 'shadow-zinc-600/40' },
            { icon: <Wheat size={22} />, value: resources.food, label: 'Comida', bg: 'from-lime-500 to-[hsl(28,85%,40%)]', shadow: 'shadow-lime-500/40' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-lg border border-gray-100">
              <div className={`bg-gradient-to-br ${item.bg} text-white p-2 rounded-lg shadow-lg ${item.shadow}`}>
                {item.icon}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{item.label}</p>
                <p className="font-black text-gray-800 text-xl leading-none">{item.value}</p>
              </div>
            </div>
          ))}

          <div className="h-14 w-px bg-gradient-to-b from-transparent via-amber-300 to-transparent" />

          <button
            onClick={onOpenShop}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-lg hover:opacity-90 transition"
            data-testid="open-shop-btn"
            title="Comprar materiais com moedas e diamantes"
          >
            <ShoppingCart size={20} />
            <span>Loja</span>
          </button>

          <div className="flex items-center gap-3">
            {[
              { icon: <Home size={20} />, value: `${gameState?.population || 10}/${gameState?.max_population || 20}`, bg: 'bg-[hsl(200,55%,88%)]', text: 'text-blue-700', iconColor: 'text-[hsl(35,92%,45%)]' },
              { icon: <Shield size={20} />, value: gameState?.defense_power || 5, bg: 'bg-emerald-100', text: 'text-emerald-700', iconColor: 'text-emerald-500' },
              { icon: <Sword size={20} />, value: gameState?.attack_power || 0, bg: 'bg-red-100', text: 'text-red-700', iconColor: 'text-red-500' },
            ].map((stat, i) => (
              <div key={i} className={`flex items-center gap-2 ${stat.bg} px-4 py-2.5 rounded-xl`}>
                <span className={stat.iconColor}>{stat.icon}</span>
                <span className={`font-black text-lg ${stat.text}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceBar;
