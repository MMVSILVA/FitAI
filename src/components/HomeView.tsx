import React from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, Flame, MapPin, Calendar, ChevronRight, 
  Settings, Search, User as UserIcon, CheckCircle2,
  Zap, Star, Target, Award, Copy
} from 'lucide-react';
import { useUser } from '../store/userStore';
import { UserProfile } from '../types';

export function HomeView() {
  const { user, profile, planType } = useUser();

  const handleCheckIn = async () => {
    if (!user || !profile) return;
    try {
      const { doc, updateDoc, arrayUnion } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const today = new Date().toISOString().split('T')[0];
      
      if (profile.checkInDates?.includes(today)) {
        alert('Você já fez check-in hoje!');
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        checkInDates: arrayUnion(today),
        streak: (profile.streak || 0) + 1,
        points: (profile.points || 0) + 50,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error doing check-in:", err);
    }
  };

  const medals = [
    { id: '1', name: 'Mestre do Bem-estar', icon: <Zap className="w-8 h-8 text-white" />, color: 'bg-zinc-900', year: '2026' },
    { id: '2', name: '200 Check-ins', icon: <MapPin className="w-8 h-8 text-white" />, color: 'bg-rose-600', count: '200' },
    { id: '3', name: 'Dia Mundial da Atividade', icon: <Award className="w-8 h-8 text-white" />, color: 'bg-blue-600', year: '2026' },
    { id: '4', name: 'Dia Internacional', icon: <Star className="w-8 h-8 text-white" />, color: 'bg-purple-600', year: '2026' },
  ];

  const challenges = [
    {
      id: 'c1',
      title: 'Maio: 70k Pontos em 7 Dias',
      meta: '70.000 pontos por participante',
      participants: 1240,
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
      by: 'FitAI'
    }
  ];

  const weekDays = [
    { day: '06', label: 'QUA', active: true },
    { day: '07', label: 'QUI' },
    { day: '08', label: 'SEX' },
    { day: '09', label: 'SAB' },
    { day: '10', label: 'DOM' },
  ];

  if (!profile) return null;

  return (
    <div className="space-y-12 pb-24">
      {/* Profile Header */}
      <section className="px-1">
        <div className="flex justify-between items-start mb-10">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.9] text-black dark:text-white max-w-sm">
              {profile.displayName || user?.displayName || 'Usuário'}
            </h1>
            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 font-medium text-xs sm:text-sm">
              <span>Wellhub ID: 220 827 924 0946</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('220 827 924 0946');
                  alert('ID Copiado!');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="inline-block bg-gray-100 dark:bg-zinc-800 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/5">
              Plano {profile.planType === 'FREE' ? 'Basic' : 'Premium'}+
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
             <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-full border border-gray-200 dark:border-white/10 shadow-sm cursor-pointer hover:scale-105 transition-all">
                <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
             </div>
             {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-2xl"
                />
             ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-purple-600 text-white flex items-center justify-center text-2xl font-black border-4 border-white dark:border-zinc-900 shadow-2xl">
                   {(profile.displayName || 'U').charAt(0).toUpperCase()}
                </div>
             )}
          </div>
        </div>

        {/* Check-ins and Pins Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white dark:bg-zinc-900 rounded-[3rem] p-10 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5 flex items-center justify-between group"
          >
            <div>
              <p className="text-7xl font-black text-black dark:text-white mb-2 leading-none">{profile.checkInDates?.length || 0}</p>
              <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight text-lg">Check-ins realizados</p>
              <button 
                onClick={handleCheckIn}
                className="mt-6 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 dark:hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-black/10"
              >
                Fazer Check-in
              </button>
            </div>
            <div className="flex -space-x-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-20 bg-rose-500 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-2xl group-hover:translate-x-2 transition-transform">
                  <MapPin className="w-10 h-10 text-white fill-white/20" />
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-rose-800 to-rose-950 rounded-[2.5rem] p-8 shadow-2xl shadow-rose-950/20 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 transition-transform group-hover:scale-110">
              <Flame className="w-32 h-32 text-orange-400" />
            </div>
            <div className="relative z-10">
              <h3 className="text-4xl font-black text-white mb-2 leading-tight">
                Sequência de <span className="text-orange-400">{profile.streak || 14}</span> semanas
              </h3>
              <p className="text-white/80 font-bold mb-6">Você está com tudo! 🔥</p>
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Agenda Section */}
      <section>
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-6 px-1">Agenda</h2>
        <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar pb-2">
          {weekDays.map((wd) => (
            <div 
              key={wd.day} 
              className={`flex-1 min-w-[80px] p-4 rounded-[1.5rem] border flex flex-col items-center gap-2 transition-all ${
                wd.active 
                  ? 'bg-white dark:bg-zinc-900 border-black dark:border-white shadow-xl translate-y-[-4px]' 
                  : 'bg-white dark:bg-zinc-900/50 border-gray-100 dark:border-white/5 opacity-50'
              }`}
            >
              <span className={`text-2xl font-black ${wd.active ? 'text-black dark:text-white' : 'text-gray-400'}`}>
                {wd.day}
              </span>
              <span className={`text-[10px] font-black tracking-widest ${wd.active ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'}`}>
                {wd.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Medals Section */}
      <section>
        <div className="flex justify-between items-end mb-6 px-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Medalhas</h2>
          <button className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white border-b-2 border-gray-200 dark:border-white/10 uppercase tracking-tighter">Ver tudo</button>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
          {medals.map((medal) => (
            <div key={medal.id} className="flex flex-col items-center gap-3 shrink-0 w-32 group">
              <div className={`w-28 h-28 ${medal.color} rounded-[2rem] flex items-center justify-center relative overflow-hidden shadow-2xl group-hover:scale-105 transition-transform`}>
                 <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                 {medal.icon}
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-black text-white">
                    {medal.year || medal.count}
                 </div>
              </div>
              <p className="text-[11px] font-black text-center text-gray-600 dark:text-gray-400 leading-tight uppercase tracking-tight">
                {medal.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Challenges Section */}
      <section>
        <div className="flex justify-between items-end mb-6 px-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Desafios</h2>
          <button className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white border-b-2 border-gray-200 dark:border-white/10 uppercase tracking-tighter">Ver tudo</button>
        </div>
        <div className="space-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="relative rounded-[3rem] overflow-hidden group shadow-2xl">
              <img 
                src={challenge.image} 
                alt={challenge.title}
                className="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-10 flex flex-col justify-end">
                <div className="space-y-2 mb-6">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Por {challenge.by}</p>
                  <h3 className="text-3xl font-black text-white tracking-tighter">{challenge.title}</h3>
                  <p className="text-white/80 text-sm font-bold">Meta: {challenge.meta}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-black text-white">
                        {i === 4 ? '+1k' : '👤'}
                      </div>
                    ))}
                  </div>
                  <button className="bg-rose-600 hover:bg-rose-500 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-rose-600/30 active:scale-95">
                    Participar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Games Section */}
      <section>
        <div className="flex justify-between items-end mb-6 px-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter">Games & Social</h2>
          <button className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white border-b-2 border-gray-200 dark:border-white/10 uppercase tracking-tighter text-right">Explorar</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-600/10 border-2 border-purple-500/20 rounded-[2.5rem] p-8 aspect-square flex flex-col justify-between group hover:bg-purple-600 transition-colors">
            <Target className="w-12 h-12 text-purple-600 group-hover:text-white transition-colors" />
            <div>
              <p className="text-2xl font-black text-purple-600 group-hover:text-white transition-colors tracking-tighter leading-none mb-1">Rank Global</p>
              <p className="text-gray-500 group-hover:text-white/60 transition-colors text-xs font-bold uppercase tracking-widest">Dispute o topo</p>
            </div>
          </div>
          <div className="bg-yellow-500/10 border-2 border-yellow-500/20 rounded-[2.5rem] p-8 aspect-square flex flex-col justify-between group hover:bg-yellow-500 transition-colors">
            <Trophy className="w-12 h-12 text-yellow-600 group-hover:text-white transition-colors" />
            <div>
              <p className="text-2xl font-black text-yellow-600 group-hover:text-white transition-colors tracking-tighter leading-none mb-1">Conquistas</p>
              <p className="text-gray-500 group-hover:text-white/60 transition-colors text-xs font-bold uppercase tracking-widest">Coletar insígnias</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
