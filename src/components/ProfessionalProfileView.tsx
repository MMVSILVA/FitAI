import React from 'react';
import { UserProfile } from '../types';
import { MapPin, Award, BookOpen, Clock, DollarSign, X } from 'lucide-react';

interface ProfessionalProfileViewProps {
  professional: UserProfile;
  onClose: () => void;
}

export const ProfessionalProfileView: React.FC<ProfessionalProfileViewProps> = ({ professional, onClose }) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="h-32 bg-gradient-to-r from-purple-600 to-blue-600 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="px-8 pb-8 pt-0 -mt-16 text-center relative z-10">
          <div className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-950 bg-white dark:bg-zinc-900 mx-auto overflow-hidden shadow-xl mb-4">
            <img 
              src={professional.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${professional.displayName || professional.email}`} 
              alt={professional.displayName || 'Professional'} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <h3 className="text-2xl font-black text-black dark:text-white mb-1">
            {professional.displayName || 'Profissional'}
          </h3>
          <p className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest text-[10px] mb-6">
            {(professional as any).specialty || (professional.role === 'trainer' ? 'Personal Trainer' : 'Nutricionista')}
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl flex flex-col items-center">
              <Award className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Registro</p>
              <p className="text-sm font-bold text-black dark:text-white truncate w-full">{(professional as any).license || 'Não informado'}</p>
            </div>
            <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl flex flex-col items-center">
              <Clock className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Experiência</p>
              <p className="text-sm font-bold text-black dark:text-white truncate w-full">{(professional as any).experience || 'Não informado'}</p>
            </div>
            <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl flex flex-col items-center">
              <MapPin className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Localização</p>
              <p className="text-sm font-bold text-black dark:text-white truncate w-full">
                {(professional as any).location_city ? `${(professional as any).location_city}, ${(professional as any).location_state}` : 'Não informado'}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-white/5 p-3 rounded-2xl flex flex-col items-center">
              <DollarSign className="w-5 h-5 text-gray-400 mb-1" />
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Consultoria</p>
              <p className="text-sm font-bold text-black dark:text-white truncate w-full">{(professional as any).consultationPrice || 'Sob consulta'}</p>
            </div>
          </div>

          <div className="text-left space-y-4">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <BookOpen className="w-3 h-3" /> Bio / Metodologia
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
                {(professional as any).bio || 'Este profissional ainda não preencheu sua biografia.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
