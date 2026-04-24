import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cookie, X, ShieldCheck } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('fitai_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('fitai_cookie_consent', 'true');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:max-w-md"
        >
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-[24px] shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Cookie className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                  Privacidade e Cookies
                  <ShieldCheck className="w-3 h-3 text-purple-400" />
                </h3>
                <p className="text-gray-400 text-xs leading-relaxed mb-4">
                  Usamos cookies para melhorar sua experiência e analisar nosso tráfego conforme a LGPD. Ao continuar no FitAI, você concorda com nossa política de dados.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={handleAccept}
                    className="flex-1 bg-white text-black py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 transition-transform"
                  >
                    Aceitar Todos
                  </button>
                  <button 
                    onClick={() => setIsVisible(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
                  >
                    Recusar
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsVisible(false)}
                className="text-gray-600 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
