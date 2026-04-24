import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Check, X, ExternalLink, ScrollText } from 'lucide-react';

interface LegalConsentProps {
  onAccept: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const LegalConsent: React.FC<LegalConsentProps> = ({ onAccept, isOpen, onClose }) => {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[32px] overflow-hidden relative shadow-2xl"
          >
            <div className="p-8">
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-purple-500" />
              </div>
              
              <h2 className="text-2xl font-black text-white mb-2">Sua Privacidade é Prioridade</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8">
                De acordo com a Lei Geral de Proteção de Dados (LGPD), precisamos do seu consentimento para processar seus dados de saúde e biometria para gerar seus treinos personalizados.
              </p>

              <div className="space-y-4 mb-8">
                <label className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl cursor-pointer group hover:bg-white/[0.08] transition-colors">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
                    />
                    <div className={`h-5 w-5 border-2 rounded-md transition-all ${agreedTerms ? 'bg-purple-600 border-purple-600' : 'border-white/20'}`}>
                      {agreedTerms && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-0.5">Termos de Uso</p>
                    <p className="text-xs text-gray-500">Eu li e aceito os termos de serviço e uso da plataforma FitAI.</p>
                  </div>
                </label>

                <label className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl cursor-pointer group hover:bg-white/[0.08] transition-colors">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      checked={agreedPrivacy}
                      onChange={(e) => setAgreedPrivacy(e.target.checked)}
                      className="peer h-5 w-5 opacity-0 absolute cursor-pointer" 
                    />
                    <div className={`h-5 w-5 border-2 rounded-md transition-all ${agreedPrivacy ? 'bg-purple-600 border-purple-600' : 'border-white/20'}`}>
                      {agreedPrivacy && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-0.5">Política de Privacidade (LGPD)</p>
                    <p className="text-xs text-gray-500">Autorizo o FitAI a coletar e processar meus dados de saúde para fins de treinamento personalizado.</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-colors border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  onClick={onAccept}
                  disabled={!agreedTerms || !agreedPrivacy}
                  className="flex-1 px-6 py-4 rounded-2xl font-black bg-purple-600 text-white disabled:opacity-30 disabled:grayscale transition-all active:scale-95 shadow-lg shadow-purple-600/20"
                >
                  Confirmar e Entrar
                </button>
              </div>
            </div>

            <div className="p-4 bg-black/40 border-t border-white/5 flex justify-center gap-6">
              <button className="text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:text-purple-400 flex items-center gap-1">
                <ScrollText className="w-3 h-3" />
                Ver Termos Completos
              </button>
              <button className="text-[10px] uppercase tracking-widest font-bold text-gray-600 hover:text-purple-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Política de Cookies
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
