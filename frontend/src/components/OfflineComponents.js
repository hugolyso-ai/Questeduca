import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Download, RefreshCw, Check, CloudOff } from 'lucide-react';
import { useOnlineStatus, useOfflineQuestions } from '../hooks/useOffline';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Componente de indicador de status na barra superior
export const OnlineStatusIndicator = () => {
  const isOnline = useOnlineStatus();
  const { cachedCount } = useOfflineQuestions();

  if (isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
        <Wifi size={12} />
        <span className="hidden sm:inline">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium animate-pulse">
      <WifiOff size={12} />
      <span className="hidden sm:inline">Offline</span>
      {cachedCount > 0 && (
        <span className="bg-amber-200 px-1 rounded">{cachedCount} perguntas</span>
      )}
    </div>
  );
};

// Banner de aviso offline
export const OfflineBanner = () => {
  const isOnline = useOnlineStatus();
  const { cachedCount } = useOfflineQuestions();
  const [dismissed, setDismissed] = useState(false);

  if (isOnline || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-amber-500 text-white rounded-2xl shadow-lg p-4 z-40 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-xl">
          <CloudOff size={24} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold">Estás Offline</h4>
          <p className="text-sm text-white/90">
            {cachedCount > 0 
              ? `Podes continuar a jogar com ${cachedCount} perguntas guardadas.`
              : 'Algumas funcionalidades podem não funcionar.'}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Modal de gestão de cache offline
export const OfflineCacheManager = ({ isOpen, onClose, schoolYear }) => {
  const isOnline = useOnlineStatus();
  const { cachedCount, cacheQuestions, clearCache, countCachedQuestions } = useOfflineQuestions();
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownloadQuestions = async () => {
    if (!isOnline) {
      toast.error('Precisas de estar online para descarregar perguntas');
      return;
    }

    setLoading(true);
    setDownloadProgress(0);

    try {
      // Buscar disciplinas do ano
      const subjectsRes = await axios.get(`${API}/subjects/${schoolYear || 5}`, { withCredentials: true });
      const subjects = subjectsRes.data || [];
      
      let totalQuestions = 0;
      
      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        setDownloadProgress(Math.round(((i + 1) / subjects.length) * 100));
        
        try {
          // Gerar perguntas para cada disciplina
          const quizRes = await axios.get(`${API}/quiz/generate`, {
            params: { 
              subject: subject.id || subject.name, 
              year: schoolYear || 5,
              count: 10 
            },
            withCredentials: true
          });
          
          if (quizRes.data?.questions) {
            const questionsWithMeta = quizRes.data.questions.map(q => ({
              ...q,
              subject: subject.id || subject.name,
              year: schoolYear || 5,
              question_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }));
            
            await cacheQuestions(questionsWithMeta);
            totalQuestions += questionsWithMeta.length;
          }
        } catch (error) {
          console.error(`Error downloading questions for ${subject.name}:`, error);
        }
      }
      
      await countCachedQuestions();
      toast.success(`${totalQuestions} perguntas guardadas para modo offline!`);
    } catch (error) {
      console.error('Error downloading questions:', error);
      toast.error('Erro ao descarregar perguntas');
    } finally {
      setLoading(false);
      setDownloadProgress(0);
    }
  };

  const handleClearCache = async () => {
    const success = await clearCache();
    if (success) {
      toast.success('Cache limpo com sucesso');
    } else {
      toast.error('Erro ao limpar cache');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <Download size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Modo Offline
              </h2>
              <p className="text-white/80 text-sm">
                Guarda perguntas para jogar sem internet
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status atual */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-600">Estado da conexão:</span>
              <span className={`flex items-center gap-1 font-semibold ${isOnline ? 'text-green-600' : 'text-amber-600'}`}>
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Perguntas guardadas:</span>
              <span className="font-bold text-blue-600">{cachedCount}</span>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadQuestions}
              disabled={loading || !isOnline}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  A descarregar... {downloadProgress}%
                </>
              ) : (
                <>
                  <Download size={20} />
                  Descarregar Perguntas
                </>
              )}
            </button>

            {/* Progress bar */}
            {loading && (
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            )}

            {cachedCount > 0 && (
              <button
                onClick={handleClearCache}
                className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 transition"
              >
                Limpar Cache
              </button>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
            <p className="font-semibold mb-1">💡 Dica:</p>
            <p>
              Descarrega perguntas antes de ir para um local sem internet. 
              As respostas serão sincronizadas automaticamente quando voltares online.
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default { OnlineStatusIndicator, OfflineBanner, OfflineCacheManager };
