import React, { useState, useRef, useCallback } from 'react';
import {
  ASSETS, BUILDING_CONFIG, TILE_W, TILE_H, DIAMOND_CLIP, gridToScreen, worldSize,
} from './cityConfig';

// Single isometric terrain/road tile (purely visual)
const Tile = ({ x, y, gridSize, isRoad, showGrid, overlayColor }) => {
  const { left, top } = gridToScreen(x, y, gridSize);
  const variation = 0.92 + (((x * 7 + y * 13) % 6) * 0.025);
  const texture = isRoad ? ASSETS.roadTexture : ASSETS.grassTexture;

  return (
    <div
      style={{
        position: 'absolute', left, top, width: TILE_W, height: TILE_H,
        clipPath: DIAMOND_CLIP,
        background: showGrid ? 'rgba(255,255,255,0.35)' : (isRoad ? 'rgba(60,40,20,0.6)' : 'transparent'),
        zIndex: isRoad ? 2 : 1,
      }}
      data-testid={`city-tile-${x}-${y}`}
    >
      <div
        style={{
          position: 'absolute', inset: showGrid || isRoad ? 1 : 0,
          clipPath: DIAMOND_CLIP,
          backgroundImage: `url(${texture})`,
          backgroundSize: '300px',
          backgroundPosition: `${((x * 73 + y * 31) % 300) - 150}px ${((y * 97 + x * 17) % 300) - 150}px`,
          filter: `brightness(${isRoad ? 1 : variation})`,
        }}
      />
      {overlayColor && (
        <div style={{ position: 'absolute', inset: 0, clipPath: DIAMOND_CLIP, background: overlayColor }} />
      )}
    </div>
  );
};

// Pixel-perfect alpha hit-testing: cache a canvas per asset and sample the alpha
const alphaCtxCache = {};
const sampleSpriteAlpha = (id, imgEl, clientX, clientY) => {
  const rect = imgEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return 0;
  const relX = (clientX - rect.left) / rect.width;
  const relY = (clientY - rect.top) / rect.height;
  if (relX < 0 || relX > 1 || relY < 0 || relY > 1) return 0;
  try {
    let ctx = alphaCtxCache[id];
    if (!ctx) {
      if (!imgEl.complete || imgEl.naturalWidth === 0) return 255;
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth;
      canvas.height = imgEl.naturalHeight;
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(imgEl, 0, 0);
      alphaCtxCache[id] = ctx;
    }
    const px = ctx.getImageData(
      Math.min(Math.floor(relX * imgEl.naturalWidth), imgEl.naturalWidth - 1),
      Math.min(Math.floor(relY * imgEl.naturalHeight), imgEl.naturalHeight - 1),
      1, 1
    ).data;
    return px[3];
  } catch {
    return 255; // CORS or other failure: treat as opaque
  }
};

// Placed building sprite anchored to its tile
const BuildingSprite = ({ id, building, gridSize, isSelected, skinFilter, dimmed, interactive }) => {
  const config = BUILDING_CONFIG[id];
  const { left, top } = gridToScreen(building.x, building.y, gridSize);
  const cx = left + TILE_W / 2;
  const cy = top + TILE_H / 2;
  const width = TILE_W * 1.3 * (config?.scale || 1);

  const baseFilter = skinFilter && skinFilter !== 'none' ? skinFilter : '';
  const shadow = isSelected
    ? 'drop-shadow(0 0 20px rgba(251, 191, 36, 0.9)) drop-shadow(0 6px 14px rgba(0,0,0,0.5))'
    : 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))';

  return (
    <div
      className="absolute group cursor-pointer"
      style={{
        left: cx, top: cy,
        transform: 'translate(-50%, -80%)',
        width,
        zIndex: 100 + (building.x + building.y) * 2 + (isSelected ? 50 : 0),
        opacity: dimmed ? 0.45 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: interactive ? 'none' : 'auto',
      }}
      data-building-id={id}
      data-testid={`building-${id}`}
    >
      {/* Ground contact shadow to integrate with terrain */}
      <div
        className="absolute"
        style={{
          width: '70%', height: '18%', left: '15%', bottom: '2%',
          background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
        }}
      />
      <img
        src={ASSETS[id]}
        alt={config?.name}
        className={`relative w-full transition-transform duration-200 ${isSelected ? 'scale-110' : 'group-hover:scale-105'}`}
        style={{ filter: `${baseFilter} ${shadow}`.trim() }}
        draggable={false}
      />
      {/* Level badge */}
      <div
        className="absolute w-8 h-8 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-yellow-200"
        style={{ top: '8%', right: '-2%' }}
      >
        <span className="text-sm font-black text-amber-900">{building.level}</span>
      </div>
      {/* Production indicator */}
      {building.producing && (
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-white text-[10px] font-bold animate-pulse shadow-lg whitespace-nowrap">
          ⚡ A Produzir
        </div>
      )}
      {/* Hover tooltip */}
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" style={{ zIndex: 500 }}>
        <div className="px-3 py-1.5 bg-gray-900/95 text-white text-xs rounded-lg font-semibold whitespace-nowrap shadow-xl border border-gray-700">
          {config?.name} <span className="text-yellow-400">Nv.{building.level}</span>
        </div>
      </div>
    </div>
  );
};

