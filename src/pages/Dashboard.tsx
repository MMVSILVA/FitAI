import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../store/userStore';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { UserRole } from '../types';
import { Dumbbell, Apple, Lock, Zap, ChevronRight, LogOut, Activity, Timer, Play, Pause, X, TrendingUp, CheckCircle2, Calendar, Users, Download, Loader2 } from 'lucide-react';
import { logoutFirebase } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Logo } from '../components/Logo';
import { ExerciseLibrary } from '../components/ExerciseLibrary';

import { translate, translateExerciseName, ptToEnSearch } from '../lib/exerciseTranslations';

function ExerciseRow({ 
  exercise, 
  dayIdx, 
  exerciseIdx, 
  restSeconds, 
  onStartRest 
}: { 
  exercise: any; 
  dayIdx: number; 
  exerciseIdx: number; 
  restSeconds: number; 
  onStartRest: (s: number) => void;
  key?: any;
}) {
  const { updateExerciseWeight } = useUser();

  return (
    <div className="flex flex-col sm:flex-row gap-4 py-4 border-b border-white/5 last:border-0">
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <p className="font-bold text-lg">{translateExerciseName(exercise.name)}</p>
          <span className="text-xs text-gray-400 bg-white/5 px-3 py-1 rounded-md text-center">
            {exercise.rest} rest
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 mt-1">
          <p className="text-gray-400 font-medium">{exercise.sets} séries x {exercise.reps}</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Carga:</span>
            <input 
              type="text" 
              value={exercise.weight || ''} 
              onChange={(e) => updateExerciseWeight(dayIdx, exerciseIdx, e.target.value)}
              placeholder="Ex: 20kg"
              className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-sm text-white w-24 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Descrição Técnica no lugar da foto */}
        {exercise.technicalDescription && (
          <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Execução Técnica
            </p>
            <p className="text-sm text-gray-300 leading-relaxed italic">
              "{exercise.technicalDescription}"
            </p>
          </div>
        )}

        <div className="mt-3 grid sm:grid-cols-3 gap-2">
          {exercise.tips && (
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold text-purple-400 uppercase mb-1">Dica</p>
              <p className="text-xs text-gray-400">{exercise.tips}</p>
            </div>
          )}
          {exercise.breathing && (
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Respiração</p>
              <p className="text-xs text-gray-400">{exercise.breathing}</p>
            </div>
          )}
          {exercise.cadence && (
            <div className="bg-white/5 p-2 rounded-lg border border-white/10">
              <p className="text-[10px] font-bold text-green-400 uppercase mb-1">Cadência</p>
              <p className="text-xs text-gray-400">{exercise.cadence}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center gap-3">
        <button 
          onClick={() => onStartRest(restSeconds)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
        >
          <Timer className="w-5 h-5" /> Iniciar Descanso
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    user, profile, plan, planType, role, clients, linkedTrainerId, linkedNutritionistId, trialEndsAt, isAdmin,
    logout, calculateIMC, updateExerciseWeight, resetAccount, setPlan, setRole, linkClient, linkNutritionist, updatePlanForUser, setRoleForUser 
  } = useUser();
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'evolution' | 'routine' | 'personal' | 'nutrition' | 'library'>('workout');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [targetUserRole, setTargetUserRole] = useState<UserRole>('trainer');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState({ type: '', text: '' });
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [isEditingClientPlan, setIsEditingClientPlan] = useState(false);

  const navigate = useNavigate();

  // Load client data if selected
  useEffect(() => {
    if (selectedClient) {
      const loadClient = async () => {
        const { getDoc, doc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const snap = await getDoc(doc(db, 'users', selectedClient));
        if (snap.exists()) {
          setClientData(snap.data());
        }
      };
      loadClient();
    } else {
      setClientData(null);
    }
  }, [selectedClient]);

  const handleLinkClient = async () => {
    if (!trainerEmail) return;
    setLinkLoading(true);
    const res = await linkClient(trainerEmail);
    setLinkMessage({ type: res.success ? 'success' : 'error', text: res.message });
    setLinkLoading(false);
    if (res.success) setTrainerEmail('');
    setTimeout(() => setLinkMessage({ type: '', text: '' }), 4000);
  };

  const handleUpdateClientPlan = async (newPlan: any) => {
    if (!selectedClient) return;
    await updatePlanForUser(selectedClient, newPlan);
    setClientData({ ...clientData, plan: newPlan });
    setIsEditingClientPlan(false);
  };

  const handleSetRole = async () => {
    if (!targetUserEmail) return;
    setLinkLoading(true);
    // Find UID by email
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('../firebase');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', targetUserEmail.toLowerCase().trim()));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      setLinkMessage({ type: 'error', text: 'Usuário não encontrado' });
      setLinkLoading(false);
      return;
    }
    
    const res = await setRoleForUser(snap.docs[0].id, targetUserRole);
    setLinkMessage({ type: res.success ? 'success' : 'error', text: res.message });
    setLinkLoading(false);
    if (res.success) setTargetUserEmail('');
    setTimeout(() => setLinkMessage({ type: '', text: '' }), 4000);
  };

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimer, setShowTimer] = useState(false);

  // Routine State
  const [routineData, setRoutineData] = useState({ sleep: '', water: '', stress: '' });
  const [routineSuccess, setRoutineSuccess] = useState(false);

  // Premium State
  const [premiumGoals, setPremiumGoals] = useState('');
  const [premiumGoalsSuccess, setPremiumGoalsSuccess] = useState(false);
  const [ptRequestSuccess, setPtRequestSuccess] = useState(false);
  const [ptMessage, setPtMessage] = useState('');
  const [isGeneratingPT, setIsGeneratingPT] = useState(false);

  const handleGeneratePersonalPlan = async () => {
    if (!ptMessage.trim() && !premiumGoals.trim()) return;
    
    setIsGeneratingPT(true);
    try {
      const { generatePlan } = await import('../services/aiService');
      
      const customProfile = {
        ...profile,
        objective: `${profile?.objective}. Pedido específico para o personal: ${ptMessage}. Metas adicionais: ${premiumGoals}`
      };
      
      const res = await generatePlan(customProfile);
      
      // Use the setPlan from the component's useUser hook
      setPlan(res.workout);
      
      setPtRequestSuccess(true);
      setPtMessage('');
      setTimeout(() => setPtRequestSuccess(false), 4000);
    } catch (error) {
      console.error("Error generating PT plan:", error);
    } finally {
      setIsGeneratingPT(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startRest = (seconds: number) => {
    setTimeLeft(seconds);
    setTimerActive(true);
    setShowTimer(true);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleLogout = async () => {
    await logoutFirebase();
    logout();
    navigate('/login');
  };

  if (!profile || !plan) {
    return <Navigate to="/onboarding" />;
  }

  const isAdminUser = ['vinidoctor@gmail.com', 'vinisilva02@hotmail.com', 'nangelicaalcantara@gmail.com'].includes(user?.email || '');
  const isFree = planType === 'FREE' && !isAdminUser;
  const isTrialExpired = isFree && trialEndsAt && new Date() >= new Date(trialEndsAt);
  const imcData = calculateIMC();

  // Mock data for evolution chart
  const chartData = [
    { name: 'Sem 1', peso: (profile?.weight || 0) + 2 },
    { name: 'Sem 2', peso: (profile?.weight || 0) + 1 },
    { name: 'Sem 3', peso: (profile?.weight || 0) + 0.5 },
    { name: 'Atual', peso: profile?.weight || 0 },
  ];

  const Paywall = ({ feature }: { feature: string }) => (
    <div className="absolute inset-0 backdrop-blur-md bg-black/80 z-10 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
      <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mb-4 mt-8">
        <Lock className="w-8 h-8 text-purple-500" />
      </div>
      <h4 className="text-2xl font-bold mb-2">Recurso Bloqueado</h4>
      <p className="text-gray-300 max-w-md mb-8">
        O recurso <strong>{feature}</strong> está disponível apenas nos planos pagos. Escolha seu plano abaixo para liberar:
      </p>
      
      <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col">
          <h5 className="text-xl font-bold mb-2">Pro</h5>
          <p className="text-3xl font-bold text-purple-400 mb-4">R$ 39,90<span className="text-sm text-gray-500">/mês</span></p>
          <ul className="text-sm text-gray-400 space-y-2 mb-6 flex-1 text-left">
            <li>✓ Treinos ilimitados</li>
            <li>✓ Dieta completa</li>
            <li>✓ Evolução detalhada</li>
          </ul>
          <Link to="/checkout?plan=PRO" className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors">
            Assinar Pro
          </Link>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-500 p-6 rounded-2xl flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
            Recomendado
          </div>
          <h5 className="text-xl font-bold mb-2">Premium</h5>
          <p className="text-3xl font-bold text-purple-400 mb-4">R$ 59,90<span className="text-sm text-gray-500">/mês</span></p>
          <ul className="text-sm text-gray-400 space-y-2 mb-6 flex-1 text-left">
            <li>✓ Tudo do Pro</li>
            <li>✓ Chat 24h com Coach IA</li>
            <li>✓ Ajustes diários</li>
          </ul>
          <Link to="/checkout?plan=PREMIUM" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-colors">
            Assinar Premium
          </Link>
        </div>
      </div>
    </div>
  );

  if (isTrialExpired) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Seu período de teste acabou</h2>
        <p className="text-gray-400 max-w-md mb-8">
          Para continuar acessando seus treinos, dietas e evolução, escolha um de nossos planos.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 w-full max-w-3xl">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-3xl flex flex-col items-center">
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-4xl font-bold text-purple-400 mb-6">R$ 39,90<span className="text-sm text-gray-500 font-normal">/mês</span></p>
            <ul className="text-left space-y-3 mb-8 w-full">
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Treinos ilimitados</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Dieta completa</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Evolução detalhada</li>
            </ul>
            <Link to="/checkout?plan=PRO" className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-bold transition-colors mt-auto">
              Assinar Pro
            </Link>
          </div>

          <div className="bg-purple-900/20 border border-purple-500 p-8 rounded-3xl flex flex-col items-center relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full">
              Recomendado
            </div>
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <p className="text-4xl font-bold text-purple-400 mb-6">R$ 59,90<span className="text-sm text-gray-500 font-normal">/mês</span></p>
            <ul className="text-left space-y-3 mb-8 w-full">
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Tudo do plano Pro</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Chat 24h com Coach IA</li>
              <li className="flex items-center gap-2 text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-500" /> Ajustes diários de treino</li>
            </ul>
            <Link to="/checkout?plan=PREMIUM" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold transition-colors mt-auto">
              Assinar Premium
            </Link>
          </div>
        </div>

        <button onClick={handleLogout} className="mt-12 text-gray-500 hover:text-white transition-colors flex items-center gap-2">
          <LogOut className="w-4 h-4" /> Sair da conta
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                <span className="text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">Fit</span>
                <span className="text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI</span>
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-purple-400 font-medium tracking-wider uppercase">Plano {isAdminUser ? 'ADMIN (PREMIUM)' : planType}</p>
                {isAdminUser && (
                  <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold uppercase tracking-tighter">Admin</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick} 
                className="hidden sm:flex items-center gap-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4" /> Instalar App
              </button>
            )}
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30 text-purple-400 font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Floating Timer */}
      <AnimatePresence>
        {showTimer && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-purple-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Descanso</p>
              <p className={`text-2xl font-bold font-mono ${timeLeft === 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button 
                onClick={() => setTimerActive(!timerActive)}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20"
              >
                {timerActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setShowTimer(false)}
                className="p-2 bg-white/10 rounded-full hover:bg-red-500/20 hover:text-red-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 pt-8">
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Seu plano está pronto.</h2>
            <p className="text-gray-400">
              Objetivos: <span className="text-white font-medium">{Array.isArray(profile.objective) ? profile.objective.join(', ') : profile.objective}</span> • 
              Nível: <span className="text-white font-medium">{profile.fitnessLevel}</span>
            </p>
            {isFree && trialEndsAt && (
              <div className="mt-4 inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-lg text-sm text-purple-300">
                <Timer className="w-4 h-4" />
                Seu período de teste grátis termina em: {new Date(trialEndsAt).toLocaleDateString()}
              </div>
            )}
          </div>
          <button 
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
          >
            Refazer Plano
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('workout')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'workout' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            Treino
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'library' ? 'bg-zinc-700 text-white border border-white/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5 text-purple-400" />
            Biblioteca
          </button>
          <button 
            onClick={() => setActiveTab('diet')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'diet' ? 'bg-green-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className="w-5 h-5" />
            Dieta
          </button>
          <button 
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'evolution' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Evolução
          </button>
          <button 
            onClick={() => setActiveTab('routine')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'routine' ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-5 h-5" />
            Rotina Diária
          </button>
          {planType === 'PREMIUM' && (
            <>
              <button 
                onClick={() => setActiveTab('personal')}
                className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
                  activeTab === 'personal' ? 'bg-purple-900 border border-purple-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Users className="w-5 h-5" />
                Personal Trainer
              </button>
              <button 
                onClick={() => setActiveTab('nutrition')}
                className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
                  activeTab === 'nutrition' ? 'bg-green-900 border border-green-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <Apple className="w-5 h-5 text-green-400" />
                Nutricionista
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'library' && (
            <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
              <ExerciseLibrary />
            </div>
          )}

          {activeTab === 'workout' && (
            <div className="space-y-8">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Rotina Semanal ({profile.daysPerWeek} dias)
                </h3>
                
                <div className="grid gap-4">
                  {plan.workout.days.map((day, idx) => (
                    <div key={idx} className="bg-black border border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-purple-400">{day.day}</h4>
                        <span className="text-sm font-medium bg-white/5 px-3 py-1 rounded-full">{day.focus}</span>
                      </div>
                      
                      <div className="space-y-4">
                        {day.exercises.map((ex, i) => {
                          // Extrai os segundos do texto (ex: "60s" -> 60)
                          const restSeconds = parseInt(ex.rest.replace(/\D/g, '')) || 60;
                          
                          // Hook-like behavior inside map? Better use a sub-component
                          return <ExerciseRow key={i} exercise={ex} dayIdx={idx} exerciseIdx={i} restSeconds={restSeconds} onStartRest={startRest} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

               {/* Progression Paywall */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Progressão de Carga
                  </h3>
                  
                  {isFree ? (
                    <Paywall feature="Progressão de Carga Automática" />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                        {plan.workout.progression}
                      </p>
                      <div className="p-4 bg-purple-900/20 rounded-xl border border-purple-500/30">
                        <p className="text-xs font-bold text-purple-400 uppercase mb-2">Projeção Próximo Ciclo</p>
                        <p className="text-sm text-gray-300">Esperamos um aumento de 2-5% na intensidade volumétrica baseado no seu histórico.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    Estratégia de Consistência
                  </h3>
                  
                  {plan.consistencyScore ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">Score de Aderência</span>
                        <span className="text-2xl font-bold text-green-400">{plan.consistencyScore}%</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${plan.consistencyScore}%` }} />
                      </div>
                      <div className="space-y-2 mt-6">
                        {plan.strategies?.map((strat: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-400">
                            <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                            {strat}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="w-10 h-10 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm italic">Inicie seus treinos para gerar score de consistência.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diet' && (
            <div className="space-y-8">
              {/* Macros Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Calorias</p>
                  <p className="text-3xl font-bold text-white">{plan.diet.calories}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal/dia</p>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Proteína</p>
                  <p className="text-3xl font-bold text-purple-400">{plan.diet.macros.protein}g</p>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Carboidratos</p>
                  <p className="text-3xl font-bold text-green-400">{plan.diet.macros.carbs}g</p>
                </div>
                <div className="bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-400 text-sm mb-1">Gorduras</p>
                  <p className="text-3xl font-bold text-yellow-400">{plan.diet.macros.fat}g</p>
                </div>
              </div>

              {/* Meals Paywall */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-8 min-h-[500px]">
                <h3 className="text-xl font-bold mb-6">Plano Alimentar Completo</h3>
                
                {isFree ? (
                  <Paywall feature="Refeições Detalhadas" />
                ) : (
                  <div className="grid gap-4">
                    {plan.diet.meals.map((meal, idx) => (
                      <div key={idx} className="bg-black border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-bold text-green-400">{meal.name}</h4>
                          <span className="text-sm font-medium bg-white/5 px-3 py-1 rounded-full">{meal.time}</span>
                        </div>
                        <ul className="space-y-2">
                          {meal.foods.map((food, i) => (
                            <li key={i} className="flex items-start gap-2 text-gray-300">
                              <span className="text-green-500 mt-1">•</span>
                              {food}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    
                    <div className="mt-8 p-6 bg-purple-900/10 border border-purple-500/20 rounded-2xl">
                      <h4 className="font-bold text-purple-400 mb-4">Recomendações do Coach</h4>
                      <ul className="space-y-2">
                        {plan.diet.recommendations.map((rec, i) => (
                          <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                            <Zap className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'evolution' && (
            <div className="space-y-8">
              {/* IMC Card */}
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6">Seu Corpo</h3>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-48 h-48 rounded-full border-8 border-blue-500/20 flex flex-col items-center justify-center relative">
                    <div className="absolute inset-0 border-8 border-blue-500 rounded-full border-t-transparent border-r-transparent rotate-45"></div>
                    <span className="text-4xl font-bold text-white">{imcData?.value}</span>
                    <span className="text-sm text-gray-400">IMC</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-blue-400 mb-2">{imcData?.category}</h4>
                    <p className="text-gray-400 mb-4">
                      Seu Índice de Massa Corporal é calculado com base na sua altura ({profile.height}cm) e peso ({profile.weight}kg).
                    </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-xl">
                      <p className="text-sm text-gray-500">Peso Atual</p>
                      <p className="text-xl font-bold">{profile.weight} kg</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl">
                      <p className="text-sm text-gray-500">Objetivo</p>
                      <p className="text-xl font-bold">{profile.objective}</p>
                    </div>
                  </div>
                  </div>
                </div>
              </div>

              {/* Evolution Chart Paywall */}
              <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 p-8 min-h-[400px]">
                <h3 className="text-xl font-bold mb-6">Histórico de Peso</h3>
                
                {isFree ? (
                  <Paywall feature="Gráficos de Evolução" />
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                          itemStyle={{ color: '#60a5fa' }}
                        />
                        <Line type="monotone" dataKey="peso" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6, fill: '#3b82f6' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
          {activeTab === 'routine' && (
            <div className="space-y-8">
              <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-400" />
                  Registro de Rotina Diária
                </h3>
                <p className="text-gray-400 mb-8">
                  Registre sua rotina para que a IA possa entender seu contexto e ajustar seu plano de forma mais inteligente (Engenharia Social para IA).
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Horas de sono na última noite</label>
                    <input 
                      type="text" 
                      value={routineData.sleep}
                      onChange={e => setRoutineData({...routineData, sleep: e.target.value})}
                      placeholder="Ex: 7 horas"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Água consumida hoje</label>
                    <input 
                      type="text" 
                      value={routineData.water}
                      onChange={e => setRoutineData({...routineData, water: e.target.value})}
                      placeholder="Ex: 2 litros"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nível de estresse (1-10)</label>
                    <input 
                      type="text" 
                      value={routineData.stress}
                      onChange={e => setRoutineData({...routineData, stress: e.target.value})}
                      placeholder="Ex: 4"
                      className="w-full bg-black border border-white/20 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  
                  <button 
                    onClick={() => {
                      setRoutineSuccess(true);
                      setRoutineData({ sleep: '', water: '', stress: '' });
                      setTimeout(() => setRoutineSuccess(false), 3000);
                    }}
                    className="w-full bg-orange-500 text-white p-4 rounded-xl font-bold hover:bg-orange-600 transition-colors"
                  >
                    Salvar Rotina
                  </button>
                  {routineSuccess && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center">
                      Rotina registrada com sucesso! A IA usará esses dados para otimizar seu próximo treino.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-8 pb-32">
              {/* Admin Section: Role Management */}
              {isAdmin && (
                <div className="bg-zinc-950 border border-red-500/20 rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-bold text-red-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Painel Admin: Gestão de Profissionais
                      </h4>
                      <p className="text-sm text-gray-500">Promova usuários para Trainer ou Nutricionista</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Seu modo atual:</span>
                      <button 
                        onClick={() => setRole(role === 'user' ? 'trainer' : 'user')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          role === 'trainer' ? 'bg-purple-600' : 'bg-white/10'
                        }`}
                      >
                        {role === 'trainer' ? 'Modo Trainer' : 'Modo Aluno'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-3 gap-3">
                    <input 
                      type="email" 
                      value={targetUserEmail}
                      onChange={e => setTargetUserEmail(e.target.value)}
                      placeholder="E-mail do usuário..."
                      className="sm:col-span-1 bg-black border border-white/10 rounded-xl p-3 text-sm text-white"
                    />
                    <select 
                      value={targetUserRole}
                      onChange={e => setTargetUserRole(e.target.value as any)}
                      className="bg-black border border-white/10 rounded-xl p-3 text-sm text-white"
                    >
                      <option value="trainer">Trainer</option>
                      <option value="nutritionist">Nutricionista</option>
                      <option value="user">Aluno (Reset Role)</option>
                    </select>
                    <button 
                      onClick={handleSetRole}
                      disabled={linkLoading}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl text-sm transition-all"
                    >
                      {linkLoading ? 'Processando...' : 'Atualizar Role'}
                    </button>
                  </div>
                  {linkMessage.text && (
                    <p className={`mt-3 text-xs text-center ${linkMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {linkMessage.text}
                    </p>
                  )}
                </div>
              )}

              {role === 'trainer' ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-400" />
                      Painel do Treinador
                    </h3>
                    
                    <div className="grid gap-6">
                      <div className="bg-black border border-white/5 rounded-2xl p-6">
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-500">Adicionar Novo Aluno</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="email" 
                            value={trainerEmail}
                            onChange={e => setTrainerEmail(e.target.value)}
                            placeholder="E-mail do aluno..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-purple-500 outline-none"
                          />
                          <button 
                            onClick={handleLinkClient}
                            disabled={linkLoading}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                          >
                            {linkLoading ? 'Vinculando...' : 'Vincular Aluno'}
                          </button>
                        </div>
                        {linkMessage.text && (
                          <p className={`mt-3 text-sm ${linkMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                            {linkMessage.text}
                          </p>
                        )}
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Seus Alunos</h4>
                        {clients && clients.length > 0 ? (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clients.map((clientId) => (
                              <button 
                                key={clientId}
                                onClick={() => setSelectedClient(clientId)}
                                className={`p-4 rounded-2xl border transition-all text-left ${
                                  selectedClient === clientId 
                                    ? 'bg-purple-600/10 border-purple-500' 
                                    : 'bg-black border-white/10 hover:border-white/30'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">
                                    {clientId.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm truncate">ID: {clientId.substring(0, 8)}</p>
                                    <p className="text-xs text-gray-500">Toque para gerenciar</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-black/40 rounded-3xl border border-dashed border-white/10">
                            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">Você ainda não possui alunos vinculados.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedClient && clientData && (
                    <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-2xl font-bold">Gerenciando: {clientData.email}</h3>
                          <p className="text-gray-400">Plano Atual: {clientData.planType}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditingClientPlan(!isEditingClientPlan)}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold transition-all"
                          >
                            {isEditingClientPlan ? 'Cancelar Edição' : 'Editar Treino'}
                          </button>
                          <button 
                            onClick={() => setSelectedClient(null)}
                            className="bg-red-600/10 hover:bg-red-600/20 text-red-500 px-4 py-2 rounded-xl font-bold transition-all"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>

                      {isEditingClientPlan && clientData.plan ? (
                        <div className="space-y-6">
                          <div className="p-4 bg-purple-900/10 border border-purple-500/20 rounded-2xl mb-6">
                            <p className="text-sm text-purple-400">
                              <strong>Instruções:</strong> Edite o plano do aluno. Salve ao finalizar.
                            </p>
                          </div>
                          
                          {clientData.plan.workout.days.map((day: any, dIdx: number) => (
                            <div key={dIdx} className="bg-black border border-white/5 rounded-2xl p-6">
                              <h5 className="font-bold text-lg mb-4 text-purple-400">{day.day} - {day.muscleGroup}</h5>
                              <div className="space-y-4">
                                {day.exercises.map((ex: any, eIdx: number) => (
                                  <div key={eIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl">
                                    <div>
                                      <label className="text-[10px] uppercase font-bold text-gray-500">Exercício</label>
                                      <input 
                                        value={ex.name}
                                        onChange={(e) => {
                                          const newPlan = { ...clientData.plan };
                                          newPlan.workout.days[dIdx].exercises[eIdx].name = e.target.value;
                                          setClientData({ ...clientData, plan: newPlan });
                                        }}
                                        className="w-full bg-transparent border-b border-white/10 py-1 text-sm outline-none focus:border-purple-500"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-[10px] uppercase font-bold text-gray-500">Séries/Reps</label>
                                      <div className="flex gap-2">
                                        <input 
                                          value={ex.sets}
                                          onChange={(e) => {
                                            const newPlan = { ...clientData.plan };
                                            newPlan.workout.days[dIdx].exercises[eIdx].sets = e.target.value;
                                            setClientData({ ...clientData, plan: newPlan });
                                          }}
                                          className="w-1/2 bg-transparent border-b border-white/10 py-1 text-sm outline-none focus:border-purple-500 text-white"
                                        />
                                        <input 
                                          value={ex.reps}
                                          onChange={(e) => {
                                            const newPlan = { ...clientData.plan };
                                            newPlan.workout.days[dIdx].exercises[eIdx].reps = e.target.value;
                                            setClientData({ ...clientData, plan: newPlan });
                                          }}
                                          className="w-1/2 bg-transparent border-b border-white/10 py-1 text-sm outline-none focus:border-purple-500 text-white"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex items-end">
                                      <button 
                                        onClick={() => {
                                          const newPlan = { ...clientData.plan };
                                          newPlan.workout.days[dIdx].exercises.splice(eIdx, 1);
                                          setClientData({ ...clientData, plan: newPlan });
                                        }}
                                        className="text-xs text-red-500 hover:text-red-400"
                                      >
                                        Remover
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => {
                                    const newPlan = { ...clientData.plan };
                                    newPlan.workout.days[dIdx].exercises.push({
                                      name: 'Novo Exercício',
                                      sets: '3',
                                      reps: '12',
                                      rest: '60s',
                                      tips: 'Postura...',
                                      imageKeyword: 'fitness'
                                    });
                                    setClientData({ ...clientData, plan: newPlan });
                                  }}
                                  className="text-sm text-purple-400 hover:text-purple-300 font-bold"
                                >
                                  + Adicionar Exercício
                                </button>
                              </div>
                            </div>
                          ))}

                          <button 
                            onClick={() => handleUpdateClientPlan(clientData.plan)}
                            className="w-full bg-green-600 hover:bg-green-500 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-600/20"
                          >
                            Salvar Alterações no Plano do Aluno
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-6">
                           <div className="bg-black border border-white/10 rounded-2xl p-6 text-center py-20 text-gray-500">
                             Selecione "Editar Treino" para começar a montar o plano deste aluno.
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {linkedTrainerId ? (
                    <div className="bg-zinc-950 border border-purple-500/20 rounded-3xl p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                          <Users className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Personal Trainer Afiliado</h3>
                          <p className="text-gray-400">Acompanhamento Profissional Ativo</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Seu treinador tem acesso total à sua evolução, podendo realizar ajustes diretos em seu protocolo de treino e carga com precisão profissional.
                      </p>
                      <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                        <Activity className="w-5 h-5" />
                        Abrir Chat com Treinador
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                          <Zap className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Agente Personal IA</h3>
                          <p className="text-gray-400">Consultoria Inteligente Ativa</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 mb-8">
                        <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                          <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-1 italic">Inteligência Artificial Ativa</p>
                          <p className="text-gray-300 leading-relaxed">
                            Como você não possui um treinador humano vinculado, eu assumo o controle total do seu protocolo. 
                            Minha IA monitora sua frequência, adapta exercícios em caso de dor e reorganiza sua semana automaticamente.
                          </p>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-3">
                          {[
                            { cmd: "Não treinei hoje", desc: "Reorganizo sua semana" },
                            { cmd: "Isso dói", desc: "Substituo exercícios" },
                            { cmd: "Treinar em casa", desc: "Adapto para seu local" },
                            { cmd: "Pouco tempo", desc: "Otimizo a densidade" }
                          ].map((item, i) => (
                            <div key={i} className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5">
                              <span className="text-sm font-bold text-white">"{item.cmd}"</span>
                              <span className="text-[10px] text-gray-500">{item.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <textarea 
                          value={ptMessage}
                          onChange={(e) => setPtMessage(e.target.value)}
                          placeholder="Ex: 'Não treinei hoje, o que eu faço?' ou 'Sinto dor no ombro no supino'..."
                          className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm text-white focus:border-purple-500 outline-none h-24"
                        />
                        <button 
                          onClick={handleGeneratePersonalPlan}
                          disabled={isGeneratingPT || !ptMessage.trim()}
                          className="bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all disabled:opacity-50"
                        >
                          {isGeneratingPT ? <Dumbbell className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                          Enviar ao Agente IA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-8 pb-32">
              {/* Admin Section: Role Management */}
              {isAdmin && (
                <div className="bg-zinc-950 border border-green-500/20 rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-bold text-green-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Painel Admin: Gestão Nutricional
                      </h4>
                      <p className="text-sm text-gray-500">Promova usuários para Nutricionista</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Seu modo atual:</span>
                      <button 
                        onClick={() => setRole(role === 'user' ? 'nutritionist' : 'user')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          role === 'nutritionist' ? 'bg-green-600' : 'bg-white/10'
                        }`}
                      >
                        {role === 'nutritionist' ? 'Modo Nutri' : 'Modo Aluno'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Use a ferramenta de gestão no topo para promover usuários.</p>
                </div>
              )}

              {role === 'nutritionist' ? (
                <div className="bg-zinc-950 border border-green-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center py-24">
                  <Apple className="w-16 h-16 text-green-500 mb-6" />
                  <h3 className="text-2xl font-bold">Painel Nutricional Profissional</h3>
                  <p className="text-gray-500 max-w-md">Gerencie dietas, macros e protocolos alimentares de seus pacientes vinculados com precisão clínica.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {linkedNutritionistId ? (
                    <div className="bg-zinc-950 border border-green-500/20 rounded-3xl p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center border border-green-500/30">
                          <Apple className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Nutricionista Afiliado</h3>
                          <p className="text-gray-400">Acompanhamento Dietético Ativo</p>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-8 leading-relaxed">
                        Sua estratégia alimentar está sendo otimizada por um especialista humano. Seus protocolos são sincronizados com seu gasto calórico real.
                      </p>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                        <Apple className="w-5 h-5" />
                        Ver Recomendações do Nutricionista
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 border border-green-500/20 rounded-3xl p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center border border-green-500/30">
                          <Apple className="w-8 h-8 text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Agente Nutri IA</h3>
                          <p className="text-gray-400">Suporte Nutricional 24/7</p>
                        </div>
                      </div>
                      <div className="bg-black/40 p-4 rounded-xl border border-white/5 mb-8">
                        <p className="text-sm font-bold text-green-400 uppercase tracking-widest mb-1 italic">Consultoria Nutricional Inteligente</p>
                        <p className="text-gray-300 leading-relaxed font-mono text-xs">
                          {profile.objective === 'hipertrofia' ? "FASE: Superávit Calórico Controlado" : "FASE: Déficit Calórico Otimizado"}
                        </p>
                        <p className="text-gray-400 mt-2 text-sm">
                          Analiso seu peso atual ({profile.weight}kg) e nível de atividade para calcular macros em tempo real e sugerir substituições inteligentes.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button className="bg-white/5 border border-white/5 p-4 rounded-xl text-center hover:bg-white/10 transition-all">
                          <Apple className="w-5 h-5 mx-auto mb-2 text-green-500" />
                          <p className="text-xs font-bold">Base Alimentar</p>
                        </button>
                        <button className="bg-white/5 border border-white/5 p-4 rounded-xl text-center hover:bg-white/10 transition-all">
                          <Activity className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                          <p className="text-xs font-bold">Macros Diários</p>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/10 py-8 px-6 flex flex-col items-center gap-4 text-gray-500 text-sm">
        <p>© 2026 FitAI. Desenvolvido por NVM Project Management</p>
      </footer>
    </div>
  );
}
