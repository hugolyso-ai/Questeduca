import React, { useState } from 'react';
import { MapPin, Users, Search, X } from 'lucide-react';

// Coordenadas simplificadas dos distritos de Portugal para o SVG
const DISTRICTS_PATHS = {
  "Viana do Castelo": { path: "M80,20 L120,25 L115,60 L75,55 Z", center: [95, 40] },
  "Braga": { path: "M120,25 L160,30 L155,70 L115,60 Z", center: [135, 48] },
  "Vila Real": { path: "M160,30 L210,35 L205,80 L155,70 Z", center: [180, 55] },
  "Bragança": { path: "M210,35 L280,45 L270,95 L205,80 Z", center: [240, 65] },
  "Porto": { path: "M75,55 L115,60 L110,110 L70,105 Z", center: [92, 82] },
  "Aveiro": { path: "M60,105 L110,110 L105,165 L55,160 Z", center: [82, 135] },
  "Viseu": { path: "M110,70 L205,80 L195,140 L105,130 Z", center: [150, 105] },
  "Guarda": { path: "M205,80 L270,95 L260,155 L195,140 Z", center: [230, 118] },
  "Coimbra": { path: "M55,160 L105,165 L100,220 L50,215 Z", center: [75, 188] },
  "Castelo Branco": { path: "M140,140 L260,155 L250,230 L130,210 Z", center: [190, 185] },
  "Leiria": { path: "M40,215 L100,220 L95,280 L35,275 Z", center: [65, 248] },
  "Santarém": { path: "M80,220 L190,230 L180,310 L70,295 Z", center: [130, 265] },
  "Lisboa": { path: "M30,295 L80,300 L75,360 L25,355 Z", center: [52, 328] },
  "Portalegre": { path: "M190,200 L260,210 L250,290 L180,275 Z", center: [218, 245] },
  "Setúbal": { path: "M25,355 L90,365 L85,420 L20,410 Z", center: [55, 388] },
  "Évora": { path: "M90,310 L200,330 L190,410 L80,390 Z", center: [140, 360] },
  "Beja": { path: "M80,390 L200,410 L190,500 L70,480 Z", center: [135, 445] },
  "Faro": { path: "M70,480 L200,500 L190,550 L60,530 Z", center: [130, 515] },
  "Açores": { path: "M320,100 L380,100 L380,140 L320,140 Z", center: [350, 120], island: true },
  "Madeira": { path: "M320,180 L380,180 L380,220 L320,220 Z", center: [350, 200], island: true }
};

// Cores por distrito
const DISTRICT_COLORS = {
  "Viana do Castelo": "#4CAF50",
  "Braga": "#2196F3",
  "Vila Real": "#9C27B0",
  "Bragança": "#FF9800",
  "Porto": "#E91E63",
  "Aveiro": "#00BCD4",
  "Viseu": "#8BC34A",
  "Guarda": "#FF5722",
  "Coimbra": "#3F51B5",
  "Castelo Branco": "#CDDC39",
  "Leiria": "#009688",
  "Santarém": "#FFC107",
  "Lisboa": "#F44336",
  "Portalegre": "#673AB7",
  "Setúbal": "#795548",
  "Évora": "#607D8B",
  "Beja": "#FF4081",
  "Faro": "#00E676",
  "Açores": "#536DFE",
  "Madeira": "#FF6D00"
};

const PortugalMap = ({ onDistrictSelect, selectedDistrict, studentsPerDistrict = {} }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  return (
    <div className="relative">
      <svg 
        viewBox="0 0 400 580" 
        className="w-full max-w-md mx-auto"
        style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
      >
        {/* Background */}
        <rect x="0" y="0" width="400" height="580" fill="#e3f2fd" rx="20" />
        
        {/* Ocean waves decoration */}
        <path d="M0,300 Q50,290 100,300 T200,300 T300,300 T400,300" fill="none" stroke="#90caf9" strokeWidth="2" opacity="0.5" />
        <path d="M0,320 Q50,310 100,320 T200,320 T300,320 T400,320" fill="none" stroke="#90caf9" strokeWidth="2" opacity="0.3" />

        {/* Districts */}
        {Object.entries(DISTRICTS_PATHS).map(([name, data]) => {
          const isSelected = selectedDistrict === name;
          const isHovered = hoveredDistrict === name;
          const studentCount = studentsPerDistrict[name] || 0;
          
          return (
            <g key={name}>
              <path
                d={data.path}
                fill={DISTRICT_COLORS[name]}
                stroke={isSelected ? '#1a1a1a' : '#fff'}
                strokeWidth={isSelected ? 3 : 1.5}
                opacity={isHovered || isSelected ? 1 : 0.75}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${data.center[0]}px ${data.center[1]}px`
                }}
                onClick={() => onDistrictSelect(name)}
                onMouseEnter={() => setHoveredDistrict(name)}
                onMouseLeave={() => setHoveredDistrict(null)}
                data-testid={`district-${name.replace(/\s/g, '-').toLowerCase()}`}
              />
              
              {/* Student count badge */}
              {studentCount > 0 && (
                <g transform={`translate(${data.center[0] - 10}, ${data.center[1] - 10})`}>
                  <circle cx="10" cy="10" r="12" fill="#fff" stroke={DISTRICT_COLORS[name]} strokeWidth="2" />
                  <text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill={DISTRICT_COLORS[name]}>
                    {studentCount > 99 ? '99+' : studentCount}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Labels for islands */}
        <text x="350" y="95" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#333">Açores</text>
        <text x="350" y="175" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#333">Madeira</text>
      </svg>

      {/* Hover tooltip */}
      {hoveredDistrict && (
        <div className="absolute top-4 left-4 bg-white rounded-xl shadow-lg p-3 pointer-events-none z-10">
          <p className="font-bold text-slate-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            {hoveredDistrict}
          </p>
          <p className="text-sm text-slate-500">
            {studentsPerDistrict[hoveredDistrict] || 0} alunos
          </p>
        </div>
      )}
    </div>
  );
};

// Main component for friend search with map
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
        {/* Search Bar */}
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

        {/* Selected District Badge */}
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

        {/* Map */}
        {showMap && (
          <div className="mb-6">
            <PortugalMap
              selectedDistrict={selectedDistrict}
              onDistrictSelect={handleDistrictSelect}
              studentsPerDistrict={{}}
            />
          </div>
        )}

        {/* Search Results */}
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

        {/* Empty State */}
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
