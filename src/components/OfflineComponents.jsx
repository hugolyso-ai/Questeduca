import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Download, RefreshCw, Check, CloudOff } from 'lucide-react'
import { toast } from 'sonner'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  return isOnline
}

export const OnlineStatusIndicator = () => {
  const isOnline = useOnlineStatus()
  if (isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-[hsl(142,45%,88%)] text-green-700 rounded-full text-xs font-medium">
        <Wifi size={12} /><span className="hidden sm:inline">Online</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium animate-pulse">
      <WifiOff size={12} /><span className="hidden sm:inline">Offline</span>
    </div>
  )
}

export const OfflineBanner = () => {
  const isOnline = useOnlineStatus()
  const [dismissed, setDismissed] = useState(false)
  if (isOnline || dismissed) return null
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-amber-500 text-white rounded-2xl shadow-lg p-4 z-40">
      <div className="flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-xl"><CloudOff size={24} /></div>
        <div className="flex-1">
          <h4 className="font-bold">Estás Offline</h4>
          <p className="text-sm text-white/90">Algumas funcionalidades podem não funcionar.</p>
        </div>
        <button onClick={() => setDismissed(true)} className="text-white/80 hover:text-white">X</button>
      </div>
    </div>
  )
}

const OfflineCacheManager = ({ isOpen, onClose }) => {
  const isOnline = useOnlineStatus()
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-[hsl(35,92%,50%)] to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <Download size={28} />
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Cinzel, serif' }}>Modo Offline</h2>
              <p className="text-white/80 text-sm">Guarda perguntas para jogar sem internet</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Estado:</span>
              <span className={`flex items-center gap-1 font-semibold ${isOnline ? 'text-[hsl(28,85%,40%)]' : 'text-amber-600'}`}>
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}{isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="bg-[hsl(38,80%,93%)] rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">Dica:</p>
            <p>O modo offline estará disponível em breve. Por enquanto, precisa de conexão à internet para jogar.</p>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition">Fechar</button>
        </div>
      </div>
    </div>
  )
}

export default { OnlineStatusIndicator, OfflineBanner, OfflineCacheManager }
