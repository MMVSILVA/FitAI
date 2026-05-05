import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Medal, Star, User, Loader2 } from 'lucide-react';

export function Ranking() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        const q = query(
          collection(db, 'users'),
          orderBy('points', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(data);
      } catch (err) {
        console.error("Error fetching ranking:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter">HALL DA FAMA</h2>
        <p className="text-gray-500 font-medium">Os guerreiros mais consistentes da comunidade</p>
      </div>

      <div className="grid gap-4">
        {leaders.map((leader, index) => (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            key={leader.id}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              index === 0 
                ? 'bg-yellow-500/10 border-yellow-500/30 ring-2 ring-yellow-500/20' 
                : index === 1
                ? 'bg-gray-100 dark:bg-zinc-800/50 border-gray-400/30'
                : index === 2
                ? 'bg-orange-500/5 border-orange-500/20'
                : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/5'
            }`}
          >
            <div className="w-10 h-10 flex items-center justify-center font-black text-xl italic shrink-0">
              {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500" /> : 
               index === 1 ? <Medal className="w-6 h-6 text-gray-400" /> :
               index === 2 ? <Medal className="w-6 h-6 text-orange-400" /> : 
               `#${index + 1}`}
            </div>

            <div className="relative">
              <div className="w-12 h-12 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0 border border-white/10">
                <img src={leader.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${leader.displayName || leader.email}`} alt="avatar" />
              </div>
              {leader.lastSeen && (new Date().getTime() - new Date(leader.lastSeen).getTime()) < 180000 && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-900 rounded-full shadow-sm" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-bold truncate text-lg">{leader.displayName || 'Usuário Anônimo'}</p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-black uppercase">Nível {leader.level || 1}</span>
                {leader.streak > 1 && (
                  <span className="text-[10px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded font-black uppercase">🔥 {leader.streak} semanas</span>
                )}
              </div>
            </div>

            <div className="text-right">
              <p className="text-2xl font-black text-black dark:text-white leading-none">{leader.points || 0}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Pontos</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
