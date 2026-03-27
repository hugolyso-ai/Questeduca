import { useState, useEffect, useCallback } from 'react';

// Hook para detectar estado offline/online
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// IndexedDB helper para armazenar perguntas offline
const DB_NAME = 'questeduca-offline';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('cached_questions')) {
        const store = db.createObjectStore('cached_questions', { keyPath: 'id' });
        store.createIndex('subject', 'subject', { unique: false });
        store.createIndex('year', 'year', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('pending_answers')) {
        db.createObjectStore('pending_answers', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('cached_game_state')) {
        db.createObjectStore('cached_game_state', { keyPath: 'user_id' });
      }
    };
  });
};

// Hook para cache de perguntas offline
export const useOfflineQuestions = () => {
  const [cachedCount, setCachedCount] = useState(0);

  // Contar perguntas em cache
  const countCachedQuestions = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('cached_questions', 'readonly');
      const store = tx.objectStore('cached_questions');
      const count = await new Promise((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      setCachedCount(count);
      return count;
    } catch (error) {
      console.error('Error counting cached questions:', error);
      return 0;
    }
  }, []);

  // Guardar perguntas em cache
  const cacheQuestions = useCallback(async (questions) => {
    try {
      const db = await openDB();
      const tx = db.transaction('cached_questions', 'readwrite');
      const store = tx.objectStore('cached_questions');
      
      for (const question of questions) {
        const questionWithId = {
          ...question,
          id: question.question_id || `q_${Date.now()}_${Math.random()}`
        };
        await new Promise((resolve, reject) => {
          const request = store.put(questionWithId);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
      
      await countCachedQuestions();
      return true;
    } catch (error) {
      console.error('Error caching questions:', error);
      return false;
    }
  }, [countCachedQuestions]);

  // Obter perguntas do cache
  const getCachedQuestions = useCallback(async (subject = null, year = null, limit = 5) => {
    try {
      const db = await openDB();
      const tx = db.transaction('cached_questions', 'readonly');
      const store = tx.objectStore('cached_questions');
      
      let questions = [];
      
      if (subject) {
        const index = store.index('subject');
        questions = await new Promise((resolve, reject) => {
          const request = index.getAll(subject);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      } else {
        questions = await new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }
      
      // Filtrar por ano se especificado
      if (year) {
        questions = questions.filter(q => q.year === year);
      }
      
      // Retornar aleatoriamente
      const shuffled = questions.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit);
    } catch (error) {
      console.error('Error getting cached questions:', error);
      return [];
    }
  }, []);

  // Limpar cache
  const clearCache = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('cached_questions', 'readwrite');
      const store = tx.objectStore('cached_questions');
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      setCachedCount(0);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  }, []);

  // Guardar resposta pendente (para sync quando voltar online)
  const savePendingAnswer = useCallback(async (answer) => {
    try {
      const db = await openDB();
      const tx = db.transaction('pending_answers', 'readwrite');
      const store = tx.objectStore('pending_answers');
      await new Promise((resolve, reject) => {
        const request = store.add({
          ...answer,
          timestamp: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // Registar sync se disponível
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-quiz-answers');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving pending answer:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    countCachedQuestions();
  }, [countCachedQuestions]);

  return {
    cachedCount,
    cacheQuestions,
    getCachedQuestions,
    clearCache,
    savePendingAnswer,
    countCachedQuestions
  };
};

// Hook para cache do estado do jogo
export const useOfflineGameState = () => {
  const saveGameState = useCallback(async (userId, gameState) => {
    try {
      const db = await openDB();
      const tx = db.transaction('cached_game_state', 'readwrite');
      const store = tx.objectStore('cached_game_state');
      await new Promise((resolve, reject) => {
        const request = store.put({
          user_id: userId,
          ...gameState,
          cached_at: Date.now()
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  }, []);

  const getGameState = useCallback(async (userId) => {
    try {
      const db = await openDB();
      const tx = db.transaction('cached_game_state', 'readonly');
      const store = tx.objectStore('cached_game_state');
      const state = await new Promise((resolve, reject) => {
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      return state;
    } catch (error) {
      console.error('Error getting game state:', error);
      return null;
    }
  }, []);

  return { saveGameState, getGameState };
};

export default { useOnlineStatus, useOfflineQuestions, useOfflineGameState };
