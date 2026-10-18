import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { MapPin, Users, Search, ChevronDown, School, UserPlus, Check, Clock, ArrowLeft, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { MAP_DATA } from '../lib/mapData';

const B = MAP_DATA.bounds;
const W = Math.ceil(B.maxX + 30);
const H = Math.ceil(B.maxY + 30);

const toPathD = (points) => points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';

const DISTRICT_LABELS = {
  'Aveiro': [130, 200], 'Beja': [150, 560], 'Braga': [130, 100], 'Bragança': [280, 100],
  'Castelo Branco': [240, 330], 'Coimbra': [110, 280], 'Évora': [200, 480], 'Faro': [150, 720],
  'Guarda': [280, 220], 'Leiria': [110, 360], 'Lisboa': [70, 460], 'Portalegre': [280, 400],
  'Porto': [110, 140], 'Santarém': [160, 420], 'Setúbal': [110, 520], 'Viana do Castelo': [90, 55],
  'Vila Real': [210, 90], 'Viseu': [190, 160],
};

const DISTRICT_LABEL_LINES = {
  'Castelo Branco': ['CASTELO', 'BRANCO'],
  'Viana do Castelo': ['VIANA DO', 'CASTELO'],
};

// Municípios agrupados por distrito
const MUNIS_BY_DISTRICT = {};
for (const m of Object.values(MAP_DATA.municipalities)) {
  (MUNIS_BY_DISTRICT[m.district] ||= []).push(m);
}

function PortugalMap({ onDistrictSelect, selectedDistrict, studentsPerDistrict = {}, friendPins = [] }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="relative bg-gradient-to-br from-[#cfe9f3] via-[#dcedf5] to-[#bcdcea] rounded-3xl p-4 overflow-hidden shadow-inner">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg mx-auto drop-shadow-sm">
        <rect x="0" y="0" width={W} height={H} fill="#dbeaf2" />
        {Object.entries(MAP_DATA.districts).map(([name, d]) => {
          const isSelected = selectedDistrict === name;
          const isHovered = hovered === name;
          const studentCount = studentsPerDistrict[name] || 0;
          const friendsHere = friendPins.filter(f => f.district === name);
          const lp = DISTRICT_LABELS[name] || [0, 0];
          const lines = DISTRICT_LABEL_LINES[name] || [name.toUpperCase()];
          return (
            <g key={name}>
              {d.paths.map((pts, i) => (
                <path
                  key={i}
                  d={toPathD(pts)}
                  fill={d.color}
                  stroke={isSelected ? '#1a1a1a' : isHovered ? '#3f3f3f' : '#ffffff'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 1.8 : 1}
                  strokeLinejoin="round"
                  style={{ cursor: 'pointer', transition: 'all 0.2s ease', filter: isHovered ? 'brightness(1.08)' : 'none' }}
                  onClick={() => onDistrictSelect && onDistrictSelect(name)}
                  onMouseEnter={() => setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))}
              <text
                x={lp[0]} y={lp[1]}
                textAnchor="middle"
                fontSize="9"
                fontWeight="700"
                fill="#1f2937"
                style={{ pointerEvents: 'none', fontFamily: 'Nunito, sans-serif', paintOrder: 'stroke', stroke: 'rgba(255,255,255,0.85)', strokeWidth: 2.5 }}
              >
                {lines.map((line, i) => (
                  <tspan key={i} x={lp[0]} dy={i === 0 ? 0 : 10}>{line}</tspan>
                ))}
              </text>
              {studentCount > 0 && (
                <g transform={`translate(${lp[0] + 26}, ${lp[1] - 12})`} style={{ pointerEvents: 'none' }}>
                  <circle r="8" fill="#fff" stroke={d.color} strokeWidth="1.5" />
                  <text y="3" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#334155">
                    {studentCount > 99 ? '99+' : studentCount}
                  </text>
                </g>
              )}
              {friendsHere.map((f, i) => (
                <g
                  key={f.friend_id}
                  transform={`translate(${lp[0] - 22 + (i % 3) * 11}, ${lp[1] + 10 + Math.floor(i / 3) * 9})`}
                  style={{ pointerEvents: 'none' }}
                >
                  <circle r="4" fill="#e11d48" stroke="#fff" strokeWidth="1.2">
                    <animate attributeName="r" values="3.5;5;3.5" dur="2s" repeatCount="indefinite" begin={`${(i % 5) * 0.3}s`} />
                  </circle>
                  <title>{f.nickname}</title>
                </g>
              ))}
            </g>
          );
        })}
      </svg>

      {hovered && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-4 pointer-events-none z-20 border border-slate-200/50" style={{ minWidth: '160px' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: MAP_DATA.districts[hovered]?.color }} />
            <span className="font-bold text-slate-800 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>{hovered}</span>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Users size={12} />
            {studentsPerDistrict[hovered] || 0} alunos registados
          </p>
          {friendPins.filter(f => f.district === hovered).length > 0 && (
            <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
              <MapPin size={12} />
              {friendPins.filter(f => f.district === hovered).length} amigo(s) aqui
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Mapa social com zoom progressivo: distrito → município
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

  const runSearch = useCallback(async (district, query) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('search_students', {
        p_query: query || '',
        p_district: district || null,
        p_municipality: null,
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
    setSelectedDistrict(district);
    setSelectedMunicipality(null);
    runSearch(district, searchQuery);
  };

  const handleBack = () => {
    setSelectedDistrict(null);
    setSelectedMunicipality(null);
    setStudents([]);
  };

  const handleSearchSubmit = () => runSearch(selectedDistrict, searchQuery);

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

  const munis = selectedDistrict ? (MUNIS_BY_DISTRICT[selectedDistrict] || []) : [];
  // Alunos filtrados pelo município selecionado (a pesquisa já veio do distrito)
  const filteredStudents = useMemo(() => {
    if (!selectedMunicipality) return students;
    return students.filter(s => s.municipality === selectedMunicipality);
  }, [students, selectedMunicipality]);

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white">
        <div className="flex items-center justify-between relative z-10">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
              <MapPin size={24} />
              {selectedDistrict ? `${selectedDistrict} — Municípios` : 'Mapa de Portugal'}
            </h3>
            <p className="text-white/80 text-sm mt-1">
              {selectedDistrict
                ? 'Escolhe um município para ver os alunos.'
                : 'Clica num distrito para fazer zoom aos municípios.'}
            </p>
          </div>
          {selectedDistrict && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/25 hover:bg-white/40 rounded-xl font-bold text-sm transition"
            >
              <ArrowLeft size={16} /> Portugal
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {!selectedDistrict && (
          <>
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

            <PortugalMap
              selectedDistrict={selectedDistrict}
              onDistrictSelect={handleDistrictSelect}
              studentsPerDistrict={counts}
              friendPins={friendPins}
            />
          </>
        )}

        {selectedDistrict && (
          <>
            {/* Municípios do distrito */}
            <div className="mb-5">
              <h4 className="font-bold text-slate-800 mb-3 text-sm flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                <MapPin size={16} className="text-teal-600" /> Municípios ({munis.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {munis.map(m => (
                  <button
                    key={m.municipality}
                    onClick={() => setSelectedMunicipality(m.municipality)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                      selectedMunicipality === m.municipality
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 hover:bg-teal-100 text-slate-700'
                    }`}
                  >
                    {m.municipality}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de alunos */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Cinzel, serif' }}>
                <Users size={20} className="text-teal-600" />
                Alunos em {selectedMunicipality || selectedDistrict} ({filteredStudents.length})
              </h4>
              {loading ? (
                <p className="text-slate-400 text-sm text-center py-4">A pesquisar...</p>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <MapPin className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-600 font-medium">Nenhum aluno encontrado</p>
                  <p className="text-sm text-slate-400 mt-2">Tenta outro município ou limpa a pesquisa</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {filteredStudents.map(student => {
                    const st = buttonState(student.user_id);
                    const Icon = st.icon;
                    return (
                      <div key={student.user_id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow" style={{ backgroundColor: MAP_DATA.districts[student.district]?.color || '#0d9488' }}>
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
          </>
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

export { PortugalMap, PortugalFriendMap, MAP_DATA as DISTRICT_COLORS_EXPORT };
