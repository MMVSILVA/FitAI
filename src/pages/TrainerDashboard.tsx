import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Users, LayoutDashboard, MessageCircle, Settings, Plus, Search, ChevronRight, UserPlus } from 'lucide-react';
import { UserProfile, WorkoutPlan } from '../types';

export default function TrainerDashboard() {
  const { user, profile, clients: clientIds } = useUser();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'chat'>('overview');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState<{success?: boolean; message?: string} | null>(null);

  useEffect(() => {
    async function fetchClients() {
      if (!user || !clientIds?.length) {
        setLoading(false);
        return;
      }
      
      try {
        const q = query(collection(db, 'users'), where('uid', 'in', clientIds));
        const snap = await getDocs(q);
        const clientsData = snap.docs.map(d => d.data() as UserProfile);
        setClients(clientsData);
      } catch (error) {
        console.error("Error fetching clients:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, [user, clientIds]);

  const handleLinkClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail || !user) return;
    
    setSearchStatus({ message: 'Buscando...' });
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.toLowerCase().trim()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setSearchStatus({ success: false, message: 'Usuário não encontrado' });
        return;
      }

      const clientDoc = snap.docs[0];
      const clientUid = clientDoc.id;

      // Check if already linked
      if (clientIds?.includes(clientUid)) {
        setSearchStatus({ success: false, message: 'Usuário já é seu aluno' });
        return;
      }

      // Update Trainer
      await updateDoc(doc(db, 'users', user.uid), {
        clients: arrayUnion(clientUid)
      });

      // Update Client
      await updateDoc(clientDoc.ref, {
        trainerId: user.uid
      });

      setSearchStatus({ success: true, message: 'Aluno vinculado com sucesso!' });
      setSearchEmail('');
    } catch (error) {
      setSearchStatus({ success: false, message: 'Erro ao vincular' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 space-y-8 hidden md:block">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-black italic">F</div>
          <span className="font-bold text-xl tracking-tighter">FITAI <span className="text-sm font-normal text-gray-500">Coach</span></span>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('clients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'clients' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Users className="w-5 h-5" /> Meus Alunos
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <MessageCircle className="w-5 h-5" /> Chat
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold">Olá, Coach {profile?.displayName || '...'}</h1>
            <p className="text-gray-500">Gerencie seus alunos e acompanhe metas.</p>
          </div>
          
          <div className="flex gap-4">
            <button className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all"><Settings className="w-6 h-6" /></button>
            <div className="w-10 h-10 bg-green-500 rounded-full border-2 border-white/20 overflow-hidden">
               <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.displayName || 'Trainer'}`} alt="avatar" />
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl">
                 <p className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-widest">Total Alunos</p>
                 <p className="text-4xl font-bold">{clients.length}</p>
               </div>
               <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl">
                 <p className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-widest">Planos Ativos (IA)</p>
                 <p className="text-4xl font-bold">{clients.filter(c => c.planType !== 'FREE').length}</p>
               </div>
               <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl">
                 <p className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-widest">Mensagens Pendentes</p>
                 <p className="text-4xl font-bold">0</p>
               </div>
            </div>

            <section>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold">Vincular Novo Aluno</h2>
               </div>
               <form onSubmit={handleLinkClient} className="max-w-md flex gap-2">
                 <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                   <input 
                    type="email" 
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="E-mail do aluno..."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-green-500 outline-none"
                   />
                 </div>
                 <button type="submit" className="bg-green-500 text-black px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-green-400 transition-all">
                   <UserPlus className="w-4 h-4" /> Vincular
                 </button>
               </form>
               {searchStatus && (
                 <p className={`mt-2 text-sm ${searchStatus.success ? 'text-green-500' : 'text-gray-400'}`}>
                   {searchStatus.message}
                 </p>
               )}
            </section>
          </div>
        )}

        {activeTab === 'clients' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold">Gestão de Alunos</h2>
             <div className="grid gap-4">
               {loading ? <p>Carregando...</p> : clients.map(client => (
                 <motion.div 
                  key={client.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-950 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${client.email}`} alt="client" />
                     </div>
                     <div>
                       <h3 className="font-bold">{client.displayName || client.email}</h3>
                       <p className="text-xs text-gray-500">{client.planType} • {client.objective}</p>
                     </div>
                   </div>
                   <button className="p-2 hover:bg-white/10 rounded-full transition-all">
                     <ChevronRight className="w-5 h-5 text-gray-500" />
                   </button>
                 </motion.div>
               ))}
               {!loading && clients.length === 0 && <p className="text-gray-500 italic">Nenhum aluno vinculado ainda.</p>}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
