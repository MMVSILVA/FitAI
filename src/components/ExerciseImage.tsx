import React, { useState, useEffect } from 'react';
import { Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExerciseImageProps {
  src?: string;
  alt: string;
  className?: string;
  proxy?: boolean;
}

export const ExerciseImage: React.FC<ExerciseImageProps> = ({ src, alt, className = "", proxy = true }) => {
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [hasFailedAll, setHasFailedAll] = useState(false);

  // Compute the URL candidates in priority order
  const getCandidateUrls = (): string[] => {
    const urls: string[] = [];
    const encodedAlt = encodeURIComponent(alt || 'exercise');
    const encodedSrc = src ? encodeURIComponent(src) : '';

    if (src && src.startsWith('http')) {
      // Primary: backend proxy with smart fallback
      urls.push(`/api/exercises/proxy-gif?name=${encodedAlt}&url=${encodedSrc}`);
      // Secondary: direct external src
      urls.push(src);
    }

    // Name-based GIF resolver
    urls.push(`/api/exercises/gif-by-name?name=${encodedAlt}`);

    return urls;
  };

  const candidates = getCandidateUrls();
  const currentSrc = candidates[attempt] || candidates[0];

  useEffect(() => {
    setLoading(true);
    setAttempt(0);
    setHasFailedAll(false);
  }, [src, alt]);

  const handleError = () => {
    if (attempt < candidates.length - 1) {
      setAttempt(prev => prev + 1);
    } else {
      setLoading(false);
      setHasFailedAll(true);
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setHasFailedAll(false);
  };

  return (
    <div className={`relative bg-zinc-950 overflow-hidden flex items-center justify-center ${className}`}>
      <AnimatePresence>
        {loading && (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-zinc-950/80 backdrop-blur-xs"
          >
            <Loader2 className="w-5 h-5 text-purple-500 animate-spin opacity-60 mb-1" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Carregando GIF</span>
          </motion.div>
        )}
      </AnimatePresence>

      {hasFailedAll ? (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-center border border-white/5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-2">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xs font-black text-white/90 uppercase tracking-tight line-clamp-1 max-w-[90%]">
            {alt || 'Exercício'}
          </span>
          <span className="text-[9px] font-bold text-purple-400/80 uppercase tracking-widest mt-0.5">
            Guia de Movimento
          </span>
        </div>
      ) : (
        <motion.div 
          key={`image-container-${attempt}`} 
          className="relative w-full h-full flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <img
            src={currentSrc}
            alt={alt}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </motion.div>
      )}
    </div>
  );
};
