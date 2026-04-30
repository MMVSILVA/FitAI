import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { Users, LayoutDashboard, MessageCircle, Settings, Plus, Search, ChevronRight, ChevronLeft, UserPlus, Apple, Activity, Save, Loader2, X, Send } from 'lucide-react';
import { UserProfile, WorkoutPlan, DietPlan } from '../types';

export default function NutritionistDashboard() {
  const { user, profile, clients: clientIds, updatePlanForUser, isAdmin, planType, subscriptionEndsAt } = useUser();
  const isBlocked = (planType !== 'PROFESSIONAL' && !isAdmin) || (subscriptionEndsAt && new Date() >= new Date(subscriptionEndsAt) && !isAdmin);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'chat' | 'settings'>('overview');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState<{success?: boolean; message?: string} | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<UserProfile | null>(null);
  const [editingDiet, setEditingDiet] = useState<DietPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Chat States
  const [selectedChatPatient, setSelectedChatPatient] = useState<UserProfile | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Profile Settings States
  const [profileForm, setProfileForm] = useState({
    displayName: profile?.displayName || '',
    bio: (profile as any)?.bio || '',
    photoURL: profile?.photoURL || ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Clinical Records States
  const [selectedPatientForRecords, setSelectedPatientForRecords] = useState<UserProfile | null>(null);
  const [patientRecords, setPatientRecords] = useState<any[]>([]);
  const [newRecord, setNewRecord] = useState('');
  const [isAddingRecord, setIsAddingRecord] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        bio: (profile as any).bio || '',
        photoURL: profile.photoURL || ''
      });
    }
  }, [profile]);

  // Real-time Chat Subscription
  useEffect(() => {
    if (!user || !selectedChatPatient) {
      setChatMessages([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(m => 
          (m.fromId === user.uid && m.toId === selectedChatPatient.uid) ||
          (m.fromId === selectedChatPatient.uid && m.toId === user.uid)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setChatMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, selectedChatPatient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChatPatient || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        fromId: user.uid,
        toId: selectedChatPatient.uid,
        participants: [user.uid, selectedChatPatient.uid],
        text: newMessage.trim(),
        timestamp: new Date().toISOString()
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        'displayName': profileForm.displayName,
        'bio': profileForm.bio,
        'photoURL': profileForm.photoURL
      });
      alert('Perfil atualizado!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileForm({ ...profileForm, photoURL: reader.result as string });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      setUploadingPhoto(false);
    }
  };

  // Fetch Clinical Records
  useEffect(() => {
    if (!selectedPatientForRecords) return;

    const fetchRecords = async () => {
      const q = query(
        collection(db, 'clinical_records'),
        where('clientId', '==', selectedPatientForRecords.uid),
        where('professionalId', '==', user?.uid),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      setPatientRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchRecords();
  }, [selectedPatientForRecords, user]);

  const handleAddRecord = async () => {
    if (!newRecord.trim() || !selectedPatientForRecords || !user) return;
    setIsAddingRecord(true);
    try {
      const docRef = await addDoc(collection(db, 'clinical_records'), {
        clientId: selectedPatientForRecords.uid,
        professionalId: user.uid,
        text: newRecord,
        timestamp: new Date().toISOString(),
        professionalName: profile?.displayName || user.email
      });
      setPatientRecords([{ id: docRef.id, text: newRecord, timestamp: new Date().toISOString() }, ...patientRecords]);
      setNewRecord('');
    } catch (error) {
      console.error("Error adding record:", error);
    } finally {
      setIsAddingRecord(false);
    }
  };

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

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <Activity className="w-20 h-20 text-green-500 mx-auto opacity-20" />
          <h2 className="text-3xl font-black text-white">Painel Bloqueado</h2>
          <p className="text-gray-400">Para utilizar as ferramentas de Nutricionista Profissional, sua assinatura profissional deve estar ativa.</p>
          <div className="pt-4">
            <a href="/checkout?plan=PROFESSIONAL" className="inline-block bg-green-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-green-500 transition-all">
              Ativar Assinatura Pro
            </a>
          </div>
        </div>
      </div>
    );
  }

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
          <button 
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <MessageCircle className="w-5 h-5" /> Chat
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Settings className="w-5 h-5" /> Configurações
          </button>
          
          <div className="pt-8 border-t border-white/5 mt-8">
            <Link 
              to="/dashboard" 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-400 hover:bg-green-500/10 transition-all font-bold text-sm"
            >
              <LayoutDashboard className="w-5 h-5" /> Visão Aluno
            </Link>
          </div>
        </nav>

        <div className="pt-8 border-t border-white/5">
          <Link 
            to="/dashboard"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-bold text-sm">Sair do Painel</span>
          </Link>
        </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? <p>Carregando...</p> : clients.map(patient => (
                <div key={patient.uid} className="bg-zinc-950 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center group hover:border-green-500/30 transition-all text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full overflow-hidden mb-4 ring-2 ring-transparent group-hover:ring-green-500/20 transition-all">
                    <img src={patient.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${patient.email}`} alt="avatar" />
                  </div>
                  <h3 className="font-bold text-lg">{patient.displayName || patient.email}</h3>
                  <p className="text-xs text-green-500 font-bold uppercase tracking-widest mb-1">{patient.objective}</p>
                  <p className="text-[10px] text-gray-500 mb-6">{patient.planType}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleOpenDietEditor(patient)}
                      className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Dieta
                    </button>
                    <button 
                      onClick={() => setSelectedPatientForRecords(patient)}
                      className="bg-green-600/10 hover:bg-green-600 text-green-400 hover:text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-1"
                    >
                      <Activity className="w-3 h-3" /> Prontuário
                    </button>
                  </div>
                </div>
              ))}
              {!loading && clients.length === 0 && <p className="text-gray-500 italic">Nenhum paciente vinculado ainda.</p>}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-200px)] flex gap-6">
            <div className="w-72 bg-zinc-950 border border-white/10 rounded-3xl p-4 flex flex-col">
              <h3 className="font-bold mb-4 px-2">Pacientes</h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {clients.map(client => (
                  <button 
                    key={client.uid}
                    onClick={() => setSelectedChatPatient(client)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedChatPatient?.uid === client.uid ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-10 h-10 bg-white/10 rounded-full overflow-hidden">
                      <img src={client.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${client.email}`} alt="avatar" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-bold truncate">{client.displayName || client.email}</p>
                      <p className="text-[10px] text-gray-500 uppercase">{client.objective}</p>
                    </div>
                  </button>
                ))}
                {clients.length === 0 && <p className="text-xs text-gray-600 px-2 italic">Nenhum paciente ainda</p>}
              </div>
            </div>

            <div className="flex-1 bg-zinc-950 border border-white/10 rounded-3xl flex flex-col overflow-hidden">
              {selectedChatPatient ? (
                <>
                  <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-full overflow-hidden">
                        <img src={selectedChatPatient.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChatPatient.email}`} alt="avatar" />
                      </div>
                      <span className="font-bold text-sm">{selectedChatPatient.displayName || selectedChatPatient.email}</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.fromId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.fromId === user?.uid ? 'bg-green-600 text-white' : 'bg-white/10 text-gray-200'}`}>
                          {msg.text}
                          <p className="text-[8px] mt-1 opacity-50">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                    {chatMessages.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <MessageCircle className="w-12 h-12 text-gray-700 mb-4" />
                        <p className="text-gray-500 italic text-sm">Nenhuma mensagem ainda com este paciente.</p>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Sua mensagem..."
                      className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                    />
                    <button 
                      type="submit"
                      disabled={isSending || !newMessage.trim()}
                      className="bg-green-500 text-black p-2 rounded-xl hover:bg-green-400 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <MessageCircle className="w-16 h-16 text-gray-800 mb-6" />
                  <h3 className="text-xl font-bold mb-2">Selecione um paciente</h3>
                  <p className="text-gray-500 max-w-xs">Escolha um paciente na lista ao lado para iniciar o acompanhamento.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-zinc-950 border border-white/10 p-8 rounded-[2.5rem]">
            <h2 className="text-2xl font-bold mb-8">Configurações de Nutricionista</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-white/10 rounded-full overflow-hidden border-2 border-white/10">
                    <img src={profileForm.photoURL || profile?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.email}`} alt="avatar" />
                  </div>
                  <label className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all">
                    {uploadingPhoto ? 'Enviando...' : 'Carregar Foto (Arquivo)'}
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome de Exibição</label>
                  <input 
                    type="text"
                    value={profileForm.displayName}
                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                    placeholder="Seu nome profissional..."
                    className="w-full bg-black border border-white/10 rounded-xl p-3 outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">URL da Foto (Link)</label>
                  <input 
                    type="text"
                    value={profileForm.photoURL}
                    onChange={(e) => setProfileForm({ ...profileForm, photoURL: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-black border border-white/10 rounded-xl p-3 outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSaving}
                className="w-full bg-green-500 text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-400 transition-all shadow-lg shadow-green-500/20"
              >
                {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
                Salvar Dados Profissionais
              </button>
            </form>
          </div>
        )}

        {/* Clinical Records Modal */}
        {selectedPatientForRecords && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
                    <img src={selectedPatientForRecords.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedPatientForRecords.email}`} alt="avatar" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Prontuário: {selectedPatientForRecords.displayName || selectedPatientForRecords.email}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Histórico Clínico e Evolução</p>
                  </div>
                </div>
                <button onClick={() => setSelectedPatientForRecords(null)} className="p-2 hover:bg-white/5 rounded-full transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {/* New Record Form */}
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Nova Anotação de Consulta/Evolução</label>
                  <textarea 
                    value={newRecord}
                    onChange={(e) => setNewRecord(e.target.value)}
                    placeholder="Descreva a evolução nutricional, mudanças na dieta, resultados de exames..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm min-h-[120px] outline-none focus:ring-1 focus:ring-green-500"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddRecord}
                      disabled={isAddingRecord || !newRecord.trim()}
                      className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-green-500 disabled:opacity-50 transition-all"
                    >
                      {isAddingRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Registro
                    </button>
                  </div>
                </div>

                {/* Records List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Histórico de Registros</h4>
                  {patientRecords.map(record => (
                    <div key={record.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-green-500 uppercase tracking-tighter">
                          {new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{record.text}</p>
                    </div>
                  ))}
                  {patientRecords.length === 0 && (
                    <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                      <p className="text-gray-500 italic text-sm">Nenhum registro clínico ainda.</p>
                    </div>
                  )}
                </div>
              </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold">Refeições</h4>
                  </div>
                  
                  {/* Notes / Orientations */}
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Orientações Nutricionais</label>
                    <textarea 
                      placeholder="Orientações de suplementação, hidratação, substituições..."
                      value={editingDiet.orientations?.join('\n') || ''}
                      onChange={(e) => setEditingDiet({ ...editingDiet, orientations: e.target.value.split('\n') })}
                      className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm"
                    />
                  </div>

                  {editingDiet.meals.map((meal, idx) => (
                    <div key={idx} className="bg-white/5 p-6 rounded-2xl space-y-4">
                      <div className="flex gap-4">
                        <input 
                          placeholder="Nome (Ex: Café da manhã)"
                          value={meal.name}
                          onChange={(e) => {
                            const newMeals = [...editingDiet.meals];
                            newMeals[idx].name = e.target.value;
                            setEditingDiet({ ...editingDiet, meals: newMeals });
                          }}
                          className="flex-1 bg-black/40 border border-white/10 rounded-xl p-2 text-sm"
                        />
                        <input 
                          placeholder="Horário"
                          value={meal.time}
                          onChange={(e) => {
                            const newMeals = [...editingDiet.meals];
                            newMeals[idx].time = e.target.value;
                            setEditingDiet({ ...editingDiet, meals: newMeals });
                          }}
                          className="w-24 bg-black/40 border border-white/10 rounded-xl p-2 text-sm"
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
                        className="w-full h-20 bg-black/40 border border-white/10 rounded-xl p-2 text-sm"
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

                <div className="space-y-6">
                  <h4 className="text-lg font-bold">Orientações & Recomendações</h4>
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Orientações Clínicas</label>
                    <textarea 
                      placeholder="Orientações detalhadas sobre suplementação, hidratação, etc..."
                      value={(editingDiet.orientations || []).join('\n')}
                      onChange={(e) => setEditingDiet({ ...editingDiet, orientations: e.target.value.split('\n') })}
                      className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Notas Profissionais (Privadas)</label>
                    <textarea 
                      placeholder="Notas que só você vê..."
                      value={editingDiet.professionalNotes || ''}
                      onChange={(e) => setEditingDiet({ ...editingDiet, professionalNotes: e.target.value })}
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm italic text-gray-300"
                    />
                  </div>
                  
                  {selectedPatient.adherenceLogs && selectedPatient.adherenceLogs.length > 0 && (
                    <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl">
                      <h5 className="font-bold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-green-500" /> Última Adesão</h5>
                      <div className="space-y-2">
                        {selectedPatient.adherenceLogs.slice(-3).reverse().map((log, i) => (
                          <div key={i} className="flex justify-between items-center text-xs">
                            <span className="text-gray-400">{log.mealName}</span>
                            <span className={log.adhered ? 'text-green-500' : 'text-red-400'}>{log.adhered ? 'Seguiu' : 'Não seguiu'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
