import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Sparkles, Bell, Download } from 'lucide-react';
// @ts-ignore - Virtual module handled by vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { APP_VERSION } from '../constants';

export function UpdateNotification() {
  const [detectedUpdate, setDetectedUpdate] = useState<{ version: string; message: string; source: 'server' | 'firestore' | 'pwa' } | null>(null);
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Lógica de PWA (Service Worker) com proteção contra erros de runtime
  const swResult = useRegisterSW({
    onRegistered(r) {
      console.log('PWA: Service Worker registrado');
    },
    onRegisterError(error) {
      console.error('PWA: Erro no registro do SW', error);
    },
  });

  // Proteção robusta contra retornos inesperados do hook useRegisterSW
  const offlineReadyState = swResult && swResult.offlineReady ? swResult.offlineReady : [false, () => {}];
  const needUpdateState = swResult && swResult.needUpdate ? swResult.needUpdate : [false, () => {}];
  
  const [offlineReady, setOfflineReady] = offlineReadyState;
  const [needUpdate, setNeedUpdate] = needUpdateState;
  const updateServiceWorker = swResult && swResult.updateServiceWorker ? swResult.updateServiceWorker : (reload?: boolean) => Promise.resolve();

  // Função para checar versão diretamente no servidor via API REST
  const checkServerVersion = useCallback(async () => {
    try {
      const res = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.version && data.version !== APP_VERSION) {
          const dismissedForVersion = sessionStorage.getItem(`update_dismissed_${data.version}`);
          if (dismissedForVersion !== 'true') {
            console.log(`[UpdateSync] Nova versão detectada no servidor: ${data.version} (Atual: ${APP_VERSION})`);
            setDetectedUpdate({
              version: data.version,
              message: `Nova versão ${data.version} disponível com melhorias e sincronização automática.`,
              source: 'server'
            });
            setShow(true);
          }
        }
      }
    } catch (err) {
      // Falha silenciosa de rede
    }
  }, []);

  // Solicitar permissão de notificação nativa e iniciar polling periódico
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Verificação inicial
    checkServerVersion();

    // Verificação periódica frequente a cada 20 segundos para sincronização real e automática
    const interval = setInterval(() => {
      checkServerVersion();
      if (swResult?.updateServiceWorker) {
        swResult.updateServiceWorker(false);
      }
    }, 20 * 1000);

    // Verificação ao focar na janela / voltar à aba
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [checkServerVersion, swResult]);

  // Disparar notificação nativa automática no celular quando houver atualização
  useEffect(() => {
    if ((needUpdate || detectedUpdate) && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const newVersion = detectedUpdate?.version || 'Nova versão';
        const n = new Notification(`🚀 FitAI v${newVersion}`, {
          body: `Nova atualização disponível! Clique para sincronizar as melhorias agora.`,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: 'fitai-update', 
          requireInteraction: true,
          // @ts-ignore
          vibrate: [200, 100, 200, 100, 200]
        });

        n.onclick = () => {
          window.focus();
          handleUpdate();
        };
      } catch (e) {
        console.warn("Erro ao disparar notificação nativa:", e);
      }
    }
  }, [needUpdate, detectedUpdate]);

  // Listener em tempo real do Firestore (para atualizações broadcastadas pelo Admin)
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    
    try {
      unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const dismissedForVersion = sessionStorage.getItem(`update_dismissed_${data.latestVersion}`);
          
          if (data.latestVersion && data.latestVersion !== APP_VERSION && dismissedForVersion !== 'true') {
            setDetectedUpdate({
              version: data.latestVersion,
              message: data.updateMessage || 'Uma nova versão do FitAI está disponível com melhorias e correções.',
              source: 'firestore'
            });
            setShow(true);
          }
        }
      }, (error: any) => {
        if (error.code !== 'permission-denied') {
          console.error("UpdateNotification snapshot error:", error);
        }
      });
    } catch (e) {
      console.warn("UpdateNotification: Falha ao iniciar listener do Firestore:", e);
    }

    return () => unsubscribe();
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    if (detectedUpdate) {
      sessionStorage.setItem(`update_dismissed_${detectedUpdate.version}`, 'true');
    }
    
    try {
      // 1. Limpar caches do browser (Service Worker Cache API) para garantir arquivos mais recentes
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }

      // 2. Atualizar Service Worker se presente
      if (needUpdate) {
        await updateServiceWorker(true);
      } else if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const r of registrations) {
          await r.update().catch(() => {});
        }
      }
    } catch (e) {
      console.warn("Cache clean error on update:", e);
    }

    // 3. Forçar recarregamento limpo com timestamp
    const separator = window.location.href.includes('?') ? '&' : '?';
    window.location.href = window.location.href.split('#')[0] + separator + `_v=${Date.now()}`;
  };

  const handleDismiss = () => {
    if (detectedUpdate) {
      sessionStorage.setItem(`update_dismissed_${detectedUpdate.version}`, 'true');
    }
    setShow(false);
    setOfflineReady(false);
    setNeedUpdate(false);
  };

  const isVisible = show || needUpdate || offlineReady;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[9999]"
        >
          <div className="bg-zinc-950 border border-purple-500/50 rounded-3xl p-6 shadow-[0_20px_50px_rgba(168,85,247,0.3)] backdrop-blur-xl relative overflow-hidden group">
            {/* Animación de brillo en el fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent pointer-events-none" />
            
            <div className="absolute top-4 right-4">
              <button 
                onClick={handleDismiss}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                {needUpdate || detectedUpdate ? (
                  <RefreshCw className={`w-6 h-6 text-purple-400 ${isUpdating ? 'animate-spin' : 'animate-spin-slow'}`} />
                ) : (
                  <Sparkles className="w-6 h-6 text-green-400" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white">
                    {needUpdate || detectedUpdate ? 'Nova Atualização!' : 'Pronto para Uso Offline'}
                  </h3>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/30 uppercase tracking-widest">
                    Real-time
                  </span>
                </div>

                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {needUpdate || detectedUpdate 
                    ? (detectedUpdate?.message || 'Uma nova versão do FitAI está disponível com melhorias e correções de performance.')
                    : 'O FitAI foi salvo no seu dispositivo e agora funciona mesmo sem internet.'}
                </p>
                
                {(needUpdate || detectedUpdate) ? (
                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50"
                  >
                    <Download className={`w-5 h-5 ${isUpdating ? 'animate-bounce' : ''}`} />
                    {isUpdating ? 'Sincronizando Atualização...' : 'Atualizar Agora'}
                  </button>
                ) : (
                  <button
                    onClick={() => setOfflineReady(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all border border-white/5"
                  >
                    Excelente!
                  </button>
                )}
                
                {(needUpdate || detectedUpdate) && (
                  <p className="text-[9px] text-gray-500 mt-4 text-center uppercase tracking-[0.2em] font-black">
                    Versão Instalada: {APP_VERSION} {detectedUpdate ? `→ v${detectedUpdate.version}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

