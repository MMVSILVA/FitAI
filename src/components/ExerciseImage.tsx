import React, { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExerciseImageProps {
  src: string;
  alt: string;
  className?: string;
  proxy?: boolean;
}

export const ExerciseImage: React.FC<ExerciseImageProps> = ({ src, alt, className = "", proxy = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallbackImg = `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80`;
  
  // Use proxy if requested, but handle GIF specifically
  const finalSrc = (proxy && src && src.includes('.gif')) 
    ? `/api/exercises/proxy-gif?url=${encodeURIComponent(src)}` 
    : (src || fallbackImg);

  return (
    <div className={`relative bg-zinc-950 overflow-hidden flex items-center justify-center ${className}`}>
      <AnimatePresence>
        {loading && (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-950"
          >
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin opacity-40" />
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        key="image-container" 
        className="relative w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.4 }}
      >
        <img
          src={error ? fallbackImg : finalSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true);
            setLoading(false);
          }}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </motion.div>
    </div>
  );
};
