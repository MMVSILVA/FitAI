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
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);

  // Safety timeout for loading state
  React.useEffect(() => {
    if (loading && src && !fallbackUrl) {
      const timer = setTimeout(() => {
        if (loading) {
          console.warn("ExerciseImage: Loading timeout reached for", src);
          setError(true);
          setLoading(false);
        }
      }, 15000); // 15 seconds timeout
      return () => clearTimeout(timer);
    }
  }, [loading, src, fallbackUrl]);

  // Handle Unsplash Fallback
  React.useEffect(() => {
    if (error && !fallbackMode && !fallbackUrl) {
      const fetchFallback = async () => {
        try {
          const query = alt.split('(')[0].trim() || 'fitness workout';
          const response = await fetch(`/api/exercises/unsplash-image?query=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            setFallbackUrl(data.url);
            setFallbackMode(true);
            setError(false);
            setLoading(true);
          }
        } catch (e) {
          console.error("Failed to fetch unsplash fallback", e);
        }
      };
      fetchFallback();
    }
  }, [error, fallbackMode, fallbackUrl, alt]);

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

  const imageUrl = fallbackUrl || (proxy ? `/api/exercises/proxy-gif?url=${encodeURIComponent(src.trim())}` : src);

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
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
              {fallbackMode ? 'Nenhuma imagem disponível' : 'Erro ao carregar imagem'}
            </span>
          </motion.div>
        ) : (
          <motion.img
            key={imageUrl}
            src={imageUrl}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-700 ${loading ? 'scale-110 blur-sm opacity-0' : 'scale-100 blur-0 opacity-100'}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              if (fallbackMode) {
                setError(true);
                setLoading(false);
              } else {
                // Secondary error will trigger Fallback Effect
                setError(true);
                setLoading(false);
              }
            }}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        )}
        {fallbackMode && !loading && !error && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-white/60 uppercase tracking-widest">
            Unsplash Fallback
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
