import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Users, Search, X, ChevronDown, School, UserPlus, Check, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

// Cores dos distritos conforme a imagem de referência
const DISTRICT_COLORS = {
  "Viana do Castelo": "#4CAF50",
  "Braga": "#9C27B0",
  "Vila Real": "#CE93D8",
  "Bragança": "#D32F2F",
  "Porto": "#FFEB3B",
  "Aveiro": "#FFF9C4",
  "Viseu": "#F8BBD9",
  "Guarda": "#FF9800",
  "Coimbra": "#009688",
  "Castelo Branco": "#2196F3",
  "Leiria": "#E53935",
  "Santarém": "#795548",
  "Lisboa": "#FFF59D",
  "Portalegre": "#E1BEE7",
  "Setúbal": "#FFB74D",
  "Évora": "#81C784",
  "Beja": "#F48FB1",
  "Faro": "#FFD54F",
  "Açores": "#FF7043",
  "Madeira": "#D32F2F"
};

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
    labelLines: ["LISBOA"]
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

const PortugalMap = ({ onDistrictSelect, selectedDistrict, studentsPerDistrict = {}, friendPins = [] }) => {
  const [hoveredDistrict, setHoveredDistrict] = useState(null);

  return (
    <div className="relative bg-gradient-to-br from-[#8ec5d6] via-[#a8d5e5] to-[#7bb8cc] rounded-3xl p-4 overflow-hidden shadow-inner">
      <svg viewBox="0 0 420 850" className="w-full max-w-md mx-auto drop-shadow-sm">
        <defs>
          <linearGradient id="oceanGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8ec5d6" />
            <stop offset="50%" stopColor="#a8d5e5" />
            <stop offset="100%" stopColor="#7bb8cc" />
          </linearGradient>
          <filter id="districtShadow2" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.2"/>
          </filter>
        </defs>

        <rect x="0" y="0" width="420" height="850" fill="url(#oceanGradient2)" />

        <g opacity="0.3">
          <path d="M0,150 Q40,140 80,150 T160,150 T240,150" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,420 Q60,410 120,420 T240,420" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
          <path d="M0,580 Q45,570 90,580 T180,580" fill="none" stroke="#6ba8bc" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(25, -5)" filter="url(#districtShadow2)">
          {Object.entries(DISTRICTS).map(([name, data]) => {
            const isSelected = selectedDistrict === name;
            const isHovered = hoveredDistrict === name;
            const studentCount = studentsPerDistrict[name] || 0;
            const friendsHere = friendPins.filter(f => f.district === name);

            return (
              <g key={name}>
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
                  }}
                  onClick={() => onDistrictSelect && onDistrictSelect(name)}
                  onMouseEnter={() => setHoveredDistrict(name)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
                <text
                  x={data.labelPos[0]}
                  y={data.labelPos[1]}
                  textAnchor="middle"
                  fontSize={name.length > 12 ? "7" : "8"}
                  fontWeight="600"
                  fill="#2d2d2d"
                  style={{ pointerEvents: 'none', textShadow: '0.5px 0.5px 1px rgba(255,255,255,0.8)' }}
                >
                  {data.labelLines ? (
                    data.labelLines.map((line, i) => (
                      <tspan key={i} x={data.labelPos[0]} dy={i === 0 ? 0 : 10}>{line}</tspan>
                    ))
                  ) : (
                    name.toUpperCase()
                  )}
                </text>

                {studentCount > 0 && (
                  <g transform={`translate(${data.labelPos[0] + 18}, ${data.labelPos[1] - 12})`}>
                    <circle cx="0" cy="0" r="9" fill="#fff" stroke={DISTRICT_COLORS[name]} strokeWidth="1.5" />
                    <text x="0" y="3" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#333">
                      {studentCount > 99 ? '99+' : studentCount}
                    </text>
                  </g>
                )}

                {friendsHere.map((f, i) => (
                  <g
                    key={f.friend_id}
                    transform={`translate(${data.labelPos[0] - 20 + (i % 3) * 12}, ${data.labelPos[1] + 10 + Math.floor(i / 3) * 10})`}
                    className="cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); onDistrictSelect && onDistrictSelect(name); }}
                  >
                    <circle r="5" fill="#e11d48" stroke="#fff" strokeWidth="1.5">
                      <animate attributeName="r" values="4.5;6;4.5" dur="2s" repeatCount="indefinite" begin={`${(i % 5) * 0.3}s`} />
                    </circle>
                    <title>{f.nickname}</title>
                  </g>
                ))}
              </g>
            );
          })}
        </g>
      </svg>

      {hoveredDistrict && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 pointer-events-none z-20 border border-slate-200/50" style={{ minWidth: '160px' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: DISTRICT_COLORS[hoveredDistrict] }} />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>{hoveredDistrict}</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Users size={12} />
            {studentsPerDistrict[hoveredDistrict] || 0} alunos registados
          </p>
          {friendPins.filter(f => f.district === hoveredDistrict).length > 0 && (
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
              <MapPin size={12} />
              {friendPins.filter(f => f.district === hoveredDistrict).length} amigo(s) aqui
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Mapa social com zoom progressivo: distrito → município → localidade/escola + pesquisa de inscritos
const PortugalFriendMap = () => {
  const { user } = useAuth();
  const [counts, setCounts] = useState({});
  const [friendPins, setFriendPins] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [friendIds, setFriendIds] = useState([]);
  const [pendingIds, setPendingIds] = useState([]);

  const loadBase = useCallback(async () => {
    try {
      const [countsRes, friendsRes] = await Promise.all([
        supabase.rpc('get_student_counts_by_district'),
        supabase.rpc('get_friend_locations'),
      ]);
      if (countsRes.data) {
        const map = {};
        countsRes.data.forEach(r => { map[r.district] = Number(r.student_count); });
        setCounts(map);
      }
      if (friendsRes.data) setFriendPins(friendsRes.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadBase(); }, [loadBase]);

  // Amigos e pedidos pendentes (para estados dos botões)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: fr } = await supabase.from('friendships').select('user1_id, user2_id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      const ids = (fr || []).map(r => (r.user1_id === user.id ? r.user2_id : r.user1_id));
      setFriendIds(ids);
      const { data: reqs } = await supabase
        .from('friend_requests')
        .select('from_user_id, to_user_id, status')
        .in('status', ['pending', 'pending_parent_req', 'pending_parent_rcp', 'approved'])
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
      setPendingIds((reqs || []).map(r => (r.from_user_id === user.id ? r.to_user_id : r.from_user_id)));
    })();
  }, [user]);

  const runSearch = useCallback(async (district, municipality, query) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_students', {
        p_query: query || '',
        p_district: district || null,
        p_municipality: municipality || null,
        p_locality: null,
      });
      if (error) throw error;
      setStudents(data || []);
    } catch {
      toast.error('Erro ao pesquisar alunos.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDistrictSelect = (district) => {
    if (selectedDistrict === district && selectedMunicipality) {
      setSelectedMunicipality(null);
      runSearch(district, null, searchQuery);
    } else {
      setSelectedDistrict(district);
      setSelectedMunicipality(null);
      runSearch(district, null, searchQuery);
    }
  };

  const handleSearchSubmit = () => {
    runSearch(selectedDistrict, selectedMunicipality, searchQuery);
  };

  // Municípios e escolas a partir dos resultados atuais (zoom progressivo)
  const municipalities = [...new Set(students.map(s => s.municipality).filter(Boolean))];
  const localityStudents = selectedMunicipality
    ? students.filter(s => s.municipality === selectedMunicipality)
    : students;

  const sendFriendRequest = async (toUserId) => {
    const { data, error } = await supabase.rpc('send_friend_request', { p_to_user_id: toUserId });
    if (error) {
      toast.error('Erro ao enviar pedido.');
      return;
    }
    switch (data) {
      case 'pending_parent':
        toast.success('Pedido registado! Assim que os teus pais autorizarem, segue para os pais do outro aluno.');
        setPendingIds(prev => [...prev, toUserId]);
        break;
      case 'already_friends': toast.info('Já são amigos!'); break;
      case 'already_pending': toast.info('Já existe um pedido pendente entre vocês.'); break;
      case 'self': toast.info('Não podes adicionar-te a ti mesmo!'); break;
      default: toast.error('Não foi possível enviar o pedido.');
    }
  };

  const buttonState = (id) => {
    if (friendIds.includes(id)) return { label: 'Amigos', cls: 'bg-emerald-100 text-emerald-700', icon: Check, disabled: true };
    if (pendingIds.includes(id)) return { label: 'Pendente', cls: 'bg-amber-100 text-amber-700', icon: Clock, disabled: true };
    return { label: 'Adicionar', cls: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white', icon: UserPlus, disabled: false };
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
              <MapPin size={24} />
              Mapa de Portugal
            </h3>
            <p className="text-white/80 text-sm mt-1">
              {friendPins.length > 0
                ? `Tens ${friendPins.length} amigo(s) no mapa. Clica num distrito para explorar.`
                : 'Clica num distrito para encontrar amigos'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Breadcrumb de zoom */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => { setSelectedDistrict(null); setSelectedMunicipality(null); setStudents([]); }} className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${!selectedDistrict ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            Portugal
          </button>
          {selectedDistrict && (
            <>
              <ChevronDown size={14} className="text-slate-400 -rotate-90" />
              <button onClick={() => { setSelectedMunicipality(null); runSearch(selectedDistrict, null, searchQuery); }} className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-600 text-white">
                {selectedDistrict}
              </button>
            </>
          )}
          {selectedMunicipality && (
            <>
              <ChevronDown size={14} className="text-slate-400 -rotate-90" />
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">{selectedMunicipality}</span>
            </>
          )}
        </div>

        {/* Pesquisa */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por nickname ou escola..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition text-slate-700 placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={handleSearchSubmit}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : 'Pesquisar'}
          </button>
        </div>

        {/* Mapa */}
        <div className="mb-6">
          <PortugalMap
            selectedDistrict={selectedDistrict}
            onDistrictSelect={handleDistrictSelect}
            studentsPerDistrict={counts}
            friendPins={friendPins}
          />
        </div>

        {/* Zoom nível 2: municípios */}
        {selectedDistrict && !selectedMunicipality && municipalities.length > 0 && (
          <div className="mb-5">
            <h4 className="font-bold text-slate-800 mb-2 text-sm flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
              <MapPin size={16} className="text-teal-600" /> Municípios em {selectedDistrict}
            </h4>
            <div className="flex flex-wrap gap-2">
              {municipalities.map(m => (
                <button
                  key={m}
                  onClick={() => { setSelectedMunicipality(m); runSearch(selectedDistrict, m, searchQuery); }}
                  className="px-4 py-2 bg-slate-100 hover:bg-teal-100 text-slate-700 rounded-xl text-sm font-semibold transition"
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de alunos */}
        {(students.length > 0 || loading) && (
          <div>
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
              <Users size={20} className="text-teal-600" />
              {selectedMunicipality
                ? `Alunos em ${selectedMunicipality}`
                : selectedDistrict
                  ? `Alunos em ${selectedDistrict}`
                  : 'Todos os inscritos'} ({localityStudents.length})
            </h4>
            {loading ? (
              <p className="text-slate-400 text-sm text-center py-4">A pesquisar...</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                {localityStudents.map(student => {
                  const st = buttonState(student.user_id);
                  const Icon = st.icon;
                  return (
                    <div key={student.user_id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow" style={{ backgroundColor: DISTRICT_COLORS[student.district] || '#0d9488' }}>
                        {student.nickname?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-slate-800 truncate text-sm">{student.nickname || 'Anónimo'}</h5>
                        <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                          <School size={11} />
                          {student.school_name || 'Escola não indicada'}{student.school_year ? ` · ${student.school_year}º ano` : ''}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {[student.locality, student.municipality, student.district].filter(Boolean).join(', ') || 'Portugal'} · Nível {student.level || 1}
                        </p>
                      </div>
                      <button
                        onClick={() => sendFriendRequest(student.user_id)}
                        disabled={st.disabled}
                        className={`px-4 py-2 font-semibold rounded-xl transition-all text-xs whitespace-nowrap flex items-center gap-1.5 ${st.cls} ${st.disabled ? '' : 'hover:shadow-md'}`}
                      >
                        <Icon size={14} /> {st.label}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Estado vazio */}
        {students.length === 0 && !loading && selectedDistrict && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
              <MapPin className="text-slate-300" size={32} />
            </div>
            <p className="text-slate-600 font-medium">Nenhum aluno encontrado em {selectedDistrict}</p>
            <p className="text-sm text-slate-400 mt-2">Tenta outro distrito ou pesquisa por nome</p>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>
    </div>
  );
};

export { PortugalMap, PortugalFriendMap, DISTRICT_COLORS };
