import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Coins, Diamond, TreePine, Mountain, Pickaxe, Wheat, 
  Home, School, Library, Store, Building2, Shield, Sword,
  Clock, Check, Play, ChevronUp, X, Info, Gift, Sparkles,
  Volume2, VolumeX, Settings, ZoomIn, ZoomOut, RotateCcw
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Building configurations with medieval RTS style
const BUILDING_CONFIG = {
  town_hall: { 
    name: 'Câmara Municipal', 
    icon: '🏛️', 
    roofColor: '#7c3aed',
    wallColor: '#f5f5dc',
    size: 'large',
    description: 'Centro administrativo da cidade. Aumenta a capacidade de população.'
  },
  house: { 
    name: 'Casa', 
    icon: '🏠', 
    roofColor: '#ef4444',
    wallColor: '#fef3c7',
    size: 'medium',
    description: 'Residência para a população. Cada casa adiciona moradores.'
  },
  school: { 
    name: 'Escola', 
    icon: '🏫', 
    roofColor: '#3b82f6',
    wallColor: '#e0f2fe',
    size: 'large',
    description: 'Onde a educação acontece! Aumenta o XP ganho em quizzes.'
  },
  library: { 
    name: 'Biblioteca', 
    icon: '📚', 
    roofColor: '#8b5cf6',
    wallColor: '#f3e8ff',
    size: 'medium',
    description: 'Conhecimento é poder! Desbloqueia dicas nos quizzes.'
  },
  market: { 
    name: 'Mercado', 
    icon: '🏪', 
    roofColor: '#f97316',
    wallColor: '#fff7ed',
    size: 'medium',
    produces: true,
    description: 'Centro de comércio. Produz moedas ao longo do tempo.'
  },
  farm: { 
    name: 'Quinta', 
    icon: '🌾', 
    roofColor: '#84cc16',
    wallColor: '#ecfccb',
    size: 'medium',
    produces: true,
    description: 'Produz comida para alimentar a população.'
  },
  lumber_mill: { 
    name: 'Serração', 
    icon: '🪵', 
    roofColor: '#92400e',
    wallColor: '#fef3c7',
    size: 'medium',
    produces: true,
    description: 'Produz madeira para construção.'
  },
  quarry: { 
    name: 'Pedreira', 
    icon: '🪨', 
    roofColor: '#64748b',
    wallColor: '#f1f5f9',
    size: 'medium',
    produces: true,
    description: 'Extrai pedra para construção.'
  },
  mine: { 
    name: 'Mina', 
    icon: '⛏️', 
    roofColor: '#3f3f46',
    wallColor: '#52525b',
    size: 'medium',
    produces: true,
    description: 'Extrai ferro para construções avançadas.'
  },
  barracks: { 
    name: 'Quartel', 
    icon: '⚔️', 
    roofColor: '#dc2626',
    wallColor: '#fee2e2',
    size: 'large',
    description: 'Treina soldados. Aumenta o poder de ataque.'
  },
  wall: { 
    name: 'Muralha', 
    icon: '🏰', 
    roofColor: '#78716c',
    wallColor: '#d6d3d1',
    size: 'small',
    description: 'Proteção da cidade. Aumenta o poder de defesa.'
  },
  garden: { 
    name: 'Jardim', 
    icon: '🌳', 
    roofColor: '#22c55e',
    wallColor: '#dcfce7',
    size: 'medium',
    description: 'Beleza e tranquilidade. Produz diamantes bónus.'
  }
};

