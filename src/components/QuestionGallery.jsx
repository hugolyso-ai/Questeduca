import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const QuestionGallery = ({ text }) => {
  const [aids, setAids] = useState([])
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    supabase
      .from('visual_aids')
      .select('keyword, label, symbol, image_url')
      .eq('school_year', '1')
      .then(({ data, error }) => {
        if (!active) return
        if (error || !Array.isArray(data)) {
          setLoadError(true)
          return
        }
        setAids(data)
      })
    return () => {
      active = false
    }
  }, [])

  if (loadError) {
    return <p className="text-center text-base text-slate-500">Não foi possível carregar as imagens de apoio.</p>
  }

  const normalizedText = normalize(text || '')
  const matches = aids.filter((aid) => new RegExp(`\\b${normalize(aid.keyword)}\\b`).test(normalizedText))
  if (matches.length === 0) return null

  return (
    <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 space-y-3">
      <p className="text-sm font-bold uppercase tracking-wide text-sky-700 text-center">Imagens de apoio</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {matches.map((aid) => (
          <div key={aid.keyword} className="flex flex-col items-center gap-2 rounded-xl bg-white p-3 shadow-sm">
            <img src={aid.image_url} alt={aid.label} loading="lazy" className="w-full aspect-square rounded-lg object-cover" />
            <span className="text-4xl leading-none" aria-hidden="true">{aid.symbol}</span>
            <span className="text-xl font-bold text-slate-800">{aid.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionGallery
