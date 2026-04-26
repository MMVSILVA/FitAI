import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { 
  Users, LayoutDashboard, MessageCircle, Settings, Plus, Search, 
  ChevronRight, UserPlus, Save, Loader2, X, Dumbbell, Activity 
} from 'lucide-react';
import { UserProfile, WorkoutPlan } from '../types';

export default function TrainerDashboard() {
  const { user, profile, clients: clientIds } = useUser();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'chat'>('overview');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState<{success?: boolean; message?: string} | null>(null);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleOpenPlanEditor = async (client: UserProfile) => {
    setSelectedClient(client);
    const snap = await getDoc(doc(db, 'users', client.uid));
    if (snap.exists()) {
      const data = snap.data();
      setEditingPlan(data.plan || {
        title: 'Treino Personalizado',
        objective: '...',
        structure: '...',
        frequency: '...',
        duration: '...',
        days: [],
        progression: '',
        consistencyScore: 100,
        strategies: []
      });
    }
  };

  const handleSavePlan = async () => {
    if (!selectedClient || !editingPlan) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', selectedClient.uid), {
        plan: editingPlan
      });
      alert('Treino atualizado com sucesso!');
      setSelectedClient(null);
    } catch (error) {
      console.error("Error saving plan:", error);
      alert('Erro ao salvar treino.');
    } finally {
      setIsSaving(false);
    }
  };

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
                  whileHover={{ x: 5 }}
                  onClick={() => handleOpenPlanEditor(client)}
                  className="bg-zinc-950 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
                       <img src={client.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.email}`} alt="client" />
                     </div>
                     <div>
                       <h3 className="font-bold">{client.displayName || client.email}</h3>
                       <p className="text-xs text-gray-500">{client.planType} • {client.objective}</p>
                       <p className="text-[10px] text-green-500 underline mt-1">Clique para editar treino</p>
                     </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-500" />
                 </motion.div>
               ))}
               {!loading && clients.length === 0 && <p className="text-gray-500 italic">Nenhum aluno vinculado ainda.</p>}
             </div>
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle className="w-16 h-16 text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold">Chat em breve</h2>
            <p className="text-gray-500">Estamos trabalhando nesta funcionalidade.</p>
          </div>
        )}
      </main>

      {/* Plan Editor Modal */}
      <AnimatePresence>
        {selectedClient && editingPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] p-8 relative"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Dumbbell className="w-6 h-6 text-green-500" /> Treino: {selectedClient.displayName}
                  </h3>
                  <p className="text-gray-500">Prescreva ou edite o plano de treino.</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Título do Plano</label>
                    <input 
                      type="text" 
                      value={editingPlan.title}
                      onChange={(e) => setEditingPlan({ ...editingPlan, title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Objetivo</label>
                    <input 
                      type="text" 
                      value={editingPlan.objective}
                      onChange={(e) => setEditingPlan({ ...editingPlan, objective: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-bold">Dias de Treino</h4>
                  {editingPlan.days.map((day, dIdx) => (
                    <div key={dIdx} className="bg-white/5 p-6 rounded-2xl space-y-4 border border-white/5">
                      <div className="flex gap-4">
                        <div className="w-32 space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Dia</label>
                          <input 
                            placeholder="Dia 1"
                            value={day.day}
                            onChange={(e) => {
                              const newDays = [...editingPlan.days];
                              newDays[dIdx].day = e.target.value;
                              setEditingPlan({ ...editingPlan, days: newDays });
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Foco do Dia</label>
                          <input 
                            placeholder="Ex: Peito e Tríceps"
                            value={day.focus}
                            onChange={(e) => {
                              const newDays = [...editingPlan.days];
                              newDays[dIdx].focus = e.target.value;
                              setEditingPlan({ ...editingPlan, days: newDays });
                            }}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-sm"
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newDays = [...editingPlan.days];
                            newDays.splice(dIdx, 1);
                            setEditingPlan({ ...editingPlan, days: newDays });
                          }}
                          className="pt-6 text-red-500 hover:text-red-400"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-2 bg-black/20 p-4 rounded-xl">
                        <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                          <div className="col-span-1 text-[8px] font-bold text-gray-600 uppercase">#</div>
                          <div className="col-span-6 text-[8px] font-bold text-gray-600 uppercase">Exercício</div>
                          <div className="col-span-2 text-[8px] font-bold text-gray-600 uppercase">Séries</div>
                          <div className="col-span-2 text-[8px] font-bold text-gray-600 uppercase">Reps</div>
                          <div className="col-span-1"></div>
                        </div>
                        {day.exercises.map((ex, eIdx) => (
                          <div key={eIdx} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-1 text-[10px] text-gray-500 font-bold">{eIdx + 1}</div>
                            <input 
                              placeholder="Exercício"
                              value={ex.name}
                              onChange={(e) => {
                                const newDays = [...editingPlan.days];
                                newDays[dIdx].exercises[eIdx].name = e.target.value;
                                setEditingPlan({ ...editingPlan, days: newDays });
                              }}
                              className="col-span-6 bg-white/5 border border-white/5 rounded-lg p-2 text-sm"
                            />
                            <input 
                              placeholder="Sets"
                              value={ex.sets}
                              type="number"
                              onChange={(e) => {
                                const newDays = [...editingPlan.days];
                                newDays[dIdx].exercises[eIdx].sets = parseInt(e.target.value) || 0;
                                setEditingPlan({ ...editingPlan, days: newDays });
                              }}
                              className="col-span-2 bg-white/5 border border-white/5 rounded-lg p-2 text-sm"
                            />
                            <input 
                              placeholder="Reps"
                              value={ex.reps}
                              onChange={(e) => {
                                const newDays = [...editingPlan.days];
                                newDays[dIdx].exercises[eIdx].reps = e.target.value;
                                setEditingPlan({ ...editingPlan, days: newDays });
                              }}
                              className="col-span-2 bg-white/5 border border-white/5 rounded-lg p-2 text-sm"
                            />
                            <button 
                              onClick={() => {
                                const newDays = [...editingPlan.days];
                                newDays[dIdx].exercises.splice(eIdx, 1);
                                setEditingPlan({ ...editingPlan, days: newDays });
                              }}
                              className="col-span-1 text-red-500/50 hover:text-red-500 flex justify-center"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => {
                            const newDays = [...editingPlan.days];
                            newDays[dIdx].exercises.push({ name: '', sets: 3, reps: '12', technicalDescription: '', rest: '60s' });
                            setEditingPlan({ ...editingPlan, days: newDays });
                          }}
                          className="w-full mt-2 py-2 border border-dashed border-white/10 rounded-lg text-[10px] text-gray-500 font-bold hover:bg-white/5 transition-all"
                        >
                          + Adicionar Exercício
                        </button>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setEditingPlan({ ...editingPlan, days: [...editingPlan.days, { day: `Dia ${editingPlan.days.length + 1}`, focus: 'Foco do dia', exercises: [] }] })}
                    className="w-full py-4 border border-dashed border-white/20 rounded-2xl hover:bg-white/5 transition-all text-gray-500 font-bold uppercase tracking-widest text-xs"
                  >
                    + Adicionar Novo Dia de Treino
                  </button>
                </div>
              </div>

              <div className="mt-12 flex gap-4">
                 <button 
                  onClick={handleSavePlan}
                  disabled={isSaving}
                  className="flex-1 bg-green-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
                 >
                   {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} Enviar Treino ao Aluno
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
