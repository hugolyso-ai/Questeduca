import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Volume2, VolumeX, Move, Maximize2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  SEASONAL_SKINS, URBAN_TIPS, worldSize, ASSETS,
  BUILDING_COSTS, ROAD_COST, getBuildingCost, canAfford,
} from './city/cityConfig';
import CityGrid from './city/CityGrid';
import BuildMenu from './city/BuildMenu';
import BuildingPanel from './city/BuildingPanel';
import ResourceBar from './city/ResourceBar';
import Snowfall from './city/Snowfall';
import SkinSelector from './city/SkinSelector';

const AMBIENT_SOUND_URL = 'https://cdn.pixabay.com/audio/2024/11/04/audio_aff31d7b67.mp3';
const GRID_SIZE = 14;

// Production rates per building type (replaces backend production logic)
const PRODUCTION_CONFIG = {
  farm:        { resource: 'food',     baseAmount: 5,  duration: 120 },
  lumber_mill: { resource: 'wood',     baseAmount: 5,  duration: 120 },
  quarry:      { resource: 'stone',    baseAmount: 5,  duration: 120 },
  mine:        { resource: 'iron',     baseAmount: 5,  duration: 120 },
  market:      { resource: 'coins',    baseAmount: 10, duration: 120 },
  garden:      { resource: 'diamonds', baseAmount: 1,  duration: 120 },
};

const MODE_INSTRUCTIONS = {
  place: '🏗️ Clica num terreno livre junto a uma estrada para construir',
  move: '↔️ Clica no novo terreno (livre e junto a uma estrada) para mover o edifício',
  road: '🛣️ Clica em terrenos ligados à rede para construir estradas (clica vários seguidos!)',
  'road-remove': '🧹 Clica numa estrada para a remover (50% devolvido)',
};

// Recompute derived stats from the buildings map (replaces backend stat calculation)
const computeStats = (buildings) => {
  let attack = 0;
  let defense = 0;
  let maxPop = 10; // base population
  Object.entries(buildings).forEach(([id, b]) => {
    if (b && b.placed && (b.level || 0) > 0) {
      if (id === 'town_hall') { defense += 5; maxPop += 10; }
      if (id === 'barracks') attack += 5 * b.level;
      if (id === 'wall') defense += 10 * b.level;
      if (id === 'house') maxPop += 10 * b.level;
    }
  });
  return { attack_power: attack, defense_power: defense, max_population: maxPop };
};

// Deduct a cost object from the game state, returning the fields to update
const applyCost = (gs, cost) => {
  const res = gs?.resources || {};
  return {
    coins: (gs?.coins || 0) - (cost.coins || 0),
    resources: {
      ...res,
      wood: (res.wood || 0) - (cost.wood || 0),
      stone: (res.stone || 0) - (cost.stone || 0),
      iron: (res.iron || 0) - (cost.iron || 0),
    },
  };
};

