import React, { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExerciseImageProps {
  src: string;
  alt: string;
  className?: string;
  proxy?: boolean;
}

export const ExerciseImage: React.FC<ExerciseImageProps> = ({ src, alt, className = "", proxy = true }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Safety timeout for loading state
  React.useEffect(() => {
    if (loading && src) {
      const timer = setTimeout(() => {
        if (loading) {
          console.warn("ExerciseImage: Loading timeout reached for", src);
          setError(true);
          setLoading(false);
        }
      }, 15000); // 15 seconds timeout
      return () => clearTimeout(timer);
    }
  }, [loading, src]);

  if (!src || src === '') {
    return (
      <div className={`relative bg-zinc-900 overflow-hidden flex items-center justify-center ${className}`}>
        <div className="flex flex-col items-center justify-center gap-2 text-gray-700">
          <ImageOff className="w-8 h-8 opacity-20" />
          <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Sem Imagem</span>
        </div>
      </div>
    );
  }

  const imageUrl = proxy ? `/api/exercises/proxy-gif?url=${encodeURIComponent(src.trim())}` : src;

  return (
    <div className={`relative bg-zinc-900 overflow-hidden flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        {loading && !error && (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10"
          >
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin opacity-50" />
          </motion.div>
        )}

        {error ? (
          <motion.div 
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-2 text-gray-700 px-4 text-center"
          >
            <ImageOff className="w-8 h-8 opacity-20" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">Erro ao carregar imagem</span>
          </motion.div>
        ) : (
          <motion.img
            key="image"
            src={imageUrl}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'scale-110 blur-sm opacity-0' : 'scale-100 blur-0 opacity-100'}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setError(true);
              setLoading(false);
            }}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
