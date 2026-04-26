import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, Diamond, TreePine, Mountain, Pickaxe, Wheat, 
  Home, Shield, Sword, Clock, Check, Play, ChevronUp, X, Info, Gift, Sparkles,
  ZoomIn, ZoomOut, RotateCcw, Volume2
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Age of Empires 2 Style Color Palette
const COLORS = {
  // Terrain
  grassLight: '#8B9A5B',
  grassMedium: '#7A8B4A',
  grassDark: '#6B7C3B',
  dirt: '#C4A574',
  dirtDark: '#A89060',
  fieldCrop: '#D4C088',
  fieldLines: '#B8A468',
  pathLight: '#D4C4A8',
  pathDark: '#B8A888',
  
  // Buildings
  roofTerracotta: '#C45C3B',
  roofDark: '#A04A2F',
  roofHighlight: '#D87050',
  wallCream: '#E8DCC8',
  wallShade: '#D4C8B4',
  wallDark: '#C4B8A4',
  woodDark: '#5A4030',
  woodLight: '#8B6B4B',
  windowDark: '#3A3020',
  doorBrown: '#6B4B30',
  
  // Stone/Fortifications
  stoneLight: '#A8A090',
  stoneMedium: '#908878',
  stoneDark: '#787068',
  stoneVeryDark: '#605850',
  
  // Trees
  treeGreen: '#4A6B3A',
  treeDark: '#3A5A2A',
  treeLight: '#5A7B4A',
  trunkBrown: '#5A4030',
  
  // Water
  waterLight: '#6BA8C8',
  waterDark: '#4A88A8',
  
  // Shadows
  shadow: 'rgba(0,0,0,0.25)',
  shadowLight: 'rgba(0,0,0,0.15)'
};

// Building configurations
const BUILDING_CONFIG = {
  town_hall: { 
    name: 'Câmara Municipal', 
    icon: '🏛️',
    size: 'large',
    description: 'Centro administrativo. Aumenta capacidade de população.'
  },
  house: { 
    name: 'Casa', 
    icon: '🏠',
    size: 'medium',
    description: 'Residência para a população.'
  },
  school: { 
    name: 'Escola', 
    icon: '🏫',
    size: 'large',
    description: 'Aumenta o XP ganho em quizzes.'
  },
  library: { 
    name: 'Biblioteca', 
    icon: '📚',
    size: 'medium',
    description: 'Desbloqueia dicas nos quizzes.'
  },
  market: { 
    name: 'Mercado', 
    icon: '🏪',
    size: 'medium',
    produces: true,
    description: 'Produz moedas ao longo do tempo.'
  },
  farm: { 
    name: 'Quinta', 
    icon: '🌾',
    size: 'medium',
    produces: true,
    description: 'Produz comida para a população.'
  },
  lumber_mill: { 
    name: 'Serração', 
    icon: '🪵',
    size: 'medium',
    produces: true,
    description: 'Produz madeira para construção.'
  },
  quarry: { 
    name: 'Pedreira', 
    icon: '🪨',
    size: 'medium',
    produces: true,
    description: 'Extrai pedra para construção.'
  },
  mine: { 
    name: 'Mina', 
    icon: '⛏️',
    size: 'medium',
    produces: true,
    description: 'Extrai ferro para construções avançadas.'
  },
  barracks: { 
    name: 'Quartel', 
    icon: '⚔️',
    size: 'large',
    description: 'Treina soldados. Aumenta poder de ataque.'
  },
  wall: { 
    name: 'Muralha', 
    icon: '🏰',
    size: 'small',
    description: 'Proteção da cidade. Aumenta defesa.'
  },
  garden: { 
    name: 'Jardim', 
    icon: '🌳',
    size: 'medium',
    description: 'Produz diamantes bónus.'
  }
};

// Seasonal Packages
const SEASONAL_PACKAGES = {
  christmas: {
    id: 'christmas', name: 'Pacote de Natal', icon: '🎄',
    theme: 'from-red-500 via-green-600 to-red-500',
    items: [
      { type: 'diamonds', amount: 100, icon: '💎' },
      { type: 'skin', name: 'Neve nos Telhados', icon: '❄️' },
      { type: 'decoration', name: 'Árvore de Natal', icon: '🎄' }
    ],
    price: 4.99, discount: 30, endDate: '2026-12-31'
  },
  summer: {
    id: 'summer', name: 'Pacote de Verão', icon: '☀️',
    theme: 'from-yellow-400 via-orange-500 to-red-500',
    items: [
      { type: 'diamonds', amount: 150, icon: '💎' },
      { type: 'skin', name: 'Praia Tropical', icon: '🏖️' },
      { type: 'coins', amount: 500, icon: '🪙' }
    ],
    price: 6.99, discount: 40, endDate: '2026-08-31'
  }
};

// ==================== SVG BUILDING COMPONENTS (Age of Empires 2 Style) ====================

