import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { Users, Search, MapPin, Star, MessageCircle, ChevronRight, Zap, Target } from 'lucide-react';
import { motion } from 'motion/react';

export function ProfessionalsView() {
  const [professionals, setProfessionals] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchProfessionals() {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['admin', 'trainer', 'nutritionist'])
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ ...d.data(), uid: d.id } as UserProfile));
        
        // Filter out the master admin if requested, but typically we want all professionals.
        // The user specifically wanted to be treated as a student, so we might filter him out of THIS list.
        const filtered = data.filter(p => p.email !== 'vinidoctor@gmail.com');
        
        setProfessionals(filtered);
      } catch (err) {
        console.error("Error fetching professionals:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfessionals();
  }, []);

  const filtered = professionals.filter(p => 
    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p as any).specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-32">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Explore Profissionais</h2>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Encontre o Personal ou Nutri ideal para você</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar por nome ou especialidade..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm focus:border-blue-500 transition-all outline-none"
          />
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-zinc-900 rounded-[2.5rem] border border-white/5"></div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filtered.map((prof) => (
            <motion.div 
              key={prof.uid}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 dark:border-white/5 shadow-2xl shadow-black/5 relative overflow-hidden group"
            >
              <div className="flex gap-6 relative z-10">
                <div className="shrink-0">
                  {prof.photoURL ? (
                    <img 
                      src={prof.photoURL} 
                      alt={prof.displayName}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white dark:border-zinc-800 shadow-xl"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-black border-4 border-white dark:border-zinc-800 shadow-xl">
                      {prof.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${i <= 4 ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-black text-xl text-black dark:text-white leading-tight uppercase tracking-tight truncate">
                         {prof.displayName}
                      </h3>
                      <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">
                        {prof.role === 'nutritionist' ? 'Nutricionista' : 'Personal Trainer'}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 leading-relaxed italic">
                    {(prof as any).specialty || 'Especialista em alto rendimento e transformação corporal.'}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                      <Target className="w-3 h-3" /> {(prof as any).experience || '5+ anos'} exp
                    </div>
                    {(prof as any).location_city && (
                      <div className="bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-[9px] font-black uppercase text-gray-500 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> {(prof as any).location_city}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                      <MessageCircle className="w-4 h-4" /> Contatar
                    </button>
                    <button className="p-3 bg-gray-100 dark:bg-white/10 rounded-2xl hover:bg-blue-500 hover:text-white transition-all group-hover:translate-x-1">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Abstract background shape */}
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-zinc-900/50 rounded-[3rem] border border-dashed border-white/10">
          <Users className="w-16 h-16 text-gray-700 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Nenhum profissional encontrado com esses critérios.</p>
        </div>
      )}
    </div>
  );
}