// Seasonal Packages Configuration
const SEASONAL_PACKAGES = {
  christmas: {
    id: 'christmas',
    name: 'Pacote de Natal',
    icon: '🎄',
    theme: 'from-red-500 via-green-600 to-red-500',
    items: [
      { type: 'diamonds', amount: 100, icon: '💎' },
      { type: 'skin', name: 'Neve nos Telhados', icon: '❄️' },
      { type: 'decoration', name: 'Árvore de Natal', icon: '🎄' }
    ],
    price: 4.99,
    discount: 30,
    endDate: '2026-12-31'
  },
  carnival: {
    id: 'carnival',
    name: 'Pacote de Carnaval',
    icon: '🎭',
    theme: 'from-yellow-400 via-pink-500 to-purple-600',
    items: [
      { type: 'diamonds', amount: 80, icon: '💎' },
      { type: 'skin', name: 'Cores Festivas', icon: '🎨' },
      { type: 'decoration', name: 'Confetes', icon: '🎉' }
    ],
    price: 3.99,
    discount: 25,
    endDate: '2026-03-05'
  },
  summer: {
    id: 'summer',
    name: 'Pacote de Verão',
    icon: '☀️',
    theme: 'from-yellow-400 via-orange-500 to-red-500',
    items: [
      { type: 'diamonds', amount: 150, icon: '💎' },
      { type: 'skin', name: 'Praia Tropical', icon: '🏖️' },
      { type: 'decoration', name: 'Palmeiras', icon: '🌴' },
      { type: 'coins', amount: 500, icon: '🪙' }
    ],
    price: 6.99,
    discount: 40,
    endDate: '2026-08-31'
  },
  easter: {
    id: 'easter',
    name: 'Pacote da Páscoa',
    icon: '🐰',
    theme: 'from-pink-300 via-purple-400 to-blue-400',
    items: [
      { type: 'diamonds', amount: 60, icon: '💎' },
      { type: 'skin', name: 'Ovos Coloridos', icon: '🥚' },
      { type: 'decoration', name: 'Coelho', icon: '🐇' }
    ],
    price: 2.99,
    discount: 20,
    endDate: '2026-04-21'
  }
};

// SVG Building Component - Medieval Style
const MedievalBuilding = ({ building, config, level, isSelected, isProducing, onClick }) => {
  const isBuilt = level > 0;
  const scale = config.size === 'large' ? 1.4 : config.size === 'small' ? 0.8 : 1;
  
  return (
    <g 
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      className={`transition-all duration-300 ${isSelected ? 'filter drop-shadow-lg' : ''}`}
    >
      {/* Building shadow */}
      <ellipse 
        cx="50" cy="95" rx={35 * scale} ry={15 * scale} 
        fill="rgba(0,0,0,0.2)" 
      />
      
      {isBuilt ? (
        <>
          {/* Base/Ground */}
          <rect 
            x={25 - (scale - 1) * 15} 
            y={60 - (scale - 1) * 20} 
            width={50 * scale} 
            height={40 * scale} 
            fill={config.wallColor}
            stroke="#8b7355"
            strokeWidth="2"
            rx="3"
          />
          
          {/* Roof */}
          <polygon 
            points={`${50},${20 - (scale - 1) * 15} ${25 - (scale - 1) * 15},${60 - (scale - 1) * 20} ${75 + (scale - 1) * 15},${60 - (scale - 1) * 20}`}
            fill={config.roofColor}
            stroke="#5a4a3a"
            strokeWidth="2"
          />
          
          {/* Windows */}
          <rect x="35" y={70 - (scale - 1) * 10} width="8" height="10" fill="#87ceeb" stroke="#5a4a3a" strokeWidth="1" rx="1" />
          <rect x="55" y={70 - (scale - 1) * 10} width="8" height="10" fill="#87ceeb" stroke="#5a4a3a" strokeWidth="1" rx="1" />
          
          {/* Door */}
          <rect x="43" y={80 - (scale - 1) * 5} width="14" height="18" fill="#8b4513" stroke="#5a3510" strokeWidth="1" rx="2" />
          
          {/* Chimney smoke animation */}
          {isProducing && (
            <g className="animate-pulse">
              <circle cx="65" cy="15" r="4" fill="rgba(128,128,128,0.6)" />
              <circle cx="68" cy="8" r="3" fill="rgba(128,128,128,0.4)" />
              <circle cx="63" cy="3" r="2" fill="rgba(128,128,128,0.2)" />
            </g>
          )}
          
          {/* Level badge */}
          <g transform="translate(70, 15)">
            <circle r="12" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">
              {level}
            </text>
          </g>
          
          {/* Production indicator */}
          {isProducing && (
            <g transform="translate(50, 105)">
              <rect x="-25" y="-8" width="50" height="16" rx="8" fill="#22c55e" className="animate-pulse" />
              <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">
                A produzir
              </text>
            </g>
          )}
        </>
      ) : (
        <>
          {/* Unbuilt placeholder */}
          <rect 
            x="20" y="40" width="60" height="55" 
            fill="none" 
            stroke="#9ca3af" 
            strokeWidth="2" 
            strokeDasharray="5,5"
            rx="5"
          />
          <text x="50" y="70" textAnchor="middle" fontSize="24">🏗️</text>
          <text x="50" y="90" textAnchor="middle" fontSize="10" fill="#6b7280">Construir</text>
        </>
      )}
      
      {/* Building name tooltip */}
      <text x="50" y="115" textAnchor="middle" fontSize="9" fill="#374151" fontWeight="600">
        {config.name}
      </text>
    </g>
  );
};

