import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// Escolha de escola em cascata: distrito → concelho → localidade → escola.
// value: { school_id, school_name, district, municipality, locality }
// onChange recebe o objeto completo; showLocality permite omitir o passo localidade.
const SchoolPicker = ({ value, onChange, label = 'Escola', showLocality = true }) => {
  const [districts, setDistricts] = useState([])
  const [municipalities, setMunicipalities] = useState([])
  const [localities, setLocalities] = useState([])
  const [schools, setSchools] = useState([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('districts').select('district_id, name').order('name')
      setDistricts(data || [])
    }
    load()
  }, [])

  useEffect(() => {
    if (!value?.district) { setMunicipalities([]); return }
    const load = async () => {
      const { data } = await supabase
        .from('schools')
        .select('municipality')
        .eq('district', value.district)
        .order('municipality')
      setMunicipalities([...new Set((data || []).map(s => s.municipality).filter(Boolean))])
    }
    load()
  }, [value?.district])

  useEffect(() => {
    if (!value?.district || !value?.municipality) { setLocalities([]); return }
    const load = async () => {
      const { data } = await supabase
        .from('schools')
        .select('locality')
        .eq('district', value.district)
        .eq('municipality', value.municipality)
        .order('locality')
      setLocalities([...new Set((data || []).map(s => s.locality).filter(Boolean))])
    }
    load()
  }, [value?.district, value?.municipality])

  useEffect(() => {
    if (!value?.district || !value?.municipality) { setSchools([]); return }
    const load = async () => {
      let q = supabase
        .from('schools')
        .select('school_id, name, locality')
        .eq('district', value.district)
        .eq('municipality', value.municipality)
      if (showLocality && value?.locality) q = q.eq('locality', value.locality)
      const { data } = await q.order('name')
      setSchools(data || [])
    }
    load()
  }, [value?.district, value?.municipality, value?.locality, showLocality])

  const update = (patch) => onChange({ ...value, ...patch })

  const selectCls = "w-full px-4 py-3 bg-[hsl(36,33%,93%)] border-2 border-[hsl(35,25%,85%)] rounded-xl focus:border-[hsl(35,92%,50%)] focus:ring-4 focus:ring-[hsl(35,92%,50%)]/20 transition-all disabled:opacity-50"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Distrito</label>
          <select
            value={value?.district || ''}
            onChange={(e) => update({ district: e.target.value, municipality: '', locality: '', school_id: '', school_name: '' })}
            required
            className={selectCls}
          >
            <option value="">Selecionar...</option>
            {districts.map(d => <option key={d.district_id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Concelho</label>
          <select
            value={value?.municipality || ''}
            onChange={(e) => update({ municipality: e.target.value, locality: '', school_id: '', school_name: '' })}
            required
            disabled={!value?.district}
            className={selectCls}
          >
            <option value="">Selecionar...</option>
            {municipalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {showLocality && (
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">Localidade (opcional)</label>
          <select
            value={value?.locality || ''}
            onChange={(e) => update({ locality: e.target.value, school_id: '', school_name: '' })}
            disabled={!value?.municipality}
            className={selectCls}
          >
            <option value="">Todas as localidades</option>
            {localities.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
        <select
          value={value?.school_id || ''}
          onChange={(e) => {
            const s = schools.find(x => x.school_id === e.target.value)
            update(s ? { school_id: s.school_id, school_name: s.name } : { school_id: '', school_name: '' })
          }}
          required
          disabled={!value?.municipality}
          className={selectCls}
        >
          <option value="">Selecionar...</option>
          {schools.map(s => <option key={s.school_id} value={s.school_id}>{s.name}</option>)}
        </select>
      </div>
    </div>
  )
}

export default SchoolPicker
