import React, { useState, useEffect } from 'react';
import { GraduationCap, School, User, Save, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const CLASS_SUGGESTIONS = ['1ºA', '1ºB', '2ºA', '2ºB', '3ºA', '3ºB', '4ºA', '4ºB', '5ºA', '5ºB', '5ºC', '6ºA', '6ºB', '6ºC', '7ºA', '7ºB', '8ºA', '8ºB', '9ºA', '9ºB'];

const ProfileSettingsPanel = ({ studentProfile, onSaved }) => {
  const { user, profile } = useAuth();
  const [schools, setSchools] = useState([]);
  const [schoolSearch, setSchoolSearch] = useState(studentProfile?.school_name || '');
  const [selectedSchoolId, setSelectedSchoolId] = useState(studentProfile?.school_id || null);
  const [className, setClassName] = useState(studentProfile?.class_name || '');
  const [schoolYear, setSchoolYear] = useState(studentProfile?.school_year || '');
  const [nickname, setNickname] = useState(studentProfile?.nickname || profile?.name || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('school_id, name, district, municipality')
          .order('name')
          .limit(500);
        if (error) throw error;
        setSchools(data || []);
      } catch (e) {
        setSchools([]);
      }
    };
    fetchSchools();
  }, []);

  const filteredSchools = schoolSearch.length >= 2
    ? schools.filter(s =>
        s.name.toLowerCase().includes(schoolSearch.toLowerCase()) ||
        (s.municipality || '').toLowerCase().includes(schoolSearch.toLowerCase())
      ).slice(0, 8)
    : [];

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const selectedSchool = schools.find(s => s.school_id === selectedSchoolId);
      const updates = {
        nickname: nickname.trim() || null,
        class_name: className.trim() || null,
        school_year: schoolYear || null,
        school_id: selectedSchoolId,
        school_name: selectedSchool?.name || null,
      };
      const { error } = await supabase
        .from('student_profiles')
        .update(updates)
        .eq('user_id', user.id);
      if (error) throw error;
      toast.success('Perfil guardado! Já apareces nas classificações da tua turma e escola!');
      onSaved?.();
    } catch (e) {
      toast.error('Não foi possível guardar. Tenta novamente.');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = nickname !== (studentProfile?.nickname || profile?.name || '') ||
    className !== (studentProfile?.class_name || '') ||
    schoolYear !== (studentProfile?.school_year || '') ||
    selectedSchoolId !== (studentProfile?.school_id || null);

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-2xl">
            <GraduationCap size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>O Meu Perfil Escolar</h2>
            <p className="text-white/80 text-sm">Define a tua turma e escola para entrares nas classificações!</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Apelido */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <User size={16} /> Como queres ser chamado no jogo?
          </label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={30}
            placeholder="Ex.: SuperPedro"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
          />
        </div>

        {/* Ano escolar */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Ano escolar</label>
          <div className="flex flex-wrap gap-2">
            {['1','2','3','4','5','6','7','8','9'].map(y => (
              <button
                key={y}
                onClick={() => setSchoolYear(y)}
                className={`px-4 py-2 rounded-xl font-bold transition ${
                  schoolYear === y
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {y}º
              </button>
            ))}
          </div>
        </div>

        {/* Escola com pesquisa */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
            <School size={16} /> A tua escola
          </label>
          <input
            type="text"
            value={schoolSearch}
            onChange={e => { setSchoolSearch(e.target.value); setSelectedSchoolId(null); }}
            placeholder="Escreve o nome da escola ou cidade..."
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
          />
          {filteredSchools.length > 0 && (
            <div className="mt-2 bg-white border-2 border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-lg">
              {filteredSchools.map(s => (
                <button
                  key={s.school_id}
                  onClick={() => { setSelectedSchoolId(s.school_id); setSchoolSearch(s.name); }}
                  className={`w-full text-left px-4 py-2.5 hover:bg-emerald-50 transition flex items-center justify-between ${
                    selectedSchoolId === s.school_id ? 'bg-emerald-100' : ''
                  }`}
                >
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.municipality || s.district}</p>
                  </div>
                  {selectedSchoolId === s.school_id && <Check size={16} className="text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
          {schoolSearch.length >= 2 && filteredSchools.length === 0 && (
            <p className="text-xs text-slate-400 mt-2">Nenhuma escola encontrada — podes deixar em branco.</p>
          )}
        </div>

        {/* Turma */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Turma (opcional)</label>
          <input
            type="text"
            value={className}
            onChange={e => setClassName(e.target.value)}
            maxLength={10}
            placeholder="Ex.: 5ºA"
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {CLASS_SUGGESTIONS.map(c => (
              <button
                key={c}
                onClick={() => setClassName(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  className === c ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'A guardar...' : 'Guardar Perfil'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettingsPanel;