// Castle Walls Component
const CastleWalls = ({ wallLevel }) => {
  const opacity = wallLevel > 0 ? 1 : 0.3;
  
  return (
    <g opacity={opacity}>
      {/* Left wall */}
      <rect x="20" y="50" width="15" height="400" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
      <rect x="20" y="50" width="15" height="20" fill="#78716c" />
      <rect x="20" y="130" width="15" height="20" fill="#78716c" />
      <rect x="20" y="210" width="15" height="20" fill="#78716c" />
      <rect x="20" y="290" width="15" height="20" fill="#78716c" />
      <rect x="20" y="370" width="15" height="20" fill="#78716c" />
      
      {/* Right wall */}
      <rect x="865" y="50" width="15" height="400" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
      <rect x="865" y="50" width="15" height="20" fill="#78716c" />
      <rect x="865" y="130" width="15" height="20" fill="#78716c" />
      <rect x="865" y="210" width="15" height="20" fill="#78716c" />
      <rect x="865" y="290" width="15" height="20" fill="#78716c" />
      <rect x="865" y="370" width="15" height="20" fill="#78716c" />
      
      {/* Top wall with gate */}
      <rect x="20" y="35" width="360" height="20" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
      <rect x="520" y="35" width="360" height="20" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
      
      {/* Gate */}
      <rect x="380" y="15" width="140" height="60" fill="#8b4513" stroke="#5a3510" strokeWidth="3" rx="5" />
      <rect x="400" y="35" width="100" height="40" fill="#654321" rx="3" />
      {/* Gate decorations */}
      <circle cx="420" cy="55" r="5" fill="#fbbf24" />
      <circle cx="480" cy="55" r="5" fill="#fbbf24" />
      
      {/* Corner towers */}
      <g transform="translate(10, 20)">
        <rect x="0" y="0" width="30" height="50" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
        <polygon points="15,-15 0,0 30,0" fill="#78716c" />
        <rect x="5" y="5" width="6" height="8" fill="#3b82f6" />
        <rect x="19" y="5" width="6" height="8" fill="#3b82f6" />
      </g>
      
      <g transform="translate(860, 20)">
        <rect x="0" y="0" width="30" height="50" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
        <polygon points="15,-15 0,0 30,0" fill="#78716c" />
        <rect x="5" y="5" width="6" height="8" fill="#3b82f6" />
        <rect x="19" y="5" width="6" height="8" fill="#3b82f6" />
      </g>
      
      {/* Flags on towers */}
      <g transform="translate(25, -5)">
        <line x1="0" y1="0" x2="0" y2="-25" stroke="#5a3510" strokeWidth="2" />
        <polygon points="0,-25 20,-20 0,-15" fill="#dc2626" />
      </g>
      <g transform="translate(875, -5)">
        <line x1="0" y1="0" x2="0" y2="-25" stroke="#5a3510" strokeWidth="2" />
        <polygon points="0,-25 20,-20 0,-15" fill="#3b82f6" />
      </g>
    </g>
  );
};

