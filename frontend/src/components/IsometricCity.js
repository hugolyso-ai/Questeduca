import React, { useState, useEffect, useCallback } from 'react';
import { 
  Coins, Diamond, TreePine, Mountain, Pickaxe, Wheat, 
  Home, School, Library, Store, Building2, Shield, Sword,
  Clock, Check, Play, ChevronUp, X, Info
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Building configurations
const BUILDING_CONFIG = {
  town_hall: { name: 'Câmara Municipal', icon: '🏛️', color: 'from-amber-400 to-amber-600', size: 'large' },
  house: { name: 'Casa', icon: '🏠', color: 'from-blue-400 to-blue-600', size: 'medium' },
  school: { name: 'Escola', icon: '🏫', color: 'from-green-400 to-green-600', size: 'large' },
  library: { name: 'Biblioteca', icon: '📚', color: 'from-purple-400 to-purple-600', size: 'medium' },
  market: { name: 'Mercado', icon: '🏪', color: 'from-orange-400 to-orange-600', size: 'medium', produces: true },
  farm: { name: 'Quinta', icon: '🌾', color: 'from-lime-400 to-lime-600', size: 'medium', produces: true },
  lumber_mill: { name: 'Serração', icon: '🪵', color: 'from-amber-600 to-amber-800', size: 'medium', produces: true },
  quarry: { name: 'Pedreira', icon: '🪨', color: 'from-slate-400 to-slate-600', size: 'medium', produces: true },
  mine: { name: 'Mina', icon: '⛏️', color: 'from-zinc-500 to-zinc-700', size: 'medium', produces: true },
  barracks: { name: 'Quartel', icon: '⚔️', color: 'from-red-500 to-red-700', size: 'large' },
  wall: { name: 'Muralha', icon: '🏰', color: 'from-stone-400 to-stone-600', size: 'small' },
  garden: { name: 'Jardim', icon: '🌳', color: 'from-emerald-400 to-emerald-600', size: 'medium' }
};

// Isometric tile component
const IsometricTile = ({ x, y, building, gameState, onSelect, isSelected, productionTimers }) => {
  const config = BUILDING_CONFIG[building?.id] || {};
  const level = building?.level || 0;
  const isBuilt = level > 0;
  const isProducing = building?.producing;
  
  // Calculate production time remaining
  const getProductionStatus = () => {
    if (!isProducing || !productionTimers?.[building?.id]) return null;
    const endTime = new Date(productionTimers[building.id]);
    const now = new Date();
    const remaining = Math.max(0, (endTime - now) / 1000 / 60);
    return remaining > 0 ? `${Math.ceil(remaining)}min` : 'Pronto!';
  };
  
  const productionStatus = getProductionStatus();
  
  // Isometric positioning
  const tileWidth = 100;
  const tileHeight = 50;
  const offsetX = (x - y) * (tileWidth / 2) + 400;
  const offsetY = (x + y) * (tileHeight / 2) + 50;
  
  // Size multiplier based on building size
  const sizeMultiplier = config.size === 'large' ? 1.3 : config.size === 'small' ? 0.8 : 1;
  
  return (
    <div
      className={`absolute cursor-pointer transition-all duration-300 ${isSelected ? 'z-20 scale-110' : 'z-10 hover:scale-105'}`}
      style={{
        left: `${offsetX}px`,
        top: `${offsetY}px`,
        transform: `translate(-50%, -50%)`,
        width: `${tileWidth * sizeMultiplier}px`
      }}
      onClick={() => onSelect(building)}
    >
      {/* Ground tile */}
      <div 
        className={`relative ${isBuilt ? '' : 'opacity-40'}`}
        style={{
          width: `${tileWidth * sizeMultiplier}px`,
          height: `${tileWidth * sizeMultiplier}px`
        }}
      >
        {/* Building base (isometric diamond) */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br ${isBuilt ? config.color : 'from-slate-300 to-slate-400'} rounded-lg shadow-lg transform`}
          style={{
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
            transform: 'rotateX(60deg) rotateZ(45deg)'
          }}
        />
        
        {/* Building structure */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-4xl ${sizeMultiplier > 1 ? 'text-5xl' : ''} drop-shadow-lg transform -translate-y-2`}>
            {isBuilt ? config.icon : '🏗️'}
          </div>
        </div>
        
        {/* Level indicator */}
        {isBuilt && level > 0 && (
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
            {level}
          </div>
        )}
        
        {/* Production indicator */}
        {isProducing && (
          <div className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 ${productionStatus === 'Pronto!' ? 'bg-green-500' : 'bg-blue-500'} text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg animate-pulse`}>
            {productionStatus}
          </div>
        )}
        
        {/* Not built overlay */}
        {!isBuilt && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/50 rounded-full p-2">
              <Building2 className="text-white" size={20} />
            </div>
          </div>
        )}
      </div>
      
      {/* Building name on hover */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className="text-xs font-semibold text-slate-700 bg-white/80 px-2 py-0.5 rounded shadow-sm">
          {config.name || building?.id}
        </span>
      </div>
    </div>
  );
};

// Resource bar component
const ResourceBar = ({ gameState }) => {
  const resources = gameState?.resources || { wood: 0, stone: 0, iron: 0, food: 0 };
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 mb-4">
      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {/* Coins */}
        <div className="flex items-center gap-2 bg-yellow-50 rounded-xl p-3">
          <div className="bg-yellow-400 p-2 rounded-lg">
            <Coins className="text-yellow-900" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Moedas</p>
            <p className="font-bold text-slate-800">{gameState?.coins || 0}</p>
          </div>
        </div>
        
        {/* Diamonds */}
        <div className="flex items-center gap-2 bg-purple-50 rounded-xl p-3">
          <div className="bg-purple-400 p-2 rounded-lg">
            <Diamond className="text-purple-900" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Diamantes</p>
            <p className="font-bold text-slate-800">{gameState?.diamonds || 0}</p>
          </div>
        </div>
        
        {/* Wood */}
        <div className="flex items-center gap-2 bg-amber-50 rounded-xl p-3">
          <div className="bg-amber-600 p-2 rounded-lg">
            <TreePine className="text-white" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Madeira</p>
            <p className="font-bold text-slate-800">{resources.wood}</p>
          </div>
        </div>
        
        {/* Stone */}
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-3">
          <div className="bg-slate-500 p-2 rounded-lg">
            <Mountain className="text-white" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Pedra</p>
            <p className="font-bold text-slate-800">{resources.stone}</p>
          </div>
        </div>
        
        {/* Iron */}
        <div className="flex items-center gap-2 bg-zinc-100 rounded-xl p-3">
          <div className="bg-zinc-600 p-2 rounded-lg">
            <Pickaxe className="text-white" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Ferro</p>
            <p className="font-bold text-slate-800">{resources.iron}</p>
          </div>
        </div>
        
        {/* Food */}
        <div className="flex items-center gap-2 bg-lime-50 rounded-xl p-3">
          <div className="bg-lime-500 p-2 rounded-lg">
            <Wheat className="text-white" size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Comida</p>
            <p className="font-bold text-slate-800">{resources.food}</p>
          </div>
        </div>
      </div>
      
      {/* City stats */}
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <Home className="text-blue-500" size={18} />
          <span className="text-sm text-slate-600">
            Pop: <span className="font-bold">{gameState?.population || 10}/{gameState?.max_population || 20}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="text-green-500" size={18} />
          <span className="text-sm text-slate-600">
            Defesa: <span className="font-bold">{gameState?.defense_power || 5}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sword className="text-red-500" size={18} />
          <span className="text-sm text-slate-600">
            Ataque: <span className="font-bold">{gameState?.attack_power || 0}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Building detail panel
const BuildingPanel = ({ building, buildingInfo, gameState, onClose, onUpgrade, onStartProduction, onCollect, loading }) => {
  if (!building) return null;
  
  const config = BUILDING_CONFIG[building.id] || {};
  const info = buildingInfo?.[building.id] || {};
  const level = building.level || 0;
  const isBuilt = level > 0;
  const maxLevel = info.max_level || 5;
  
  // Calculate costs for next level
  const nextLevelCost = info.base_cost ? {
    coins: info.base_cost.coins * (level + 1),
    wood: info.base_cost.wood * (level + 1),
    stone: info.base_cost.stone * (level + 1),
    iron: info.base_cost.iron * (level + 1)
  } : null;
  
  // Check if can afford
  const canAfford = nextLevelCost && gameState && 
    gameState.coins >= nextLevelCost.coins &&
    (gameState.resources?.wood || 0) >= nextLevelCost.wood &&
    (gameState.resources?.stone || 0) >= nextLevelCost.stone &&
    (gameState.resources?.iron || 0) >= nextLevelCost.iron;
  
  // Check production status
  const isProducing = building.producing;
  const productionTimer = gameState?.production_timers?.[building.id];
  const productionReady = productionTimer && new Date(productionTimer) <= new Date();
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in">
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.color || 'from-slate-400 to-slate-600'} p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{config.icon || '🏗️'}</div>
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  {config.name || building.id}
                </h2>
                <p className="text-white/80">Nível {level}/{maxLevel}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-slate-600">{info.description || 'Edifício da cidade.'}</p>
          </div>
          
          {/* Level progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Progresso</span>
              <span className="font-bold text-slate-800">{level}/{maxLevel}</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.color || 'from-slate-400 to-slate-600'} transition-all`}
                style={{ width: `${(level / maxLevel) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Production section (for production buildings) */}
          {info.produces && isBuilt && (
            <div className="bg-blue-50 rounded-xl p-4">
              <h3 className="font-bold text-blue-800 mb-2">Produção</h3>
              <p className="text-blue-600 text-sm mb-3">
                Produz {info.produces.amount * level} {info.produces.resource} a cada {Math.round(info.produces.time_minutes / level)} minutos
              </p>
              
              {!isProducing && !productionReady && (
                <button
                  onClick={() => onStartProduction(building.id)}
                  disabled={loading}
                  className="w-full py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition flex items-center justify-center gap-2"
                >
                  <Play size={18} />
                  Iniciar Produção
                </button>
              )}
              
              {isProducing && !productionReady && (
                <div className="flex items-center justify-center gap-2 py-2 bg-blue-200 text-blue-800 rounded-xl">
                  <Clock className="animate-spin" size={18} />
                  A produzir...
                </div>
              )}
              
              {productionReady && (
                <button
                  onClick={() => onCollect(building.id)}
                  disabled={loading}
                  className="w-full py-2 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition flex items-center justify-center gap-2 animate-pulse"
                >
                  <Check size={18} />
                  Recolher Recursos!
                </button>
              )}
            </div>
          )}
          
          {/* Upgrade section */}
          {level < maxLevel && (
            <div className="bg-amber-50 rounded-xl p-4">
              <h3 className="font-bold text-amber-800 mb-2">
                {isBuilt ? 'Melhorar para Nível ' + (level + 1) : 'Construir'}
              </h3>
              
              {nextLevelCost && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className={`flex items-center gap-2 text-sm ${gameState?.coins >= nextLevelCost.coins ? 'text-green-600' : 'text-red-600'}`}>
                    <Coins size={16} /> {nextLevelCost.coins} moedas
                  </div>
                  {nextLevelCost.wood > 0 && (
                    <div className={`flex items-center gap-2 text-sm ${(gameState?.resources?.wood || 0) >= nextLevelCost.wood ? 'text-green-600' : 'text-red-600'}`}>
                      <TreePine size={16} /> {nextLevelCost.wood} madeira
                    </div>
                  )}
                  {nextLevelCost.stone > 0 && (
                    <div className={`flex items-center gap-2 text-sm ${(gameState?.resources?.stone || 0) >= nextLevelCost.stone ? 'text-green-600' : 'text-red-600'}`}>
                      <Mountain size={16} /> {nextLevelCost.stone} pedra
                    </div>
                  )}
                  {nextLevelCost.iron > 0 && (
                    <div className={`flex items-center gap-2 text-sm ${(gameState?.resources?.iron || 0) >= nextLevelCost.iron ? 'text-green-600' : 'text-red-600'}`}>
                      <Pickaxe size={16} /> {nextLevelCost.iron} ferro
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => onUpgrade(building.id, nextLevelCost?.coins || 50)}
                disabled={!canAfford || loading}
                className={`w-full py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 ${
                  canAfford 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:opacity-90' 
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ChevronUp size={18} />
                {isBuilt ? 'Melhorar' : 'Construir'}
              </button>
            </div>
          )}
          
          {level >= maxLevel && (
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <Check className="text-green-500 mx-auto mb-2" size={32} />
              <p className="font-bold text-green-700">Nível Máximo Atingido!</p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes bounce-in {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-bounce-in { animation: bounce-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

// Main Isometric City component
const IsometricCity = ({ gameState, onRefresh }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingInfo, setBuildingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch building info
  useEffect(() => {
    const fetchBuildingInfo = async () => {
      try {
        const response = await axios.get(`${API}/game/building-info`, { withCredentials: true });
        setBuildingInfo(response.data);
      } catch (error) {
        console.error('Error fetching building info:', error);
      }
    };
    fetchBuildingInfo();
  }, []);
  
  // Convert buildings object to array for rendering
  const buildingsArray = Object.entries(gameState?.buildings || {}).map(([id, data]) => ({
    id,
    ...(typeof data === 'object' ? data : { level: data, x: 5, y: 5, producing: false })
  }));
  
  const handleSelectBuilding = (building) => {
    setSelectedBuilding(building);
  };
  
  const handleUpgrade = async (buildingId, cost) => {
    setLoading(true);
    try {
      await axios.post(`${API}/game/upgrade-building`, null, {
        params: { building_id: buildingId, cost },
        withCredentials: true
      });
      toast.success('Edifício melhorado!');
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao melhorar edifício');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartProduction = async (buildingId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/game/start-production`, null, {
        params: { building_id: buildingId },
        withCredentials: true
      });
      toast.success(`Produção iniciada! ${response.data.amount} ${response.data.resource} em breve.`);
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao iniciar produção');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCollect = async (buildingId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/game/collect-production`, null, {
        params: { building_id: buildingId },
        withCredentials: true
      });
      toast.success(`Recolheste ${response.data.amount} ${response.data.resource}!`);
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao recolher recursos');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Resource bar */}
      <ResourceBar gameState={gameState} />
      
      {/* City view */}
      <div className="bg-gradient-to-b from-sky-200 via-sky-100 to-green-200 rounded-3xl shadow-xl overflow-hidden relative" style={{ height: '500px' }}>
        {/* Sky decorations */}
        <div className="absolute top-4 left-8 text-4xl animate-bounce" style={{ animationDuration: '3s' }}>☁️</div>
        <div className="absolute top-12 right-16 text-3xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>☁️</div>
        <div className="absolute top-6 left-1/3 text-2xl animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }}>☁️</div>
        
        {/* Sun */}
        <div className="absolute top-4 right-8 text-5xl">🌞</div>
        
        {/* Ground decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-green-400 to-transparent" />
        
        {/* Buildings grid */}
        <div className="relative w-full h-full">
          {buildingsArray.map((building) => (
            <IsometricTile
              key={building.id}
              x={building.x}
              y={building.y}
              building={building}
              gameState={gameState}
              onSelect={handleSelectBuilding}
              isSelected={selectedBuilding?.id === building.id}
              productionTimers={gameState?.production_timers}
            />
          ))}
        </div>
        
        {/* City name */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-6 py-2 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              🏰 Cidade de {gameState?.city_name || 'Aventureiro'}
            </h2>
          </div>
        </div>
        
        {/* Help button */}
        <button className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition">
          <Info className="text-slate-600" size={20} />
        </button>
      </div>
      
      {/* Building panel */}
      {selectedBuilding && (
        <BuildingPanel
          building={selectedBuilding}
          buildingInfo={buildingInfo}
          gameState={gameState}
          onClose={() => setSelectedBuilding(null)}
          onUpgrade={handleUpgrade}
          onStartProduction={handleStartProduction}
          onCollect={handleCollect}
          loading={loading}
        />
      )}
    </div>
  );
};

export default IsometricCity;
