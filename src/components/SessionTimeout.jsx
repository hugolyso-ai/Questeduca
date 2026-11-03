import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  ACTIVITY_EVENTS,
  INACTIVITY_CHECK_MS,
  INACTIVITY_LIMIT_MS,
  getKeepSessionChoice,
  isInstalledApp,
  setKeepSessionChoice,
} from '../lib/sessionPolicy'

const SessionTimeout = () => {
  const { user, logout } = useAuth()
  const [keepChoice, setKeepChoice] = useState(getKeepSessionChoice)
  const installed = isInstalledApp()
  const keepActive = installed && keepChoice === 'keep'
  const askKeep = !!user && installed && keepChoice === null
  const timeoutActive = !!user && !keepActive

  const lastActivityRef = useRef(Date.now())
  const logoutRef = useRef(logout)
  logoutRef.current = logout

  useEffect(() => {
    if (!timeoutActive) return undefined

    lastActivityRef.current = Date.now()
    const markActive = () => {
      lastActivityRef.current = Date.now()
    }
    const expireIfIdle = () => {
      if (Date.now() - lastActivityRef.current < INACTIVITY_LIMIT_MS) return
      toast.info('A sessão terminou por inatividade. Entre novamente para continuar.')
      logoutRef.current()
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') expireIfIdle()
    }

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }))
    document.addEventListener('visibilitychange', handleVisibility)
    const timer = setInterval(expireIfIdle, INACTIVITY_CHECK_MS)

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, markActive))
      document.removeEventListener('visibilitychange', handleVisibility)
      clearInterval(timer)
    }
  }, [timeoutActive])

  const chooseKeep = (choice) => {
    setKeepSessionChoice(choice)
    setKeepChoice(choice)
  }

  if (!askKeep) return null

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Manter a sessão sempre ativa?</h2>
        <p className="text-slate-600">
          Se escolher manter a sessão ativa, não precisa de voltar a entrar neste dispositivo. Caso contrário, a sessão termina automaticamente após 30 minutos sem utilização.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => chooseKeep('timeout')}
            className="flex-1 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition"
          >
            Terminar após 30 minutos
          </button>
          <button
            onClick={() => chooseKeep('keep')}
            className="flex-1 px-4 py-3 rounded-xl bg-[hsl(35,92%,50%)] text-white font-semibold hover:opacity-90 transition"
          >
            Manter sessão ativa
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionTimeout
