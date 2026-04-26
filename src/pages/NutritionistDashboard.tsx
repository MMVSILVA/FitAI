import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { Users, LayoutDashboard, MessageCircle, Settings, Plus, Search, ChevronRight, UserPlus, Apple, Activity, Save, Loader2, X } from 'lucide-react';
import { UserProfile, WorkoutPlan, DietPlan } from '../types';

export default function NutritionistDashboard() {
  const { user, profile, clients: clientIds, updatePlanForUser } = useUser();
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'chat'>('overview');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState<{success?: boolean; message?: string} | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<UserProfile | null>(null);
  const [editingDiet, setEditingDiet] = useState<DietPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchPatients() {
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
        console.error("Error fetching patients:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, [user, clientIds]);

  const handleLinkPatient = async (e: React.FormEvent) => {
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

      if (clientIds?.includes(clientUid)) {
        setSearchStatus({ success: false, message: 'Usuário já é seu paciente' });
        return;
      }

      await updateDoc(doc(db, 'users', user.uid), {
        clients: arrayUnion(clientUid)
      });

      await updateDoc(clientDoc.ref, {
        nutritionistId: user.uid
      });

      setSearchStatus({ success: true, message: 'Paciente vinculado com sucesso!' });
      setSearchEmail('');
    } catch (error) {
      setSearchStatus({ success: false, message: 'Erro ao vincular' });
    }
  };

  const handleOpenDietEditor = async (patient: UserProfile) => {
    setSelectedPatient(patient);
    // Fetch full patient data including plan/diet
    const snap = await getDoc(doc(db, 'users', patient.uid));
    if (snap.exists()) {
      const data = snap.data();
      setEditingDiet(data.plan?.diet || {
        calories: '',
        macros: { protein: '', carbs: '', fat: '' },
        meals: [],
        recommendations: []
      });
    }
  };

  const handleSaveDiet = async () => {
    if (!selectedPatient || !editingDiet) return;
    setIsSaving(true);
    try {
      const snap = await getDoc(doc(db, 'users', selectedPatient.uid));
      if (snap.exists()) {
        const data = snap.data();
        const updatedPlan = {
          ...(data.plan || { title: 'Plano Personalizado', objective: '...', structure: '...', frequency: '...', duration: '...', days: [], progression: '', consistencyScore: 100, strategies: [] }),
          diet: editingDiet
        };
        await updatePlanForUser(selectedPatient.uid, updatedPlan);
        alert('Dieta atualizada com sucesso!');
        setSelectedPatient(null);
      }
    } catch (error) {
      console.error("Error saving diet:", error);
      alert('Erro ao salvar dieta.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      <aside className="w-64 border-r border-white/10 p-6 space-y-8 hidden md:block">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center font-bold text-black italic">N</div>
          <span className="font-bold text-xl tracking-tighter">FITAI <span className="text-sm font-normal text-gray-500">Nutri</span></span>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'patients' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Users className="w-5 h-5" /> Meus Pacientes
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold">Painel Nutricional: {profile?.displayName || '...'}</h1>
            <p className="text-gray-500">Gerencie dietas e protocolos alimentares.</p>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-zinc-950 border border-white/10 p-6 rounded-3xl">
                 <p className="text-gray-500 text-sm mb-1 uppercase font-bold tracking-widest">Total Pacientes</p>
                 <p className="text-4xl font-bold">{clients.length}</p>
               </div>
            </div>

            <section className="bg-zinc-950 border border-white/10 p-8 rounded-[2.5rem]">
               <h2 className="text-xl font-bold mb-6">Vincular Novo Paciente</h2>
               <form onSubmit={handleLinkPatient} className="max-w-md flex gap-2">
                 <input 
                  type="email" 
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="E-mail do paciente..."
                  className="flex-1 bg-zinc-900 border border-white/10 rounded-xl py-3 px-4 focus:ring-2 focus:ring-green-500 outline-none"
                 />
                 <button type="submit" className="bg-green-500 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-green-400 transition-all">
                   <UserPlus className="w-5 h-5" /> Vincular
                 </button>
               </form>
               {searchStatus && (
                 <p className={`mt-4 text-sm ${searchStatus.success ? 'text-green-500' : 'text-red-400'}`}>
                   {searchStatus.message}
                 </p>
               )}
            </section>
          </div>
        )}

        {activeTab === 'patients' && (
          <div className="space-y-6">
             <h2 className="text-2xl font-bold">Gestão de Pacientes</h2>
             <div className="grid gap-4">
               {loading ? <p>Carregando...</p> : clients.map(patient => (
                 <motion.div 
                  key={patient.uid}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleOpenDietEditor(patient)}
                  className="bg-zinc-950 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
                       <img src={patient.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${patient.email}`} alt="patient" />
                     </div>
                     <div>
                       <h3 className="font-bold">{patient.displayName || patient.email}</h3>
                       <p className="text-xs text-gray-500 underline">Clique para editar dieta</p>
                     </div>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-500" />
                 </motion.div>
               ))}
               {!loading && clients.length === 0 && <p className="text-gray-500 italic">Nenhum paciente vinculado ainda.</p>}
             </div>
          </div>
        )}
      </main>

      {/* Diet Editor Modal */}
      <AnimatePresence>
        {selectedPatient && editingDiet && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
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
                    <Apple className="w-6 h-6 text-green-500" /> Dieta: {selectedPatient.displayName}
                  </h3>
                  <p className="text-gray-500">Personalize o plano alimentar do seu paciente.</p>
                </div>
                <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Proteína (g)</label>
                  <input 
                    type="text" 
                    value={editingDiet.macros.protein}
                    onChange={(e) => setEditingDiet({ ...editingDiet, macros: { ...editingDiet.macros, protein: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Carbeidratos (g)</label>
                  <input 
                    type="text" 
                    value={editingDiet.macros.carbs}
                    onChange={(e) => setEditingDiet({ ...editingDiet, macros: { ...editingDiet.macros, carbs: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gordura (g)</label>
                  <input 
                    type="text" 
                    value={editingDiet.macros.fat}
                    onChange={(e) => setEditingDiet({ ...editingDiet, macros: { ...editingDiet.macros, fat: e.target.value } })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-lg font-bold">Refeições</h4>
                {editingDiet.meals.map((meal, idx) => (
                  <div key={idx} className="bg-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex gap-4">
                      <input 
                        placeholder="Nome da Refeição (Ex: Café da manhã)"
                        value={meal.name}
                        onChange={(e) => {
                          const newMeals = [...editingDiet.meals];
                          newMeals[idx].name = e.target.value;
                          setEditingDiet({ ...editingDiet, meals: newMeals });
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2"
                      />
                      <input 
                        placeholder="Horário"
                        value={meal.time}
                        onChange={(e) => {
                          const newMeals = [...editingDiet.meals];
                          newMeals[idx].time = e.target.value;
                          setEditingDiet({ ...editingDiet, meals: newMeals });
                        }}
                        className="w-32 bg-black/40 border border-white/10 rounded-xl p-2"
                      />
                    </div>
                    <textarea 
                      placeholder="Alimentos (um por linha)"
                      value={meal.foods.join('\n')}
                      onChange={(e) => {
                        const newMeals = [...editingDiet.meals];
                        newMeals[idx].foods = e.target.value.split('\n');
                        setEditingDiet({ ...editingDiet, meals: newMeals });
                      }}
                      className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-2"
                    />
                  </div>
                ))}
                <button 
                  onClick={() => setEditingDiet({ ...editingDiet, meals: [...editingDiet.meals, { name: '', time: '', foods: [] }] })}
                  className="w-full py-3 border border-dashed border-white/20 rounded-2xl hover:bg-white/5 transition-all text-gray-500 font-bold"
                >
                  + Adicionar Refeição
                </button>
              </div>

              <div className="mt-8 flex gap-4">
                 <button 
                  onClick={handleSaveDiet}
                  disabled={isSaving}
                  className="flex-1 bg-green-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-green-400 transition-all"
                 >
                   {isSaving ? <Loader2 className="animate-spin" /> : <Save />} Salvar Dieta
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