// Ground/Terrain Component
const Terrain = () => (
  <g>
    {/* Base grass */}
    <rect x="0" y="0" width="900" height="500" fill="#7cb342" />
    
    {/* Grass texture variations */}
    {[...Array(50)].map((_, i) => (
      <ellipse 
        key={i}
        cx={Math.random() * 900} 
        cy={Math.random() * 500 + 50}
        rx={Math.random() * 30 + 10}
        ry={Math.random() * 15 + 5}
        fill={`rgba(${100 + Math.random() * 40}, ${160 + Math.random() * 40}, ${66}, 0.3)`}
      />
    ))}
    
    {/* Paths */}
    <path 
      d="M 450 55 L 450 200 L 200 200 L 200 350 L 450 350 L 450 450 M 450 200 L 700 200 L 700 350 L 450 350"
      fill="none"
      stroke="#c4b896"
      strokeWidth="30"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path 
      d="M 450 55 L 450 200 L 200 200 L 200 350 L 450 350 L 450 450 M 450 200 L 700 200 L 700 350 L 450 350"
      fill="none"
      stroke="#d4c8a6"
      strokeWidth="20"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Farm fields */}
    <g transform="translate(100, 380)">
      <rect x="0" y="0" width="80" height="60" fill="#e6d66a" stroke="#c9b84a" strokeWidth="2" />
      <line x1="0" y1="15" x2="80" y2="15" stroke="#c9b84a" strokeWidth="1" />
      <line x1="0" y1="30" x2="80" y2="30" stroke="#c9b84a" strokeWidth="1" />
      <line x1="0" y1="45" x2="80" y2="45" stroke="#c9b84a" strokeWidth="1" />
    </g>
    <g transform="translate(720, 380)">
      <rect x="0" y="0" width="80" height="60" fill="#d4e66a" stroke="#b4c64a" strokeWidth="2" />
      <line x1="0" y1="15" x2="80" y2="15" stroke="#b4c64a" strokeWidth="1" />
      <line x1="0" y1="30" x2="80" y2="30" stroke="#b4c64a" strokeWidth="1" />
      <line x1="0" y1="45" x2="80" y2="45" stroke="#b4c64a" strokeWidth="1" />
    </g>
    
    {/* Decorative trees */}
    {[50, 850, 100, 800].map((x, i) => (
      <g key={i} transform={`translate(${x}, ${100 + i * 100})`}>
        <ellipse cx="0" cy="20" rx="15" ry="8" fill="rgba(0,0,0,0.2)" />
        <circle cx="0" cy="-10" r="20" fill="#228b22" />
        <circle cx="-12" cy="-5" r="15" fill="#2e8b2e" />
        <circle cx="12" cy="-5" r="15" fill="#2e8b2e" />
        <rect x="-4" y="5" width="8" height="15" fill="#8b4513" />
      </g>
    ))}
  </g>
);

