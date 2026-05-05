import React, { useState } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ExerciseImageProps {
  src: string;
  alt: string;
  className?: string;
  proxy?: boolean;
}

export const ExerciseImage: React.FC<ExerciseImageProps> = ({ src, alt, className = "" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fallbackImg = `https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500&q=80`;

  return (
    <div className={`relative bg-zinc-950 overflow-hidden flex items-center justify-center ${className}`}>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div 
            key="loader"
            className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-950"
          >
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin opacity-40" />
          </motion.div>
        )}
        
        <motion.div 
          key="image-container" 
          className="relative w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <img
            src={error || !src ? fallbackImg : src}
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
      </AnimatePresence>
    </div>
  );
};
