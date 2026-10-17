import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'questeduca_cookie_consent'

const readConsent = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

const saveConsent = (categories) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...categories, date: new Date().toISOString() }))
}

const CookieConsent = () => {
  const [consent, setConsent] = useState(readConsent)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState({ necessary: true, analytics: false, marketing: false })

  if (consent) return null

  const acceptAll = () => {
    const all = { necessary: true, analytics: true, marketing: true }
    saveConsent(all)
    setConsent(all)
  }

  const rejectAll = () => {
    const onlyNecessary = { necessary: true, analytics: false, marketing: false }
    saveConsent(onlyNecessary)
    setConsent(onlyNecessary)
  }

  const savePreferences = () => {
    saveConsent(preferences)
    setConsent(preferences)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border-2 border-[hsl(35,25%,85%)] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Cookie className="text-[hsl(35,92%,45%)] flex-shrink-0 mt-0.5" size={22} />
          <div className="text-sm text-slate-700 space-y-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <p className="font-bold text-slate-900">Este site utiliza cookies</p>
            {showPreferences ? (
              <div className="space-y-2">
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked disabled className="mt-1" />
                  <span><strong>Técnicos (necessários)</strong> — mantêm a sessão iniciada e a segurança da conta. Sempre ativos, não requerem consentimento (art.º 5.º da Diretiva 2002/58/CE).</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="mt-1"
                  />
                  <span><strong>Estatísticos</strong> — ajudam-nos a perceber como a plataforma é usada, de forma agregada e anónima.</span>
                </label>
                <label className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="mt-1"
                  />
                  <span><strong>Marketing</strong> — lembram preferências e suportam comunicações promocionais.</span>
                </label>
              </div>
            ) : (
              <p>
                Utilizamos cookies técnicos essenciais ao funcionamento (sessão e segurança) e, apenas com o seu consentimento, cookies opcionais. Pode aceitar, recusar ou escolher. Consulte a{' '}
                <Link to="/privacy" className="text-[hsl(28,85%,40%)] font-bold underline">Política de Privacidade</Link>.
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          {showPreferences ? (
            <>
              <button onClick={() => setShowPreferences(false)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>Voltar</button>
              <button onClick={savePreferences} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>Guardar preferências</button>
            </>
          ) : (
            <>
              <button onClick={() => setShowPreferences(true)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>Personalizar</button>
              <button onClick={rejectAll} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>Recusar opcionais</button>
              <button onClick={acceptAll} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-[hsl(28,85%,40%)] hover:bg-[hsl(28,85%,32%)] transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>Aceitar tudo</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CookieConsent