// Sky and atmosphere
const Sky = () => (
  <g>
    {/* Sky gradient */}
    <defs>
      <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#87ceeb" />
        <stop offset="100%" stopColor="#b8e0f0" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="900" height="80" fill="url(#skyGradient)" />
    
    {/* Sun */}
    <g transform="translate(820, 40)">
      <circle r="30" fill="#fde047" />
      <circle r="35" fill="none" stroke="#fde047" strokeWidth="2" opacity="0.5" />
      <circle r="42" fill="none" stroke="#fde047" strokeWidth="1" opacity="0.3" />
    </g>
    
    {/* Clouds */}
    <g className="animate-cloud1">
      <ellipse cx="100" cy="35" rx="40" ry="20" fill="white" opacity="0.9" />
      <ellipse cx="130" cy="30" rx="30" ry="18" fill="white" opacity="0.9" />
      <ellipse cx="70" cy="40" rx="25" ry="15" fill="white" opacity="0.9" />
    </g>
    <g className="animate-cloud2">
      <ellipse cx="400" cy="25" rx="35" ry="18" fill="white" opacity="0.8" />
      <ellipse cx="425" cy="20" rx="25" ry="14" fill="white" opacity="0.8" />
    </g>
    <g className="animate-cloud3">
      <ellipse cx="650" cy="40" rx="30" ry="15" fill="white" opacity="0.85" />
      <ellipse cx="680" cy="35" rx="25" ry="12" fill="white" opacity="0.85" />
    </g>
    
    {/* Birds */}
    <g className="animate-bird">
      <path d="M 200 50 Q 205 45 210 50 Q 215 45 220 50" fill="none" stroke="#374151" strokeWidth="2" />
      <path d="M 230 45 Q 233 42 236 45 Q 239 42 242 45" fill="none" stroke="#374151" strokeWidth="1.5" />
    </g>
  </g>
);