// Isometric House - Mediterranean style with terracotta roof
const IsometricHouse = ({ x, y, level, isSelected, onClick, isProducing }) => {
  const scale = 1;
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Shadow */}
      <ellipse cx="40" cy="85" rx="45" ry="20" fill={COLORS.shadow} />
      
      {isBuilt ? (
        <>
          {/* Base/Foundation */}
          <polygon points="40,70 80,50 80,45 40,65 0,45 0,50" fill={COLORS.stoneMedium} />
          <polygon points="0,45 40,65 40,70 0,50" fill={COLORS.stoneDark} />
          <polygon points="40,65 80,45 80,50 40,70" fill={COLORS.stoneLight} />
          
          {/* Left Wall */}
          <polygon points="0,45 40,25 40,65 0,45" fill={COLORS.wallShade} />
          <polygon points="0,45 0,20 40,0 40,25" fill={COLORS.wallCream} />
          
          {/* Right Wall */}
          <polygon points="40,25 80,45 80,20 40,0" fill={COLORS.wallDark} />
          <polygon points="40,25 40,65 80,45 80,20" fill={COLORS.wallShade} />
          
          {/* Window Left */}
          <rect x="12" y="22" width="10" height="14" fill={COLORS.windowDark} transform="skewY(-26.5)" />
          <rect x="12" y="21" width="10" height="2" fill={COLORS.woodDark} transform="skewY(-26.5)" />
          
          {/* Window Right */}
          <rect x="52" y="22" width="10" height="14" fill={COLORS.windowDark} transform="skewY(26.5)" />
          <rect x="52" y="21" width="10" height="2" fill={COLORS.woodDark} transform="skewY(26.5)" />
          
          {/* Door */}
          <polygon points="35,65 35,45 45,40 45,60" fill={COLORS.doorBrown} />
          
          {/* Roof - Terracotta tiles */}
          <polygon points="40,-15 -5,15 40,35 85,15" fill={COLORS.roofTerracotta} />
          <polygon points="40,-15 -5,15 -5,20 40,-10" fill={COLORS.roofDark} />
          <polygon points="40,-15 85,15 85,20 40,-10" fill={COLORS.roofHighlight} />
          
          {/* Roof tile lines */}
          {[0, 8, 16, 24].map((offset, i) => (
            <line key={i} x1={-3 + offset} y1={14 - offset * 0.5} x2={40} y2={-12 + offset * 0.4} 
              stroke={COLORS.roofDark} strokeWidth="1" opacity="0.4" />
          ))}
          
          {/* Chimney */}
          <rect x="55" y="-5" width="8" height="15" fill={COLORS.stoneMedium} />
          <rect x="54" y="-7" width="10" height="3" fill={COLORS.stoneDark} />
          
          {/* Smoke if producing */}
          {isProducing && (
            <g className="animate-smoke">
              <circle cx="59" cy="-15" r="3" fill="rgba(200,200,200,0.6)" />
              <circle cx="61" cy="-22" r="2.5" fill="rgba(200,200,200,0.4)" />
              <circle cx="58" cy="-28" r="2" fill="rgba(200,200,200,0.2)" />
            </g>
          )}
          
          {/* Level badge */}
          <g transform="translate(70, -10)">
            <circle r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">
              {level}
            </text>
          </g>
        </>
      ) : (
        <>
          {/* Unbuilt placeholder */}
          <polygon points="0,45 40,25 80,45 40,65" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
          <text x="40" y="50" textAnchor="middle" fontSize="24">🏗️</text>
        </>
      )}
      
      {/* Selection highlight */}
      {isSelected && (
        <polygon points="0,45 40,25 80,45 40,65" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Isometric Town Hall - Large central building
const IsometricTownHall = ({ x, y, level, isSelected, onClick }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="60" cy="110" rx="70" ry="30" fill={COLORS.shadow} />
      
      {isBuilt ? (
        <>
          {/* Large base */}
          <polygon points="60,100 120,70 120,60 60,90 0,60 0,70" fill={COLORS.stoneMedium} />
          
          {/* Main structure - Left */}
          <polygon points="0,60 60,30 60,90 0,60" fill={COLORS.wallShade} />
          <polygon points="0,60 0,10 60,-20 60,30" fill={COLORS.wallCream} />
          
          {/* Main structure - Right */}
          <polygon points="60,30 120,60 120,10 60,-20" fill={COLORS.wallDark} />
          <polygon points="60,30 60,90 120,60 120,10" fill={COLORS.wallShade} />
          
          {/* Columns */}
          {[15, 35, 55].map((cx, i) => (
            <g key={i}>
              <rect x={cx - 3} y={20 + i * 3} width="6" height="40" fill={COLORS.wallCream} />
              <ellipse cx={cx} cy={20 + i * 3} rx="4" ry="2" fill={COLORS.wallShade} />
            </g>
          ))}
          
          {/* Large arched entrance */}
          <path d="M 50,90 L 50,60 Q 60,50 70,60 L 70,90 Z" fill={COLORS.windowDark} />
          
          {/* Roof */}
          <polygon points="60,-40 -10,10 60,40 130,10" fill={COLORS.roofTerracotta} />
          <polygon points="60,-40 -10,10 -10,15 60,-35" fill={COLORS.roofDark} />
          <polygon points="60,-40 130,10 130,15 60,-35" fill={COLORS.roofHighlight} />
          
          {/* Tower */}
          <rect x="50" y="-70" width="20" height="35" fill={COLORS.wallCream} />
          <polygon points="50,-70 60,-85 70,-70" fill={COLORS.roofTerracotta} />
          <rect x="55" y="-60" width="10" height="15" fill={COLORS.windowDark} />
          
          {/* Flag */}
          <line x1="60" y1="-85" x2="60" y2="-100" stroke={COLORS.woodDark} strokeWidth="2" />
          <polygon points="60,-100 80,-95 60,-90" fill="#dc2626" className="animate-flag" />
          
          {/* Level */}
          <g transform="translate(110, -30)">
            <circle r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
        </>
      ) : (
        <>
          <polygon points="0,60 60,30 120,60 60,90" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
          <text x="60" y="65" textAnchor="middle" fontSize="30">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,60 60,30 120,60 60,90" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Isometric Farm with crop fields
const IsometricFarm = ({ x, y, level, isSelected, onClick, isProducing }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="50" cy="75" rx="55" ry="25" fill={COLORS.shadow} />
      
      {isBuilt ? (
        <>
          {/* Crop field with diagonal lines */}
          <polygon points="0,50 50,25 100,50 50,75" fill={COLORS.fieldCrop} />
          {/* Crop rows */}
          {[0, 10, 20, 30, 40].map((offset, i) => (
            <line key={i} x1={5 + offset * 1.5} y1={48 - offset * 0.5} 
              x2={55 + offset * 0.5} y2={28 + offset * 0.5}
              stroke={COLORS.fieldLines} strokeWidth="2" />
          ))}
          
          {/* Small farmhouse */}
          <g transform="translate(60, 20)">
            <polygon points="0,30 20,20 20,0 0,10" fill={COLORS.wallCream} />
            <polygon points="20,20 40,30 40,10 20,0" fill={COLORS.wallShade} />
            <polygon points="20,-10 0,10 20,20 40,10" fill={COLORS.roofTerracotta} />
            <rect x="8" y="15" width="8" height="12" fill={COLORS.doorBrown} transform="skewY(-26.5)" />
          </g>
          
          {/* Windmill */}
          <g transform="translate(15, 0)">
            <rect x="5" y="15" width="10" height="25" fill={COLORS.wallCream} />
            {/* Windmill blades */}
            <g className={isProducing ? "animate-spin-slow" : ""} style={{ transformOrigin: '10px 10px' }}>
              <rect x="8" y="-15" width="4" height="25" fill={COLORS.woodLight} />
              <rect x="-15" y="8" width="25" height="4" fill={COLORS.woodLight} />
            </g>
          </g>
          
          {/* Level */}
          <g transform="translate(90, 10)">
            <circle r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
          
          {isProducing && (
            <g transform="translate(50, 80)">
              <rect x="-20" y="-8" width="40" height="14" rx="7" fill="#22c55e" />
              <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Colheita</text>
            </g>
          )}
        </>
      ) : (
        <>
          <polygon points="0,50 50,25 100,50 50,75" fill="none" stroke={COLORS.fieldLines} 
            strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
          <text x="50" y="55" textAnchor="middle" fontSize="24">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,50 50,25 100,50 50,75" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Stone Wall Section
const IsometricWall = ({ x, y, level, isSelected, onClick }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {isBuilt ? (
        <>
          {/* Wall base */}
          <polygon points="0,40 30,25 30,0 0,15" fill={COLORS.stoneDark} />
          <polygon points="30,25 60,40 60,15 30,0" fill={COLORS.stoneLight} />
          <polygon points="0,15 30,0 60,15 30,30" fill={COLORS.stoneMedium} />
          
          {/* Crenellations (ameias) */}
          <rect x="5" y="-8" width="6" height="10" fill={COLORS.stoneMedium} />
          <rect x="17" y="-8" width="6" height="10" fill={COLORS.stoneMedium} />
          <rect x="37" y="-8" width="6" height="10" fill={COLORS.stoneLight} />
          <rect x="49" y="-8" width="6" height="10" fill={COLORS.stoneLight} />
          
          {/* Stone texture lines */}
          <line x1="5" y1="30" x2="25" y2="20" stroke={COLORS.stoneVeryDark} strokeWidth="1" opacity="0.3" />
          <line x1="35" y1="20" x2="55" y2="30" stroke={COLORS.stoneVeryDark} strokeWidth="1" opacity="0.3" />
          
          {/* Level */}
          <g transform="translate(50, -15)">
            <circle r="8" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
        </>
      ) : (
        <>
          <polygon points="0,40 30,25 60,40 30,55" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="4,4" opacity="0.5" />
          <text x="30" y="45" textAnchor="middle" fontSize="20">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,40 30,25 60,40 30,55" fill="none" stroke="#fbbf24" strokeWidth="2" />
      )}
    </g>
  );
};

// Barracks - Military building
const IsometricBarracks = ({ x, y, level, isSelected, onClick }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="55" cy="95" rx="60" ry="25" fill={COLORS.shadow} />
      
      {isBuilt ? (
        <>
          {/* Base */}
          <polygon points="55,85 110,55 110,45 55,75 0,45 0,55" fill={COLORS.stoneDark} />
          
          {/* Main building */}
          <polygon points="0,45 55,15 55,75 0,45" fill={COLORS.wallShade} />
          <polygon points="0,45 0,-5 55,-35 55,15" fill={COLORS.stoneMedium} />
          <polygon points="55,15 110,45 110,-5 55,-35" fill={COLORS.stoneLight} />
          
          {/* Tower left */}
          <rect x="5" y="-25" width="20" height="40" fill={COLORS.stoneMedium} />
          <polygon points="5,-25 15,-40 25,-25" fill={COLORS.stoneDark} />
          
          {/* Tower right */}
          <rect x="85" y="-25" width="20" height="40" fill={COLORS.stoneLight} />
          <polygon points="85,-25 95,-40 105,-25" fill={COLORS.stoneMedium} />
          
          {/* Gate */}
          <path d="M 45,75 L 45,40 Q 55,30 65,40 L 65,75 Z" fill={COLORS.windowDark} />
          <rect x="53" y="35" width="4" height="40" fill={COLORS.woodDark} />
          
          {/* Red banners */}
          <rect x="10" y="-20" width="3" height="20" fill="#dc2626" />
          <rect x="97" y="-20" width="3" height="20" fill="#dc2626" />
          
          {/* Level */}
          <g transform="translate(100, -35)">
            <circle r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
        </>
      ) : (
        <>
          <polygon points="0,45 55,15 110,45 55,75" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
          <text x="55" y="50" textAnchor="middle" fontSize="28">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,45 55,15 110,45 55,75" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Generic Medium Building (Library, Market, etc.)
const IsometricMediumBuilding = ({ x, y, level, isSelected, onClick, isProducing, roofColor = COLORS.roofTerracotta }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="35" cy="70" rx="40" ry="18" fill={COLORS.shadow} />
      
      {isBuilt ? (
        <>
          {/* Walls */}
          <polygon points="0,40 35,20 35,60 0,40" fill={COLORS.wallShade} />
          <polygon points="0,40 0,10 35,-10 35,20" fill={COLORS.wallCream} />
          <polygon points="35,20 70,40 70,10 35,-10" fill={COLORS.wallDark} />
          <polygon points="35,20 35,60 70,40 70,10" fill={COLORS.wallShade} />
          
          {/* Window */}
          <rect x="10" y="18" width="8" height="12" fill={COLORS.windowDark} transform="skewY(-26.5)" />
          <rect x="47" y="18" width="8" height="12" fill={COLORS.windowDark} transform="skewY(26.5)" />
          
          {/* Door */}
          <polygon points="30,60 30,42 40,37 40,55" fill={COLORS.doorBrown} />
          
          {/* Roof */}
          <polygon points="35,-25 -5,10 35,30 75,10" fill={roofColor} />
          <polygon points="35,-25 -5,10 -5,15 35,-20" fill={COLORS.roofDark} />
          
          {/* Level */}
          <g transform="translate(60, -15)">
            <circle r="9" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
          
          {isProducing && (
            <g transform="translate(35, 72)">
              <rect x="-18" y="-7" width="36" height="12" rx="6" fill="#22c55e" className="animate-pulse" />
              <text x="0" y="3" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">Produzindo</text>
            </g>
          )}
        </>
      ) : (
        <>
          <polygon points="0,40 35,20 70,40 35,60" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
          <text x="35" y="45" textAnchor="middle" fontSize="22">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,40 35,20 70,40 35,60" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Cypress Tree (typical Mediterranean)
const CypressTree = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="8" cy="50" rx="8" ry="4" fill={COLORS.shadow} />
    <rect x="5" y="35" width="6" height="18" fill={COLORS.trunkBrown} />
    <ellipse cx="8" cy="20" rx="8" ry="25" fill={COLORS.treeDark} />
    <ellipse cx="6" cy="15" rx="5" ry="18" fill={COLORS.treeGreen} />
    <ellipse cx="10" cy="10" rx="4" ry="15" fill={COLORS.treeLight} />
  </g>
);

// Deciduous Tree
const DeciduousTree = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="15" cy="55" rx="15" ry="7" fill={COLORS.shadow} />
    <rect x="12" y="35" width="6" height="22" fill={COLORS.trunkBrown} />
    <circle cx="15" cy="20" r="20" fill={COLORS.treeDark} />
    <circle cx="8" cy="15" r="12" fill={COLORS.treeGreen} />
    <circle cx="22" cy="18" r="10" fill={COLORS.treeGreen} />
    <circle cx="15" cy="8" r="8" fill={COLORS.treeLight} />
  </g>
);

// ==================== TERRAIN COMPONENTS ====================

const Terrain = () => (
  <g>
    {/* Base grass with variations */}
    <rect x="0" y="0" width="1000" height="600" fill={COLORS.grassMedium} />
    
    {/* Grass patches for texture */}
    {[...Array(80)].map((_, i) => (
      <ellipse 
        key={i}
        cx={Math.random() * 1000}
        cy={Math.random() * 600}
        rx={Math.random() * 40 + 15}
        ry={Math.random() * 20 + 8}
        fill={i % 3 === 0 ? COLORS.grassLight : i % 3 === 1 ? COLORS.grassDark : COLORS.grassMedium}
        opacity={0.4 + Math.random() * 0.3}
      />
    ))}
    
    {/* Main paths */}
    <path 
      d="M 500 0 L 500 250 L 200 250 L 200 450 L 500 450 L 500 600 M 500 250 L 800 250 L 800 450 L 500 450"
      fill="none" stroke={COLORS.pathLight} strokeWidth="35" strokeLinecap="round" strokeLinejoin="round"
    />
    <path 
      d="M 500 0 L 500 250 L 200 250 L 200 450 L 500 450 L 500 600 M 500 250 L 800 250 L 800 450 L 500 450"
      fill="none" stroke={COLORS.pathDark} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"
    />
    
    {/* Dirt patches near buildings */}
    {[[150, 150], [350, 350], [650, 350], [500, 500]].map(([cx, cy], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={50} ry={30} fill={COLORS.dirt} opacity="0.5" />
    ))}
  </g>
);

// Massive stone walls surrounding the city
const CityWalls = ({ wallLevel }) => {
  const opacity = wallLevel > 0 ? 1 : 0.4;
  
  return (
    <g opacity={opacity}>
      {/* Top wall with main gate */}
      <rect x="100" y="40" width="350" height="25" fill={COLORS.stoneMedium} />
      <rect x="550" y="40" width="350" height="25" fill={COLORS.stoneMedium} />
      
      {/* Crenellations top */}
      {[...Array(15)].map((_, i) => (
        <rect key={`top-left-${i}`} x={105 + i * 22} y="30" width="12" height="15" fill={COLORS.stoneLight} />
      ))}
      {[...Array(15)].map((_, i) => (
        <rect key={`top-right-${i}`} x={555 + i * 22} y="30" width="12" height="15" fill={COLORS.stoneLight} />
      ))}
      
      {/* Main Gate */}
      <rect x="450" y="20" width="100" height="60" fill={COLORS.stoneDark} />
      <path d="M 455,80 L 455,35 Q 500,10 545,35 L 545,80 Z" fill={COLORS.windowDark} />
      <rect x="495" y="30" width="10" height="50" fill={COLORS.woodDark} />
      
      {/* Gate towers */}
      <rect x="430" y="10" width="25" height="70" fill={COLORS.stoneMedium} />
      <polygon points="430,10 442,-10 455,10" fill={COLORS.roofTerracotta} />
      <rect x="545" y="10" width="25" height="70" fill={COLORS.stoneMedium} />
      <polygon points="545,10 558,-10 570,10" fill={COLORS.roofTerracotta} />
      
      {/* Side walls */}
      <rect x="80" y="40" width="25" height="520" fill={COLORS.stoneDark} />
      <rect x="895" y="40" width="25" height="520" fill={COLORS.stoneLight} />
      
      {/* Corner towers */}
      {[[80, 40], [895, 40], [80, 520], [895, 520]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${tx}, ${ty})`}>
          <rect x="-5" y="-15" width="35" height="55" fill={COLORS.stoneMedium} />
          <polygon points="0,-15 12,-35 25,-15" fill={COLORS.roofTerracotta} />
          {/* Flag */}
          <line x1="12" y1="-35" x2="12" y2="-55" stroke={COLORS.woodDark} strokeWidth="2" />
          <polygon points="12,-55 28,-50 12,-45" fill={i < 2 ? '#dc2626' : '#3b82f6'} />
        </g>
      ))}
      
      {/* Wall level indicator */}
      {wallLevel > 0 && (
        <g transform="translate(500, 5)">
          <rect x="-25" y="-12" width="50" height="20" rx="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">
            Nv.{wallLevel}
          </text>
        </g>
      )}
    </g>
  );
};

// ==================== RESOURCE BAR ====================

const ResourceBar = ({ gameState }) => {
  const resources = gameState?.resources || { wood: 0, stone: 0, iron: 0, food: 0 };
  
  return (
    <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-xl p-0.5 shadow-2xl">
      <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-lg px-4 py-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {[
            { icon: <Coins size={16} />, value: gameState?.coins || 0, label: 'Ouro', bg: 'bg-yellow-500' },
            { icon: <Diamond size={16} />, value: gameState?.diamonds || 0, label: 'Gemas', bg: 'bg-purple-500' },
            { icon: <TreePine size={16} />, value: resources.wood, label: 'Madeira', bg: 'bg-amber-700' },
            { icon: <Mountain size={16} />, value: resources.stone, label: 'Pedra', bg: 'bg-slate-500' },
            { icon: <Pickaxe size={16} />, value: resources.iron, label: 'Ferro', bg: 'bg-zinc-600' },
            { icon: <Wheat size={16} />, value: resources.food, label: 'Comida', bg: 'bg-lime-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-white/80 rounded-lg px-2 py-1">
              <div className={`${item.bg} text-white p-1 rounded`}>{item.icon}</div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 leading-none">{item.label}</p>
                <p className="font-bold text-slate-800 text-sm leading-tight">{item.value}</p>
              </div>
            </div>
          ))}
          
          <div className="h-8 w-px bg-amber-300 mx-2" />
          
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1"><Home size={14} className="text-blue-600" />{gameState?.population || 10}/{gameState?.max_population || 20}</span>
            <span className="flex items-center gap-1"><Shield size={14} className="text-green-600" />{gameState?.defense_power || 5}</span>
            <span className="flex items-center gap-1"><Sword size={14} className="text-red-600" />{gameState?.attack_power || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== BUILDING PANEL ====================

const BuildingPanel = ({ building, buildingInfo, gameState, onClose, onUpgrade, onStartProduction, onCollect, loading }) => {
  if (!building) return null;
  
  const config = BUILDING_CONFIG[building.id] || {};
  const info = buildingInfo?.[building.id] || {};
  const level = building.level || 0;
  const isBuilt = level > 0;
  const maxLevel = info.max_level || 5;
  
  const nextLevelCost = info.base_cost ? {
    coins: Math.floor(info.base_cost.coins * (level + 1) * 1.2),
    wood: Math.floor(info.base_cost.wood * (level + 1)),
    stone: Math.floor(info.base_cost.stone * (level + 1)),
    iron: Math.floor(info.base_cost.iron * (level + 1))
  } : { coins: 50 * (level + 1), wood: 20 * (level + 1), stone: 10 * (level + 1), iron: 5 * (level + 1) };
  
  const canAfford = gameState && 
    gameState.coins >= nextLevelCost.coins &&
    (gameState.resources?.wood || 0) >= nextLevelCost.wood &&
    (gameState.resources?.stone || 0) >= nextLevelCost.stone &&
    (gameState.resources?.iron || 0) >= nextLevelCost.iron;
  
  const isProducing = building.producing;
  const productionTimer = gameState?.production_timers?.[building.id];
  const productionReady = productionTimer && new Date(productionTimer) <= new Date();
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-amber-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-4 border-amber-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{config.icon}</span>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>{config.name}</h2>
                <p className="text-amber-200 text-sm">Nível {level}/{maxLevel}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={20} /></button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <p className="text-slate-600 bg-white rounded-lg p-3 text-sm">{config.description}</p>
          
          {/* Level bar */}
          <div className="h-3 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600" style={{ width: `${(level / maxLevel) * 100}%` }} />
          </div>
          
          {/* Production */}
          {info.produces && isBuilt && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">Produção</h3>
              {!isProducing && !productionReady && (
                <button onClick={() => onStartProduction(building.id)} disabled={loading}
                  className="w-full py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2">
                  <Play size={16} /> Iniciar
                </button>
              )}
              {productionReady && (
                <button onClick={() => onCollect(building.id)} disabled={loading}
                  className="w-full py-2 bg-green-500 text-white font-bold rounded-lg animate-pulse flex items-center justify-center gap-2">
                  <Check size={16} /> Recolher!
                </button>
              )}
              {isProducing && !productionReady && (
                <div className="text-center py-2 text-blue-600"><Clock className="inline animate-spin mr-2" size={16} />A produzir...</div>
              )}
            </div>
          )}
          
          {/* Upgrade */}
          {level < maxLevel && (
            <div className="bg-amber-100 rounded-lg p-3 border border-amber-300">
              <h3 className="font-bold text-amber-800 mb-2">{isBuilt ? `Melhorar para Nv.${level + 1}` : 'Construir'}</h3>
              <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                {[
                  { icon: <Coins size={14} />, val: nextLevelCost.coins, have: gameState?.coins || 0 },
                  { icon: <TreePine size={14} />, val: nextLevelCost.wood, have: gameState?.resources?.wood || 0 },
                  { icon: <Mountain size={14} />, val: nextLevelCost.stone, have: gameState?.resources?.stone || 0 },
                  { icon: <Pickaxe size={14} />, val: nextLevelCost.iron, have: gameState?.resources?.iron || 0 },
                ].map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 p-1.5 rounded ${r.have >= r.val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.icon} {r.val}
                  </div>
                ))}
              </div>
              <button onClick={() => onUpgrade(building.id, nextLevelCost.coins)} disabled={!canAfford || loading}
                className={`w-full py-2.5 font-bold rounded-lg flex items-center justify-center gap-2 ${canAfford ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}>
                <ChevronUp size={16} /> {isBuilt ? 'Melhorar' : 'Construir'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==================== SEASONAL PACKAGES ====================

const SeasonalPackagesPanel = ({ onClose, onPurchase }) => {
  const activePackages = Object.values(SEASONAL_PACKAGES).filter(p => new Date(p.endDate) > new Date());
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Gift size={24} /> Pacotes Sazonais</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={20} /></button>
          </div>
        </div>
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {activePackages.map(pack => (
            <div key={pack.id} className={`bg-gradient-to-r ${pack.theme} p-0.5 rounded-xl`}>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{pack.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold">{pack.name}</h3>
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">-{pack.discount}%</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-2">
                  {pack.items.map((item, i) => (
                    <span key={i} className="text-xs bg-slate-100 rounded px-2 py-1">{item.icon} {item.amount || item.name}</span>
                  ))}
                </div>
                <button onClick={() => onPurchase(pack)} className={`w-full py-2 bg-gradient-to-r ${pack.theme} text-white font-bold rounded-lg`}>
                  €{pack.price}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================

const IsometricCity = ({ gameState, onRefresh }) => {
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingInfo, setBuildingInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPackages, setShowPackages] = useState(false);
  const [zoom, setZoom] = useState(1);
  
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
  
  const buildingsData = gameState?.buildings || {};
  const getLevel = (id) => {
    const b = buildingsData[id];
    return typeof b === 'object' ? b.level || 0 : b || 0;
  };
  const isProducing = (id) => buildingsData[id]?.producing || false;
  
  const handleUpgrade = async (buildingId, cost) => {
    setLoading(true);
    try {
      await axios.post(`${API}/game/upgrade-building`, null, { params: { building_id: buildingId, cost }, withCredentials: true });
      toast.success('Edifício melhorado!', { icon: '🏗️' });
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao melhorar');
    } finally { setLoading(false); }
  };
  
  const handleStartProduction = async (buildingId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/game/start-production`, null, { params: { building_id: buildingId }, withCredentials: true });
      toast.success('Produção iniciada!', { icon: '⚙️' });
      setSelectedBuilding(null);
      onRefresh?.();
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
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };
  
  const selectBuilding = (id) => {
    const b = buildingsData[id];
    setSelectedBuilding({ id, level: typeof b === 'object' ? b.level || 0 : b || 0, producing: b?.producing || false });
  };
  
  return (
    <div className="space-y-3">
      <ResourceBar gameState={gameState} />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 bg-white rounded-lg shadow hover:bg-slate-50"><ZoomIn size={18} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.6))} className="p-2 bg-white rounded-lg shadow hover:bg-slate-50"><ZoomOut size={18} /></button>
          <button onClick={() => setZoom(1)} className="p-2 bg-white rounded-lg shadow hover:bg-slate-50"><RotateCcw size={18} /></button>
        </div>
        <button onClick={() => setShowPackages(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition" data-testid="seasonal-packages-btn">
          <Gift size={18} /> Pacotes <span className="text-xs bg-white/20 px-2 rounded-full">Novo!</span>
        </button>
      </div>
      
      {/* Main game view */}
      <div className="bg-gradient-to-b from-sky-400 to-sky-200 rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-800" style={{ height: '520px' }}>
        <svg viewBox="0 0 1000 600" className="w-full h-full" style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.3s' }}>
          {/* Sky */}
          <defs>
            <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" />
              <stop offset="100%" stopColor="#B8E0F0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1000" height="80" fill="url(#sky)" />
          
          {/* Sun */}
          <circle cx="900" cy="50" r="35" fill="#FDE047" />
          <circle cx="900" cy="50" r="45" fill="none" stroke="#FDE047" strokeWidth="3" opacity="0.4" />
          
          {/* Clouds */}
          <g className="animate-cloud">
            <ellipse cx="150" cy="40" rx="50" ry="22" fill="white" opacity="0.9" />
            <ellipse cx="190" cy="35" rx="35" ry="18" fill="white" opacity="0.9" />
          </g>
          <g className="animate-cloud2">
            <ellipse cx="600" cy="30" rx="40" ry="18" fill="white" opacity="0.85" />
            <ellipse cx="640" cy="25" rx="30" ry="14" fill="white" opacity="0.85" />
          </g>
          
          {/* Terrain */}
          <g transform="translate(0, 60)">
            <Terrain />
            
            {/* City Walls */}
            <CityWalls wallLevel={getLevel('wall')} />
            
            {/* Trees decoration */}
            <CypressTree x={120} y={100} scale={0.8} />
            <CypressTree x={140} y={130} scale={0.7} />
            <CypressTree x={850} y={110} scale={0.85} />
            <DeciduousTree x={150} y={420} scale={0.9} />
            <DeciduousTree x={820} y={400} scale={0.85} />
            <CypressTree x={860} y={380} scale={0.75} />
            
            {/* Buildings */}
            <IsometricTownHall x={440} y={180} level={getLevel('town_hall')} isSelected={selectedBuilding?.id === 'town_hall'} onClick={() => selectBuilding('town_hall')} />
            
            <IsometricHouse x={250} y={130} level={getLevel('house')} isSelected={selectedBuilding?.id === 'house'} onClick={() => selectBuilding('house')} isProducing={isProducing('house')} />
            
            <IsometricMediumBuilding x={650} y={140} level={getLevel('school')} isSelected={selectedBuilding?.id === 'school'} onClick={() => selectBuilding('school')} roofColor="#3b82f6" />
            
            <IsometricMediumBuilding x={250} y={290} level={getLevel('library')} isSelected={selectedBuilding?.id === 'library'} onClick={() => selectBuilding('library')} roofColor="#8b5cf6" />
            
            <IsometricMediumBuilding x={650} y={290} level={getLevel('market')} isSelected={selectedBuilding?.id === 'market'} onClick={() => selectBuilding('market')} isProducing={isProducing('market')} roofColor="#f97316" />
            
            <IsometricFarm x={170} y={400} level={getLevel('farm')} isSelected={selectedBuilding?.id === 'farm'} onClick={() => selectBuilding('farm')} isProducing={isProducing('farm')} />
            
            <IsometricMediumBuilding x={750} y={140} level={getLevel('lumber_mill')} isSelected={selectedBuilding?.id === 'lumber_mill'} onClick={() => selectBuilding('lumber_mill')} isProducing={isProducing('lumber_mill')} roofColor="#92400e" />
            
            <IsometricMediumBuilding x={750} y={290} level={getLevel('quarry')} isSelected={selectedBuilding?.id === 'quarry'} onClick={() => selectBuilding('quarry')} isProducing={isProducing('quarry')} roofColor="#64748b" />
            
            <IsometricMediumBuilding x={750} y={420} level={getLevel('mine')} isSelected={selectedBuilding?.id === 'mine'} onClick={() => selectBuilding('mine')} isProducing={isProducing('mine')} roofColor="#3f3f46" />
            
            <IsometricBarracks x={420} y={380} level={getLevel('barracks')} isSelected={selectedBuilding?.id === 'barracks'} onClick={() => selectBuilding('barracks')} />
            
            <IsometricWall x={180} y={200} level={getLevel('wall')} isSelected={selectedBuilding?.id === 'wall'} onClick={() => selectBuilding('wall')} />
            
            <IsometricMediumBuilding x={350} y={440} level={getLevel('garden')} isSelected={selectedBuilding?.id === 'garden'} onClick={() => selectBuilding('garden')} roofColor="#22c55e" />
          </g>
        </svg>
        
        {/* City name */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-800 to-amber-700 rounded-xl px-6 py-2 shadow-xl border-2 border-amber-600">
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              🏰 Reino de {gameState?.city_name || 'Aventureiro'}
            </h2>
          </div>
        </div>
      </div>
      
      {selectedBuilding && (
        <BuildingPanel building={selectedBuilding} buildingInfo={buildingInfo} gameState={gameState} onClose={() => setSelectedBuilding(null)} onUpgrade={handleUpgrade} onStartProduction={handleStartProduction} onCollect={handleCollect} loading={loading} />
      )}
      
      {showPackages && <SeasonalPackagesPanel onClose={() => setShowPackages(false)} onPurchase={(p) => { toast.info(`Pacote ${p.name} adicionado!`); setShowPackages(false); }} />}
      
      <style>{`
        @keyframes cloud { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(40px); } }
        @keyframes cloud2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-30px); } }
        @keyframes smoke { 0%, 100% { opacity: 0.6; transform: translateY(0); } 50% { opacity: 0.2; transform: translateY(-8px); } }
        @keyframes flag { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.9); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-cloud { animation: cloud 20s ease-in-out infinite; }
        .animate-cloud2 { animation: cloud2 25s ease-in-out infinite; }
        .animate-smoke { animation: smoke 3s ease-in-out infinite; }
        .animate-flag { animation: flag 2s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 8s linear infinite; }
      `}</style>
    </div>
  );
};

export default IsometricCity;
