import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Trophy, Medal, Star, User, Loader2, ShieldCheck } from 'lucide-react';

export function Ranking() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [indexError, setIndexError] = useState<{ message: string; url?: string } | null>(null);

  useEffect(() => {
    async function fetchLeaders() {
      try {
        // Try the optimized query first
        const q = query(
          collection(db, 'users'),
          where('showInRanking', '==', true),
          orderBy('points', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeaders(data);
      } catch (err: any) {
        console.error("Error fetching ranking:", err);
        
        // Handle Index Errors
        if (err.message && err.message.includes('requires an index')) {
          const isBuilding = err.message.includes('currently building');
          const urlMatch = err.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
          
          setIndexError({ 
            message: isBuilding ? 'O Firebase está otimizando o ranking agora mesmo. Isso leva apenas alguns minutos.' : err.message, 
            url: urlMatch ? urlMatch[0] : undefined,
            isBuilding
          });

          // Fallback: Try a simpler query if index is building or missing
          try {
            const fallbackQ = query(collection(db, 'users'), limit(50));
            const fallbackSnap = await getDocs(fallbackQ);
            const fallbackData = fallbackSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() as any }))
              .filter(u => u.showInRanking)
              .sort((a, b) => (b.points || 0) - (a.points || 0))
              .slice(0, 20);
            
            if (fallbackData.length > 0) {
              setLeaders(fallbackData);
            }
          } catch (fallbackErr) {
            console.error("Fallback ranking failed:", fallbackErr);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    fetchLeaders();
  }, []);

  if (loading && leaders.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (indexError && leaders.length === 0) {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 p-8 rounded-[2.5rem] text-center space-y-4">
        <Trophy className="w-12 h-12 text-yellow-500 mx-auto opacity-20" />
        <h3 className="text-xl font-bold italic tracking-tighter uppercase">
          {indexError.isBuilding ? 'Otimizando Ranking' : 'Ranking em Preparação'}
        </h3>
        <p className="text-gray-400 text-sm max-w-xs mx-auto font-medium">
          {indexError.isBuilding 
            ? 'Nosso sistema está processando as pontuações globais. O ranking aparecerá automaticamente em instantes.'
            : 'O sistema está otimizando a base de dados global. Este processo requer a ativação de um índice de performance.'}
        </p>
        
        {indexError.url && !indexError.isBuilding && (
          <div className="pt-4 space-y-4">
            <p className="text-xs text-yellow-500 font-black uppercase tracking-widest">Atenção Administrador:</p>
            <a 
              href={indexError.url} 
              target="_blank" 
              rel="noreferrer"
              className="inline-block bg-yellow-500 text-black px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-yellow-500/20 hover:scale-105 transition-all"
            >
              CRIAR ÍNDICE NO CONSOLE
            </a>
            <p className="text-[10px] text-gray-500 max-w-[200px] mx-auto">Após clicar, aguarde alguns minutos para o ranking ativar sozinho.</p>
          </div>
        )}

        {indexError.isBuilding && (
          <div className="flex items-center justify-center gap-2 text-yellow-500/50 mt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</span>
          </div>
        )}
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
              <p className="font-black truncate text-lg tracking-tight">
                {leader.displayName || (leader.email ? leader.email.split('@')[0] : 'Guerreiro FitAI')}
              </p>
              <div className="flex items-center gap-3">
                <span className="text-[10px] bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded font-black uppercase ring-1 ring-purple-500/20">Nível {leader.level || 1}</span>
                {leader.streak > 0 && (
                  <span className="text-[10px] bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded font-black uppercase">🔥 {leader.streak} dias</span>
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
      <div className="mt-8 p-6 bg-zinc-900/50 border border-white/5 rounded-3xl text-center">
        <ShieldCheck className="w-5 h-5 text-gray-500 mx-auto mb-2" />
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Respeitamos sua privacidade (LGPD)</p>
        <p className="text-xs text-gray-600 mt-1">Apenas usuários que optaram por "Aparecer no Ranking" em suas configurações de perfil são exibidos aqui.</p>
      </div>
    </div>
  );
}