// Ghost preview while placing/moving
const GhostBuilding = ({ buildingId, tile, gridSize, isValid }) => {
  const config = BUILDING_CONFIG[buildingId];
  const { left, top } = gridToScreen(tile.x, tile.y, gridSize);
  const width = TILE_W * 1.3 * (config?.scale || 1);
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: left + TILE_W / 2, top: top + TILE_H / 2,
        transform: 'translate(-50%, -80%)',
        width,
        zIndex: 400,
        opacity: 0.7,
      }}
    >
      <img
        src={ASSETS[buildingId]}
        alt="preview"
        className="w-full"
        style={{ filter: isValid ? 'drop-shadow(0 0 12px rgba(74,222,128,0.9))' : 'grayscale(0.8) drop-shadow(0 0 12px rgba(248,113,113,0.9))' }}
        draggable={false}
      />
    </div>
  );
};

const CityGrid = ({
  gridSize, roads, buildings, selectedBuildingId,
  mode, ghostBuildingId, isTileValid, onTileClick, onBuildingClick, skinBuildingFilter,
}) => {
  const [hoverTile, setHoverTile] = useState(null);
  const containerRef = useRef(null);
  const interactive = mode !== 'view';
  const roadSet = new Set(roads.map(([x, y]) => `${x},${y}`));
  const { width, height } = worldSize(gridSize);

  // Inverse isometric transform: client coords -> grid tile (accounts for CSS scale)
  const tileFromEvent = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const wx = ((e.clientX - rect.left) / rect.width) * width;
    const wy = ((e.clientY - rect.top) / rect.height) * height;
    const off = ((gridSize - 1) * TILE_W) / 2;
    const A = (wx - off - TILE_W / 2) / (TILE_W / 2); // = x - y
    const B = (wy - TILE_H / 2) / (TILE_H / 2);       // = x + y
    const x = Math.round((A + B) / 2);
    const y = Math.round((B - A) / 2);
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return null;
    return { x, y };
  }, [gridSize, width, height]);

  const handleMouseMove = (e) => {
    if (!interactive) return;
    setHoverTile(tileFromEvent(e));
  };

  const handleClick = (e) => {
    if (interactive) {
      const t = tileFromEvent(e);
      if (t) onTileClick(t.x, t.y);
      return;
    }
    // View mode: resolve which building was really clicked using pixel-alpha hit-testing
    // (transparent corners of overlapping PNG sprites must not steal clicks)
    const els = document.elementsFromPoint(e.clientX, e.clientY);
    const seen = new Set();
    for (const el of els) {
      const wrapper = el.closest?.('[data-building-id]');
      if (!wrapper) continue;
      const id = wrapper.dataset.buildingId;
      if (seen.has(id)) continue;
      seen.add(id);
      const img = wrapper.querySelector('img');
      if (img && sampleSpriteAlpha(id, img, e.clientX, e.clientY) > 30) {
        onBuildingClick(id);
        return;
      }
    }
  };

  const tiles = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      tiles.push([x, y]);
    }
  }

  const placedBuildings = Object.entries(buildings).filter(
    ([, b]) => b && typeof b === 'object' && (b.level || 0) > 0 && b.placed
  );

  const hoverValid = hoverTile ? isTileValid(hoverTile.x, hoverTile.y) : false;

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', width, height, cursor: interactive ? (hoverValid ? 'pointer' : 'not-allowed') : undefined }}
      onMouseLeave={() => setHoverTile(null)}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      data-testid="city-grid"
    >
      {tiles.map(([x, y]) => {
        const isHovered = interactive && hoverTile?.x === x && hoverTile?.y === y;
        return (
          <Tile
            key={`${x}-${y}`}
            x={x} y={y}
            gridSize={gridSize}
            isRoad={roadSet.has(`${x},${y}`)}
            showGrid={interactive}
            overlayColor={isHovered ? (hoverValid ? 'rgba(74, 222, 128, 0.55)' : 'rgba(248, 113, 113, 0.55)') : null}
          />
        );
      })}

      {placedBuildings.map(([id, b]) => (
        <BuildingSprite
          key={id}
          id={id}
          building={b}
          gridSize={gridSize}
          isSelected={selectedBuildingId === id}
          skinFilter={skinBuildingFilter}
          dimmed={mode === 'move' && ghostBuildingId === id}
          interactive={interactive}
        />
      ))}

      {/* Ghost preview for placement / move */}
      {(mode === 'place' || mode === 'move') && ghostBuildingId && hoverTile && (
        <GhostBuilding
          buildingId={ghostBuildingId}
          tile={hoverTile}
          gridSize={gridSize}
          isValid={hoverValid}
        />
      )}
    </div>
  );
};

export default CityGrid;
