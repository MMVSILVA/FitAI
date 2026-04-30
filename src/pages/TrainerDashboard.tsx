import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useUser } from '../store/userStore';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, getDoc, onSnapshot, addDoc, orderBy } from 'firebase/firestore';
import { 
  Users, LayoutDashboard, MessageCircle, Settings, Plus, Search, 
  ChevronRight, ChevronLeft, UserPlus, Save, Loader2, X, Dumbbell, Activity, Send 
} from 'lucide-react';
import { UserProfile, WorkoutPlan } from '../types';

export default function TrainerDashboard() {
  const { user, profile, clients: clientIds, isAdmin, planType, subscriptionEndsAt } = useUser();
  const isBlocked = (planType !== 'PROFESSIONAL' && !isAdmin) || (subscriptionEndsAt && new Date() >= new Date(subscriptionEndsAt) && !isAdmin);
  const [clients, setClients] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'chat' | 'settings'>('overview');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchStatus, setSearchStatus] = useState<{success?: boolean; message?: string} | null>(null);

  const [selectedClient, setSelectedClient] = useState<UserProfile | null>(null);
  const [editingPlan, setEditingPlan] = useState<WorkoutPlan | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Chat States
  const [selectedChatClient, setSelectedChatClient] = useState<UserProfile | null>(null);
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
  const [selectedClientForRecords, setSelectedClientForRecords] = useState<UserProfile | null>(null);
  const [clientRecords, setClientRecords] = useState<any[]>([]);
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
    if (!user || !selectedChatClient) {
      setChatMessages([]);
      return;
    }

    const q = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'asc')
    );

    // Note: This requires a composite index in Firestore. 
    // In a quick prototype, we might filter client-side if the message count is small,
    // or set up the index. I'll use a simpler query for now to avoid index errors.
    const unsubscribe = onSnapshot(collection(db, 'messages'), (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(m => 
          (m.fromId === user.uid && m.toId === selectedChatClient.uid) ||
          (m.fromId === selectedChatClient.uid && m.toId === user.uid)
        )
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      setChatMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, selectedChatClient]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedChatClient || !newMessage.trim()) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        fromId: user.uid,
        toId: selectedChatClient.uid,
        participants: [user.uid, selectedChatClient.uid],
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
      // For this environment, we'll convert to base64 for the prototype
      // In production, use Firebase Storage
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
    if (!selectedClientForRecords) return;

    const fetchRecords = async () => {
      const q = query(
        collection(db, 'clinical_records'),
        where('clientId', '==', selectedClientForRecords.uid),
        where('professionalId', '==', user?.uid),
        orderBy('timestamp', 'desc')
      );
      const snap = await getDocs(q);
      setClientRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchRecords();
  }, [selectedClientForRecords, user]);

  const handleAddRecord = async () => {
    if (!newRecord.trim() || !selectedClientForRecords || !user) return;
    setIsAddingRecord(true);
    try {
      const docRef = await addDoc(collection(db, 'clinical_records'), {
        clientId: selectedClientForRecords.uid,
        professionalId: user.uid,
        text: newRecord,
        timestamp: new Date().toISOString(),
        professionalName: profile?.displayName || user.email
      });
      setClientRecords([{ id: docRef.id, text: newRecord, timestamp: new Date().toISOString() }, ...clientRecords]);
      setNewRecord('');
    } catch (error) {
      console.error("Error adding record:", error);
    } finally {
      setIsAddingRecord(false);
    }
  };

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

  if (isBlocked) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <Activity className="w-20 h-20 text-purple-500 mx-auto opacity-20" />
          <h2 className="text-3xl font-black text-white">Painel Bloqueado</h2>
          <p className="text-gray-400">Para utilizar as ferramentas de Treinador Profissional, sua assinatura profissional deve estar ativa.</p>
          <div className="pt-4">
            <a href="/checkout?plan=PROFESSIONAL" className="inline-block bg-purple-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 transition-all">
              Ativar Assinatura Pro
            </a>
          </div>
        </div>
      </div>
    );
  }

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
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}
          >
            <Settings className="w-5 h-5" /> Configurações
          </button>
          
          <div className="pt-8 border-t border-white/5 mt-8">
            <Link 
              to="/dashboard" 
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-purple-400 hover:bg-purple-500/10 transition-all font-bold text-sm"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? <p>Carregando...</p> : clients.map(client => (
                <div key={client.uid} className="bg-zinc-950 border border-white/10 p-6 rounded-[2.5rem] flex flex-col items-center group hover:border-purple-500/30 transition-all text-center">
                  <div className="w-20 h-20 bg-white/10 rounded-full overflow-hidden mb-4 ring-2 ring-transparent group-hover:ring-purple-500/20 transition-all">
                    <img src={client.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${client.email}`} alt="avatar" />
                  </div>
                  <h3 className="font-bold text-lg">{client.displayName || client.email}</h3>
                  <p className="text-xs text-purple-500 font-bold uppercase tracking-widest mb-1">{client.objective}</p>
                  <p className="text-[10px] text-gray-500 mb-6">{client.planType}</p>
                  
                  <div className="w-full grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleOpenPlanEditor(client)}
                      className="bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Plano
                    </button>
                    <button 
                      onClick={() => setSelectedClientForRecords(client)}
                      className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-tighter transition-all flex items-center justify-center gap-1"
                    >
                      <Activity className="w-3 h-3" /> Prontuário
                    </button>
                  </div>
                </div>
              ))}
              {!loading && clients.length === 0 && <p className="text-gray-500 italic">Nenhum aluno vinculado ainda.</p>}
            </div>
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="h-[calc(100vh-200px)] flex gap-6">
            {/* Contacts List */}
            <div className="w-72 bg-zinc-950 border border-white/10 rounded-3xl p-4 flex flex-col">
              <h3 className="font-bold mb-4 px-2">Conversas</h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {clients.map(client => (
                  <button 
                    key={client.uid}
                    onClick={() => setSelectedChatClient(client)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedChatClient?.uid === client.uid ? 'bg-white/10' : 'hover:bg-white/5'}`}
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
                {clients.length === 0 && <p className="text-xs text-gray-600 px-2 italic">Nenhum aluno ainda</p>}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-zinc-950 border border-white/10 rounded-3xl flex flex-col overflow-hidden">
              {selectedChatClient ? (
                <>
                  <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/10 rounded-full overflow-hidden">
                        <img src={selectedChatClient.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChatClient.email}`} alt="avatar" />
                      </div>
                      <span className="font-bold text-sm">{selectedChatClient.displayName || selectedChatClient.email}</span>
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
                        <p className="text-gray-500 italic text-sm">Nenhuma mensagem ainda com este aluno.</p>
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
                  <h3 className="text-xl font-bold mb-2">Selecione uma conversa</h3>
                  <p className="text-gray-500 max-w-xs">Escolha um aluno na lista ao lado para ver o histórico e enviar novas mensagens.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-zinc-950 border border-white/10 p-8 rounded-[2.5rem]">
            <h2 className="text-2xl font-bold mb-8">Configurações de Perfil Profissional</h2>
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
                Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {/* Clinical Records Modal */}
        {selectedClientForRecords && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full overflow-hidden">
                    <img src={selectedClientForRecords.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedClientForRecords.email}`} alt="avatar" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Prontuário: {selectedClientForRecords.displayName || selectedClientForRecords.email}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-black">Histórico e Evolução</p>
                  </div>
                </div>
                <button onClick={() => setSelectedClientForRecords(null)} className="p-2 hover:bg-white/5 rounded-full transition-all">
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
                    placeholder="Descreva o progresso, mudanças no treino, feedback da sessão..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm min-h-[120px] outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddRecord}
                      disabled={isAddingRecord || !newRecord.trim()}
                      className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-purple-500 disabled:opacity-50 transition-all"
                    >
                      {isAddingRecord ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Salvar Registro
                    </button>
                  </div>
                </div>

                {/* Records List */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Histórico de Registros</h4>
                  {clientRecords.map(record => (
                    <div key={record.id} className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black text-purple-500 uppercase tracking-tighter">
                          {new Date(record.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{record.text}</p>
                    </div>
                  ))}
                  {clientRecords.length === 0 && (
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

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-12">
                {/* Stats Summary */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Peso Atual</p>
                    <p className="text-2xl font-bold">{selectedClient.weight} kg</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Altura</p>
                    <p className="text-2xl font-bold">{selectedClient.height} cm</p>
                  </div>
                  <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Nível</p>
                    <p className="text-lg font-bold capitalize">{selectedClient.fitnessLevel}</p>
                  </div>
                  
                  {/* Progress Photos Mock */}
                  <div className="bg-zinc-900/50 border border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-3">Fotos de Progresso</p>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="aspect-[3/4] bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-[10px] text-gray-600">Frente</div>
                       <div className="aspect-[3/4] bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-[10px] text-gray-600">Lado</div>
                    </div>
                    <p className="text-[10px] text-center mt-2 text-gray-500 italic">Aguardando novas fotos do aluno.</p>
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-8">
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
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold">Estrutura de Treino</h4>
                      <button className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full font-bold uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all flex items-center gap-1 group">
                        <Activity className="w-3 h-3 group-hover:animate-pulse" /> Sugestão Assistida IA
                      </button>
                    </div>

                    {/* Personal Notes / Orientations */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Orientações do Treinador</label>
                      <textarea 
                        placeholder="Orientações de execução, cardio post-treino, etc..."
                        value={editingPlan.recommendations?.join('\n') || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, recommendations: e.target.value.split('\n') })}
                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm"
                      />
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Notas Profissionais Privadas</label>
                      <textarea 
                        placeholder="Notas internas sobre o progresso do aluno (não visível para o aluno se desejado, ou use para feedback direto)"
                        value={editingPlan.professionalNotes || ''}
                        onChange={(e) => setEditingPlan({ ...editingPlan, professionalNotes: e.target.value })}
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-sm"
                      />
                    </div>

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
