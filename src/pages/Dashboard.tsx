import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../store/userStore';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { UserRole, PlanType } from '../types';
import { 
  Dumbbell, Apple, Lock, Zap, ChevronRight, LogOut, Activity, Timer, 
  Play, Pause, X, TrendingUp, CheckCircle2, Calendar, Users, 
  Download, Loader2, Heart, Sparkles, Moon, Sun, Plus
} from 'lucide-react';
import { logoutFirebase } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { APP_VERSION } from '../constants';
import { Logo } from '../components/Logo';
import { ExerciseLibrary } from '../components/ExerciseLibrary';
import { ExerciseImage } from '../components/ExerciseImage';
import { ProgressComparison } from '../components/ProgressComparison';
import { Toast, ToastType } from '../components/Toast';


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
  const { updateExerciseWeight, addExerciseProgress, planType } = useUser();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

  // Buscar GIF do exercício via proxy para evitar bloqueios de CORS/Referer
  useEffect(() => {
    const fetchGif = async () => {
      try {
        const origin = window.location.origin;
        // Prefer imageKeyword if available, otherwise use name
        const searchTerm = ptToEnSearch(exercise.imageKeyword || exercise.name);
        const res = await fetch(`${origin}/api/exercises/search?limit=1&name=${encodeURIComponent(searchTerm)}`);
        
        if (!res.ok) {
          throw new Error(`API Error: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setImageUrl(data.data[0].gifUrl);
        } else if (data.success && exercise.imageKeyword && exercise.imageKeyword !== exercise.name) {
          // Fallback to name if imageKeyword search failed
          const fallbackSearch = ptToEnSearch(exercise.name);
          const fallbackRes = await fetch(`${origin}/api/exercises/search?limit=1&name=${encodeURIComponent(fallbackSearch)}`);
          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            if (fallbackData.success && fallbackData.data.length > 0) {
              setImageUrl(fallbackData.data[0].gifUrl);
            }
          }
        }
      } catch (e) {
        console.error("Erro ao buscar GIF:", e);
      }
    };
    fetchGif();
  }, [exercise.name, exercise.imageKeyword]);

  const handleLogProgress = async () => {
    if (!exercise.weight || isLogging) return;
    
    setIsLogging(true);
    // Parse weight numeric value
    const numericWeight = parseFloat(exercise.weight.replace(/[^\d.]/g, '')) || 0;
    const numericReps = parseInt(exercise.reps.replace(/[^\d]/g, '')) || 0;
    
    await addExerciseProgress(exercise.name, numericWeight, numericReps);
    setIsLogging(false);
    setLogSuccess(true);
    setTimeout(() => setLogSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-4 py-6 border-b border-gray-200 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors px-2 rounded-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xl text-black dark:text-white tracking-tight truncate">{translateExerciseName(exercise.name)}</p>
          {exercise.englishName && (
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium italic truncate">{exercise.englishName}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {exercise.group && (
              <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-500/20">
                {exercise.group}
              </span>
            )}
            {exercise.equipment && (
              <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-500/20">
                {exercise.equipment}
              </span>
            )}
          </div>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full uppercase tracking-widest shrink-0">
          {exercise.rest} descanso
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Lado Esquerdo: Info e Instruções */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-purple-600/10 border border-purple-500/20 px-3 py-2 rounded-lg">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-tighter mb-0.5">Séries x Repetições</p>
              <p className="text-lg font-black text-black dark:text-white">{exercise.sets} x {exercise.reps}</p>
            </div>
            
            <div className="bg-purple-600/5 dark:bg-zinc-900/50 border border-purple-500/10 dark:border-white/10 px-4 py-2.5 rounded-2xl flex items-center gap-3 min-w-[160px] flex-1 sm:flex-none hover:border-purple-500/30 transition-all group/weight">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest mb-0.5 whitespace-nowrap opacity-60">Sua Carga</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={exercise.weight || ''} 
                    onChange={(e) => updateExerciseWeight(dayIdx, exerciseIdx, e.target.value)}
                    placeholder="Ex: Moderado - 10kg"
                    className="bg-transparent border-none p-0 text-xl font-black text-black dark:text-white w-full focus:ring-0 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-700 truncate"
                  />
                  <div className="flex items-center justify-center p-1.5 bg-purple-500/10 rounded-lg group-hover/weight:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
              
              {planType === 'PREMIUM' && (
                <button 
                  onClick={handleLogProgress}
                  disabled={!exercise.weight || isLogging}
                  className={`p-2 rounded-xl transition-all ${
                    logSuccess 
                      ? 'bg-green-500/20 text-green-500' 
                      : 'bg-white dark:bg-white/10 text-gray-500 hover:bg-purple-600 hover:text-white shadow-sm'
                  } disabled:opacity-30 flex-shrink-0`}
                  title="Salvar no Histórico"
                >
                  {isLogging ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>

          {exercise.technicalDescription && (
            <div className="p-4 bg-gray-100 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-50" />
              <p className="text-[10px] font-black text-purple-600 dark:text-purple-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> Execução Técnica
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium italic">
                "{exercise.technicalDescription}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {exercise.tips && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-purple-500/20 transition-colors">
                <p className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">Dica</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.tips}</p>
              </div>
            )}
            {exercise.breathing && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-blue-500/20 transition-colors">
                <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Respiração</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.breathing}</p>
              </div>
            )}
            {exercise.cadence && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-green-500/20 transition-colors">
                <p className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1.5">Cadência</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.cadence}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: GIF do Exercício */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-video relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 group">
            <ExerciseImage 
              src={imageUrl || ''} 
              alt={exercise.name}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </div>

          <button 
            onClick={() => onStartRest(restSeconds)}
            className="w-full bg-white text-black dark:bg-white dark:text-black hover:bg-purple-500 hover:text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/20 group"
          >
            <Timer className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Iniciar Descanso
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { 
    user, profile, plan, planType, role, clients, linkedTrainerId, linkedNutritionistId, trialEndsAt, subscriptionEndsAt, isAdmin,
    logout, calculateIMC, updateExerciseWeight, resetAccount, setPlan, setRole, linkClient, linkNutritionist, updatePlanForUser, setRoleForUser,
    toggleTheme, theme 
  } = useUser();
  
  const isFree = planType === 'FREE';
  const isTrialExpired = isFree && trialEndsAt && new Date() >= new Date(trialEndsAt);
  const isSubscriptionExpired = (planType === 'PRO' || planType === 'PREMIUM') && subscriptionEndsAt && new Date() >= new Date(subscriptionEndsAt);
  const isBlocked = isTrialExpired || isSubscriptionExpired;

  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'evolution' | 'routine' | 'personal' | 'nutrition' | 'library'>('workout');
  const [trainerEmail, setTrainerEmail] = useState('');
  const [targetUserEmail, setTargetUserEmail] = useState('');
  const [targetUserRole, setTargetUserRole] = useState<UserRole>('trainer');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState({ type: '', text: '' });
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientData, setClientData] = useState<any>(null);
  const [isEditingClientPlan, setIsEditingClientPlan] = useState(false);
  const [toast, setToast] = useState<{ isVisible: boolean; message: string; type: ToastType }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  };

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

  // Admin Modal State
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState({ type: '', msg: '' });
  const [updateMsgInput, setUpdateMsgInput] = useState('Nova versão disponível com melhorias e correções!');
  const [versionInput, setVersionInput] = useState(APP_VERSION);

  const handleAdminPlanChange = async (newPlan: PlanType) => {
    if (!isAdmin || !user) return;
    setAdminActionLoading(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await updateDoc(doc(db, 'users', user.uid), {
        planType: newPlan,
        isPremium: newPlan === 'PREMIUM',
        updatedAt: new Date().toISOString()
      });
      
      if (newPlan !== 'FREE') {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 30);
        await updateDoc(doc(db, 'users', user.uid), {
          subscriptionEndsAt: futureDate.toISOString()
        });
      }
      setAdminFeedback({ type: 'success', msg: `Plano alterado para ${newPlan}` });
    } catch (error) {
      console.error("Error updating admin plan:", error);
      setAdminFeedback({ type: 'error', msg: 'Erro ao atualizar plano' });
    } finally {
      setAdminActionLoading(false);
      setTimeout(() => setAdminFeedback({ type: '', msg: '' }), 3000);
    }
  };

  const handleBroadcastUpdate = async () => {
    if (!isAdmin) return;
    if (!updateMsgInput.trim()) return;

    setAdminActionLoading(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await setDoc(doc(db, 'system', 'config'), {
        latestVersion: versionInput || APP_VERSION,
        updateMessage: updateMsgInput,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setAdminFeedback({ type: 'success', msg: 'Notificação enviada com sucesso!' });
    } catch (error) {
      console.error("Error broadcasting update:", error);
      setAdminFeedback({ type: 'error', msg: 'Erro ao enviar notificação' });
    } finally {
      setAdminActionLoading(false);
      setTimeout(() => setAdminFeedback({ type: '', msg: '' }), 3000);
    }
  };

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

  // Subscription expiration check and auto-reversion
  useEffect(() => {
    const isSimulationExpired = (planType === 'PRO' || planType === 'PREMIUM') && subscriptionEndsAt && new Date() >= new Date(subscriptionEndsAt);
    
    if (isSimulationExpired && user && !isAdmin) {
      const revertToFree = async () => {
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const { db } = await import('../firebase');
          await updateDoc(doc(db, 'users', user.uid), {
            planType: 'FREE',
            isPremium: false,
            role: 'user',
            updatedAt: new Date().toISOString()
          });
          console.log("Subscription expired. Reverted to FREE plan.");
        } catch (error) {
          console.error("Error reverting to free plan:", error);
        }
      };
      revertToFree();
    }
  }, [planType, subscriptionEndsAt, user, isAdmin]);

  const startRest = (seconds: number) => {
    setTimeLeft(seconds);
    setTimerActive(true);
    setShowTimer(true);
    showToast(`Descanso de ${seconds}s iniciado!`, 'info');
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

  const imcData = calculateIMC();

  // Mock data for evolution chart
  const chartData = [
    { name: 'Sem 1', peso: (profile?.weight || 0) + 2 },
    { name: 'Sem 2', peso: (profile?.weight || 0) + 1 },
    { name: 'Sem 3', peso: (profile?.weight || 0) + 0.5 },
    { name: 'Atual', peso: profile?.weight || 0 },
  ];

  const Paywall = ({ feature, type = 'pro' }: { feature: string; type?: 'pro' | 'premium' | 'expired' }) => {
    const isExpired = type === 'expired';
    
    return (
      <div className="absolute inset-0 backdrop-blur-md bg-black/80 z-10 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 mt-8 ${isExpired ? 'bg-red-600/20' : 'bg-purple-600/20'}`}>
          <Lock className={`w-8 h-8 ${isExpired ? 'text-red-500' : 'text-purple-500'}`} />
        </div>
        <h4 className="text-2xl font-bold mb-2">
          {isExpired ? (isSubscriptionExpired ? 'Sua assinatura expirou' : 'Seu período de teste acabou') : 'Recurso Bloqueado'}
        </h4>
        <p className="text-gray-300 max-w-md mb-8">
          {isExpired ? (
            isSubscriptionExpired 
              ? "Seus 30 dias de acesso premium chegaram ao fim. Renove sua assinatura para continuar usando todos os recursos."
              : "Para continuar acessando seus treinos, dietas e evolução, escolha um de nossos planos."
          ) : (
            <>Ative a assinatura <strong className="uppercase">{type}</strong> para ativar os recursos de <strong>{feature}</strong>.</>
          )}
        </p>
        
        <div className="grid sm:grid-cols-2 gap-4 w-full max-w-2xl text-left">
          <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl flex flex-col">
            <h5 className="text-xl font-bold mb-2 text-white">Pro</h5>
            <p className="text-3xl font-bold text-purple-400 mb-4">R$ 39,90<span className="text-sm text-gray-500">/mês</span></p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6 flex-1">
              <li>✓ Treinos ilimitados</li>
              <li>✓ Dieta completa</li>
              <li>✓ Evolução detalhada</li>
            </ul>
            <Link to="/checkout?plan=PRO" className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold transition-colors text-center">
              Assinar Pro
            </Link>
          </div>

          <div className="bg-purple-900/20 border border-purple-500 p-6 rounded-2xl flex flex-col relative text-left">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full">
              Recomendado
            </div>
            <h5 className="text-xl font-bold mb-2 text-white">Premium</h5>
            <p className="text-3xl font-bold text-purple-400 mb-4">R$ 59,90<span className="text-sm text-gray-500">/mês</span></p>
            <ul className="text-sm text-gray-400 space-y-2 mb-6 flex-1">
              <li>✓ Tudo do Pro</li>
              <li>✓ Chat 24h com Coach IA</li>
              <li>✓ Ajustes diários</li>
            </ul>
            <Link to="/checkout?plan=PREMIUM" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold transition-colors text-center">
              Assinar Premium
            </Link>
          </div>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => setShowAdminModal(true)}
            className="mt-8 text-red-500 font-bold uppercase tracking-widest text-xs hover:underline flex items-center gap-2"
          >
            <Users className="w-4 h-4" /> Resetar Simulação (Admin)
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-purple-500/30 pb-20">
      <AnimatePresence>
        {user?.email === 'nangelicaalcantara@gmail.com' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-red-600/30 via-pink-600/30 to-red-600/30 border-b border-red-500/20 pt-6 pb-8 px-6 text-center overflow-hidden relative"
          >
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20"
            >
              <Heart className="w-64 h-64 text-red-500 fill-current" />
            </motion.div>
            <div className="relative z-10">
              <h2 className="text-2xl font-black text-white mb-1 drop-shadow-lg">Amor, eu te amo!</h2>
              <p className="text-red-200 text-lg font-medium drop-shadow-md">Você é a razão da minha vida.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-12 h-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black dark:text-white">
                <span className="text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">Fit</span>
                <span className="text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI</span>
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium tracking-wider uppercase">Plano {isAdmin ? 'ADMIN' : planType}</p>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminModal(true)}
                    className="ml-2 bg-red-600 hover:bg-red-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-red-600/20 transition-all border border-red-500/50"
                  >
                    <Users className="w-3 h-3" /> Painel Admin
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick} 
                className="hidden lg:flex items-center gap-2 bg-purple-600/10 text-purple-600 dark:text-purple-400 hover:bg-purple-600/20 px-4 py-2 rounded-full text-sm font-bold transition-colors"
              >
                <Download className="w-4 h-4" /> Instalar App
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 transition-all group relative"
              title={theme === 'dark' ? 'Mudar para modo sistema' : theme === 'system' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              <div className="relative">
                {theme === 'dark' && <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform" />}
                {theme === 'light' && <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform" />}
                {theme === 'system' && (
                  <div className="relative text-purple-600 dark:text-purple-400">
                    <Zap className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 text-[8px] font-black uppercase">Auto</span>
                  </div>
                )}
              </div>
            </button>

            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-white/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-600/10 flex items-center justify-center border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold">
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-bold text-sm"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
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
            className="fixed bottom-6 right-6 z-50 bg-white dark:bg-zinc-900 border border-purple-500/50 p-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Descanso</p>
              <p className={`text-2xl font-bold font-mono ${timeLeft === 0 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-black dark:text-white'}`}>
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
            <p className="text-gray-500 dark:text-gray-400">
              Objetivos: <span className="text-black dark:text-white font-medium">{Array.isArray(profile.objective) ? profile.objective.join(', ') : profile.objective}</span> • 
              Nível: <span className="text-black dark:text-white font-medium">{profile.fitnessLevel}</span>
            </p>
            {isFree && trialEndsAt && (
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-2 rounded-lg text-sm text-purple-600 dark:text-purple-300">
                  <Timer className="w-4 h-4" />
                  Seu período de teste grátis termina em: {new Date(trialEndsAt).toLocaleDateString()}
                </div>
                <Link 
                  to="/checkout?plan=PRO"
                  className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4 fill-current" /> Ativar Plano PRO
                </Link>
              </div>
            )}
          </div>
          <button 
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center justify-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-black dark:text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
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
              activeTab === 'evolution' 
                ? (isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-blue-500 text-white') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp className={`w-5 h-5 ${isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Evolução
            {(isFree || isBlocked) && <Lock className="w-3 h-3 ml-1 text-gray-600" />}
          </button>
          <button 
            onClick={() => setActiveTab('routine')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'routine' 
                ? (isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-orange-500 text-white') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Calendar className={`w-5 h-5 ${isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Rotina Diária
            {(isFree || isBlocked) && <Lock className="w-3 h-3 ml-1 text-gray-600" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'personal' 
                ? (planType === 'PRO' || isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-purple-900 border border-purple-500 text-white') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users className={`w-5 h-5 ${planType === 'PRO' || isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Personal Trainer
            {(planType === 'PRO' || isFree || isBlocked) && <Lock className="w-3 h-3 ml-1 text-gray-600" />}
          </button>
          <button 
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-6 py-3 rounded-full font-bold transition-all text-sm sm:text-base whitespace-nowrap ${
              activeTab === 'nutrition' 
              ? (planType === 'PRO' || isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-green-900 border border-green-500 text-white') 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className={`w-5 h-5 ${planType === 'PRO' || isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Nutricionista
            {(planType === 'PRO' || isFree || isBlocked) && <Lock className="w-3 h-3 ml-1 text-gray-600" />}
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'routine' && (
            <div className="space-y-8 relative">
              {isBlocked ? (
                <Paywall feature="Rotina Diária" type="expired" />
              ) : isFree ? (
                <Paywall feature="Rotina Diária" type="premium" />
              ) : null}
              <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Registro de Rotina Diária
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  Registre sua rotina para que a IA possa entender seu contexto e ajustar seu plano de forma mais inteligente.
                </p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Horas de sono na última noite</label>
                    <input 
                      type="text" 
                      value={routineData.sleep}
                      onChange={e => setRoutineData({...routineData, sleep: e.target.value})}
                      placeholder="Ex: 7 horas"
                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Água consumida hoje</label>
                    <input 
                      type="text" 
                      value={routineData.water}
                      onChange={e => setRoutineData({...routineData, water: e.target.value})}
                      placeholder="Ex: 2 litros"
                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Nível de estresse (1-10)</label>
                    <input 
                      type="text" 
                      value={routineData.stress}
                      onChange={e => setRoutineData({...routineData, stress: e.target.value})}
                      placeholder="Ex: 4"
                      className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
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

          {activeTab === 'evolution' && (
            <div className="space-y-8">
              {(isFree || isBlocked) ? (
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-8 h-8 text-purple-600 dark:text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Evolução Bloqueada</h3>
                  <p className="text-gray-400 mb-8 max-w-sm">Ative a assinatura PRO para ativar os recursos de acompanhamento de progresso e biometria.</p>
                  <Link to="/checkout?plan=PRO" className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Upgrade para PRO
                  </Link>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-purple-400" />
                       Métricas de Progresso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      <div className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Peso Atual</p>
                        <p className="text-3xl font-black text-black dark:text-white">{profile.weight} kg</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">IMC</p>
                        <p className="text-3xl font-black text-black dark:text-white">{imcData?.value}</p>
                        <p className="text-[10px] font-bold text-purple-600 dark:text-purple-500 uppercase mt-1">{imcData?.category}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Objetivo</p>
                        <p className="text-lg font-bold leading-tight text-black dark:text-white">{Array.isArray(profile.objective) ? profile.objective[0] : profile.objective}</p>
                      </div>
                      <div className="bg-gray-100 dark:bg-black border border-gray-200 dark:border-white/5 p-6 rounded-2xl">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Status</p>
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                          <CheckCircle2 className="w-5 h-5" />
                          <p className="text-lg font-bold">Em dia</p>
                        </div>
                      </div>
                    </div>

                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#ddd'} vertical={false} />
                          <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#111' : '#fff', border: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`, borderRadius: '8px' }}
                            itemStyle={{ color: '#a855f7' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="peso" 
                            stroke="#a855f7" 
                            strokeWidth={4} 
                            dot={{ r: 6, fill: '#a855f7', strokeWidth: 0 }} 
                            activeDot={{ r: 8, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                    <ProgressComparison />
                  </div>

                  <div className="bg-red-500/5 dark:bg-red-900/10 border border-red-500/20 rounded-3xl p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <Lock className="w-5 h-5 text-red-500" />
                      <h3 className="text-lg font-bold">Gestão de Dados (LGPD)</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-6">Você tem o direito de solicitar a exclusão permanente de todos os seus dados biométricos e histórico de treinos.</p>
                    <button 
                      onClick={resetAccount}
                      className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 px-6 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      Excluir Meus Dados Permanentemente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
              <ExerciseLibrary />
            </div>
          )}

          {activeTab === 'workout' && (
            <div className="space-y-8 relative">
              {isBlocked && <Paywall feature="Treinos" type="expired" />}
              <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Rotina Semanal ({profile.daysPerWeek} dias)
                </h3>
                
                <div className="grid gap-4">
                  {plan.days.map((day, idx) => (
                    <div key={`day-${idx}-${day.day}`} className="bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:border-purple-500/30 transition-colors shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400">{day.day}</h4>
                        <span className="text-sm font-medium bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-gray-600 dark:text-white">{day.focus}</span>
                      </div>
                      
                      <div className="space-y-4">
                        {day.exercises.map((ex, i) => {
                           const restSeconds = parseInt(ex.rest.replace(/\D/g, '')) || 60;
                           const uniqueKey = ex.id ? `${ex.id}-${i}` : `${ex.name}-${i}`;
                           return <ExerciseRow key={uniqueKey} exercise={ex} dayIdx={idx} exerciseIdx={i} restSeconds={restSeconds} onStartRest={startRest} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    Progressão de Carga
                  </h3>
                  
                  {isFree ? (
                    <Paywall feature="Progressão de Carga Automática" />
                  ) : (
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed bg-gray-100 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                        {plan.progression}
                      </p>
                      <div className="p-4 bg-purple-600/10 dark:bg-purple-900/20 rounded-xl border border-purple-500/30">
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase mb-2">Projeção Próximo Ciclo</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Esperamos um aumento de 2-5% na intensidade volumétrica baseado no seu histórico.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Estratégia de Consistência
                  </h3>
                  
                  {plan.consistencyScore ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">Score de Aderência</span>
                        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{plan.consistencyScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${plan.consistencyScore}%` }} />
                      </div>
                      <div className="space-y-2 mt-6">
                        {plan.strategies?.map((strat: string, i: number) => (
                          <div key={`strat-${i}`} className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Zap className="w-4 h-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                            {strat}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Zap className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 dark:text-gray-500 text-sm italic">Inicie seus treinos para gerar score de consistência.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diet' && (
            <div className="space-y-8 relative">
              {isBlocked && <Paywall feature="Dieta" type="expired" />}
              {/* Macros Overview */}
              <div id="diet-macros" className="grid grid-cols-2 md:grid-cols-4 gap-4 scroll-mt-24">
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Calorias</p>
                  <p className="text-3xl font-bold text-black dark:text-white">{plan?.diet?.calories || '---'}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal/dia</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Proteína</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{plan?.diet?.macros?.protein || '0'}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Carboidratos</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">{plan?.diet?.macros?.carbs || '0'}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Gorduras</p>
                  <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{plan?.diet?.macros?.fat || '0'}g</p>
                </div>
              </div>

              {/* Meals Section */}
              <div id="diet-meals" className="relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 p-8 min-h-[500px] scroll-mt-24">
                <h3 className="text-xl font-bold mb-6">Plano Alimentar Completo</h3>
                
                {isFree ? (
                  <Paywall feature="Refeições Detalhadas" />
                ) : (
                  <div className="grid gap-4">
                    {plan?.diet ? (
                      <>
                        {plan.diet.meals?.map((meal, idx) => (
                          <div key={`meal-${idx}-${meal.name}`} className="bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-bold text-green-600 dark:text-green-400">{meal.name}</h4>
                              <span className="text-sm font-medium bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">{meal.time}</span>
                            </div>
                            <ul className="space-y-2">
                              {meal.foods?.map((food, i) => (
                                <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                                  <span className="text-green-600 dark:text-green-500 mt-1">•</span>
                                  {food}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                        
                        {plan.diet.recommendations && plan.diet.recommendations.length > 0 && (
                          <div className="mt-8 p-6 bg-purple-600/5 dark:bg-purple-900/10 border border-purple-500/20 rounded-2xl">
                            <h4 className="font-bold text-purple-600 dark:text-purple-400 mb-4">Recomendações do Coach</h4>
                            <ul className="space-y-2">
                              {plan.diet.recommendations.map((rec, i) => (
                                <li key={i} className="text-gray-600 dark:text-gray-300 text-sm flex items-start gap-2">
                                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center">
                        <Apple className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">Sua dieta personalizada ainda não foi gerada ou está sendo carregada.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}


          {activeTab === 'personal' && (
            <div className="space-y-8 pb-32 relative">
              {isBlocked ? (
                <Paywall feature="Personal Trainer" type="expired" />
              ) : planType === 'PRO' || isFree ? (
                <Paywall feature="Personal Trainer" type="premium" />
              ) : null}
              {/* Admin Section: Role Management */}
              {isAdmin && (
                <div className="bg-gray-100 dark:bg-zinc-950 border border-red-500/20 rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Painel Admin: Gestão de Profissionais
                      </h4>
                      <p className="text-sm text-gray-500">Promova usuários para Trainer ou Nutricionista</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Seu modo atual:</span>
                      <button 
                        onClick={() => setRole(role === 'user' ? 'trainer' : 'user')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          role === 'trainer' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
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
                      className="sm:col-span-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white"
                    />
                    <select 
                      value={targetUserRole}
                      onChange={e => setTargetUserRole(e.target.value as any)}
                      className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white"
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
                  <div className="bg-gray-100 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Painel do Treinador
                    </h3>
                    
                    <div className="grid gap-6">
                      <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-gray-500">Adicionar Novo Aluno</h4>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="email" 
                            value={trainerEmail}
                            onChange={e => setTrainerEmail(e.target.value)}
                            placeholder="E-mail do aluno..."
                            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-black dark:text-white focus:border-purple-500 outline-none transition-all"
                          />
                          <button 
                            onClick={handleLinkClient}
                            disabled={linkLoading}
                            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 shadow-md"
                          >
                            {linkLoading ? 'Vinculando...' : 'Vincular Aluno'}
                          </button>
                        </div>
                        {linkMessage.text && (
                          <p className={`mt-3 text-sm ${linkMessage.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                                className={`p-4 rounded-2xl border transition-all text-left shadow-sm ${
                                  selectedClient === clientId 
                                    ? 'bg-purple-600/10 border-purple-600 dark:border-purple-500' 
                                    : 'bg-white dark:bg-black border-gray-200 dark:border-white/10 hover:border-purple-500'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center font-bold text-gray-700 dark:text-white">
                                    {clientId.substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-sm truncate text-black dark:text-white">ID: {clientId.substring(0, 8)}</p>
                                    <p className="text-xs text-gray-500">Toque para gerenciar</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 dark:bg-black/40 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
                            <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">Você ainda não possui alunos vinculados.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedClient && clientData && (
                    <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">Gerenciando: {clientData.email}</h3>
                          <p className="text-gray-500 dark:text-gray-400">Plano Atual: {clientData.planType}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsEditingClientPlan(!isEditingClientPlan)}
                            className="bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-black dark:text-white px-4 py-2 rounded-xl font-bold transition-all"
                          >
                            {isEditingClientPlan ? 'Cancelar Edição' : 'Editar Treino'}
                          </button>
                          <button 
                            onClick={() => setSelectedClient(null)}
                            className="bg-red-600/10 hover:bg-red-600 font-bold text-red-600 hover:text-white px-4 py-2 rounded-xl transition-all"
                          >
                            Fechar
                          </button>
                        </div>
                      </div>

                      {isEditingClientPlan && clientData.plan ? (
                        <div className="space-y-6">
                          <div className="p-4 bg-purple-600/5 dark:bg-purple-900/10 border border-purple-500/20 rounded-2xl mb-6">
                            <p className="text-sm text-purple-600 dark:text-purple-400">
                              <strong>Instruções:</strong> Edite o plano do aluno. Salve ao finalizar.
                            </p>
                          </div>
                          
                          {clientData.plan.days.map((day: any, dIdx: number) => (
                            <div key={dIdx} className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/5 rounded-2xl p-6 mb-4">
                              <h5 className="font-bold text-lg mb-4 text-purple-600 dark:text-purple-400">{day.day} - {day.focus}</h5>
                              <div className="space-y-4">
                                {day.exercises.map((ex: any, eIdx: number) => (
                                  <div key={eIdx} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div>
                                      <label className="text-[10px] uppercase font-bold text-gray-500">Exercício</label>
                                      <input 
                                        value={ex.name}
                                        onChange={(e) => {
                                          const newPlan = { ...clientData.plan };
                                          newPlan.workout.days[dIdx].exercises[eIdx].name = e.target.value;
                                          setClientData({ ...clientData, plan: newPlan });
                                        }}
                                        className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm outline-none focus:border-purple-500 text-black dark:text-white"
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
                                          className="w-1/2 bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm outline-none focus:border-purple-500 text-black dark:text-white"
                                        />
                                        <input 
                                          value={ex.reps}
                                          onChange={(e) => {
                                            const newPlan = { ...clientData.plan };
                                            newPlan.workout.days[dIdx].exercises[eIdx].reps = e.target.value;
                                            setClientData({ ...clientData, plan: newPlan });
                                          }}
                                          className="w-1/2 bg-transparent border-b border-gray-200 dark:border-white/10 py-1 text-sm outline-none focus:border-purple-500 text-black dark:text-white"
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
                                        className="text-xs text-red-600 hover:text-red-500 font-bold"
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
                                  className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 font-bold flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" /> Adicionar Exercício
                                </button>
                              </div>
                            </div>
                          ))}

                          <button 
                            onClick={() => handleUpdateClientPlan(clientData.plan)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white p-4 rounded-2xl font-bold transition-all shadow-lg shadow-green-600/20"
                          >
                            Salvar Alterações no Plano do Aluno
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-6">
                           <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center py-20 text-gray-500">
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
                    <div className="bg-gray-50 dark:bg-zinc-950 border border-purple-500/20 rounded-3xl p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                          <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">Personal Trainer Afiliado</h3>
                          <p className="text-gray-500 dark:text-gray-400">Acompanhamento Profissional Ativo</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        Seu treinador tem acesso total à sua evolução, podendo realizar ajustes diretos em seu protocolo de treino e carga com precisão profissional.
                      </p>
                      <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20">
                        <Activity className="w-5 h-5" />
                        Abrir Chat com Treinador
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-zinc-950 border border-purple-500/20 rounded-3xl p-8 relative overflow-hidden group shadow-sm">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
                          <Zap className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">Agente Personal IA</h3>
                          <p className="text-gray-500 dark:text-gray-400">Consultoria Inteligente Ativa</p>
                        </div>
                      </div>
                      
                      <div className="grid gap-4 mb-8">
                        <div className="bg-white/50 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-white/5">
                          <p className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1 italic">Inteligência Artificial Ativa</p>
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
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
                            <div key={i} className="flex flex-col p-3 bg-white/80 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                              <span className="text-sm font-bold text-black dark:text-white">"{item.cmd}"</span>
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
                          className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-black dark:text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none h-24 shadow-inner"
                        />
                        <button 
                          onClick={handleGeneratePersonalPlan}
                          disabled={isGeneratingPT || !ptMessage.trim()}
                          className="bg-black dark:bg-white text-white dark:text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
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
            <div className="space-y-8 pb-32 relative">
              {isBlocked ? (
                <Paywall feature="Nutricionista" type="expired" />
              ) : planType === 'PRO' || isFree ? (
                <Paywall feature="Nutricionista" type="premium" />
              ) : null}
              {/* Admin Section: Role Management */}
              {isAdmin && (
                <div className="bg-gray-100 dark:bg-zinc-950 border border-green-500/20 rounded-3xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-bold text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Painel Admin: Gestão Nutricional
                      </h4>
                      <p className="text-sm text-gray-500">Promova usuários para Nutricionista</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Seu modo atual:</span>
                      <button 
                        onClick={() => setRole(role === 'user' ? 'nutritionist' : 'user')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                          role === 'nutritionist' ? 'bg-green-600' : 'bg-gray-200 dark:bg-white/10'
                        }`}
                      >
                        {role === 'nutritionist' ? 'Modo Nutri' : 'Modo Aluno'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Use a ferramenta de gestão no topo para promover usuários.</p>
                </div>
              )}

              {role === 'nutritionist' ? (
                <div className="bg-gray-50 dark:bg-zinc-950 border border-green-500/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center py-24 shadow-sm">
                  <Apple className="w-16 h-16 text-green-500 mb-6" />
                  <h3 className="text-2xl font-bold text-black dark:text-white">Painel Nutricional Profissional</h3>
                  <p className="text-gray-500 max-w-md">Gerencie dietas, macros e protocolos alimentares de seus pacientes vinculados com precisão clínica.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {linkedNutritionistId ? (
                    <div className="bg-gray-50 dark:bg-zinc-950 border border-green-500/20 rounded-3xl p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center border border-green-500/30">
                          <Apple className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">Nutricionista Afiliado</h3>
                          <p className="text-gray-500 dark:text-gray-400">Acompanhamento Dietético Ativo</p>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        Sua estratégia alimentar está sendo otimizada por um especialista humano. Seus protocolos são sincronizados com seu gasto calórico real.
                      </p>
                      <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20">
                        <Apple className="w-5 h-5" />
                        Ver Recomendações do Nutricionista
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-zinc-950 border border-green-500/20 rounded-3xl p-8 shadow-sm">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center border border-green-500/30">
                          <Apple className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">Agente Nutri IA</h3>
                          <p className="text-gray-500 dark:text-gray-400">Suporte Nutricional 24/7</p>
                        </div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-white/5 mb-8">
                        <p className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-widest mb-1 italic">Consultoria Nutricional Inteligente</p>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-mono text-xs">
                          {profile.objective === 'hipertrofia' ? "FASE: Superávit Calórico Controlado" : "FASE: Déficit Calórico Otimizado"}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                          Analiso seu peso atual ({profile.weight}kg) e nível de atividade para calcular macros em tempo real e sugerir substituições inteligentes.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div 
                          className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 p-6 rounded-2xl text-center shadow-sm cursor-pointer hover:border-green-500/30 transition-all"
                          onClick={() => {
                            setActiveTab('diet');
                            setTimeout(() => {
                              document.getElementById('diet-meals')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          <Apple className="w-8 h-8 mx-auto mb-3 text-green-600 dark:text-green-500" />
                          <p className="text-sm font-bold text-black dark:text-white">Base Alimentar</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Ver Cardápio Completo</p>
                        </div>
                        <div 
                          className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 p-6 rounded-2xl text-center shadow-sm cursor-pointer hover:border-blue-500/30 transition-all"
                          onClick={() => {
                            setActiveTab('diet');
                            setTimeout(() => {
                              document.getElementById('diet-macros')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                        >
                          <Activity className="w-8 h-8 mx-auto mb-3 text-blue-600 dark:text-blue-500" />
                          <p className="text-sm font-bold text-black dark:text-white">Macros Diários</p>
                          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Resumo Nutricional</p>
                        </div>
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
      <footer className="mt-12 border-t border-gray-200 dark:border-white/10 py-12 px-6 flex flex-col items-center gap-3 text-gray-500 text-xs">
        <p className="font-bold tracking-tight">© 2026 FitAI. Desenvolvido por NVM Project Management</p>
        <p className="font-mono bg-gray-100 dark:bg-white/5 px-2 py-1 rounded border border-gray-200 dark:border-white/5 uppercase tracking-widest text-[9px]">Versão {APP_VERSION}</p>
      </footer>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminModal(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-red-500/30 rounded-3xl p-8 shadow-[0_30px_70px_rgba(0,0,0,0.2)] dark:shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600/10 dark:bg-red-600/20 flex items-center justify-center border border-red-500/30">
                    <Users className="w-6 h-6 text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-black dark:text-white">Painel de Controle</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">Acesso Restrito</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {adminFeedback.msg && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`mb-6 p-4 rounded-xl text-sm font-bold text-center border ${
                    adminFeedback.type === 'success' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
                      : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  }`}
                >
                  {adminFeedback.msg}
                </motion.div>
              )}

              <div className="space-y-8">
                {/* Alterar Plano */}
                <section>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Simular Plano do Usuário</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['FREE', 'PRO', 'PREMIUM'].map((p) => (
                      <button
                        key={p}
                        onClick={() => handleAdminPlanChange(p as PlanType)}
                        disabled={adminActionLoading}
                        className={`py-3 rounded-xl font-bold text-sm transition-all border ${
                          planType === p 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg' 
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                <div className="h-px bg-gray-100 dark:bg-white/5" />

                {/* Push Update */}
                <section>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Notificar Atualização (Sistema)</label>
                  
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Versão da Atualização</p>
                      <input
                        type="text"
                        value={versionInput}
                        onChange={(e) => setVersionInput(e.target.value)}
                        placeholder="Ex: 1.0.2"
                        className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:border-red-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-2">Mensagem (opcional)</p>
                  <textarea
                    value={updateMsgInput}
                    onChange={(e) => setUpdateMsgInput(e.target.value)}
                    placeholder="Digite a mensagem da nova versão..."
                    className="w-full bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm text-black dark:text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all h-24 resize-none mb-4 shadow-inner"
                  />
                  <button
                    onClick={handleBroadcastUpdate}
                    disabled={adminActionLoading || !updateMsgInput.trim()}
                    className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    {adminActionLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" /> Enviar Notificação Push
                      </>
                    )}
                  </button>
                </section>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast 
        isVisible={toast.isVisible} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </div>
  );
}
