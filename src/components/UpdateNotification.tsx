import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Sparkles, Bell, Download } from 'lucide-react';
// @ts-ignore - Virtual module handled by vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { APP_VERSION } from '../constants';

export function UpdateNotification() {
  const [firestoreUpdate, setFirestoreUpdate] = useState<{ version: string; message: string } | null>(null);
  const [show, setShow] = useState(false);

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

  // Solicitar permissão de notificação nativa ao montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Disparar notificação nativa automática no celular quando houver atualização
  useEffect(() => {
    if ((needUpdate || firestoreUpdate) && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const n = new Notification('FitAI - Nova Atualização!', {
          body: 'Uma nova versão do app está pronta. Toque para atualizar agora.',
          icon: '/favicon.svg',
          tag: 'fitai-update', // Evita duplicatas
          // @ts-ignore
          vibrate: [200, 100, 200]
        });

        n.onclick = () => {
          window.focus();
          handleUpdate();
        };
      } catch (e) {
        console.warn("Erro ao disparar notificação nativa:", e);
      }
    }
  }, [needUpdate, firestoreUpdate]);
  // Listener do Firestore (Backup para atualizações forçadas via DB)
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.latestVersion && data.latestVersion !== APP_VERSION) {
          setFirestoreUpdate({
            version: data.latestVersion,
            message: data.updateMessage || 'Uma nova versão do FitAI está disponível com melhorias e correções.'
          });
          setShow(true);
        }
      }
    }, (error) => {
      console.error("UpdateNotification snapshot error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = () => {
    if (needUpdate) {
      updateServiceWorker(true);
    } else {
      window.location.reload();
    }
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
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent pointer-events-none" />
            
            <div className="absolute top-4 right-4">
              <button 
                onClick={() => {
                  setShow(false);
                  setOfflineReady(false);
                  setNeedUpdate(false);
                }}
                className="text-gray-500 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                {needUpdate || firestoreUpdate ? (
                  <RefreshCw className="w-6 h-6 text-purple-400 animate-spin-slow" />
                ) : (
                  <Sparkles className="w-6 h-6 text-green-400" />
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">
                  {needUpdate || firestoreUpdate ? 'Nova Atualização!' : 'Pronto para Uso Offline'}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {needUpdate || firestoreUpdate 
                    ? (firestoreUpdate?.message || 'Uma nova versão do FitAI está disponível com melhorias e correções de performance.')
                    : 'O FitAI foi salvo no seu dispositivo e agora funciona mesmo sem internet.'}
                </p>
                
                {(needUpdate || firestoreUpdate) ? (
                  <button
                    onClick={handleUpdate}
                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    Atualizar Agora
                  </button>
                ) : (
                  <button
                    onClick={() => setOfflineReady(false)}
                    className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all border border-white/5"
                  >
                    Excelente!
                  </button>
                )}
                
                {(needUpdate || firestoreUpdate) && (
                  <p className="text-[9px] text-gray-600 mt-4 text-center uppercase tracking-[0.2em] font-black">
                    Versão Atual: {APP_VERSION} {firestoreUpdate ? `→ ${firestoreUpdate.version}` : ''}
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
