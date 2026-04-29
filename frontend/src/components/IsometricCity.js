import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, Diamond, TreePine, Mountain, Pickaxe, Wheat, 
  Home, Shield, Sword, Clock, Check, Play, ChevronUp, X, Info, Gift, Sparkles,
  ZoomIn, ZoomOut, RotateCcw, Volume2, VolumeX
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ==================== COLOR PALETTE (Age of Empires 2 Style) ====================
const COLORS = {
  // Terrain
  grassLight: '#9AAF6B',
  grassMedium: '#8A9F5B',
  grassDark: '#7A8F4B',
  grassPatch: '#6B803C',
  dirt: '#C9B896',
  dirtDark: '#B8A785',
  dirtPath: '#D4C4A8',
  fieldGold: '#E8D878',
  fieldBrown: '#C9B878',
  water: '#4A90B8',
  waterLight: '#6AB0D8',
  
  // Buildings - Mediterranean
  roofTerracotta: '#C45C3B',
  roofDark: '#A04A2F',
  roofLight: '#D87050',
  roofBlue: '#4A6B8A',
  roofGreen: '#5A7B5A',
  wallCream: '#F0E6D2',
  wallShade: '#E0D6C2',
  wallDark: '#D0C6B2',
  wallStone: '#C8C0B0',
  woodDark: '#5A4030',
  woodMedium: '#7A5B40',
  woodLight: '#9A7B60',
  windowDark: '#2A2520',
  windowGlass: '#6A8AA0',
  doorBrown: '#6B4530',
  
  // Stone/Fortifications
  stoneLight: '#B8B0A0',
  stoneMedium: '#A8A090',
  stoneDark: '#989080',
  stoneVeryDark: '#787068',
  stoneMoss: '#7A8A6A',
  
  // Vegetation
  treeGreen: '#4A7B4A',
  treeDark: '#3A6B3A',
  treeLight: '#5A8B5A',
  bushGreen: '#5A6B4A',
  trunkBrown: '#5A4535',
  
  // Units
  unitRed: '#C43030',
  unitBlue: '#3050A0',
  unitSkin: '#E0C0A0',
  unitMetal: '#A0A0B0'
};

// ==================== SEASONAL SKINS ====================
const SEASONAL_SKINS = {
  default: {
    roofColor: COLORS.roofTerracotta,
    wallColor: COLORS.wallCream,
    decoration: null
  },
  christmas: {
    roofColor: '#FFFFFF', // Snow covered
    wallColor: COLORS.wallCream,
    snowOnRoof: true,
    decoration: 'snow',
    lights: true
  },
  summer: {
    roofColor: '#D4A048', // Golden summer
    wallColor: '#FFF8E8',
    decoration: 'flowers',
    palmTrees: true
  },
  carnival: {
    roofColor: '#FF6B9D',
    wallColor: '#FFF0F5',
    decoration: 'confetti',
    colorful: true
  }
};

// Building configurations
const BUILDING_CONFIG = {
  town_hall: { name: 'Câmara Municipal', icon: '🏛️', size: 'large', produces: false },
  house: { name: 'Casa', icon: '🏠', size: 'medium', produces: false },
  school: { name: 'Escola', icon: '🏫', size: 'large', produces: false },
  library: { name: 'Biblioteca', icon: '📚', size: 'medium', produces: false },
  market: { name: 'Mercado', icon: '🏪', size: 'medium', produces: true },
  farm: { name: 'Quinta', icon: '🌾', size: 'large', produces: true },
  lumber_mill: { name: 'Serração', icon: '🪵', size: 'medium', produces: true },
  quarry: { name: 'Pedreira', icon: '🪨', size: 'medium', produces: true },
  mine: { name: 'Mina', icon: '⛏️', size: 'medium', produces: true },
  barracks: { name: 'Quartel', icon: '⚔️', size: 'large', produces: false },
  wall: { name: 'Muralha', icon: '🏰', size: 'small', produces: false },
  garden: { name: 'Jardim', icon: '🌳', size: 'medium', produces: true }
};

// ==================== MILITARY UNITS ====================

const SoldierUnit = ({ x, y, type = 'guard', facing = 'right', animated = false }) => {
  const isRed = type === 'guard';
  const shieldColor = isRed ? COLORS.unitRed : COLORS.unitBlue;
  
  return (
    <g transform={`translate(${x}, ${y})`} className={animated ? 'animate-soldier' : ''}>
      {/* Shadow */}
      <ellipse cx="0" cy="12" rx="5" ry="2" fill="rgba(0,0,0,0.3)" />
      
      {/* Legs */}
      <rect x="-3" y="4" width="2" height="8" fill={COLORS.woodDark} />
      <rect x="1" y="4" width="2" height="8" fill={COLORS.woodDark} />
      
      {/* Body/Armor */}
      <rect x="-4" y="-4" width="8" height="10" fill={shieldColor} rx="1" />
      <rect x="-3" y="-3" width="6" height="8" fill={shieldColor} />
      
      {/* Head */}
      <circle cx="0" cy="-7" r="4" fill={COLORS.unitSkin} />
      
      {/* Helmet */}
      <path d="M -4,-8 Q 0,-14 4,-8" fill={COLORS.unitMetal} />
      <rect x="-4" y="-10" width="8" height="3" fill={COLORS.unitMetal} rx="1" />
      
      {/* Shield */}
      <ellipse cx={facing === 'right' ? 6 : -6} cy="0" rx="3" ry="5" fill={shieldColor} stroke={COLORS.woodDark} strokeWidth="0.5" />
      
      {/* Spear */}
      <line x1={facing === 'right' ? 3 : -3} y1="-15" x2={facing === 'right' ? 3 : -3} y2="8" stroke={COLORS.woodLight} strokeWidth="1.5" />
      <polygon points={`${facing === 'right' ? 3 : -3},-18 ${facing === 'right' ? 1 : -5},-15 ${facing === 'right' ? 5 : -1},-15`} fill={COLORS.unitMetal} />
    </g>
  );
};

const VillagerUnit = ({ x, y, working = false, tool = 'none' }) => (
  <g transform={`translate(${x}, ${y})`} className={working ? 'animate-work' : ''}>
    <ellipse cx="0" cy="10" rx="4" ry="1.5" fill="rgba(0,0,0,0.25)" />
    
    {/* Legs */}
    <rect x="-2" y="3" width="1.5" height="7" fill="#5A4030" />
    <rect x="0.5" y="3" width="1.5" height="7" fill="#5A4030" />
    
    {/* Body - simple tunic */}
    <polygon points="-3,-2 3,-2 4,5 -4,5" fill="#8B7355" />
    
    {/* Head */}
    <circle cx="0" cy="-5" r="3" fill={COLORS.unitSkin} />
    
    {/* Hair/Hat */}
    <ellipse cx="0" cy="-7" rx="3" ry="2" fill="#5A4030" />
    
    {/* Tool */}
    {tool === 'hoe' && (
      <g transform="rotate(-30, 4, -2)">
        <line x1="4" y1="-8" x2="4" y2="4" stroke={COLORS.woodLight} strokeWidth="1" />
        <rect x="2" y="-9" width="4" height="2" fill={COLORS.unitMetal} />
      </g>
    )}
    {tool === 'axe' && (
      <g transform="rotate(-45, 4, -2)">
        <line x1="5" y1="-6" x2="5" y2="2" stroke={COLORS.woodLight} strokeWidth="1" />
        <polygon points="3,-7 7,-7 5,-4" fill={COLORS.unitMetal} />
      </g>
    )}
  </g>
);

