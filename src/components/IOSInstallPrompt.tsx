import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

export function IOSInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Check if it's already installed (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    // We only show the prompt if it's iOS and NOT installed
    // Also, we can check if the user has already dismissed it today
    const dismissedAt = localStorage.getItem('ios-install-prompt-dismissed');
    const isRecentlyDismissed = dismissedAt && Date.now() - parseInt(dismissedAt) < 1000 * 60 * 60 * 24; // 24h

    if (isIOS && !isStandalone && !isRecentlyDismissed) {
      // Delay the prompt slightly for better UX
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('ios-install-prompt-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-6 right-6 z-[10000] md:max-w-md md:left-auto md:right-8"
        >
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <button 
              onClick={dismiss}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                <Smartphone className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg">Instale no seu iPhone</h3>
                <p className="text-gray-400 text-sm">Adicione à tela de início para acesso rápido.</p>
              </div>
            </div>

            <div className="space-y-4 bg-black/40 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <Share className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-300 text-sm">1. Toque no botão <span className="text-white font-bold">Compartilhar</span> no menu do navegador.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                  <PlusSquare className="w-4 h-4 text-white" />
                </div>
                <p className="text-gray-300 text-sm">2. Role para baixo e toque em <span className="text-white font-bold">Adicionar à Tela de Início</span>.</p>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/20 active:scale-95"
            >
              Entendi
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
