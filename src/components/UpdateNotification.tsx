import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { APP_VERSION } from '../constants';

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string; message: string } | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Listen to system config for updates
    const unsubscribe = onSnapshot(doc(db, 'system', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.latestVersion && data.latestVersion !== APP_VERSION) {
          setUpdateInfo({
            version: data.latestVersion,
            message: data.updateMessage || 'Uma nova versão do FitAI está disponível com melhorias e correções.'
          });
          setShow(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {show && updateInfo && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-96 z-[100]"
        >
          <div className="bg-zinc-900 border border-purple-500/50 rounded-3xl p-6 shadow-[0_20px_50px_rgba(168,85,247,0.3)] backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <button 
                onClick={() => setShow(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Nova Atualização!</h3>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  {updateInfo.message}
                </p>
                
                <button
                  onClick={handleUpdate}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  Atualizar Agora
                </button>
                
                <p className="text-[10px] text-gray-600 mt-4 text-center uppercase tracking-widest font-bold">
                  Versão Atual: {APP_VERSION} → Nova: {updateInfo.version}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