// ==================== DETAILED BUILDING COMPONENTS ====================

// Highly detailed Town Hall
const TownHallBuilding = ({ x, y, level, isSelected, onClick, skin = 'default' }) => {
  const isBuilt = level > 0;
  const skinData = SEASONAL_SKINS[skin] || SEASONAL_SKINS.default;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Large shadow */}
      <ellipse cx="70" cy="130" rx="85" ry="35" fill="rgba(0,0,0,0.25)" />
      
      {isBuilt ? (
        <>
          {/* Stone foundation/platform */}
          <polygon points="70,120 140,85 140,75 70,110 0,75 0,85" fill={COLORS.stoneDark} />
          <polygon points="0,75 70,110 70,120 0,85" fill={COLORS.stoneVeryDark} />
          <polygon points="70,110 140,75 140,85 70,120" fill={COLORS.stoneMedium} />
          
          {/* Main building - Left wall */}
          <polygon points="10,70 70,35 70,105 10,70" fill={COLORS.wallShade} />
          <polygon points="10,70 10,15 70,-20 70,35" fill={skinData.wallColor || COLORS.wallCream} />
          
          {/* Main building - Right wall */}
          <polygon points="70,35 130,70 130,15 70,-20" fill={COLORS.wallDark} />
          <polygon points="70,35 70,105 130,70 130,15" fill={COLORS.wallShade} />
          
          {/* Stone trim at base */}
          <polygon points="10,70 70,35 70,45 10,80" fill={COLORS.stoneMedium} />
          <polygon points="70,35 130,70 130,80 70,45" fill={COLORS.stoneLight} />
          
          {/* Decorative columns */}
          {[25, 45].map((cx, i) => (
            <g key={`col-l-${i}`}>
              <rect x={cx} y={30 + i * 5} width="6" height="35" fill={COLORS.wallCream} />
              <ellipse cx={cx + 3} cy={30 + i * 5} rx="4" ry="2" fill={COLORS.wallShade} />
              <ellipse cx={cx + 3} cy={65 + i * 5} rx="4" ry="2" fill={COLORS.stoneMedium} />
            </g>
          ))}
          {[95, 115].map((cx, i) => (
            <g key={`col-r-${i}`}>
              <rect x={cx} y={30 + i * 5} width="6" height="35" fill={COLORS.wallShade} />
              <ellipse cx={cx + 3} cy={30 + i * 5} rx="4" ry="2" fill={COLORS.wallDark} />
            </g>
          ))}
          
          {/* Large arched entrance */}
          <path d="M 55,105 L 55,60 Q 70,45 85,60 L 85,105 Z" fill={COLORS.windowDark} />
          <path d="M 58,105 L 58,62 Q 70,50 82,62 L 82,105 Z" fill="#1A1510" />
          {/* Door details */}
          <line x1="70" y1="50" x2="70" y2="105" stroke={COLORS.woodDark} strokeWidth="2" />
          <circle cx="62" cy="80" r="2" fill={COLORS.woodMedium} />
          <circle cx="78" cy="80" r="2" fill={COLORS.woodMedium} />
          
          {/* Windows on sides */}
          <rect x="20" y="25" width="12" height="18" fill={COLORS.windowDark} rx="2" transform="skewY(-26)" />
          <rect x="20" y="24" width="12" height="3" fill={COLORS.woodDark} transform="skewY(-26)" />
          
          <rect x="100" y="25" width="12" height="18" fill={COLORS.windowDark} rx="2" transform="skewY(26)" />
          <rect x="100" y="24" width="12" height="3" fill={COLORS.woodDark} transform="skewY(26)" />
          
          {/* Main roof */}
          <polygon points="70,-50 -5,15 70,55 145,15" fill={skinData.roofColor || COLORS.roofTerracotta} />
          <polygon points="70,-50 -5,15 -5,22 70,-43" fill={COLORS.roofDark} />
          <polygon points="70,-50 145,15 145,22 70,-43" fill={COLORS.roofLight} />
          
          {/* Roof tile lines */}
          {[0, 12, 24, 36, 48].map((offset, i) => (
            <line key={i} x1={-2 + offset * 1.2} y1={12 - offset * 0.4} x2={70} y2={-47 + offset * 0.2} 
              stroke={COLORS.roofDark} strokeWidth="1" opacity="0.3" />
          ))}
          
          {/* Snow on roof if Christmas skin */}
          {skinData.snowOnRoof && (
            <>
              <polygon points="70,-52 -3,16 70,54 143,16" fill="white" opacity="0.9" />
              <ellipse cx="30" cy="-5" rx="15" ry="8" fill="white" />
              <ellipse cx="110" cy="-5" rx="15" ry="8" fill="white" />
            </>
          )}
          
          {/* Central tower */}
          <rect x="55" y="-85" width="30" height="40" fill={COLORS.wallCream} />
          <rect x="53" y="-90" width="34" height="8" fill={COLORS.stoneMedium} />
          
          {/* Tower windows */}
          <rect x="62" y="-75" width="8" height="12" fill={COLORS.windowDark} rx="1" />
          <rect x="72" y="-75" width="8" height="12" fill={COLORS.windowDark} rx="1" />
          
          {/* Tower roof */}
          <polygon points="52,-90 70,-115 88,-90" fill={skinData.roofColor || COLORS.roofTerracotta} />
          <polygon points="52,-90 70,-115 70,-90" fill={COLORS.roofDark} />
          
          {/* Flag pole and flag */}
          <line x1="70" y1="-115" x2="70" y2="-140" stroke={COLORS.woodDark} strokeWidth="2" />
          <polygon points="70,-140 95,-132 70,-124" fill="#DC2626" className="animate-flag">
            {/* Flag details */}
            <animate attributeName="points" 
              values="70,-140 95,-132 70,-124;70,-140 92,-133 70,-124;70,-140 95,-132 70,-124" 
              dur="2s" repeatCount="indefinite" />
          </polygon>
          
          {/* Coat of arms on flag */}
          <circle cx="80" cy="-132" r="4" fill="#FDE047" />
          
          {/* Christmas lights if skin active */}
          {skinData.lights && (
            <g className="animate-lights">
              {[0, 20, 40, 60, 80, 100].map((offset, i) => (
                <circle key={i} cx={5 + offset * 1.3} cy={12 - offset * 0.3} r="2" 
                  fill={i % 3 === 0 ? '#FF0000' : i % 3 === 1 ? '#00FF00' : '#FFD700'} 
                  className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </g>
          )}
          
          {/* Level badge */}
          <g transform="translate(130, -40)">
            <circle r="14" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
          
          {/* Guards at entrance */}
          <SoldierUnit x={40} y={115} type="guard" facing="right" />
          <SoldierUnit x={100} y={115} type="guard" facing="left" />
        </>
      ) : (
        <>
          <polygon points="10,70 70,35 130,70 70,105" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="8,4" opacity="0.5" />
          <text x="70" y="75" textAnchor="middle" fontSize="36">🏗️</text>
          <text x="70" y="95" textAnchor="middle" fontSize="10" fill={COLORS.stoneDark}>Construir</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="10,70 70,35 130,70 70,105" fill="none" stroke="#fbbf24" strokeWidth="3" 
          strokeDasharray="none" className="animate-pulse" />
      )}
    </g>
  );
};

// Detailed House with villagers
const HouseBuilding = ({ x, y, level, isSelected, onClick, isProducing, skin = 'default' }) => {
  const isBuilt = level > 0;
  const skinData = SEASONAL_SKINS[skin] || SEASONAL_SKINS.default;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="45" cy="90" rx="50" ry="22" fill="rgba(0,0,0,0.2)" />
      
      {isBuilt ? (
        <>
          {/* Foundation */}
          <polygon points="45,80 90,55 90,48 45,73 0,48 0,55" fill={COLORS.stoneDark} />
          
          {/* Walls */}
          <polygon points="0,48 45,23 45,73 0,48" fill={COLORS.wallShade} />
          <polygon points="0,48 0,5 45,-20 45,23" fill={skinData.wallColor || COLORS.wallCream} />
          <polygon points="45,23 90,48 90,5 45,-20" fill={COLORS.wallDark} />
          <polygon points="45,23 45,73 90,48 90,5" fill={COLORS.wallShade} />
          
          {/* Timber frame details */}
          <line x1="0" y1="25" x2="45" y2="0" stroke={COLORS.woodDark} strokeWidth="2" />
          <line x1="45" y1="0" x2="90" y2="25" stroke={COLORS.woodDark} strokeWidth="2" />
          <line x1="22" y1="35" x2="22" y2="5" stroke={COLORS.woodDark} strokeWidth="1.5" />
          <line x1="68" y1="35" x2="68" y2="5" stroke={COLORS.woodDark} strokeWidth="1.5" />
          
          {/* Windows with shutters */}
          <rect x="12" y="18" width="14" height="18" fill={COLORS.windowDark} rx="1" transform="skewY(-26)" />
          <rect x="8" y="18" width="4" height="18" fill={COLORS.woodMedium} transform="skewY(-26)" />
          <rect x="26" y="18" width="4" height="18" fill={COLORS.woodMedium} transform="skewY(-26)" />
          
          <rect x="58" y="18" width="14" height="18" fill={COLORS.windowDark} rx="1" transform="skewY(26)" />
          <rect x="72" y="18" width="4" height="18" fill={COLORS.woodMedium} transform="skewY(26)" />
          
          {/* Door with frame */}
          <rect x="36" y="45" width="18" height="28" fill={COLORS.doorBrown} rx="1" />
          <rect x="34" y="43" width="22" height="4" fill={COLORS.woodDark} />
          <circle cx="50" cy="60" r="2" fill={COLORS.woodMedium} />
          
          {/* Roof */}
          <polygon points="45,-35 -8,15 45,45 98,15" fill={skinData.roofColor || COLORS.roofTerracotta} />
          <polygon points="45,-35 -8,15 -8,20 45,-30" fill={COLORS.roofDark} />
          <polygon points="45,-35 98,15 98,20 45,-30" fill={COLORS.roofLight} />
          
          {/* Roof tiles pattern */}
          {[0, 10, 20, 30].map((offset, i) => (
            <line key={i} x1={-5 + offset * 1.3} y1={13 - offset * 0.5} x2={45} y2={-32 + offset * 0.2}
              stroke={COLORS.roofDark} strokeWidth="0.8" opacity="0.4" />
          ))}
          
          {/* Snow on roof */}
          {skinData.snowOnRoof && (
            <polygon points="45,-37 -6,16 45,44 96,16" fill="white" opacity="0.85" />
          )}
          
          {/* Chimney */}
          <rect x="60" y="-20" width="10" height="20" fill={COLORS.stoneMedium} />
          <rect x="58" y="-23" width="14" height="5" fill={COLORS.stoneDark} />
          
          {/* Smoke */}
          <g className="animate-smoke">
            <circle cx="65" cy="-30" r="4" fill="rgba(180,180,180,0.6)" />
            <circle cx="68" cy="-40" r="3" fill="rgba(180,180,180,0.4)" />
            <circle cx="63" cy="-48" r="2.5" fill="rgba(180,180,180,0.2)" />
          </g>
          
          {/* Flower boxes under windows */}
          <rect x="10" y="38" width="16" height="4" fill={COLORS.woodDark} transform="skewY(-26)" />
          {[12, 16, 20].map((fx, i) => (
            <circle key={i} cx={fx} cy={36 - i} r="2" fill={i % 2 ? '#FF6B6B' : '#FFD93D'} transform="skewY(-26)" />
          ))}
          
          {/* Level badge */}
          <g transform="translate(80, -25)">
            <circle r="11" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
          
          {/* Villager outside */}
          {level >= 2 && <VillagerUnit x={-15} y={70} />}
        </>
      ) : (
        <>
          <polygon points="0,48 45,23 90,48 45,73" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="6,3" opacity="0.5" />
          <text x="45" y="55" textAnchor="middle" fontSize="28">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,48 45,23 90,48 45,73" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Detailed Farm with fields and workers
const FarmBuilding = ({ x, y, level, isSelected, onClick, isProducing, skin = 'default' }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="65" cy="95" rx="75" ry="32" fill="rgba(0,0,0,0.2)" />
      
      {isBuilt ? (
        <>
          {/* Large crop field */}
          <polygon points="0,70 65,35 130,70 65,105" fill={COLORS.fieldGold} />
          
          {/* Field rows with crops */}
          {[0, 12, 24, 36, 48, 60].map((offset, i) => (
            <g key={i}>
              <line x1={5 + offset * 1.5} y1={68 - offset * 0.45} x2={70 + offset * 0.5} y2={38 + offset * 0.35}
                stroke={COLORS.fieldBrown} strokeWidth="3" />
              {/* Wheat stalks */}
              {[0, 8, 16, 24, 32].map((wx, wi) => (
                <line key={wi} x1={8 + offset * 1.5 + wx} y1={65 - offset * 0.45 - wi * 0.3} 
                  x2={8 + offset * 1.5 + wx} y2={58 - offset * 0.45 - wi * 0.3}
                  stroke="#C9A828" strokeWidth="1" />
              ))}
            </g>
          ))}
          
          {/* Farmhouse */}
          <g transform="translate(85, 20)">
            <polygon points="0,45 25,30 25,0 0,15" fill={COLORS.wallCream} />
            <polygon points="25,30 50,45 50,15 25,0" fill={COLORS.wallShade} />
            
            {/* Farmhouse roof */}
            <polygon points="25,-15 -5,15 25,35 55,15" fill={COLORS.roofTerracotta} />
            
            {/* Door */}
            <rect x="8" y="25" width="10" height="18" fill={COLORS.doorBrown} transform="skewY(-26)" />
            
            {/* Window */}
            <rect x="32" y="18" width="8" height="10" fill={COLORS.windowDark} transform="skewY(26)" />
          </g>
          
          {/* Windmill */}
          <g transform="translate(15, 15)">
            {/* Tower */}
            <polygon points="10,50 20,50 18,10 12,10" fill={COLORS.wallCream} />
            <polygon points="12,10 18,10 16,0 14,0" fill={COLORS.stoneMedium} />
            
            {/* Windmill blades */}
            <g className={isProducing ? "animate-spin-slow" : ""} style={{ transformOrigin: '15px 5px' }}>
              <rect x="13" y="-25" width="4" height="30" fill={COLORS.woodLight} rx="1" />
              <rect x="-15" y="3" width="30" height="4" fill={COLORS.woodLight} rx="1" />
              {/* Blade cloth */}
              <polygon points="11,-25 9,-10 17,-10 19,-25" fill="#F5F5DC" opacity="0.8" />
              <polygon points="17,25 19,10 11,10 9,25" fill="#F5F5DC" opacity="0.8" />
              <polygon points="-15,1 0,-1 0,7 -15,9" fill="#F5F5DC" opacity="0.8" />
              <polygon points="30,1 45,-1 45,7 30,9" fill="#F5F5DC" opacity="0.8" />
            </g>
            
            {/* Door */}
            <rect x="11" y="35" width="8" height="15" fill={COLORS.doorBrown} rx="1" />
          </g>
          
          {/* Hay bales */}
          <ellipse cx="110" cy="60" rx="8" ry="5" fill="#D4B060" />
          <ellipse cx="118" cy="65" rx="7" ry="4" fill="#C4A050" />
          
          {/* Farmer working */}
          {isProducing && <VillagerUnit x={50} y={75} working={true} tool="hoe" />}
          {level >= 2 && <VillagerUnit x={80} y={85} tool="none" />}
          
          {/* Production indicator */}
          {isProducing && (
            <g transform="translate(65, 110)">
              <rect x="-25" y="-8" width="50" height="14" rx="7" fill="#22c55e" className="animate-pulse" />
              <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">Colheita</text>
            </g>
          )}
          
          {/* Level */}
          <g transform="translate(120, 15)">
            <circle r="11" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
        </>
      ) : (
        <>
          <polygon points="0,70 65,35 130,70 65,105" fill="none" stroke={COLORS.fieldBrown} 
            strokeWidth="2" strokeDasharray="8,4" opacity="0.5" />
          <text x="65" y="75" textAnchor="middle" fontSize="30">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,70 65,35 130,70 65,105" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Detailed Barracks with soldiers
const BarracksBuilding = ({ x, y, level, isSelected, onClick, skin = 'default' }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="65" cy="105" rx="75" ry="32" fill="rgba(0,0,0,0.25)" />
      
      {isBuilt ? (
        <>
          {/* Stone platform */}
          <polygon points="65,95 130,60 130,50 65,85 0,50 0,60" fill={COLORS.stoneDark} />
          
          {/* Main fortress walls */}
          <polygon points="0,50 65,15 65,85 0,50" fill={COLORS.stoneLight} />
          <polygon points="0,50 0,-5 65,-40 65,15" fill={COLORS.stoneMedium} />
          <polygon points="65,15 130,50 130,-5 65,-40" fill={COLORS.stoneDark} />
          <polygon points="65,15 65,85 130,50 130,-5" fill={COLORS.stoneLight} />
          
          {/* Arrow slits */}
          {[15, 35].map((sy, i) => (
            <g key={`slit-l-${i}`}>
              <rect x="18" y={sy} width="3" height="12" fill={COLORS.windowDark} transform="skewY(-26)" />
            </g>
          ))}
          {[15, 35].map((sy, i) => (
            <g key={`slit-r-${i}`}>
              <rect x="95" y={sy} width="3" height="12" fill={COLORS.windowDark} transform="skewY(26)" />
            </g>
          ))}
          
          {/* Left tower */}
          <rect x="5" y="-35" width="25" height="50" fill={COLORS.stoneMedium} />
          <polygon points="5,-35 17,-55 30,-35" fill={COLORS.stoneDark} />
          {/* Crenellations */}
          {[7, 15, 23].map((cx, i) => (
            <rect key={i} x={cx} y="-42" width="5" height="8" fill={COLORS.stoneLight} />
          ))}
          
          {/* Right tower */}
          <rect x="100" y="-35" width="25" height="50" fill={COLORS.stoneLight} />
          <polygon points="100,-35 112,-55 125,-35" fill={COLORS.stoneMedium} />
          {[102, 110, 118].map((cx, i) => (
            <rect key={i} x={cx} y="-42" width="5" height="8" fill={COLORS.stoneMedium} />
          ))}
          
          {/* Main gate */}
          <path d="M 50,85 L 50,45 Q 65,30 80,45 L 80,85 Z" fill={COLORS.windowDark} />
          <rect x="63" y="35" width="4" height="50" fill={COLORS.woodDark} />
          
          {/* Gate portcullis pattern */}
          {[52, 58, 64, 70, 76].map((gx, i) => (
            <line key={i} x1={gx} y1="45" x2={gx} y2="85" stroke={COLORS.unitMetal} strokeWidth="1.5" />
          ))}
          {[50, 60, 70, 80].map((gy, i) => (
            <line key={i} x1="52" y1={gy} x2="78" y2={gy} stroke={COLORS.unitMetal} strokeWidth="1" />
          ))}
          
          {/* Red banners */}
          <rect x="12" y="-30" width="4" height="25" fill={COLORS.unitRed} />
          <polygon points="12,-30 20,-25 12,-20" fill={COLORS.unitRed} />
          <rect x="114" y="-30" width="4" height="25" fill={COLORS.unitRed} />
          <polygon points="118,-30 110,-25 118,-20" fill={COLORS.unitRed} />
          
          {/* Soldiers on guard */}
          <SoldierUnit x={35} y={95} type="guard" facing="right" />
          <SoldierUnit x={95} y={95} type="guard" facing="left" />
          
          {/* Training soldiers based on level */}
          {level >= 2 && <SoldierUnit x={-10} y={65} type="recruit" facing="right" animated />}
          {level >= 3 && <SoldierUnit x={140} y={65} type="recruit" facing="left" animated />}
          
          {/* Level badge */}
          <g transform="translate(120, -45)">
            <circle r="13" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="4" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
        </>
      ) : (
        <>
          <polygon points="0,50 65,15 130,50 65,85" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="8,4" opacity="0.5" />
          <text x="65" y="55" textAnchor="middle" fontSize="32">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,50 65,15 130,50 65,85" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Generic medium building (Market, Library, etc.)
const MediumBuilding = ({ x, y, level, isSelected, onClick, isProducing, roofColor, buildingType, skin = 'default' }) => {
  const isBuilt = level > 0;
  const skinData = SEASONAL_SKINS[skin] || SEASONAL_SKINS.default;
  const finalRoofColor = skinData.roofColor || roofColor || COLORS.roofTerracotta;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      <ellipse cx="40" cy="75" rx="45" ry="20" fill="rgba(0,0,0,0.2)" />
      
      {isBuilt ? (
        <>
          {/* Foundation */}
          <polygon points="40,68 80,45 80,38 40,61 0,38 0,45" fill={COLORS.stoneDark} />
          
          {/* Walls */}
          <polygon points="0,38 40,15 40,61 0,38" fill={COLORS.wallShade} />
          <polygon points="0,38 0,0 40,-23 40,15" fill={skinData.wallColor || COLORS.wallCream} />
          <polygon points="40,15 80,38 80,0 40,-23" fill={COLORS.wallDark} />
          <polygon points="40,15 40,61 80,38 80,0" fill={COLORS.wallShade} />
          
          {/* Timber details */}
          <line x1="0" y1="18" x2="40" y2="-5" stroke={COLORS.woodDark} strokeWidth="1.5" />
          <line x1="40" y1="-5" x2="80" y2="18" stroke={COLORS.woodDark} strokeWidth="1.5" />
          
          {/* Windows */}
          <rect x="10" y="12" width="10" height="14" fill={COLORS.windowDark} rx="1" transform="skewY(-26)" />
          <rect x="55" y="12" width="10" height="14" fill={COLORS.windowDark} rx="1" transform="skewY(26)" />
          
          {/* Door */}
          <rect x="32" y="38" width="16" height="23" fill={COLORS.doorBrown} rx="1" />
          <circle cx="44" cy="50" r="1.5" fill={COLORS.woodMedium} />
          
          {/* Roof */}
          <polygon points="40,-38 -5,10 40,40 85,10" fill={finalRoofColor} />
          <polygon points="40,-38 -5,10 -5,15 40,-33" fill={COLORS.roofDark} />
          <polygon points="40,-38 85,10 85,15 40,-33" fill={COLORS.roofLight} />
          
          {/* Snow */}
          {skinData.snowOnRoof && (
            <polygon points="40,-40 -3,11 40,39 83,11" fill="white" opacity="0.85" />
          )}
          
          {/* Market specific: awning */}
          {buildingType === 'market' && (
            <>
              <polygon points="0,45 40,25 40,32 0,52" fill="#D84040" />
              <polygon points="40,25 80,45 80,52 40,32" fill="#B83030" />
              {/* Market goods */}
              <ellipse cx="15" cy="60" rx="6" ry="3" fill="#E8A040" />
              <ellipse cx="65" cy="60" rx="5" ry="2.5" fill="#A0D040" />
            </>
          )}
          
          {/* Library specific: books visible */}
          {buildingType === 'library' && (
            <g transform="translate(12, 22)">
              <rect x="0" y="0" width="3" height="8" fill="#8B4513" transform="skewY(-26)" />
              <rect x="4" y="0" width="2" height="7" fill="#2F4F4F" transform="skewY(-26)" />
              <rect x="7" y="0" width="3" height="8" fill="#800020" transform="skewY(-26)" />
            </g>
          )}
          
          {/* Level */}
          <g transform="translate(70, -28)">
            <circle r="10" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="3" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
          
          {/* Production indicator */}
          {isProducing && (
            <g transform="translate(40, 80)">
              <rect x="-22" y="-7" width="44" height="12" rx="6" fill="#22c55e" className="animate-pulse" />
              <text x="0" y="3" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">Produzindo</text>
            </g>
          )}
          
          {/* Worker for producing buildings */}
          {isProducing && buildingType !== 'market' && <VillagerUnit x={-12} y={60} working tool="axe" />}
        </>
      ) : (
        <>
          <polygon points="0,38 40,15 80,38 40,61" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="6,3" opacity="0.5" />
          <text x="40" y="45" textAnchor="middle" fontSize="24">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,38 40,15 80,38 40,61" fill="none" stroke="#fbbf24" strokeWidth="3" />
      )}
    </g>
  );
};

// Wall section
const WallSection = ({ x, y, level, isSelected, onClick }) => {
  const isBuilt = level > 0;
  
  return (
    <g transform={`translate(${x}, ${y})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {isBuilt ? (
        <>
          {/* Wall base */}
          <polygon points="0,45 35,25 35,0 0,20" fill={COLORS.stoneDark} />
          <polygon points="35,25 70,45 70,20 35,0" fill={COLORS.stoneLight} />
          <polygon points="0,20 35,0 70,20 35,40" fill={COLORS.stoneMedium} />
          
          {/* Crenellations */}
          {[5, 18, 31, 44, 57].map((cx, i) => (
            <rect key={i} x={cx} y="-12" width="8" height="14" fill={i % 2 ? COLORS.stoneLight : COLORS.stoneMedium} />
          ))}
          
          {/* Stone texture */}
          <line x1="10" y1="35" x2="25" y2="25" stroke={COLORS.stoneVeryDark} strokeWidth="0.5" opacity="0.4" />
          <line x1="45" y1="25" x2="60" y2="35" stroke={COLORS.stoneVeryDark} strokeWidth="0.5" opacity="0.4" />
          
          {/* Guard on wall */}
          {level >= 2 && <SoldierUnit x={35} y={-5} type="guard" facing="right" />}
          
          {/* Level */}
          <g transform="translate(60, -20)">
            <circle r="9" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1.5" />
            <text x="0" y="3" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78350f">{level}</text>
          </g>
        </>
      ) : (
        <>
          <polygon points="0,45 35,25 70,45 35,65" fill="none" stroke={COLORS.stoneMedium} 
            strokeWidth="2" strokeDasharray="5,3" opacity="0.5" />
          <text x="35" y="50" textAnchor="middle" fontSize="22">🏗️</text>
        </>
      )}
      
      {isSelected && (
        <polygon points="0,45 35,25 70,45 35,65" fill="none" stroke="#fbbf24" strokeWidth="2" />
      )}
    </g>
  );
};

// ==================== ENVIRONMENT COMPONENTS ====================

// Detailed terrain with texture
const DetailedTerrain = () => (
  <g>
    {/* Base grass */}
    <rect x="0" y="0" width="1100" height="650" fill={COLORS.grassMedium} />
    
    {/* Grass texture patches */}
    {[...Array(120)].map((_, i) => (
      <ellipse key={i}
        cx={Math.random() * 1100}
        cy={Math.random() * 650}
        rx={Math.random() * 35 + 12}
        ry={Math.random() * 18 + 6}
        fill={[COLORS.grassLight, COLORS.grassDark, COLORS.grassPatch][i % 3]}
        opacity={0.35 + Math.random() * 0.25}
      />
    ))}
    
    {/* Main paths */}
    <path 
      d="M 550 0 L 550 280 L 220 280 L 220 480 L 550 480 L 550 650 M 550 280 L 880 280 L 880 480 L 550 480"
      fill="none" stroke={COLORS.dirtPath} strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"
    />
    <path 
      d="M 550 0 L 550 280 L 220 280 L 220 480 L 550 480 L 550 650 M 550 280 L 880 280 L 880 480 L 550 480"
      fill="none" stroke={COLORS.dirt} strokeWidth="30" strokeLinecap="round" strokeLinejoin="round"
    />
    
    {/* Dirt patches around buildings */}
    {[[180, 180], [400, 380], [700, 380], [550, 520]].map(([cx, cy], i) => (
      <ellipse key={i} cx={cx} cy={cy} rx={55} ry={30} fill={COLORS.dirt} opacity="0.45" />
    ))}
    
    {/* Small rocks scattered */}
    {[...Array(15)].map((_, i) => (
      <ellipse key={i} 
        cx={100 + Math.random() * 900} 
        cy={100 + Math.random() * 500}
        rx={3 + Math.random() * 4}
        ry={2 + Math.random() * 2}
        fill={COLORS.stoneDark}
        opacity="0.5"
      />
    ))}
  </g>
);

// Detailed cypress tree
const CypressTree = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="8" cy="58" rx="10" ry="4" fill="rgba(0,0,0,0.25)" />
    <rect x="5" y="40" width="6" height="20" fill={COLORS.trunkBrown} />
    <ellipse cx="8" cy="22" rx="10" ry="30" fill={COLORS.treeDark} />
    <ellipse cx="6" cy="18" rx="6" ry="22" fill={COLORS.treeGreen} />
    <ellipse cx="10" cy="12" rx="5" ry="18" fill={COLORS.treeLight} />
  </g>
);

// Detailed deciduous tree
const DeciduousTree = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    <ellipse cx="18" cy="65" rx="18" ry="7" fill="rgba(0,0,0,0.25)" />
    <rect x="14" y="42" width="8" height="25" fill={COLORS.trunkBrown} />
    <circle cx="18" cy="25" r="24" fill={COLORS.treeDark} />
    <circle cx="8" cy="18" r="15" fill={COLORS.treeGreen} />
    <circle cx="28" cy="22" r="13" fill={COLORS.treeGreen} />
    <circle cx="18" cy="8" r="10" fill={COLORS.treeLight} />
  </g>
);

// Bush
const Bush = ({ x, y }) => (
  <g transform={`translate(${x}, ${y})`}>
    <ellipse cx="0" cy="8" rx="10" ry="4" fill="rgba(0,0,0,0.2)" />
    <ellipse cx="0" cy="0" rx="12" ry="8" fill={COLORS.bushGreen} />
    <ellipse cx="-6" cy="-2" rx="6" ry="5" fill={COLORS.treeGreen} />
    <ellipse cx="6" cy="-1" rx="5" ry="4" fill={COLORS.treeLight} />
  </g>
);

// City walls surrounding everything
const CityFortifications = ({ wallLevel }) => {
  const opacity = wallLevel > 0 ? 1 : 0.35;
  
  return (
    <g opacity={opacity}>
      {/* Top wall segments */}
      <rect x="120" y="45" width="380" height="30" fill={COLORS.stoneMedium} />
      <rect x="600" y="45" width="380" height="30" fill={COLORS.stoneMedium} />
      
      {/* Crenellations top */}
      {[...Array(18)].map((_, i) => (
        <rect key={`top-l-${i}`} x={125 + i * 20} y="35" width="12" height="15" fill={COLORS.stoneLight} />
      ))}
      {[...Array(18)].map((_, i) => (
        <rect key={`top-r-${i}`} x={605 + i * 20} y="35" width="12" height="15" fill={COLORS.stoneLight} />
      ))}
      
      {/* Main gate with towers */}
      <rect x="500" y="20" width="100" height="70" fill={COLORS.stoneDark} />
      <path d="M 510,90 L 510,40 Q 550,15 590,40 L 590,90 Z" fill={COLORS.windowDark} />
      
      {/* Gate towers */}
      <rect x="475" y="5" width="30" height="85" fill={COLORS.stoneMedium} />
      <polygon points="475,5 490,-20 505,5" fill={COLORS.roofTerracotta} />
      <rect x="595" y="5" width="30" height="85" fill={COLORS.stoneMedium} />
      <polygon points="595,5 610,-20 625,5" fill={COLORS.roofTerracotta} />
      
      {/* Flags on gate towers */}
      <line x1="490" y1="-20" x2="490" y2="-45" stroke={COLORS.woodDark} strokeWidth="2" />
      <polygon points="490,-45 515,-38 490,-31" fill="#DC2626" className="animate-flag" />
      <line x1="610" y1="-20" x2="610" y2="-45" stroke={COLORS.woodDark} strokeWidth="2" />
      <polygon points="610,-45 635,-38 610,-31" fill="#3B82F6" className="animate-flag" />
      
      {/* Side walls */}
      <rect x="95" y="45" width="30" height="560" fill={COLORS.stoneDark} />
      <rect x="975" y="45" width="30" height="560" fill={COLORS.stoneLight} />
      
      {/* Corner towers */}
      {[[95, 45], [975, 45], [95, 565], [975, 565]].map(([tx, ty], i) => (
        <g key={i} transform={`translate(${tx}, ${ty})`}>
          <rect x="-8" y="-20" width="46" height="65" fill={COLORS.stoneMedium} />
          <polygon points="0,-20 15,-45 30,-20" fill={COLORS.roofTerracotta} />
          {/* Tower windows */}
          <rect x="8" y="-5" width="6" height="10" fill={COLORS.windowDark} />
          <rect x="18" y="-5" width="6" height="10" fill={COLORS.windowDark} />
          {/* Flag */}
          <line x1="15" y1="-45" x2="15" y2="-65" stroke={COLORS.woodDark} strokeWidth="2" />
          <polygon points="15,-65 35,-58 15,-51" fill={i < 2 ? '#DC2626' : '#3B82F6'} />
        </g>
      ))}
      
      {/* Wall level indicator */}
      {wallLevel > 0 && (
        <g transform="translate(550, 0)">
          <rect x="-30" y="-15" width="60" height="24" rx="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
          <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">
            Muralha Nv.{wallLevel}
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
    <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-xl p-0.5 shadow-2xl border border-amber-700">
      <div className="bg-gradient-to-b from-amber-100 to-amber-50 rounded-lg px-4 py-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {[
            { icon: <Coins size={18} />, value: gameState?.coins || 0, label: 'Ouro', bg: 'bg-yellow-500' },
            { icon: <Diamond size={18} />, value: gameState?.diamonds || 0, label: 'Gemas', bg: 'bg-purple-500' },
            { icon: <TreePine size={18} />, value: resources.wood, label: 'Madeira', bg: 'bg-amber-700' },
            { icon: <Mountain size={18} />, value: resources.stone, label: 'Pedra', bg: 'bg-slate-500' },
            { icon: <Pickaxe size={18} />, value: resources.iron, label: 'Ferro', bg: 'bg-zinc-600' },
            { icon: <Wheat size={18} />, value: resources.food, label: 'Comida', bg: 'bg-lime-600' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-white/90 rounded-lg px-3 py-1.5 shadow-sm">
              <div className={`${item.bg} text-white p-1.5 rounded-md`}>{item.icon}</div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 leading-none font-medium">{item.label}</p>
                <p className="font-bold text-slate-800 text-sm leading-tight">{item.value}</p>
              </div>
            </div>
          ))}
          
          <div className="h-10 w-px bg-amber-300" />
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="flex items-center gap-1.5 bg-blue-100 px-2 py-1 rounded-lg">
              <Home size={16} className="text-blue-600" />{gameState?.population || 10}/{gameState?.max_population || 20}
            </span>
            <span className="flex items-center gap-1.5 bg-green-100 px-2 py-1 rounded-lg">
              <Shield size={16} className="text-green-600" />{gameState?.defense_power || 5}
            </span>
            <span className="flex items-center gap-1.5 bg-red-100 px-2 py-1 rounded-lg">
              <Sword size={16} className="text-red-600" />{gameState?.attack_power || 0}
            </span>
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
  
  const nextLevelCost = { 
    coins: 50 * (level + 1) * 1.2, 
    wood: 20 * (level + 1), 
    stone: 15 * (level + 1), 
    iron: 5 * (level + 1) 
  };
  
  const canAfford = gameState && 
    gameState.coins >= nextLevelCost.coins &&
    (gameState.resources?.wood || 0) >= nextLevelCost.wood;
  
  const isProducing = building.producing;
  const productionReady = gameState?.production_timers?.[building.id] && new Date(gameState.production_timers[building.id]) <= new Date();
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-amber-50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border-4 border-amber-800 animate-scale-in">
        <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{config.icon}</span>
              <div>
                <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>{config.name}</h2>
                <p className="text-amber-200 text-sm">Nível {level}/{maxLevel}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition"><X size={22} /></button>
          </div>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Level progress */}
          <div className="bg-white rounded-xl p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Progresso</span>
              <span className="font-bold">{level}/{maxLevel}</span>
            </div>
            <div className="h-3 bg-amber-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all" style={{ width: `${(level / maxLevel) * 100}%` }} />
            </div>
          </div>
          
          {/* Production */}
          {config.produces && isBuilt && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><Clock size={18} />Produção</h3>
              {!isProducing && !productionReady && (
                <button onClick={() => onStartProduction(building.id)} disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-lg transition">
                  <Play size={18} /> Iniciar Produção
                </button>
              )}
              {productionReady && (
                <button onClick={() => onCollect(building.id)} disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl animate-pulse flex items-center justify-center gap-2 shadow-lg">
                  <Check size={18} /> Recolher Recursos!
                </button>
              )}
              {isProducing && !productionReady && (
                <div className="text-center py-3 text-blue-600 font-medium">
                  <Clock className="inline animate-spin mr-2" size={18} />A produzir...
                </div>
              )}
            </div>
          )}
          
          {/* Upgrade */}
          {level < maxLevel && (
            <div className="bg-amber-100 rounded-xl p-4 border border-amber-300">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <ChevronUp size={18} />{isBuilt ? `Melhorar para Nível ${level + 1}` : 'Construir'}
              </h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { icon: <Coins size={16} />, val: Math.floor(nextLevelCost.coins), have: gameState?.coins || 0 },
                  { icon: <TreePine size={16} />, val: nextLevelCost.wood, have: gameState?.resources?.wood || 0 },
                  { icon: <Mountain size={16} />, val: nextLevelCost.stone, have: gameState?.resources?.stone || 0 },
                  { icon: <Pickaxe size={16} />, val: nextLevelCost.iron, have: gameState?.resources?.iron || 0 },
                ].map((r, i) => (
                  <div key={i} className={`flex items-center gap-1 p-2 rounded-lg text-sm font-medium ${r.have >= r.val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {r.icon} {r.val}
                  </div>
                ))}
              </div>
              <button onClick={() => onUpgrade(building.id, Math.floor(nextLevelCost.coins))} disabled={!canAfford || loading}
                className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg ${canAfford ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90' : 'bg-slate-200 text-slate-500 cursor-not-allowed'}`}>
                <ChevronUp size={18} /> {isBuilt ? 'Melhorar' : 'Construir'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes scale-in { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// ==================== SOUND EFFECTS MANAGER ====================
const AmbientSoundManager = ({ enabled, onToggle }) => {
  const audioRef = useRef(null);
  
  useEffect(() => {
    if (enabled && audioRef.current) {
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [enabled]);
  
  return (
    <>
      <audio ref={audioRef} loop>
        <source src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA" type="audio/wav" />
      </audio>
      <button 
        onClick={onToggle}
        className={`p-2 rounded-lg shadow transition ${enabled ? 'bg-green-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
        title={enabled ? 'Desligar sons' : 'Ligar sons'}
      >
        {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </>
  );
};

// ==================== SEASONAL PACKAGES PANEL ====================
const SeasonalPackagesPanel = ({ onClose, onPurchase, currentSkin, onChangeSkin }) => {
  const packages = [
    { id: 'christmas', name: 'Pacote de Natal', icon: '🎄', theme: 'from-red-500 via-green-600 to-red-500', price: 4.99, discount: 30, items: ['💎 100', '❄️ Neve', '🎄 Decorações'] },
    { id: 'summer', name: 'Pacote de Verão', icon: '☀️', theme: 'from-yellow-400 via-orange-500 to-red-500', price: 6.99, discount: 40, items: ['💎 150', '🏖️ Praia', '🌴 Palmeiras'] }
  ];
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-5 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2"><Gift size={24} /> Pacotes Sazonais</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={22} /></button>
          </div>
          <p className="text-white/80 text-sm mt-1">Skins exclusivas para a tua cidade!</p>
        </div>
        
        <div className="p-5 space-y-4">
          {/* Current skin selector */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-bold text-slate-800 mb-3">Skin Ativa</h3>
            <div className="flex gap-2 flex-wrap">
              {['default', 'christmas', 'summer'].map(skin => (
                <button key={skin} onClick={() => onChangeSkin(skin)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${currentSkin === skin ? 'bg-purple-500 text-white' : 'bg-white border hover:bg-slate-100'}`}>
                  {skin === 'default' ? '🏠 Normal' : skin === 'christmas' ? '🎄 Natal' : '☀️ Verão'}
                </button>
              ))}
            </div>
          </div>
          
          {/* Packages */}
          {packages.map(pack => (
            <div key={pack.id} className={`bg-gradient-to-r ${pack.theme} p-0.5 rounded-xl`}>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{pack.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{pack.name}</h3>
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">-{pack.discount}%</span>
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  {pack.items.map((item, i) => (
                    <span key={i} className="text-xs bg-slate-100 rounded-lg px-2 py-1">{item}</span>
                  ))}
                </div>
                <button onClick={() => onPurchase(pack)} className={`w-full py-2.5 bg-gradient-to-r ${pack.theme} text-white font-bold rounded-xl hover:opacity-90 transition`}>
                  Comprar €{pack.price}
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
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [currentSkin, setCurrentSkin] = useState('default');
  
  useEffect(() => {
    const fetchBuildingInfo = async () => {
      try {
        const response = await axios.get(`${API}/game/building-info`, { withCredentials: true });
        setBuildingInfo(response.data);
      } catch (error) { console.error('Error:', error); }
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
      toast.success('Edifício construído!', { icon: '🏗️' });
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro');
    } finally { setLoading(false); }
  };
  
  const handleStartProduction = async (buildingId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/game/start-production`, null, { params: { building_id: buildingId }, withCredentials: true });
      toast.success('Produção iniciada!', { icon: '⚙️' });
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) { toast.error(error.response?.data?.detail || 'Erro'); }
    finally { setLoading(false); }
  };
  
  const handleCollect = async (buildingId) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/game/collect-production`, null, { params: { building_id: buildingId }, withCredentials: true });
      toast.success(`+${res.data.amount} ${res.data.resource}!`, { icon: '📦' });
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) { toast.error(error.response?.data?.detail || 'Erro'); }
    finally { setLoading(false); }
  };
  
  const selectBuilding = (id) => {
    const b = buildingsData[id];
    setSelectedBuilding({ id, level: typeof b === 'object' ? b.level || 0 : b || 0, producing: b?.producing || false });
  };
  
  return (
    <div className="space-y-3">
      <ResourceBar gameState={gameState} />
      
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))} className="p-2 bg-white rounded-lg shadow hover:bg-slate-50"><ZoomIn size={20} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.6))} className="p-2 bg-white rounded-lg shadow hover:bg-slate-50"><ZoomOut size={20} /></button>
          <button onClick={() => setZoom(1)} className="p-2 bg-white rounded-lg shadow hover:bg-slate-50"><RotateCcw size={20} /></button>
          <AmbientSoundManager enabled={soundEnabled} onToggle={() => setSoundEnabled(!soundEnabled)} />
        </div>
        <button onClick={() => setShowPackages(true)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition" data-testid="seasonal-packages-btn">
          <Gift size={20} /> Skins <span className="text-xs bg-white/20 px-2 rounded-full">Novo!</span>
        </button>
      </div>
      
      {/* Main game view */}
      <div className="bg-gradient-to-b from-sky-400 via-sky-300 to-sky-200 rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-800 relative" style={{ height: '560px' }}>
        <svg viewBox="0 0 1100 650" className="w-full h-full" style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.3s' }}>
          {/* Sky gradient */}
          <defs>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#87CEEB" />
              <stop offset="60%" stopColor="#B0E0F0" />
              <stop offset="100%" stopColor="#98D8C8" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="1100" height="100" fill="url(#skyGrad)" />
          
          {/* Sun with glow */}
          <circle cx="1000" cy="55" r="40" fill="#FDE047" />
          <circle cx="1000" cy="55" r="55" fill="none" stroke="#FDE047" strokeWidth="4" opacity="0.3" />
          <circle cx="1000" cy="55" r="70" fill="none" stroke="#FDE047" strokeWidth="2" opacity="0.15" />
          
          {/* Clouds */}
          <g className="animate-cloud">
            <ellipse cx="180" cy="45" rx="55" ry="25" fill="white" opacity="0.95" />
            <ellipse cx="230" cy="38" rx="40" ry="20" fill="white" opacity="0.95" />
            <ellipse cx="140" cy="50" rx="30" ry="15" fill="white" opacity="0.9" />
          </g>
          <g className="animate-cloud2">
            <ellipse cx="650" cy="35" rx="45" ry="20" fill="white" opacity="0.9" />
            <ellipse cx="700" cy="28" rx="35" ry="16" fill="white" opacity="0.9" />
          </g>
          
          {/* Birds */}
          <g className="animate-birds">
            <path d="M 300 50 Q 305 45 310 50 Q 315 45 320 50" fill="none" stroke="#374151" strokeWidth="2" />
            <path d="M 340 40 Q 343 37 346 40 Q 349 37 352 40" fill="none" stroke="#374151" strokeWidth="1.5" />
          </g>
          
          {/* Terrain layer */}
          <g transform="translate(0, 70)">
            <DetailedTerrain />
            
            {/* City fortifications */}
            <CityFortifications wallLevel={getLevel('wall')} />
            
            {/* Trees around the perimeter */}
            <CypressTree x={135} y={90} scale={0.85} />
            <CypressTree x={155} y={120} scale={0.75} />
            <DeciduousTree x={160} y={450} scale={0.9} />
            <CypressTree x={950} y={100} scale={0.8} />
            <CypressTree x={970} y={130} scale={0.7} />
            <DeciduousTree x={940} y={440} scale={0.85} />
            <Bush x={180} y={200} />
            <Bush x={920} y={200} />
            <Bush x={200} y={400} />
            <Bush x={900} y={400} />
            
            {/* ===== BUILDINGS ===== */}
            
            {/* Town Hall - Center */}
            <TownHallBuilding x={480} y={170} level={getLevel('town_hall')} isSelected={selectedBuilding?.id === 'town_hall'} onClick={() => selectBuilding('town_hall')} skin={currentSkin} />
            
            {/* House - Top left */}
            <HouseBuilding x={260} y={140} level={getLevel('house')} isSelected={selectedBuilding?.id === 'house'} onClick={() => selectBuilding('house')} isProducing={isProducing('house')} skin={currentSkin} />
            
            {/* School - Top right */}
            <MediumBuilding x={720} y={140} level={getLevel('school')} isSelected={selectedBuilding?.id === 'school'} onClick={() => selectBuilding('school')} roofColor={COLORS.roofBlue} buildingType="school" skin={currentSkin} />
            
            {/* Library - Middle left */}
            <MediumBuilding x={260} y={310} level={getLevel('library')} isSelected={selectedBuilding?.id === 'library'} onClick={() => selectBuilding('library')} roofColor="#8B5CF6" buildingType="library" skin={currentSkin} />
            
            {/* Market - Middle right */}
            <MediumBuilding x={720} y={310} level={getLevel('market')} isSelected={selectedBuilding?.id === 'market'} onClick={() => selectBuilding('market')} isProducing={isProducing('market')} roofColor="#F97316" buildingType="market" skin={currentSkin} />
            
            {/* Farm - Bottom left */}
            <FarmBuilding x={180} y={420} level={getLevel('farm')} isSelected={selectedBuilding?.id === 'farm'} onClick={() => selectBuilding('farm')} isProducing={isProducing('farm')} skin={currentSkin} />
            
            {/* Lumber Mill - Far right top */}
            <MediumBuilding x={850} y={160} level={getLevel('lumber_mill')} isSelected={selectedBuilding?.id === 'lumber_mill'} onClick={() => selectBuilding('lumber_mill')} isProducing={isProducing('lumber_mill')} roofColor="#92400E" buildingType="lumber_mill" skin={currentSkin} />
            
            {/* Quarry - Far right middle */}
            <MediumBuilding x={850} y={320} level={getLevel('quarry')} isSelected={selectedBuilding?.id === 'quarry'} onClick={() => selectBuilding('quarry')} isProducing={isProducing('quarry')} roofColor="#64748B" buildingType="quarry" skin={currentSkin} />
            
            {/* Mine - Far right bottom */}
            <MediumBuilding x={850} y={460} level={getLevel('mine')} isSelected={selectedBuilding?.id === 'mine'} onClick={() => selectBuilding('mine')} isProducing={isProducing('mine')} roofColor="#3F3F46" buildingType="mine" skin={currentSkin} />
            
            {/* Barracks - Bottom center */}
            <BarracksBuilding x={480} y={400} level={getLevel('barracks')} isSelected={selectedBuilding?.id === 'barracks'} onClick={() => selectBuilding('barracks')} skin={currentSkin} />
            
            {/* Wall section - Left side */}
            <WallSection x={190} y={230} level={getLevel('wall')} isSelected={selectedBuilding?.id === 'wall'} onClick={() => selectBuilding('wall')} />
            
            {/* Garden - Bottom */}
            <MediumBuilding x={380} y={500} level={getLevel('garden')} isSelected={selectedBuilding?.id === 'garden'} onClick={() => selectBuilding('garden')} isProducing={isProducing('garden')} roofColor="#22C55E" buildingType="garden" skin={currentSkin} />
          </g>
        </svg>
        
        {/* City name banner */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-xl px-8 py-3 shadow-2xl border-2 border-amber-600">
            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              🏰 Reino de {gameState?.city_name || 'Aventureiro'}
            </h2>
          </div>
        </div>
      </div>
      
      {/* Panels */}
      {selectedBuilding && (
        <BuildingPanel building={selectedBuilding} buildingInfo={buildingInfo} gameState={gameState} onClose={() => setSelectedBuilding(null)} onUpgrade={handleUpgrade} onStartProduction={handleStartProduction} onCollect={handleCollect} loading={loading} />
      )}
      
      {showPackages && (
        <SeasonalPackagesPanel onClose={() => setShowPackages(false)} onPurchase={(p) => { toast.success(`Pacote ${p.name} comprado!`); setShowPackages(false); }} currentSkin={currentSkin} onChangeSkin={setCurrentSkin} />
      )}
      
      {/* Animations */}
      <style>{`
        @keyframes cloud { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(50px); } }
        @keyframes cloud2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-40px); } }
        @keyframes birds { 0% { transform: translateX(0); } 100% { transform: translateX(800px); } }
        @keyframes smoke { 0%, 100% { opacity: 0.6; transform: translateY(0) scale(1); } 50% { opacity: 0.2; transform: translateY(-12px) scale(1.2); } }
        @keyframes flag { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(0.85); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes soldier { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes work { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-10deg); } 75% { transform: rotate(10deg); } }
        @keyframes lights { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .animate-cloud { animation: cloud 25s ease-in-out infinite; }
        .animate-cloud2 { animation: cloud2 30s ease-in-out infinite; }
        .animate-birds { animation: birds 60s linear infinite; }
        .animate-smoke { animation: smoke 4s ease-in-out infinite; }
        .animate-flag { animation: flag 2.5s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 10s linear infinite; }
        .animate-soldier { animation: soldier 1s ease-in-out infinite; }
        .animate-work { animation: work 0.8s ease-in-out infinite; }
        .animate-lights { animation: lights 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default IsometricCity;
