import React, { useState, useMemo } from 'react';
import {
  Coins, TreePine, Mountain, Pickaxe, Check, Landmark,
  GraduationCap, Wheat, Swords, Route, Lightbulb, Hammer, Eraser,
} from 'lucide-react';
import {
  ASSETS, BUILDING_CONFIG, BUILDING_COSTS, ROAD_COST, CATEGORIES, URBAN_TIPS, canAfford,
} from './cityConfig';

const CATEGORY_ICONS = {
  civil: Landmark,
  education: GraduationCap,
  resources: Wheat,
  military: Swords,
  roads: Route,
};

const CostRow = ({ cost, gameState }) => {
  const res = gameState?.resources || {};
  const items = [
    { icon: <Coins size={12} />, val: cost.coins, have: gameState?.coins || 0 },
    { icon: <TreePine size={12} />, val: cost.wood, have: res.wood || 0 },
    { icon: <Mountain size={12} />, val: cost.stone, have: res.stone || 0 },
    { icon: <Pickaxe size={12} />, val: cost.iron, have: res.iron || 0 },
  ].filter((i) => i.val > 0);
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {items.map((item, i) => (
        <span key={i} className={`flex items-center gap-0.5 text-[11px] font-bold ${item.have >= item.val ? 'text-stone-600' : 'text-red-500'}`}>
          {item.icon}{item.val}
        </span>
      ))}
    </div>
  );
};

const RESOURCE_LABELS = { coins: 'Moedas', wood: 'Madeira', stone: 'Pedra', iron: 'Ferro' };

const getMissingResources = (gameState, cost) => {
  const res = gameState?.resources || {};
  const have = { coins: gameState?.coins || 0, wood: res.wood || 0, stone: res.stone || 0, iron: res.iron || 0 };
  return Object.keys(RESOURCE_LABELS).filter((k) => have[k] < (cost[k] || 0)).map((k) => RESOURCE_LABELS[k]);
};