// Minimap based on the actual layout
const Minimap = ({ gridSize, roads, buildings, selectedId }) => {
  const placed = Object.entries(buildings).filter(([, b]) => b && typeof b === 'object' && (b.level || 0) > 0 && b.placed);
  const toPct = (x, y) => ({
    left: `${(((x - y) / (2 * gridSize)) + 0.5) * 100}%`,
    top: `${((x + y) / (2 * gridSize)) * 100}%`,
  });
  return (
    <div className="absolute bottom-4 left-4 w-40 h-28 bg-emerald-950/90 rounded-xl border-2 border-amber-600 overflow-hidden backdrop-blur-sm shadow-2xl" data-testid="city-minimap">
      <div className="absolute inset-1 rounded-lg">
        {roads.map(([x, y]) => (
          <div key={`r${x},${y}`} className="absolute w-1.5 h-1.5 rounded-sm bg-amber-700" style={{ ...toPct(x, y), transform: 'translate(-50%, -50%)' }} />
        ))}
        {placed.map(([id, b]) => (
          <div
            key={id}
            className={`absolute rounded-full ${selectedId === id ? 'bg-yellow-300 w-2.5 h-2.5 animate-pulse' : 'bg-green-400 w-2 h-2'}`}
            style={{ ...toPct(b.x, b.y), transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-white/70 font-medium">MINI-MAPA</div>
    </div>
  );
};

const IsometricCity = ({ gameState, onRefresh }) => {
  const { user } = useAuth();
  const [mode, setMode] = useState('view'); // view | place | move | road | road-remove
  const [placingId, setPlacingId] = useState(null);
  const [movingId, setMovingId] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(0.62);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [didDrag, setDidDrag] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSkin, setCurrentSkin] = useState(() => localStorage.getItem('questeduca_city_skin') || 'normal');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('questeduca_ambient_sound') === 'true');
  const audioRef = useRef(null);
  const mapRef = useRef(null);

  // Layout is derived from gameState (buildings/roads are jsonb columns on game_states)
  const buildings = useMemo(() => {
    const b = gameState?.buildings || {};
    if (!b.town_hall) {
      return { ...b, town_hall: { x: 6, y: 6, level: 1, placed: true, producing: false } };
    }
    return b;
  }, [gameState?.buildings]);

  const roads = useMemo(() => gameState?.roads || [], [gameState?.roads]);
  const gridSize = GRID_SIZE;

  const refreshAll = useCallback(() => {
    onRefresh?.();
  }, [onRefresh]);

  const cancelMode = useCallback(() => {
    setMode('view');
    setPlacingId(null);
    setMovingId(null);
  }, []);

  // ESC cancels any placement mode
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cancelMode(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelMode]);

  // ===== Ambient sound =====
  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('questeduca_ambient_sound', String(newState));
    if (newState) {
      if (audioRef.current) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {});
      }
      toast.success('Sons ambientais ativados!', { icon: '🔊' });
    } else {
      audioRef.current?.pause();
      toast.success('Sons ambientais desativados', { icon: '🔇' });
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (soundEnabled && audio) {
      audio.volume = 0.3;
      audio.play().catch(() => {});
    }
    return () => audio?.pause();
  }, [soundEnabled]);

  const handleSkinChange = (skinId) => {
    setCurrentSkin(skinId);
    localStorage.setItem('questeduca_city_skin', skinId);
  };
  const activeSkin = SEASONAL_SKINS[currentSkin] || SEASONAL_SKINS.normal;

  // ===== Layout helpers =====
  const roadSet = useMemo(() => new Set(roads.map(([x, y]) => `${x},${y}`)), [roads]);
  const occupiedSet = useMemo(() => {
    const s = new Set();
    Object.entries(buildings).forEach(([id, b]) => {
      if (b && typeof b === 'object' && (b.level || 0) > 0 && b.placed) {
        if (mode === 'move' && id === movingId) return; // moving building's own tile is free
        s.add(`${b.x},${b.y}`);
      }
    });
    return s;
  }, [buildings, mode, movingId]);

  const townHallPos = useMemo(() => {
    const th = buildings.town_hall;
    return th && th.placed ? [th.x, th.y] : [6, 6];
  }, [buildings]);

  const neighbors = (x, y) => [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
  const hasAdjRoad = useCallback((x, y) => neighbors(x, y).some(([nx, ny]) => roadSet.has(`${nx},${ny}`)), [roadSet]);

  const isTileValid = useCallback((x, y) => {
    const key = `${x},${y}`;
    const free = !roadSet.has(key) && !occupiedSet.has(key);
    if (mode === 'place' || mode === 'move') return free && hasAdjRoad(x, y);
    if (mode === 'road') {
      const adjTownHall = neighbors(x, y).some(([nx, ny]) => nx === townHallPos[0] && ny === townHallPos[1]);
      return free && (hasAdjRoad(x, y) || adjTownHall);
    }
    if (mode === 'road-remove') return roadSet.has(key);
    return false;
  }, [mode, roadSet, occupiedSet, hasAdjRoad, townHallPos]);

  // ===== Actions =====
  const showUrbanTip = () => {
    const tip = URBAN_TIPS[Math.floor(Math.random() * URBAN_TIPS.length)];
    setTimeout(() => toast(tip, { icon: '💡', duration: 5000 }), 800);
  };

  const handleTileClick = async (x, y) => {
    if (!isTileValid(x, y)) {
      if (mode === 'place' || mode === 'move') {
        toast.error('Terreno inválido — precisa de estar livre e junto a uma estrada!');
      } else if (mode === 'road') {
        toast.error('A estrada tem de ligar à rede existente ou à Câmara Municipal');
      }
      return;
    }
    if (!user) {
      toast.error('Precisas de estar autenticado!');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'place') {
        const cost = BUILDING_COSTS[placingId];
        if (!canAfford(gameState, cost)) {
          toast.error('Recursos insuficientes!');
          return;
        }
        const newBuildings = { ...buildings, [placingId]: { x, y, level: 1, placed: true, producing: false } };
        const costUpdate = applyCost(gameState, cost);
        const stats = computeStats(newBuildings);
        const updateData = { buildings: newBuildings, coins: costUpdate.coins, resources: costUpdate.resources, ...stats };
        if (stats.max_population < (gameState.population || 0)) {
          updateData.population = stats.max_population;
        }
        const { error } = await supabase.from('game_states').update(updateData).eq('user_id', user.id);
        if (error) throw error;
        toast.success('Edifício construído com sucesso!', { icon: '🏗️' });
        showUrbanTip();
        cancelMode();
      } else if (mode === 'move') {
        const newBuildings = { ...buildings, [movingId]: { ...buildings[movingId], x, y } };
        const { error } = await supabase.from('game_states').update({ buildings: newBuildings }).eq('user_id', user.id);
        if (error) throw error;
        toast.success('Edifício movido!', { icon: '↔️' });
        cancelMode();
      } else if (mode === 'road') {
        const cost = ROAD_COST;
        const res = gameState?.resources || {};
        if ((res.wood || 0) < cost.wood || (res.stone || 0) < cost.stone) {
          toast.error('Recursos insuficientes para construir estrada!');
          return;
        }
        const newRoads = [...roads, [x, y]];
        const newResources = {
          ...res,
          wood: (res.wood || 0) - cost.wood,
          stone: (res.stone || 0) - cost.stone,
        };
        const { error } = await supabase.from('game_states').update({ roads: newRoads, resources: newResources }).eq('user_id', user.id);
        if (error) throw error;
        // stay in road mode to chain road building
      } else if (mode === 'road-remove') {
        const newRoads = roads.filter(([rx, ry]) => rx !== x || ry !== y);
        const refund = {
          wood: Math.floor(ROAD_COST.wood * 0.5),
          stone: Math.floor(ROAD_COST.stone * 0.5),
        };
        const res = gameState?.resources || {};
        const newResources = {
          ...res,
          wood: (res.wood || 0) + refund.wood,
          stone: (res.stone || 0) + refund.stone,
        };
        const { error } = await supabase.from('game_states').update({ roads: newRoads, resources: newResources }).eq('user_id', user.id);
        if (error) throw error;
      }
      refreshAll();
    } catch (error) {
      toast.error(error.message || 'Erro na operação');
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlace = (buildingId) => {
    setSelectedBuilding(null);
    setPlacingId(buildingId);
    setMovingId(null);
    setMode('place');
  };

  const handleStartRoad = () => { setSelectedBuilding(null); setMode('road'); setPlacingId(null); setMovingId(null); };
  const handleStartRoadRemove = () => { setSelectedBuilding(null); setMode('road-remove'); setPlacingId(null); setMovingId(null); };

  const handleStartMove = (buildingId) => {
    setSelectedBuilding(null);
    setMovingId(buildingId);
    setPlacingId(null);
    setMode('move');
  };

  const handleDemolish = async (buildingId) => {
    if (!user) return;
    setLoading(true);
    try {
      const cost = BUILDING_COSTS[buildingId];
      const refund = {
        coins: Math.floor((cost?.coins || 0) * 0.5),
        wood: Math.floor((cost?.wood || 0) * 0.5),
        stone: Math.floor((cost?.stone || 0) * 0.5),
        iron: Math.floor((cost?.iron || 0) * 0.5),
      };
      const newBuildings = { ...buildings };
      delete newBuildings[buildingId];
      const res = gameState?.resources || {};
      const newResources = {
        ...res,
        wood: (res.wood || 0) + refund.wood,
        stone: (res.stone || 0) + refund.stone,
        iron: (res.iron || 0) + refund.iron,
      };
      const newCoins = (gameState?.coins || 0) + refund.coins;
      const stats = computeStats(newBuildings);
      const updateData = { buildings: newBuildings, coins: newCoins, resources: newResources, ...stats };
      if (stats.max_population < (gameState.population || 0)) {
        updateData.population = stats.max_population;
      }
      const { error } = await supabase.from('game_states').update(updateData).eq('user_id', user.id);
      if (error) throw error;
      toast.success(`Edifício demolido! Recuperaste ${refund.coins}🪙 ${refund.wood}🪵 ${refund.stone}🪨 ${refund.iron}⛏️`, { duration: 4000 });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.message || 'Erro ao demolir');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (buildingId) => {
    if (!user) return;
    const building = buildings[buildingId];
    if (!building) return;
    const cost = getBuildingCost(buildingId, building.level);
    if (!canAfford(gameState, cost)) {
      toast.error('Recursos insuficientes!');
      return;
    }
    setLoading(true);
    try {
      const newBuildings = { ...buildings, [buildingId]: { ...building, level: building.level + 1 } };
      const costUpdate = applyCost(gameState, cost);
      const stats = computeStats(newBuildings);
      const updateData = { buildings: newBuildings, coins: costUpdate.coins, resources: costUpdate.resources, ...stats };
      if (stats.max_population < (gameState.population || 0)) {
        updateData.population = stats.max_population;
      }
      const { error } = await supabase.from('game_states').update(updateData).eq('user_id', user.id);
      if (error) throw error;
      toast.success('Edifício evoluído com sucesso!', { icon: '⬆️' });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.message || 'Erro ao evoluir');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async (buildingId) => {
    if (!user) return;
    const prodConfig = PRODUCTION_CONFIG[buildingId];
    if (!prodConfig) {
      toast.error('Este edifício não produz recursos');
      return;
    }
    setLoading(true);
    try {
      const newBuildings = { ...buildings, [buildingId]: { ...buildings[buildingId], producing: true } };
      const newTimers = {
        ...(gameState?.production_timers || {}),
        [buildingId]: new Date(Date.now() + prodConfig.duration * 1000).toISOString(),
      };
      const { error } = await supabase
        .from('game_states')
        .update({ buildings: newBuildings, production_timers: newTimers })
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Produção iniciada!', { icon: '⚙️' });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const handleCollect = async (buildingId) => {
    if (!user) return;
    const prodConfig = PRODUCTION_CONFIG[buildingId];
    if (!prodConfig) return;
    setLoading(true);
    try {
      const building = buildings[buildingId];
      const amount = prodConfig.baseAmount * (building.level || 1);
      const resource = prodConfig.resource;
      const newBuildings = { ...buildings, [buildingId]: { ...building, producing: false } };
      const newTimers = { ...(gameState?.production_timers || {}) };
      delete newTimers[buildingId];

      const updateData = { buildings: newBuildings, production_timers: newTimers };
      if (resource === 'coins') {
        updateData.coins = (gameState?.coins || 0) + amount;
      } else if (resource === 'diamonds') {
        updateData.diamonds = (gameState?.diamonds || 0) + amount;
      } else {
        const res = gameState?.resources || {};
        updateData.resources = { ...res, [resource]: (res[resource] || 0) + amount };
      }
      const { error } = await supabase.from('game_states').update(updateData).eq('user_id', user.id);
      if (error) throw error;
      toast.success(`+${amount} ${resource}!`, { icon: '📦' });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.message || 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const selectBuilding = (id) => {
    if (mode !== 'view') return;
    const b = buildings[id];
    if (!b) return;
    setSelectedBuilding({ id, level: b.level || 0, producing: b.producing || false });
  };

  // ===== Pan / drag =====
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDidDrag(false);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      if (Math.abs(newX - pan.x) > 3 || Math.abs(newY - pan.y) > 3) setDidDrag(true);
      const maxPan = 500;
      setPan({
        x: Math.max(-maxPan, Math.min(maxPan, newX)),
        y: Math.max(-maxPan, Math.min(maxPan, newY)),
      });
    }
  };
  const handleMouseUp = () => setIsDragging(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      mapRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const { width: worldW, height: worldH } = worldSize(gridSize);

  return (
    <div className="space-y-4">
      {/* Ambient audio element */}
      <audio ref={audioRef} src={AMBIENT_SOUND_URL} loop preload="none" />

      <ResourceBar gameState={gameState} />

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom((z) => Math.min(z + 0.15, 2))} className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-200" data-testid="zoom-in-btn">
            <ZoomIn size={22} className="text-gray-700" />
          </button>
          <button onClick={() => setZoom((z) => Math.max(z - 0.15, 0.35))} className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-200" data-testid="zoom-out-btn">
            <ZoomOut size={22} className="text-gray-700" />
          </button>
          <button onClick={() => { setZoom(0.62); setPan({ x: 0, y: 0 }); }} className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-200" data-testid="reset-view-btn">
            <RotateCcw size={22} className="text-gray-700" />
          </button>
          <button onClick={toggleFullscreen} className="p-3 bg-white rounded-xl shadow-lg hover:bg-gray-50 transition border border-gray-200" data-testid="fullscreen-btn">
            <Maximize2 size={22} className="text-gray-700" />
          </button>
          <button
            onClick={toggleSound}
            className={`p-3 rounded-xl shadow-lg transition border ${soundEnabled ? 'bg-green-100 border-green-300 hover:bg-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
            data-testid="sound-toggle-btn"
          >
            {soundEnabled ? <Volume2 size={22} className="text-green-700" /> : <VolumeX size={22} className="text-gray-700" />}
          </button>
          <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-600 font-semibold hidden md:flex items-center gap-2">
            <Move size={18} /> Arrastar para mover
          </div>
        </div>

        <div className="flex items-center gap-3">
          <SkinSelector currentSkin={currentSkin} onSkinChange={handleSkinChange} />
          <div className="px-6 py-3 bg-gradient-to-r from-amber-600 via-orange-500 to-red-500 text-white rounded-2xl font-black text-lg shadow-xl flex items-center gap-3">
            <span className="text-2xl">🏰</span>
            <span className="hidden sm:inline">Reino de</span> {gameState?.city_name || 'Aventureiro'}
          </div>
        </div>
      </div>

      {/* Main game map */}
      <div
        ref={mapRef}
        className={`relative rounded-3xl shadow-2xl overflow-hidden border-4 border-stone-700 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ height: isFullscreen ? '100vh' : '600px' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        data-testid="isometric-city-map"
      >
        {/* Backdrop terrain around grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${ASSETS.grassTexture})`,
            backgroundSize: '400px',
            filter: 'brightness(0.55) saturate(0.9)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,25,8,0.55) 100%)' }} />

        {/* Seasonal ambient overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 transition-all duration-700" style={{ backgroundColor: activeSkin.ambientColor }} />
        {activeSkin.snowfall && <Snowfall />}

        {/* World (grid + buildings) */}
        {gameState ? (
          <div
            className="absolute"
            style={{
              left: '50%', top: '50%',
              width: worldW, height: worldH,
              transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.25s ease-out, filter 0.5s ease',
              filter: activeSkin.terrainFilter !== 'none' ? activeSkin.terrainFilter : undefined,
            }}
          >
            <CityGrid
              gridSize={gridSize}
              roads={roads}
              buildings={buildings}
              selectedBuildingId={selectedBuilding?.id}
              mode={mode}
              ghostBuildingId={mode === 'place' ? placingId : mode === 'move' ? movingId : null}
              isTileValid={isTileValid}
              onTileClick={(x, y) => { if (!didDrag) handleTileClick(x, y); }}
              onBuildingClick={selectBuilding}
              skinBuildingFilter={activeSkin.buildingFilter}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-400 border-t-transparent" />
          </div>
        )}

        {/* Mode instruction banner */}
        {mode !== 'view' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 bg-amber-500/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-amber-300" data-testid="mode-banner">
            <span className="text-white font-bold text-sm">{MODE_INSTRUCTIONS[mode]}</span>
            <button onClick={cancelMode} className="p-1.5 bg-white/25 hover:bg-white/40 rounded-full transition" data-testid="cancel-mode-btn">
              <X size={16} className="text-white" />
            </button>
          </div>
        )}

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 150px rgba(0,0,0,0.4)' }} />

        <Minimap gridSize={gridSize} roads={roads} buildings={buildings} selectedId={selectedBuilding?.id} />

        <div className="absolute top-4 left-4 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-xl text-white text-sm font-bold">
          Zoom: {Math.round(zoom * 100)}%
        </div>
        <div className="absolute top-4 right-4 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-xl text-white text-sm font-bold flex items-center gap-2">
          <span>{activeSkin.icon}</span> {activeSkin.name}
        </div>
      </div>

      {/* AoE-style build menu */}
      <BuildMenu
        gameState={gameState}
        buildings={buildings}
        mode={mode}
        placingId={placingId}
        onStartPlace={handleStartPlace}
        onStartRoad={handleStartRoad}
        onStartRoadRemove={handleStartRoadRemove}
      />

      {/* Building detail panel */}
      {selectedBuilding && (
        <BuildingPanel
          building={selectedBuilding}
          gameState={gameState}
          onClose={() => setSelectedBuilding(null)}
          onUpgrade={handleUpgrade}
          onStartProduction={handleStartProduction}
          onCollect={handleCollect}
          onStartMove={handleStartMove}
          onDemolish={handleDemolish}
          loading={loading}
        />
      )}
    </div>
  );
};

export default IsometricCity;
