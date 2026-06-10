import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Volume2, VolumeX, Move, Maximize2, X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import {
  SEASONAL_SKINS, URBAN_TIPS, worldSize, ASSETS,
} from './city/cityConfig';
import CityGrid from './city/CityGrid';
import BuildMenu from './city/BuildMenu';
import BuildingPanel from './city/BuildingPanel';
import ResourceBar from './city/ResourceBar';
import Snowfall from './city/Snowfall';
import SkinSelector from './city/SkinSelector';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AMBIENT_SOUND_URL = 'https://cdn.pixabay.com/audio/2024/11/04/audio_aff31d7b67.mp3';

const MODE_INSTRUCTIONS = {
  place: '🏗️ Clica num terreno livre junto a uma estrada para construir',
  move: '↔️ Clica no novo terreno (livre e junto a uma estrada) para mover o edifício',
  road: '🛣️ Clica em terrenos ligados à rede para construir estradas (clica vários seguidos!)',
  'road-remove': '🧹 Clica numa estrada para a remover (50% devolvido)',
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
  const [layout, setLayout] = useState(null);
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

  const fetchLayout = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/game/city/layout`, { withCredentials: true });
      setLayout(res.data);
    } catch (error) {
      console.error('Erro ao carregar layout da cidade', error);
    }
  }, []);

  useEffect(() => { fetchLayout(); }, [fetchLayout]);

  const refreshAll = useCallback(() => {
    fetchLayout();
    onRefresh?.();
  }, [fetchLayout, onRefresh]);

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
  const buildings = useMemo(() => layout?.buildings || {}, [layout]);
  const roads = useMemo(() => layout?.roads || [], [layout]);
  const gridSize = layout?.grid_size || 14;

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
    setLoading(true);
    try {
      if (mode === 'place') {
        await axios.post(`${API}/game/city/build`, { building_id: placingId, x, y }, { withCredentials: true });
        toast.success('Edifício construído com sucesso!', { icon: '🏗️' });
        showUrbanTip();
        cancelMode();
      } else if (mode === 'move') {
        await axios.post(`${API}/game/city/move`, { building_id: movingId, x, y }, { withCredentials: true });
        toast.success('Edifício movido!', { icon: '↔️' });
        cancelMode();
      } else if (mode === 'road') {
        await axios.post(`${API}/game/city/road/build`, { x, y }, { withCredentials: true });
        // stay in road mode to chain road building
      } else if (mode === 'road-remove') {
        await axios.post(`${API}/game/city/road/remove`, { x, y }, { withCredentials: true });
      }
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro na operação');
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
    setLoading(true);
    try {
      const res = await axios.post(`${API}/game/city/demolish`, { building_id: buildingId }, { withCredentials: true });
      const r = res.data.refund;
      toast.success(`Edifício demolido! Recuperaste ${r.coins}🪙 ${r.wood}🪵 ${r.stone}🪨 ${r.iron}⛏️`, { duration: 4000 });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao demolir');
    } finally { setLoading(false); }
  };

  const handleUpgrade = async (buildingId, cost) => {
    setLoading(true);
    try {
      await axios.post(`${API}/game/upgrade`, null, { params: { building_id: buildingId, cost }, withCredentials: true });
      toast.success('Edifício evoluído com sucesso!', { icon: '⬆️' });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao evoluir');
    } finally { setLoading(false); }
  };

  const handleStartProduction = async (buildingId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/game/start-production`, null, { params: { building_id: buildingId }, withCredentials: true });
      toast.success('Produção iniciada!', { icon: '⚙️' });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };

  const handleCollect = async (buildingId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/game/collect-production`, null, { params: { building_id: buildingId }, withCredentials: true });
      toast.success(`+${res.data.amount} ${res.data.resource}!`, { icon: '📦' });
      setSelectedBuilding(null);
      refreshAll();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
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
        {layout ? (
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