// Resource Bar Component
const ResourceBar = ({ gameState }) => {
  const resources = gameState?.resources || { wood: 0, stone: 0, iron: 0, food: 0 };
  
  const resourceItems = [
    { key: 'coins', icon: <Coins size={18} />, value: gameState?.coins || 0, label: 'Moedas', color: 'bg-yellow-500', bgColor: 'bg-yellow-100' },
    { key: 'diamonds', icon: <Diamond size={18} />, value: gameState?.diamonds || 0, label: 'Diamantes', color: 'bg-purple-500', bgColor: 'bg-purple-100' },
    { key: 'wood', icon: <TreePine size={18} />, value: resources.wood, label: 'Madeira', color: 'bg-amber-700', bgColor: 'bg-amber-100' },
    { key: 'stone', icon: <Mountain size={18} />, value: resources.stone, label: 'Pedra', color: 'bg-slate-500', bgColor: 'bg-slate-100' },
    { key: 'iron', icon: <Pickaxe size={18} />, value: resources.iron, label: 'Ferro', color: 'bg-zinc-600', bgColor: 'bg-zinc-100' },
    { key: 'food', icon: <Wheat size={18} />, value: resources.food, label: 'Comida', color: 'bg-lime-500', bgColor: 'bg-lime-100' },
  ];
  
  return (
    <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 rounded-2xl p-1 shadow-xl border-2 border-amber-600">
      <div className="bg-gradient-to-b from-amber-50 to-amber-100 rounded-xl p-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {resourceItems.map(item => (
            <div key={item.key} className={`flex items-center gap-2 ${item.bgColor} rounded-lg px-3 py-2`}>
              <div className={`${item.color} text-white p-1.5 rounded-md`}>
                {item.icon}
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500 leading-none">{item.label}</p>
                <p className="font-bold text-slate-800 text-sm leading-tight">{item.value}</p>
              </div>
            </div>
          ))}
          
          {/* City stats */}
          <div className="flex items-center gap-4 ml-4 pl-4 border-l-2 border-amber-300">
            <div className="flex items-center gap-1.5 text-sm">
              <Home className="text-blue-500" size={16} />
              <span className="text-slate-600">{gameState?.population || 10}/{gameState?.max_population || 20}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Shield className="text-green-500" size={16} />
              <span className="text-slate-600">{gameState?.defense_power || 5}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Sword className="text-red-500" size={16} />
              <span className="text-slate-600">{gameState?.attack_power || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Seasonal Package Card
const SeasonalPackageCard = ({ pack, onPurchase }) => {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const updateTimer = () => {
      const end = new Date(pack.endDate);
      const now = new Date();
      const diff = end - now;
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft(`${days}d ${hours}h`);
      } else {
        setTimeLeft('Expirado');
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [pack.endDate]);
  
  return (
    <div className={`bg-gradient-to-br ${pack.theme} rounded-2xl p-1 shadow-xl transform hover:scale-105 transition-all cursor-pointer`}>
      <div className="bg-white/95 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">{pack.icon}</span>
          <div>
            <h3 className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              {pack.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                -{pack.discount}%
              </span>
              <span className="text-xs text-slate-500">Termina em {timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {pack.items.map((item, i) => (
            <div key={i} className="bg-slate-100 rounded-lg px-2 py-1 text-xs flex items-center gap-1">
              <span>{item.icon}</span>
              <span>{item.amount ? `${item.amount}` : item.name}</span>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => onPurchase(pack)}
          className={`w-full py-2 bg-gradient-to-r ${pack.theme} text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2`}
        >
          <Gift size={18} />
          <span className="line-through text-white/60 text-sm">€{(pack.price / (1 - pack.discount/100)).toFixed(2)}</span>
          <span>€{pack.price}</span>
        </button>
      </div>
    </div>
  );
};

// Seasonal Packages Panel
const SeasonalPackagesPanel = ({ onClose, onPurchase }) => {
  const currentMonth = new Date().getMonth();
  
  // Determine which packages are currently active
  const activePackages = Object.values(SEASONAL_PACKAGES).filter(pack => {
    const endDate = new Date(pack.endDate);
    return endDate > new Date();
  });
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            {[...Array(20)].map((_, i) => (
              <Sparkles 
                key={i}
                className="absolute animate-pulse"
                size={Math.random() * 20 + 10}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                <Gift size={28} />
                Pacotes Sazonais
              </h2>
              <p className="text-white/80 mt-1">Ofertas exclusivas por tempo limitado!</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition">
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activePackages.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {activePackages.map(pack => (
                <SeasonalPackageCard key={pack.id} pack={pack} onPurchase={onPurchase} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="mx-auto text-slate-300 mb-4" size={64} />
              <p className="text-slate-500">Não há pacotes disponíveis de momento.</p>
              <p className="text-sm text-slate-400 mt-2">Volta em breve para novas ofertas!</p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
              <Info size={18} />
              Como funcionam os Pacotes Sazonais?
            </h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Pacotes exclusivos disponíveis em épocas festivas</li>
              <li>• Inclui diamantes, moedas, skins e decorações especiais</li>
              <li>• Descontos especiais por tempo limitado</li>
              <li>• As skins aplicam-se automaticamente aos teus edifícios</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Building Detail Panel
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
  } : null;
  
  const canAfford = nextLevelCost && gameState && 
    gameState.coins >= nextLevelCost.coins &&
    (gameState.resources?.wood || 0) >= nextLevelCost.wood &&
    (gameState.resources?.stone || 0) >= nextLevelCost.stone &&
    (gameState.resources?.iron || 0) >= nextLevelCost.iron;
  
  const isProducing = building.producing;
  const productionTimer = gameState?.production_timers?.[building.id];
  const productionReady = productionTimer && new Date(productionTimer) <= new Date();
  
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header with building colors */}
        <div 
          className="p-6 text-white relative overflow-hidden"
          style={{ backgroundColor: config.roofColor }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-5xl bg-white/20 rounded-xl p-2">{config.icon || '🏗️'}</div>
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
            <p className="text-slate-600">{config.description || info.description || 'Edifício da cidade.'}</p>
          </div>
          
          {/* Level progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Nível de Evolução</span>
              <span className="font-bold text-slate-800">{level}/{maxLevel}</span>
            </div>
            <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full transition-all"
                style={{ 
                  width: `${(level / maxLevel) * 100}%`,
                  backgroundColor: config.roofColor
                }}
              />
            </div>
          </div>
          
          {/* Production section */}
          {info.produces && isBuilt && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                <Clock size={18} />
                Produção
              </h3>
              <p className="text-blue-600 text-sm mb-3">
                Produz {info.produces.amount * level} {info.produces.resource} a cada {Math.round(info.produces.time_minutes / level)} minutos
              </p>
              
              {!isProducing && !productionReady && (
                <button
                  onClick={() => onStartProduction(building.id)}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <Play size={18} />
                  Iniciar Produção
                </button>
              )}
              
              {isProducing && !productionReady && (
                <div className="flex items-center justify-center gap-2 py-3 bg-blue-200 text-blue-800 rounded-xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-800 border-t-transparent" />
                  A produzir...
                </div>
              )}
              
              {productionReady && (
                <button
                  onClick={() => onCollect(building.id)}
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 animate-pulse shadow-lg"
                >
                  <Check size={18} />
                  Recolher Recursos!
                </button>
              )}
            </div>
          )}
          
          {/* Upgrade section */}
          {level < maxLevel && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                <ChevronUp size={18} />
                {isBuilt ? `Melhorar para Nível ${level + 1}` : 'Construir'}
              </h3>
              
              {nextLevelCost && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${gameState?.coins >= nextLevelCost.coins ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    <Coins size={16} /> {nextLevelCost.coins}
                  </div>
                  {nextLevelCost.wood > 0 && (
                    <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${(gameState?.resources?.wood || 0) >= nextLevelCost.wood ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <TreePine size={16} /> {nextLevelCost.wood}
                    </div>
                  )}
                  {nextLevelCost.stone > 0 && (
                    <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${(gameState?.resources?.stone || 0) >= nextLevelCost.stone ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <Mountain size={16} /> {nextLevelCost.stone}
                    </div>
                  )}
                  {nextLevelCost.iron > 0 && (
                    <div className={`flex items-center gap-2 text-sm p-2 rounded-lg ${(gameState?.resources?.iron || 0) >= nextLevelCost.iron ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <Pickaxe size={16} /> {nextLevelCost.iron}
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => onUpgrade(building.id, nextLevelCost?.coins || 50)}
                disabled={!canAfford || loading}
                className={`w-full py-3 font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg ${
                  canAfford 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white hover:opacity-90' 
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ChevronUp size={18} />
                {isBuilt ? 'Melhorar Edifício' : 'Construir Edifício'}
              </button>
            </div>
          )}
          
          {level >= maxLevel && (
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
              <Check className="text-green-500 mx-auto mb-2" size={40} />
              <p className="font-bold text-green-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Nível Máximo Atingido!
              </p>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes scale-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

// Main Isometric City Component
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
  
  // Convert buildings object to array with positions
  const buildingsArray = Object.entries(gameState?.buildings || {}).map(([id, data]) => ({
    id,
    ...(typeof data === 'object' ? data : { level: data, x: 5, y: 5, producing: false })
  }));
  
  // Building positions on the grid (x, y in SVG coordinates)
  const buildingPositions = {
    town_hall: { x: 400, y: 200 },
    house: { x: 250, y: 150 },
    school: { x: 550, y: 150 },
    library: { x: 250, y: 280 },
    market: { x: 550, y: 280 },
    farm: { x: 140, y: 360 },
    lumber_mill: { x: 700, y: 150 },
    quarry: { x: 700, y: 280 },
    mine: { x: 760, y: 360 },
    barracks: { x: 400, y: 350 },
    wall: { x: 100, y: 200 },
    garden: { x: 400, y: 420 }
  };
  
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
      toast.success('Edifício melhorado com sucesso!', { icon: '🏗️' });
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
      toast.success(`Produção iniciada!`, { icon: '⚙️' });
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
      toast.success(`Recolheste ${response.data.amount} ${response.data.resource}!`, { icon: '📦' });
      setSelectedBuilding(null);
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao recolher recursos');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePurchasePackage = (pack) => {
    toast.info(`Pacote "${pack.name}" será adicionado ao carrinho!`, { icon: pack.icon });
    setShowPackages(false);
    // Here you would integrate with Stripe or your payment system
  };
  
  const wallLevel = buildingsArray.find(b => b.id === 'wall')?.level || 0;
  
  return (
    <div className="space-y-4">
      {/* Resource bar */}
      <ResourceBar gameState={gameState} />
      
      {/* Control buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}
            className="p-2 bg-white rounded-lg shadow hover:bg-slate-50 transition"
            title="Zoom In"
          >
            <ZoomIn size={20} className="text-slate-600" />
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(z - 0.1, 0.7))}
            className="p-2 bg-white rounded-lg shadow hover:bg-slate-50 transition"
            title="Zoom Out"
          >
            <ZoomOut size={20} className="text-slate-600" />
          </button>
          <button 
            onClick={() => setZoom(1)}
            className="p-2 bg-white rounded-lg shadow hover:bg-slate-50 transition"
            title="Reset View"
          >
            <RotateCcw size={20} className="text-slate-600" />
          </button>
        </div>
        
        <button
          onClick={() => setShowPackages(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          data-testid="seasonal-packages-btn"
        >
          <Gift size={20} />
          Pacotes Sazonais
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Novo!</span>
        </button>
      </div>
      
      {/* City view */}
      <div 
        className="bg-gradient-to-b from-sky-300 to-sky-100 rounded-3xl shadow-2xl overflow-hidden relative border-4 border-amber-700"
        style={{ height: '550px' }}
      >
        <svg 
          viewBox="0 0 900 500" 
          className="w-full h-full"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center', transition: 'transform 0.3s ease' }}
        >
          {/* Sky and atmosphere */}
          <Sky />
          
          {/* Terrain and ground */}
          <g transform="translate(0, 50)">
            <Terrain />
            
            {/* Castle Walls */}
            <CastleWalls wallLevel={wallLevel} />
            
            {/* Buildings */}
            {buildingsArray.map((building) => {
              const pos = buildingPositions[building.id] || { x: 450, y: 250 };
              const config = BUILDING_CONFIG[building.id] || {};
              
              return (
                <g 
                  key={building.id} 
                  transform={`translate(${pos.x - 50}, ${pos.y - 50})`}
                  data-testid={`building-${building.id}`}
                >
                  <MedievalBuilding
                    building={building}
                    config={config}
                    level={building.level || 0}
                    isSelected={selectedBuilding?.id === building.id}
                    isProducing={building.producing}
                    onClick={() => handleSelectBuilding(building)}
                  />
                </g>
              );
            })}
          </g>
        </svg>
        
        {/* City name banner */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 rounded-xl px-6 py-3 shadow-2xl border-2 border-amber-500">
            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              🏰 Reino de {gameState?.city_name || 'Aventureiro'}
            </h2>
          </div>
        </div>
        
        {/* Achievement notification area */}
        <div className="absolute top-4 left-4 space-y-2">
          {/* Example achievement - would be dynamic */}
        </div>
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
      
      {/* Seasonal packages panel */}
      {showPackages && (
        <SeasonalPackagesPanel 
          onClose={() => setShowPackages(false)} 
          onPurchase={handlePurchasePackage}
        />
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes cloud1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(30px); }
        }
        @keyframes cloud2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes cloud3 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(25px); }
        }
        @keyframes bird {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(50px) translateY(-10px); }
          50% { transform: translateX(100px) translateY(0); }
          75% { transform: translateX(150px) translateY(-5px); }
        }
        .animate-cloud1 { animation: cloud1 15s ease-in-out infinite; }
        .animate-cloud2 { animation: cloud2 20s ease-in-out infinite; }
        .animate-cloud3 { animation: cloud3 18s ease-in-out infinite; }
        .animate-bird { animation: bird 30s linear infinite; }
      `}</style>
    </div>
  );
};

export default IsometricCity;
