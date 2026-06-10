import React, { useState } from 'react';
import {
  Coins, TreePine, Mountain, Pickaxe, Clock, Check, Play, ChevronUp, X, Move, Trash2,
} from 'lucide-react';
import { ASSETS, BUILDING_CONFIG, getBuildingCost } from './cityConfig';

const BuildingPanel = ({
  building, gameState, onClose, onUpgrade, onStartProduction, onCollect,
  onStartMove, onDemolish, loading,
}) => {
  const [confirmDemolish, setConfirmDemolish] = useState(false);

  if (!building) return null;

  const config = BUILDING_CONFIG[building.id] || {};
  const level = building.level || 0;
  const maxLevel = 5;
  const isTownHall = building.id === 'town_hall';

  const costs = getBuildingCost(building.id, level);

  const canAffordUpgrade = gameState &&
    gameState.coins >= costs.coins &&
    (gameState.resources?.wood || 0) >= costs.wood &&
    (gameState.resources?.stone || 0) >= costs.stone &&
    (gameState.resources?.iron || 0) >= costs.iron;

  const isProducing = building.producing;
  const productionReady = gameState?.production_timers?.[building.id] &&
    new Date(gameState.production_timers[building.id]) <= new Date();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-gradient-to-b from-stone-100 to-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-4 border-amber-700 animate-scale-in max-h-[90vh] overflow-y-auto" data-testid="building-panel">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 overflow-hidden shrink-0">
          <img
            src={ASSETS[building.id]}
            alt={config.name}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-40 object-contain"
            style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.4))' }}
          />
          <button onClick={onClose} className="absolute top-4 right-4 p-3 bg-white/20 hover:bg-white/30 rounded-full transition backdrop-blur-sm" data-testid="building-panel-close">
            <X size={24} className="text-white" />
          </button>
          <div className="absolute bottom-3 left-6">
            <h2 className="text-2xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              {config.name}
            </h2>
            <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full inline-block mt-1">
              <span className="text-white font-bold text-sm">Nível {level}/{maxLevel}</span>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-3 border border-amber-200">
            <p className="text-gray-700 font-medium text-sm">{config.description}</p>
          </div>

          {/* Production */}
          {config.produces && level > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border-2 border-blue-200">
              <h3 className="font-black text-blue-800 mb-3 flex items-center gap-2">
                <Clock size={20} /> Sistema de Produção
              </h3>
              {!isProducing && !productionReady && (
                <button onClick={() => onStartProduction(building.id)} disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black rounded-2xl hover:from-blue-600 hover:to-cyan-600 flex items-center justify-center gap-2 shadow-xl transition-all"
                  data-testid="start-production-btn">
                  <Play size={20} /> INICIAR PRODUÇÃO
                </button>
              )}
              {productionReady && (
                <button onClick={() => onCollect(building.id)} disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black rounded-2xl animate-pulse flex items-center justify-center gap-2 shadow-xl"
                  data-testid="collect-production-btn">
                  <Check size={20} /> RECOLHER RECURSOS!
                </button>
              )}
              {isProducing && !productionReady && (
                <div className="text-center py-3 text-blue-600 font-bold flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-4 border-blue-600 border-t-transparent" />
                  A produzir recursos...
                </div>
              )}
            </div>
          )}

          {/* Upgrade */}
          {level > 0 && level < maxLevel && (
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border-2 border-amber-300">
              <h3 className="font-black text-amber-800 mb-3 flex items-center gap-2">
                <ChevronUp size={20} /> Evoluir para Nível {level + 1}
              </h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { icon: <Coins size={16} />, val: costs.coins, have: gameState?.coins || 0 },
                  { icon: <TreePine size={16} />, val: costs.wood, have: gameState?.resources?.wood || 0 },
                  { icon: <Mountain size={16} />, val: costs.stone, have: gameState?.resources?.stone || 0 },
                  { icon: <Pickaxe size={16} />, val: costs.iron, have: gameState?.resources?.iron || 0 },
                ].map((r, i) => (
                  <div key={i} className={`flex flex-col items-center gap-1 p-2 rounded-xl font-bold text-sm ${r.have >= r.val ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-red-100 text-red-700 border-2 border-red-300'}`}>
                    {r.icon}
                    <span>{r.val}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onUpgrade(building.id, costs.coins)} disabled={!canAffordUpgrade || loading}
                className={`w-full py-3 font-black rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  canAffordUpgrade
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-xl'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
                data-testid="upgrade-building-btn">
                <ChevronUp size={20} /> EVOLUIR EDIFÍCIO
              </button>
            </div>
          )}

          {level >= maxLevel && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 text-center border-2 border-green-300">
              <p className="font-black text-green-700">✓ Nível Máximo Atingido!</p>
            </div>
          )}

          {/* Move + Demolish */}
          {level > 0 && !isTownHall && (
            <div className="flex gap-3">
              <button
                onClick={() => onStartMove(building.id)}
                disabled={loading}
                className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white font-black rounded-2xl hover:from-sky-600 hover:to-blue-600 flex items-center justify-center gap-2 shadow-lg transition-all"
                data-testid="move-building-btn"
              >
                <Move size={18} /> Mover
              </button>
              {!confirmDemolish ? (
                <button
                  onClick={() => setConfirmDemolish(true)}
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-black rounded-2xl hover:from-red-600 hover:to-rose-600 flex items-center justify-center gap-2 shadow-lg transition-all"
                  data-testid="demolish-building-btn"
                >
                  <Trash2 size={18} /> Demolir
                </button>
              ) : (
                <button
                  onClick={() => { onDemolish(building.id); setConfirmDemolish(false); }}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-700 text-white font-black rounded-2xl animate-pulse flex items-center justify-center gap-2 shadow-lg"
                  data-testid="confirm-demolish-btn"
                >
                  <Trash2 size={18} /> Confirmar? (50% devolvido)
                </button>
              )}
            </div>
          )}
          {isTownHall && (
            <p className="text-center text-xs text-stone-500 font-medium">
              🏛️ A Câmara Municipal é o coração da cidade — não pode ser movida nem demolida.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes scale-in { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
};

export default BuildingPanel;
