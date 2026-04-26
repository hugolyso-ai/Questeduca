import React, { useState } from 'react';
import { MapPin, Users, Search, X } from 'lucide-react';

// Cores dos distritos conforme a imagem de referência
const DISTRICT_COLORS = {
  "Viana do Castelo": "#4CAF50", // Verde
  "Braga": "#9C27B0", // Roxo
  "Vila Real": "#CE93D8", // Roxo claro/Lavanda
  "Bragança": "#D32F2F", // Vermelho
  "Porto": "#FFEB3B", // Amarelo
  "Aveiro": "#FFF9C4", // Amarelo claro/Bege
  "Viseu": "#F8BBD9", // Rosa
  "Guarda": "#FF9800", // Laranja
  "Coimbra": "#009688", // Verde azulado/Teal
  "Castelo Branco": "#2196F3", // Azul
  "Leiria": "#E53935", // Vermelho
  "Santarém": "#795548", // Castanho
  "Lisboa": "#FFF59D", // Amarelo claro
  "Portalegre": "#E1BEE7", // Roxo claro/Lavanda
  "Setúbal": "#FFB74D", // Laranja
  "Évora": "#81C784", // Verde
  "Beja": "#F48FB1", // Rosa
  "Faro": "#FFD54F", // Amarelo/Dourado
  "Açores": "#FF7043", // Laranja-castanho
  "Madeira": "#D32F2F" // Vermelho
};

