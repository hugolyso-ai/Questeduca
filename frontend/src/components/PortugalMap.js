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

// Mapa de Portugal com SVG paths mais realistas
const PortugalMap = ({ onDistrictSelect, selectedDistrict, studentsPerDistrict = {} }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  // Paths mais realistas para os distritos de Portugal
  const DISTRICTS = {
    "Viana do Castelo": {
      path: "M145,35 L180,25 L200,35 L210,55 L195,75 L165,80 L145,70 L130,55 Z",
      labelPos: [165, 55]
    },
    "Braga": {
      path: "M165,80 L195,75 L220,90 L230,115 L210,130 L180,125 L160,110 L150,90 Z",
      labelPos: [185, 105]
    },
    "Vila Real": {
      path: "M210,55 L260,45 L290,60 L300,85 L280,110 L250,115 L230,115 L220,90 L195,75 Z",
      labelPos: [250, 85]
    },
    "Bragança": {
      path: "M290,60 L340,40 L380,55 L390,95 L370,130 L330,140 L300,120 L300,85 Z",
      labelPos: [340, 90]
    },
    "Porto": {
      path: "M130,90 L160,110 L180,125 L175,155 L150,165 L120,150 L115,120 Z",
      labelPos: [145, 135]
    },
    "Aveiro": {
      path: "M115,150 L150,165 L175,155 L185,185 L170,215 L140,220 L115,200 L105,170 Z",
      labelPos: [145, 190]
    },
    "Viseu": {
      path: "M175,155 L210,130 L250,115 L280,130 L285,170 L260,200 L220,205 L185,185 Z",
      labelPos: [230, 170]
    },
    "Guarda": {
      path: "M280,110 L330,140 L350,180 L340,220 L300,230 L270,210 L260,170 L280,130 Z",
      labelPos: [305, 175]
    },
    "Coimbra": {
      path: "M105,200 L140,220 L170,215 L185,245 L165,280 L130,285 L100,260 L95,225 Z",
      labelPos: [140, 250]
    },
    "Castelo Branco": {
      path: "M185,205 L260,200 L300,230 L310,280 L280,320 L230,325 L195,295 L175,255 Z",
      labelPos: [245, 265]
    },
    "Leiria": {
      path: "M85,260 L130,285 L165,280 L175,320 L155,360 L120,365 L90,340 L75,295 Z",
      labelPos: [125, 320]
    },
    "Santarém": {
      path: "M155,320 L195,295 L230,325 L250,370 L230,420 L185,430 L155,400 L140,360 Z",
      labelPos: [195, 370]
    },
    "Lisboa": {
      path: "M75,360 L120,365 L140,400 L130,450 L100,470 L65,450 L55,410 L60,375 Z",
      labelPos: [95, 420]
    },
    "Portalegre": {
      path: "M250,320 L310,280 L360,310 L365,370 L340,410 L290,405 L260,380 Z",
      labelPos: [310, 350]
    },
    "Setúbal": {
      path: "M65,470 L100,470 L130,490 L150,540 L130,580 L90,590 L60,560 L50,510 Z",
      labelPos: [100, 530]
    },
    "Évora": {
      path: "M130,450 L185,430 L260,420 L290,470 L275,530 L220,545 L165,530 L140,490 Z",
      labelPos: [215, 485]
    },
    "Beja": {
      path: "M130,580 L165,560 L220,545 L275,570 L290,630 L260,680 L190,690 L140,660 L110,620 Z",
      labelPos: [200, 620]
    },
    "Faro": {
      path: "M140,690 L190,690 L260,700 L300,720 L280,760 L200,770 L130,755 L110,720 Z",
      labelPos: [200, 735]
    }
  };

  return (
    <div className="relative bg-[#a8d5e5] rounded-3xl p-4 overflow-hidden">
      {/* Textos do oceano */}
      <div className="absolute top-32 left-4 text-[#6b9eb3] text-sm font-semibold italic opacity-70">
        ATLANTIC<br/>OCEAN
      </div>
      <div className="absolute bottom-40 right-8 text-[#8b7355] text-sm font-semibold italic opacity-70">
        SPAIN
      </div>

      <svg viewBox="0 0 450 800" className="w-full max-w-md mx-auto">
        {/* Fundo do oceano */}
        <rect x="0" y="0" width="450" height="800" fill="#a8d5e5" />
        
        {/* Ondas decorativas */}
        <path d="M0,200 Q30,190 60,200 T120,200 T180,200" fill="none" stroke="#8fc9db" strokeWidth="3" opacity="0.5" />
        <path d="M0,450 Q40,440 80,450 T160,450" fill="none" stroke="#8fc9db" strokeWidth="3" opacity="0.5" />

        {/* Caixa dos Açores - Topo esquerdo */}
        <g transform="translate(10, 30)">
          <rect x="0" y="0" width="110" height="90" fill="#b8dce8" stroke="#7ab3c7" strokeWidth="2" rx="5" />
          <text x="55" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4a7a8a">AZORES</text>
          
          {/* Ilhas dos Açores */}
          <ellipse cx="25" cy="40" rx="12" ry="6" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="50" cy="35" rx="8" ry="4" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="45" cy="50" rx="6" ry="3" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="70" cy="45" rx="10" ry="5" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="90" cy="38" rx="7" ry="4" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="85" cy="55" rx="5" ry="3" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="60" cy="65" rx="9" ry="4" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          <ellipse cx="30" cy="60" rx="6" ry="3" fill={DISTRICT_COLORS["Açores"]} stroke="#c45a3a" strokeWidth="1" />
          
          {/* Linha tracejada de ligação */}
          <line x1="110" y1="60" x2="140" y2="80" stroke="#7ab3c7" strokeWidth="1" strokeDasharray="4,3" />
          
          <text x="55" y="82" textAnchor="middle" fontSize="8" fill="#5a8a9a">ATLANTIC OCEAN</text>
        </g>

        {/* Caixa da Madeira - Fundo esquerdo */}
        <g transform="translate(10, 580)">
          <rect x="0" y="0" width="110" height="100" fill="#b8dce8" stroke="#7ab3c7" strokeWidth="2" rx="5" />
          <text x="55" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4a7a8a">MADEIRA</text>
          
          {/* Ilha da Madeira */}
          <ellipse cx="55" cy="50" rx="40" ry="15" fill={DISTRICT_COLORS["Madeira"]} stroke="#a02525" strokeWidth="1.5" />
          {/* Porto Santo */}
          <ellipse cx="90" cy="35" rx="8" ry="4" fill="#f44336" stroke="#a02525" strokeWidth="1" />
          {/* Desertas */}
          <ellipse cx="75" cy="70" rx="4" ry="2" fill="#ef5350" stroke="#a02525" strokeWidth="0.5" />
          
          <text x="55" y="92" textAnchor="middle" fontSize="8" fill="#5a8a9a">ATLANTIC OCEAN</text>
        </g>

        {/* Portugal Continental */}
        <g transform="translate(40, 0)">
          {Object.entries(DISTRICTS).map(([name, data]) => {
            const isSelected = selectedDistrict === name;
            const isHovered = hoveredDistrict === name;
            const studentCount = studentsPerDistrict[name] || 0;
            
            return (
              <g key={name}>
                <path
                  d={data.path}
                  fill={DISTRICT_COLORS[name]}
                  stroke={isSelected ? '#1a1a1a' : '#666'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  opacity={isHovered || isSelected ? 1 : 0.9}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    filter: isHovered ? 'brightness(1.1)' : 'none'
                  }}
                  onClick={() => onDistrictSelect && onDistrictSelect(name)}
                  onMouseEnter={() => setHoveredDistrict(name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  data-testid={`district-${name.replace(/\s/g, '-').toLowerCase()}`}
                />
                
                {/* Nome do distrito */}
                <text
                  x={data.labelPos[0]}
                  y={data.labelPos[1]}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill="#333"
                  style={{ 
                    pointerEvents: 'none',
                    textShadow: '1px 1px 2px white'
                  }}
                >
                  {name.toUpperCase().split(' ').map((word, i) => (
                    <tspan key={i} x={data.labelPos[0]} dy={i === 0 ? 0 : 12}>
                      {word}
                    </tspan>
                  ))}
                </text>
                
                {/* Badge de contagem de alunos */}
                {studentCount > 0 && (
                  <g transform={`translate(${data.labelPos[0] + 20}, ${data.labelPos[1] - 15})`}>
                    <circle cx="0" cy="0" r="10" fill="#fff" stroke={DISTRICT_COLORS[name]} strokeWidth="2" />
                    <text x="0" y="4" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#333">
                      {studentCount > 99 ? '99+' : studentCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip de hover */}
      {hoveredDistrict && (
        <div className="absolute top-4 right-4 bg-white rounded-xl shadow-lg p-3 pointer-events-none z-10 border-2 border-slate-200">
          <div 
            className="w-4 h-4 rounded-full inline-block mr-2"
            style={{ backgroundColor: DISTRICT_COLORS[hoveredDistrict] }}
          />
          <span className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {hoveredDistrict}
          </span>
          <p className="text-sm text-slate-500 mt-1">
            {studentsPerDistrict[hoveredDistrict] || 0} alunos
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
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <MapPin className="inline mr-2" size={24} />
              Mapa de Portugal
            </h3>
            <p className="text-white/80 text-sm mt-1">
              Clica num distrito para encontrar amigos
            </p>
          </div>
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition text-sm font-semibold"
          >
            {showMap ? 'Esconder Mapa' : 'Mostrar Mapa'}
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Barra de pesquisa */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
              data-testid="map-search-input"
            />
          </div>
          <button
            onClick={handleSearchSubmit}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-50"
            data-testid="map-search-btn"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              'Pesquisar'
            )}
          </button>
        </div>

        {/* Badge do distrito selecionado */}
        {selectedDistrict && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-slate-500">Distrito selecionado:</span>
            <span 
              className="px-3 py-1 rounded-full text-white text-sm font-semibold flex items-center gap-2"
              style={{ backgroundColor: DISTRICT_COLORS[selectedDistrict] }}
            >
              {selectedDistrict}
              <button onClick={() => setSelectedDistrict(null)} className="hover:opacity-75">
                <X size={14} />
              </button>
            </span>
          </div>
        )}

        {/* Mapa */}
        {showMap && (
          <div className="mb-6">
            <PortugalMap
              selectedDistrict={selectedDistrict}
              onDistrictSelect={handleDistrictSelect}
              studentsPerDistrict={{}}
            />
          </div>
        )}

        {/* Resultados da pesquisa */}
        {searchResults.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-800 mb-3" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              <Users className="inline mr-2" size={18} />
              Resultados ({searchResults.length})
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {searchResults.map(student => (
                <div
                  key={student.user_id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: DISTRICT_COLORS[student.district] || '#6366f1' }}
                  >
                    {student.nickname?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-800">{student.nickname}</h5>
                    <p className="text-sm text-slate-500">
                      {student.school_name} • {student.district}
                    </p>
                    <p className="text-xs text-slate-400">Nível {student.level}</p>
                  </div>
                  <button
                    onClick={() => onSendRequest(student.user_id)}
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition text-sm"
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
          <div className="text-center py-8">
            <MapPin className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="text-slate-500">Nenhum aluno encontrado em {selectedDistrict}</p>
            <p className="text-sm text-slate-400 mt-1">Tenta outro distrito ou pesquisa por nome</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { PortugalMap, PortugalFriendMap, DISTRICT_COLORS };