const BuildingCard = ({ id, gameState, buildings, placingId, onStartPlace }) => {
  const config = BUILDING_CONFIG[id];
  const cost = BUILDING_COSTS[id];
  const b = buildings[id];
  const level = typeof b === 'object' ? b?.level || 0 : b || 0;
  const isBuilt = level > 0;
  const affordable = canAfford(gameState, cost);
  const isPlacing = placingId === id;
  const missing = affordable ? [] : getMissingResources(gameState, cost);

  if (isBuilt) {
    return (
      <div className="relative flex flex-col items-center gap-1 p-2 rounded-xl bg-[hsl(38,80%,93%)] border-2 border-green-300 w-28 shrink-0" data-testid={`build-item-${id}`}>
        <img src={ASSETS[id]} alt={config.name} className="h-12 object-contain" draggable={false} />
        <span className="text-[11px] font-bold text-stone-700 text-center leading-tight">{config.name}</span>
        <span className="flex items-center gap-1 text-[10px] font-black text-[hsl(28,85%,40%)]">
          <Check size={11} /> Construído Nv.{level}
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={() => affordable && onStartPlace(id)}
      disabled={!affordable}
      title={affordable ? `Construir ${config.name}` : 'Recursos insuficientes'}
      className={`relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 w-28 shrink-0 transition-all duration-200 ${
        isPlacing
          ? 'border-amber-400 bg-amber-100 ring-2 ring-amber-400 scale-105'
          : affordable
            ? 'border-stone-300 bg-white hover:border-amber-400 hover:bg-amber-50 hover:scale-105 cursor-pointer'
            : 'border-stone-200 bg-stone-100 cursor-not-allowed'
      }`}
      data-testid={`build-item-${id}`}
    >
      <img
        src={ASSETS[id]}
        alt={config.name}
        className="h-12 object-contain"
        style={!affordable ? { filter: 'blur(1.5px) grayscale(0.9)', opacity: 0.55 } : undefined}
        draggable={false}
      />
      <span className={`text-[11px] font-bold text-center leading-tight ${affordable ? 'text-stone-700' : 'text-stone-400'}`}>
        {config.name}
      </span>
      <CostRow cost={cost} gameState={gameState} />
      {!affordable && (
        <span className="text-[9px] text-red-400 font-semibold leading-tight">
          Falta: {missing.join(', ')}
        </span>
      )}
    </button>
  );
};

const RoadCards = ({ gameState, mode, onStartRoad, onStartRoadRemove }) => {
  const res = gameState?.resources || {};
  const affordable = (res.wood || 0) >= ROAD_COST.wood && (res.stone || 0) >= ROAD_COST.stone;
  return (
    <>
      <button
        onClick={() => affordable && onStartRoad()}
        disabled={!affordable}
        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 w-32 shrink-0 transition-all duration-200 ${
          mode === 'road'
            ? 'border-amber-400 bg-amber-100 ring-2 ring-amber-400'
            : affordable
              ? 'border-stone-300 bg-white hover:border-amber-400 hover:bg-amber-50 hover:scale-105'
              : 'border-stone-200 bg-stone-100 cursor-not-allowed'
        }`}
        data-testid="build-road-btn"
      >
        <div className="h-12 w-16 rounded-lg" style={{ backgroundImage: `url(${ASSETS.roadTexture})`, backgroundSize: 'cover', filter: affordable ? 'none' : 'blur(1.5px) grayscale(0.9)', opacity: affordable ? 1 : 0.55 }} />
        <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1"><Hammer size={11} /> Construir Estrada</span>
        <span className={`flex items-center gap-2 text-[11px] font-bold ${affordable ? 'text-stone-600' : 'text-red-500'}`}>
          <span className="flex items-center gap-0.5"><TreePine size={12} />{ROAD_COST.wood}</span>
          <span className="flex items-center gap-0.5"><Mountain size={12} />{ROAD_COST.stone}</span>
        </span>
      </button>
      <button
        onClick={onStartRoadRemove}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 w-32 shrink-0 transition-all duration-200 ${
          mode === 'road-remove'
            ? 'border-red-400 bg-red-100 ring-2 ring-red-400'
            : 'border-stone-300 bg-white hover:border-red-400 hover:bg-red-50 hover:scale-105'
        }`}
        data-testid="remove-road-btn"
      >
        <Eraser size={28} className="text-red-400" />
        <span className="text-[11px] font-bold text-stone-700">Remover Estrada</span>
        <span className="text-[10px] text-stone-500">Devolve 50%</span>
      </button>
      <div className="flex-1 min-w-[180px] bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 font-medium self-stretch flex items-center">
        <p>🛣️ As estradas partem da Câmara Municipal e têm de estar ligadas entre si. Só podes construir edifícios junto a uma estrada!</p>
      </div>
    </>
  );
};

const BuildMenu = ({ gameState, buildings, mode, placingId, onStartPlace, onStartRoad, onStartRoadRemove }) => {
  const [activeCategory, setActiveCategory] = useState('civil');
  const tip = useMemo(() => URBAN_TIPS[Math.floor(Math.random() * URBAN_TIPS.length)], []);

  const categoryBuildings = Object.keys(BUILDING_CONFIG).filter(
    (id) => BUILDING_CONFIG[id].category === activeCategory
  );

  return (
    <div className="bg-gradient-to-b from-stone-800 to-stone-900 rounded-2xl p-1 shadow-2xl border border-amber-700/50" data-testid="build-menu">
      <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-xl overflow-hidden">
        {/* Category tabs */}
        <div className="flex items-center border-b border-amber-200 bg-amber-100/60 px-2 pt-2 gap-1 overflow-x-auto">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-t-xl text-sm font-bold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-white text-amber-700 shadow-sm border border-b-0 border-amber-200'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-amber-50'
                }`}
                data-testid={`build-tab-${cat.id}`}
              >
                <Icon size={16} /> {cat.name}
              </button>
            );
          })}
          <div className="ml-auto hidden md:flex items-center gap-1.5 pb-1 pr-2 text-[11px] text-amber-700 font-semibold">
            <Lightbulb size={13} /> {tip}
          </div>
        </div>

        {/* Items */}
        <div className="flex items-stretch gap-2 p-3 overflow-x-auto bg-white">
          {activeCategory === 'roads' ? (
            <RoadCards gameState={gameState} mode={mode} onStartRoad={onStartRoad} onStartRoadRemove={onStartRoadRemove} />
          ) : (
            categoryBuildings.map((id) => (
              <BuildingCard
                key={id}
                id={id}
                gameState={gameState}
                buildings={buildings}
                placingId={mode === 'place' ? placingId : null}
                onStartPlace={onStartPlace}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildMenu;