// Mapa de Portugal realista baseado na imagem de referência
const PortugalMap = ({ onDistrictSelect, selectedDistrict, studentsPerDistrict = {} }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // SVG paths realistas para cada distrito de Portugal Continental
  // Baseados nos contornos reais dos distritos portugueses
  const DISTRICTS = {
    "Viana do Castelo": {
      path: "M122,28 L130,22 L145,18 L162,22 L175,32 L182,45 L178,58 L168,72 L155,82 L140,85 L125,78 L118,65 L115,50 L118,38 Z",
      labelPos: [148, 52],
      labelLines: ["VIANA DO", "CASTELO"]
    },
    "Braga": {
      path: "M155,82 L168,72 L178,58 L195,52 L210,58 L218,72 L215,88 L205,102 L188,108 L172,105 L158,98 L150,88 Z",
      labelPos: [182, 85],
      labelLines: ["BRAGA"]
    },
    "Vila Real": {
      path: "M195,52 L210,42 L228,35 L248,32 L268,38 L280,52 L282,68 L275,85 L260,98 L242,105 L225,102 L215,88 L218,72 L210,58 Z",
      labelPos: [248, 68],
      labelLines: ["VILA REAL"]
    },
    "Bragança": {
      path: "M268,38 L288,28 L310,22 L332,25 L352,35 L362,52 L365,72 L358,92 L345,108 L325,118 L302,122 L282,115 L275,98 L275,85 L282,68 L280,52 Z",
      labelPos: [320, 72],
      labelLines: ["BRAGANÇA"]
    },
    "Porto": {
      path: "M118,85 L140,85 L155,95 L172,105 L175,122 L168,138 L152,148 L135,152 L118,145 L108,128 L105,110 L110,95 Z",
      labelPos: [138, 118],
      labelLines: ["PORTO"]
    },
    "Aveiro": {
      path: "M95,145 L118,145 L135,152 L152,148 L168,155 L178,172 L175,192 L165,212 L148,222 L128,225 L110,218 L95,202 L88,182 L88,162 Z",
      labelPos: [132, 185],
      labelLines: ["AVEIRO"]
    },
    "Viseu": {
      path: "M168,138 L188,108 L205,102 L225,102 L260,98 L282,115 L285,135 L278,158 L262,178 L242,188 L218,192 L195,185 L178,172 L168,155 Z",
      labelPos: [225, 148],
      labelLines: ["VISEU"]
    },
    "Guarda": {
      path: "M282,115 L302,122 L325,118 L345,125 L358,145 L362,172 L355,198 L338,218 L315,228 L292,225 L275,212 L268,188 L275,165 L278,158 L285,135 Z",
      labelPos: [315, 172],
      labelLines: ["GUARDA"]
    },
    "Coimbra": {
      path: "M88,202 L110,218 L128,225 L148,222 L165,232 L178,252 L172,278 L155,298 L132,308 L108,305 L88,288 L78,265 L78,238 L82,218 Z",
      labelPos: [125, 262],
      labelLines: ["COIMBRA"]
    },
    "Castelo Branco": {
      path: "M172,248 L195,235 L218,232 L268,228 L292,245 L308,268 L312,298 L302,328 L275,348 L245,352 L215,345 L188,325 L175,295 L168,268 Z",
      labelPos: [242, 288],
      labelLines: ["CASTELO", "BRANCO"]
    },
    "Leiria": {
      path: "M68,285 L88,288 L108,305 L132,308 L155,298 L172,315 L178,342 L168,372 L148,392 L122,398 L98,388 L78,365 L68,335 L65,308 Z",
      labelPos: [118, 348],
      labelLines: ["LEIRIA"]
    },
    "Santarém": {
      path: "M148,372 L178,342 L188,352 L215,345 L245,352 L268,375 L275,405 L262,438 L235,458 L202,462 L172,448 L152,418 L145,392 Z",
      labelPos: [208, 405],
      labelLines: ["SANTARÉM"]
    },
    "Lisboa": {
      path: "M58,388 L78,365 L98,388 L122,398 L145,392 L152,418 L148,448 L135,478 L112,495 L85,492 L62,475 L52,448 L48,418 Z",
      labelPos: [98, 442],
      labelLines: ["LISBON"]
    },
    "Portalegre": {
      path: "M268,328 L302,328 L338,338 L362,358 L372,388 L368,422 L352,448 L325,458 L295,455 L268,438 L255,408 L258,372 Z",
      labelPos: [315, 392],
      labelLines: ["PORTALEGRE"]
    },
    "Setúbal": {
      path: "M52,492 L85,492 L112,495 L135,508 L148,538 L142,572 L125,598 L98,612 L68,608 L48,585 L42,552 L42,518 Z",
      labelPos: [92, 548],
      labelLines: ["SETÚBAL"]
    },
    "Évora": {
      path: "M135,478 L172,462 L235,458 L275,472 L295,505 L288,545 L265,572 L228,582 L188,575 L155,555 L138,522 L135,495 Z",
      labelPos: [215, 518],
      labelLines: ["ÉVORA"]
    },
    "Beja": {
      path: "M98,612 L125,598 L155,585 L188,575 L228,582 L265,598 L285,632 L278,668 L255,698 L218,712 L175,708 L138,688 L112,658 L98,635 Z",
      labelPos: [188, 648],
      labelLines: ["BEJA"]
    },
    "Faro": {
      path: "M112,688 L138,688 L175,708 L218,712 L255,718 L288,732 L298,758 L282,782 L242,795 L195,798 L148,788 L112,768 L105,738 L108,712 Z",
      labelPos: [195, 758],
      labelLines: ["FARO"]
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-[#8ec5d6] via-[#a8d5e5] to-[#7bb8cc] rounded-3xl p-4 overflow-hidden shadow-inner">
      {/* Textos do oceano decorativos */}
      <div className="absolute top-20 left-2 text-[#5a9ab0] text-xs font-bold tracking-wider opacity-60 transform -rotate-12">
        ATLANTIC
        <br/>
        OCEAN
      </div>
      <div className="absolute bottom-1/4 left-2 text-[#5a9ab0] text-xs font-bold tracking-wider opacity-60 transform -rotate-12">
        ATLANTIC
        <br/>
        OCEAN
      </div>
      <div className="absolute top-1/2 right-2 text-[#6b8577] text-sm font-bold tracking-wider opacity-50">
        SPAIN
      </div>

      <svg viewBox="0 0 420 850" className="w-full max-w-md mx-auto drop-shadow-sm">
        {/* Definições de gradientes e filtros */}
        <defs>
          <filter id="oceanWave" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
          </filter>
          <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8ec5d6" />
            <stop offset="50%" stopColor="#a8d5e5" />
            <stop offset="100%" stopColor="#7bb8cc" />
          </linearGradient>
          <filter id="districtShadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.2"/>
          </filter>
        </defs>

        {/* Fundo do oceano */}
        <rect x="0" y="0" width="420" height="850" fill="url(#oceanGradient)" />
        
        {/* Ondas decorativas do oceano */}
        <g opacity="0.3">
          <path d="M0,150 Q40,140 80,150 T160,150 T240,150" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,180 Q50,170 100,180 T200,180" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,420 Q60,410 120,420 T240,420" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,580 Q45,570 90,580 T180,580" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,720 Q35,710 70,720 T140,720" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* ============ AÇORES (Caixa no topo esquerdo) ============ */}
        <g transform="translate(8, 25)">
          {/* Caixa de fundo */}
          <rect x="0" y="0" width="105" height="95" rx="8" ry="8" 
            fill="#c4e3ed" stroke="#7ab3c7" strokeWidth="1.5" />
          
          {/* Título */}
          <text x="52" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3d6d7a" letterSpacing="1">
            AZORES
          </text>
          
          {/* Ilhas dos Açores - 9 ilhas principais */}
          {/* Grupo Ocidental: Flores e Corvo */}
          <ellipse cx="18" cy="42" rx="8" ry="4" fill="#FF7043" stroke="#c45a3a" strokeWidth="1" 
            className="cursor-pointer hover:brightness-110 transition-all"
            onClick={() => onDistrictSelect && onDistrictSelect("Açores")}
          />
          <ellipse cx="20" cy="32" rx="4" ry="2" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" 
            className="cursor-pointer hover:brightness-110 transition-all"
            onClick={() => onDistrictSelect && onDistrictSelect("Açores")}
          />
          
          {/* Grupo Central: Terceira, Graciosa, São Jorge, Pico, Faial */}
          <ellipse cx="45" cy="38" rx="6" ry="3" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" />
          <ellipse cx="55" cy="32" rx="4" ry="2" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" />
          <ellipse cx="62" cy="45" rx="10" ry="3" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" transform="rotate(-15 62 45)" />
          <ellipse cx="58" cy="55" rx="8" ry="4" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" transform="rotate(10 58 55)" />
          <ellipse cx="72" cy="50" rx="5" ry="3" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" />
          
          {/* Grupo Oriental: São Miguel e Santa Maria */}
          <ellipse cx="88" cy="58" rx="10" ry="4" fill="#FF7043" stroke="#c45a3a" strokeWidth="1" 
            className="cursor-pointer hover:brightness-110 transition-all"
            onClick={() => onDistrictSelect && onDistrictSelect("Açores")}
          />
          <ellipse cx="95" cy="70" rx="5" ry="2.5" fill="#FF7043" stroke="#c45a3a" strokeWidth="0.8" />
          
          {/* Linha tracejada decorativa */}
          <line x1="105" y1="65" x2="118" y2="85" stroke="#7ab3c7" strokeWidth="1" strokeDasharray="3,2" />
          
          <text x="52" y="88" textAnchor="middle" fontSize="6" fill="#5a8a9a" letterSpacing="0.5">
            ATLANTIC OCEAN
          </text>
        </g>

        {/* ============ MADEIRA (Caixa no fundo esquerdo) ============ */}
        <g transform="translate(8, 620)">
          {/* Caixa de fundo */}
          <rect x="0" y="0" width="105" height="105" rx="8" ry="8" 
            fill="#c4e3ed" stroke="#7ab3c7" strokeWidth="1.5" />
          
          {/* Título */}
          <text x="52" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#3d6d7a" letterSpacing="1">
            MADEIRA
          </text>
          
          {/* Ilha da Madeira (principal) */}
          <ellipse cx="52" cy="52" rx="38" ry="14" fill="#D32F2F" stroke="#a02525" strokeWidth="1.5" 
            className="cursor-pointer hover:brightness-110 transition-all"
            onClick={() => onDistrictSelect && onDistrictSelect("Madeira")}
          />
          
          {/* Porto Santo */}
          <ellipse cx="88" cy="32" rx="8" ry="4" fill="#ef5350" stroke="#a02525" strokeWidth="1" 
            className="cursor-pointer hover:brightness-110 transition-all"
            onClick={() => onDistrictSelect && onDistrictSelect("Madeira")}
          />
          
          {/* Ilhas Desertas */}
          <ellipse cx="78" cy="72" rx="4" ry="1.5" fill="#e57373" stroke="#a02525" strokeWidth="0.5" />
          <ellipse cx="82" cy="78" rx="3" ry="1" fill="#e57373" stroke="#a02525" strokeWidth="0.5" />
          
          <text x="52" y="98" textAnchor="middle" fontSize="6" fill="#5a8a9a" letterSpacing="0.5">
            ATLANTIC OCEAN
          </text>
        </g>

        {/* ============ PORTUGAL CONTINENTAL ============ */}
        <g transform="translate(25, -5)" filter="url(#districtShadow)">
          {Object.entries(DISTRICTS).map(([name, data]) => {
            const isSelected = selectedDistrict === name;
            const isHovered = hoveredDistrict === name;
            const studentCount = studentsPerDistrict[name] || 0;
            
            return (
              <g key={name}>
                {/* Path do distrito */}
                <path
                  d={data.path}
                  fill={DISTRICT_COLORS[name]}
                  stroke={isSelected ? '#1a1a1a' : isHovered ? '#444' : '#555'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
                  strokeLinejoin="round"
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    filter: isHovered ? 'brightness(1.12) saturate(1.1)' : 'none',
                    transform: isHovered ? 'scale(1.01)' : 'scale(1)',
                    transformOrigin: `${data.labelPos[0]}px ${data.labelPos[1]}px`
                  }}
                  onClick={() => onDistrictSelect && onDistrictSelect(name)}
                  onMouseEnter={() => setHoveredDistrict(name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  data-testid={`district-${name.replace(/\s/g, '-').toLowerCase()}`}
                />
                
                {/* Label do distrito */}
                <text
                  x={data.labelPos[0]}
                  y={data.labelPos[1]}
                  textAnchor="middle"
                  fontSize={name.length > 12 ? "7" : "8"}
                  fontWeight="600"
                  fill="#2d2d2d"
                  style={{ 
                    pointerEvents: 'none',
                    textShadow: '0.5px 0.5px 1px rgba(255,255,255,0.8)',
                    letterSpacing: '0.3px'
                  }}
                >
                  {data.labelLines ? (
                    data.labelLines.map((line, i) => (
                      <tspan key={i} x={data.labelPos[0]} dy={i === 0 ? 0 : 10}>
                        {line}
                      </tspan>
                    ))
                  ) : (
                    name.toUpperCase()
                  )}
                </text>
                
                {/* Badge de contagem de estudantes */}
                {studentCount > 0 && (
                  <g transform={`translate(${data.labelPos[0] + 18}, ${data.labelPos[1] - 12})`}>
                    <circle cx="0" cy="0" r="9" fill="#fff" stroke={DISTRICT_COLORS[name]} strokeWidth="1.5" />
                    <text x="0" y="3" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#333">
                      {studentCount > 99 ? '99+' : studentCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip flutuante ao hover */}
      {hoveredDistrict && (
        <div 
          className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 pointer-events-none z-20 border border-slate-200/50"
          style={{ minWidth: '160px' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
              style={{ backgroundColor: DISTRICT_COLORS[hoveredDistrict] }}
            />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              {hoveredDistrict}
            </span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Users size={12} />
            {studentsPerDistrict[hoveredDistrict] || 0} alunos registados
          </p>
        </div>
      )}
    </div>
  );
};

// Componente principal para pesquisa de amigos com mapa
const PortugalFriendMap = ({ onSearch, searchResults = [], onSendRequest, loading }) => {
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(true);

  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district);
    onSearch({ district });
  };

  const handleSearchSubmit = () => {
    onSearch({ 
      district: selectedDistrict, 
      query: searchQuery 
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <MapPin size={24} />
              Mapa de Portugal
            </h3>
            <p className="text-white/80 text-sm mt-1">
              Clica num distrito para encontrar amigos
            </p>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-white/20 rounded-xl hover:bg-white/30 transition text-sm font-semibold backdrop-blur-sm"
            data-testid="toggle-map-btn"
          >
            {showMap ? 'Esconder Mapa' : 'Mostrar Mapa'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Barra de pesquisa */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome ou escola..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-700 placeholder:text-slate-400"
              data-testid="map-search-input"
            />
          </div>
          <button
            onClick={handleSearchSubmit}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="map-search-btn"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : (
              'Pesquisar'
            )}
          </button>
        </div>

        {/* Badge do distrito selecionado */}
        {selectedDistrict && (
          <div className="mb-4 flex items-center gap-2 animate-fadeIn">
            <span className="text-sm text-slate-500">Distrito selecionado:</span>
            <span 
              className="px-4 py-1.5 rounded-full text-white text-sm font-semibold flex items-center gap-2 shadow-md"
              style={{ backgroundColor: DISTRICT_COLORS[selectedDistrict] }}
            >
              <MapPin size={14} />
              {selectedDistrict}
              <button 
                onClick={() => setSelectedDistrict(null)} 
                className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition"
                data-testid="clear-district-btn"
              >
                <X size={14} />
              </button>
            </span>
          </div>
        )}

        {/* Mapa */}
        {showMap && (
          <div className="mb-6 transition-all duration-300">
            <PortugalMap
              selectedDistrict={selectedDistrict}
              onDistrictSelect={handleDistrictSelect}
              studentsPerDistrict={{}}
            />
          </div>
        )}

        {/* Resultados da pesquisa */}
        {searchResults.length > 0 && (
          <div className="animate-fadeIn">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <Users size={20} className="text-teal-600" />
              Resultados ({searchResults.length})
            </h4>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {searchResults.map(student => (
                <div
                  key={student.user_id}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl hover:from-slate-100 hover:to-slate-200 transition-all group border border-slate-100"
                  data-testid={`search-result-${student.user_id}`}
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform"
                    style={{ 
                      backgroundColor: DISTRICT_COLORS[student.district] || '#6366f1',
                      boxShadow: `0 4px 14px ${DISTRICT_COLORS[student.district] || '#6366f1'}40`
                    }}
                  >
                    {student.nickname?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-slate-800 truncate">{student.nickname || 'Anónimo'}</h5>
                    <p className="text-sm text-slate-500 truncate">
                      {student.school_name || 'Escola não especificada'} 
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: DISTRICT_COLORS[student.district] || '#6366f1' }}
                      >
                        {student.district || 'Portugal'}
                      </span>
                      <span className="text-xs text-slate-400">Nível {student.level || 1}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onSendRequest(student.user_id)}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap"
                    data-testid={`map-add-friend-${student.user_id}`}
                  >
                    Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {searchResults.length === 0 && selectedDistrict && !loading && (
          <div className="text-center py-10 animate-fadeIn">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-600 font-medium">Nenhum aluno encontrado em {selectedDistrict}</p>
            <p className="text-sm text-slate-400 mt-2">Tenta outro distrito ou pesquisa por nome</p>
          </div>
        )}
      </div>

      {/* CSS para animações */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export { PortugalMap, PortugalFriendMap, DISTRICT_COLORS };
