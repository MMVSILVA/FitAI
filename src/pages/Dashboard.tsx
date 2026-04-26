import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../store/userStore';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { UserRole, PlanType } from '../types';
import { 
  Dumbbell, Apple, Lock, Zap, ChevronRight, LogOut, Activity, Timer, 
  Play, Pause, X, TrendingUp, CheckCircle2, Calendar, Users, 
  Download, Loader2, Heart, Sparkles, Moon, Sun, Plus, Camera, Upload
} from 'lucide-react';
import { logoutFirebase } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { APP_VERSION } from '../constants';
import { Logo } from '../components/Logo';
import { ExerciseLibrary } from '../components/ExerciseLibrary';
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
  const [isLogging, setIsLogging] = useState(false);
  const [logSuccess, setLogSuccess] = useState(false);

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
    <div className="flex flex-col gap-4 py-6 border-b border-gray-200 dark:border-white/5 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors px-1 sm:px-2 rounded-xl w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
        <div className="flex-1 min-w-0 w-full">
          <p className="font-extrabold text-2xl sm:text-3xl text-black dark:text-white tracking-tight break-words">{translateExerciseName(exercise.name)}</p>
          {exercise.englishName && (
            <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium italic break-words">{exercise.englishName}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5 min-w-0">
            {exercise.group && (
              <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-500/20 whitespace-nowrap">
                {exercise.group}
              </span>
            )}
            {exercise.equipment && (
              <span className="text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-blue-500/20 whitespace-nowrap">
                {exercise.equipment}
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-gray-500 bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-full uppercase tracking-widest shrink-0 self-start sm:self-center">
          {exercise.rest} descanso
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 items-start w-full">
        {/* Info e Instruções */}
        <div className="space-y-4 w-full">
          <div className="flex flex-col gap-3 w-full">
            <div className="bg-purple-600/10 border border-purple-500/20 px-3 py-2 rounded-lg flex flex-col justify-center w-full">
              <p className="text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-tighter mb-0.5">Séries x Repetições</p>
              <p className="text-sm sm:text-lg font-black text-black dark:text-white leading-none">{exercise.sets} x {exercise.reps}</p>
            </div>
            
            <div className="bg-purple-600/5 dark:bg-zinc-900/50 border border-purple-500/10 dark:border-white/10 px-3 py-2 rounded-xl flex items-center gap-2 sm:gap-3 w-full hover:border-purple-500/30 transition-all group/weight">
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[9px] sm:text-[10px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest mb-0.5 opacity-60">Sua Carga</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={exercise.weight || ''} 
                    onChange={(e) => updateExerciseWeight(dayIdx, exerciseIdx, e.target.value)}
                    placeholder="Ex: 10kg"
                    className="bg-transparent border-none p-0 text-sm sm:text-xl font-black text-black dark:text-white w-full focus:ring-0 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-700 min-w-0"
                  />
                  <div className="flex items-center justify-center p-1 bg-purple-500/10 rounded-lg group-hover/weight:scale-110 transition-transform shrink-0">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
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
                  {isLogging ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {exercise.technicalDescription && (
            <div className="p-3 sm:p-4 bg-gray-100 dark:bg-zinc-900/50 border border-gray-200 dark:border-white/5 rounded-2xl relative overflow-hidden group w-full">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 opacity-50" />
              <p className="text-[11px] sm:text-xs font-black text-purple-600 dark:text-purple-500 uppercase tracking-[0.1em] sm:tracking-[0.2em] mb-2 flex items-center gap-1.5 overflow-hidden whitespace-nowrap">
                <Activity className="w-3.5 h-3.5" /> Execução Técnica
              </p>
              <p className="text-[14px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-semibold italic break-words">
                "{exercise.technicalDescription}"
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {exercise.tips && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-purple-500/20 transition-colors">
                <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">Dica</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.tips}</p>
              </div>
            )}
            {exercise.breathing && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-blue-500/20 transition-colors">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Respiração</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.breathing}</p>
              </div>
            )}
            {exercise.cadence && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-3 rounded-xl border border-gray-200 dark:border-white/5 hover:border-green-500/20 transition-colors">
                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1.5">Cadência</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.cadence}</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onStartRest(restSeconds)}
            className="w-full bg-black text-white dark:bg-white dark:text-black hover:bg-purple-600 hover:text-white px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-black/10 group"
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
    user, profile, plan, planType, role, clients, linkedTrainerId, linkedNutritionistId, trialEndsAt, subscriptionEndsAt, isAdmin, authLoading,
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

  // Role-based redirection
  useEffect(() => {
    if (!user || authLoading) return;
    
    if (role === 'trainer' && !isAdmin) {
      navigate('/trainer');
    } else if (role === 'nutritionist' && !isAdmin) {
      navigate('/nutritionist');
    }
  }, [role, isAdmin, navigate, user, authLoading]);

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
  const [showRoutineSummary, setShowRoutineSummary] = useState(false);
  const [routineTips, setRoutineTips] = useState<string | null>(null);
  const [isGeneratingRoutineTips, setIsGeneratingRoutineTips] = useState(false);

  // Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    displayName: user?.displayName || '',
    phone: profile?.phone || '',
    photoURL: user?.photoURL || ''
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsUpdatingProfile(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const { updateProfile: updateFirebaseProfile } = await import('firebase/auth');
      const { auth } = await import('../firebase');
      
      if (auth.currentUser) {
        await updateFirebaseProfile(auth.currentUser, {
          displayName: editProfileForm.displayName,
          photoURL: editProfileForm.photoURL
        });
      }

      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editProfileForm.displayName,
        phone: editProfileForm.phone,
        photoURL: editProfileForm.photoURL,
        updatedAt: new Date().toISOString()
      });

      showToast('Perfil atualizado com sucesso!');
      setShowEditProfileModal(false);
      // Force refresh data would be ideal, but userStore might need a refresh method
      // For now, local state usually works if we sync it, but since we use useUser(),
      // we might need to wait for Firestore listener or refresh page.
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast('Erro ao atualizar perfil', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Nutri State
  const [showMacroDetails, setShowMacroDetails] = useState(false);
  const [showSupplementGuide, setShowSupplementGuide] = useState(false);

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
    <div className="min-h-screen w-full max-w-[100vw] bg-white dark:bg-black text-black dark:text-white font-sans selection:bg-purple-500/30 pb-20 overflow-x-hidden">
      <AnimatePresence>
        {user?.email === 'nangelicaalcantara@gmail.com' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-red-600/30 via-pink-600/30 to-red-600/30 border-b border-red-500/20 pt-6 pb-8 px-4 sm:px-6 text-center overflow-hidden relative"
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <Logo className="w-8 h-8 sm:w-12 sm:h-12 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)] shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-black dark:text-white truncate">
                <span className="text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.6)]">Fit</span>
                <span className="text-[#a855f7] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">AI</span>
              </h1>
              <div className="flex items-center gap-1 sm:gap-2">
                <div className="flex flex-col">
                  <p className="text-[8px] sm:text-xs text-purple-600 dark:text-purple-400 font-medium tracking-wider uppercase truncate max-w-[80px] sm:max-w-none">
                    {isAdmin ? 'ADMIN' : planType}
                  </p>
                  {isFree && trialEndsAt && !isTrialExpired && (
                    <p className="text-[7px] sm:text-[9px] text-orange-500 font-black uppercase tracking-widest mt-0.5">
                      {Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} dias restantes
                    </p>
                  )}
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminModal(true)}
                    className="bg-red-600 hover:bg-red-500 text-white text-[8px] sm:text-[10px] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-red-600/20 transition-all border border-red-500/50"
                  >
                    <Users className="w-2 sm:w-3 h-2 sm:h-3" /> <span className="hidden xs:inline">Admin</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden xs:flex flex-col items-end">
              <p className="text-[11px] sm:text-xs font-black text-black dark:text-white uppercase tracking-wider truncate max-w-[120px] leading-tight">
                {user?.displayName || 'Usuário'}
              </p>
              <p className="text-[9px] sm:text-[10px] text-gray-500 font-bold leading-tight">
                Ver Perfil
              </p>
            </div>

            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || 'User'} 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-purple-500/50 cursor-pointer hover:scale-105 transition-all shadow-lg shadow-purple-500/20"
                onClick={() => {
                  setEditProfileForm({
                    displayName: user?.displayName || '',
                    phone: profile?.phone || '',
                    photoURL: user?.photoURL || ''
                  });
                  setShowEditProfileModal(true);
                }}
              />
            ) : (
              <div 
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-600/10 flex items-center justify-center border-2 border-purple-500/30 text-purple-600 dark:text-purple-400 font-black cursor-pointer hover:scale-105 transition-all text-sm sm:text-lg"
                onClick={() => {
                  setEditProfileForm({
                    displayName: user?.displayName || '',
                    phone: profile?.phone || '',
                    photoURL: user?.photoURL || ''
                  });
                  setShowEditProfileModal(true);
                }}
              >
                {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <button 
              onClick={handleLogout} 
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all font-bold text-[10px] sm:text-sm shrink-0"
              title="Sair da conta"
            >
              <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
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

      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-8 overflow-x-hidden">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Seu plano está pronto.</h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium">
              Objetivos: <span className="text-purple-600 dark:text-purple-400 font-bold">{Array.isArray(profile.objective) ? profile.objective.join(', ') : profile.objective}</span> • 
              Nível: <span className="text-black dark:text-white font-bold">{profile.fitnessLevel}</span>
            </p>
          </div>
          <button 
            onClick={() => navigate('/onboarding')}
            className="self-start sm:self-auto text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-purple-500 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-3 h-3" /> Refazer Plano
          </button>
        </div>

        {/* Trial Info Banner */}
        {isFree && trialEndsAt && !isTrialExpired && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 sm:p-6 bg-gradient-to-br from-orange-500/10 to-purple-600/10 border border-orange-500/20 rounded-3xl relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Sparkles className="w-24 h-24 text-orange-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <div className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest leading-none">Free Trial</div>
                   <p className="text-xs text-orange-600 dark:text-orange-400 font-black uppercase tracking-widest">Teste Gratuito Ativo</p>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-black dark:text-white">Dê o próximo passo na sua evolução!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl font-medium">
                  Seu acesso começou em <span className="font-bold text-black dark:text-white">
                    {new Date(new Date(trialEndsAt).getTime() - (7 * 24 * 60 * 60 * 1000)).toLocaleDateString('pt-BR')}
                  </span> e termina em <span className="font-bold text-black dark:text-white">
                    {new Date(trialEndsAt).toLocaleDateString('pt-BR')}
                  </span>.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-bold italic mt-2">
                  * Garanta sua evolução contínua e não perca o acesso aos seus planos exclusivos.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                <div className="text-center bg-white dark:bg-black/40 border border-orange-500/20 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl shadow-xl min-w-[100px] sm:min-w-[120px]">
                   <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 leading-none">Faltam apenas</p>
                   <p className="text-4xl font-black text-black dark:text-white leading-none">
                     {Math.ceil((new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} 
                     <span className="text-sm ml-1">dias</span>
                   </p>
                </div>
                <Link to="/checkout?plan=PREMIUM" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95 group/btn">
                   Fidelizar Agora <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide -mx-3 px-3">
          <button 
            onClick={() => setActiveTab('workout')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'workout' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />
            Treino
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'library' ? 'bg-zinc-700 text-white border border-white/20 shadow-xl' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            Biblioteca
          </button>
          <button 
            onClick={() => setActiveTab('diet')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'diet' ? 'bg-green-500 text-black shadow-xl shadow-green-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className="w-5 h-5 sm:w-6 sm:h-6" />
            Dieta
          </button>
          <button 
            onClick={() => setActiveTab('evolution')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'evolution' 
                ? (isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-blue-500 text-white shadow-xl shadow-blue-500/20') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Evolução
            {(isFree || isBlocked) && <Lock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-600" />}
          </button>
          <button 
            onClick={() => setActiveTab('routine')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'routine' 
                ? (isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-orange-500 text-white shadow-xl shadow-orange-500/20') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Calendar className={`w-5 h-5 sm:w-6 sm:h-6 ${isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Rotina
            {(isFree || isBlocked) && <Lock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-600" />}
          </button>
          
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'personal' 
                ? (planType === 'PRO' || isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-purple-900 border border-purple-500 text-white shadow-xl') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${planType === 'PRO' || isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Personal
            {(planType === 'PRO' || isFree || isBlocked) && <Lock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-600" />}
          </button>
          <button 
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'nutrition' 
              ? (planType === 'PRO' || isFree || isBlocked ? 'bg-zinc-800 text-gray-500 border border-white/5' : 'bg-green-900 border border-green-500 text-white shadow-xl') 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className={`w-5 h-5 sm:w-6 sm:h-6 ${planType === 'PRO' || isFree || isBlocked ? 'text-gray-600' : ''}`} />
            Nutri
            {(planType === 'PRO' || isFree || isBlocked) && <Lock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-600" />}
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full relative overflow-x-hidden"
        >
          {activeTab === 'routine' && (
            <div className="space-y-8 relative">
              {isBlocked ? (
                <Paywall feature="Rotina Diária" type="expired" />
              ) : isFree ? (
                <Paywall feature="Rotina Diária" type="premium" />
              ) : null}
              <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8">
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
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => {
                        setRoutineSuccess(true);
                        setRoutineData({ sleep: '', water: '', stress: '' });
                        setTimeout(() => setRoutineSuccess(false), 3000);
                      }}
                      className="flex-1 bg-orange-500 text-white p-4 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                    >
                      Salvar Rotina
                    </button>
                    {planType === 'PREMIUM' && (
                      <button 
                        onClick={() => setShowRoutineSummary(true)}
                        className="flex-1 bg-white dark:bg-zinc-900 border border-orange-500/30 text-orange-600 dark:text-orange-400 p-4 rounded-xl font-bold hover:bg-orange-50/50 dark:hover:bg-orange-500/10 transition-colors"
                      >
                        Resumo da Rotina
                      </button>
                    )}
                  </div>
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

                  <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8">
                    <ProgressComparison />
                  </div>

                  <div className="bg-red-500/5 dark:bg-red-900/10 border border-red-500/20 rounded-3xl p-4 sm:p-8">
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
            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8">
              <ExerciseLibrary />
            </div>
          )}

          {activeTab === 'workout' && (
            <div className="space-y-6 sm:space-y-8 relative w-full overflow-x-hidden">
              {isBlocked && <Paywall feature="Treinos" type="expired" />}
              <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-3 sm:p-8 overflow-hidden">
                <h3 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2 px-1">
                  <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Rotina Semanal ({profile.daysPerWeek} dias)
                </h3>
                
                <div className="grid gap-4">
                  {plan.days.map((day, idx) => (
                    <div key={`day-${idx}-${day.day}`} className="bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-2xl p-3 sm:p-6 hover:border-purple-500/30 transition-colors shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h4 className="text-lg font-bold text-purple-600 dark:text-purple-400 shrink-0">{day.day}</h4>
                        <span className="text-sm font-medium bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full text-gray-600 dark:text-white break-words max-w-full">{day.focus}</span>
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
                <div className="relative overflow-hidden rounded-3xl bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 p-4 sm:p-8">
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
                  <p className="text-3xl font-black text-black dark:text-white">{(plan?.diet?.calories || '---').toString().replace(/kcal/i, '')}</p>
                  <p className="text-xs text-gray-500 mt-1">kcal/dia</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Proteína</p>
                  <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{(plan?.diet?.macros?.protein || '0').toString().replace(/g/g, '')}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Carboidratos</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400">{(plan?.diet?.macros?.carbs || '0').toString().replace(/g/g, '')}g</p>
                </div>
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Gorduras</p>
                  <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">{(plan?.diet?.macros?.fat || '0').toString().replace(/g/g, '')}g</p>
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
                              <h4 className="text-xl font-black text-green-600 dark:text-green-400">{meal.name}</h4>
                              <span className="text-sm font-bold bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">{meal.time}</span>
                            </div>
                            <ul className="space-y-3">
                              {meal.foods?.map((food, i) => (
                                <li key={i} className="flex items-start gap-2 text-base text-gray-700 dark:text-white font-medium">
                                  <span className="text-green-600 dark:text-green-500 mt-1.5">•</span>
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
                    className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 p-6 rounded-2xl text-center shadow-sm cursor-pointer hover:border-green-500/30 transition-all group"
                    onClick={() => {
                      if (planType === 'PREMIUM') {
                        setShowSupplementGuide(true);
                      }
                      setActiveTab('diet');
                      setTimeout(() => {
                        const el = document.getElementById('diet-meals');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 500);
                    }}
                  >
                    <Apple className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform" />
                    <p className="text-lg font-bold text-black dark:text-white">Base Alimentar</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                      {planType === 'PREMIUM' ? 'Plano & Suplementos' : 'Ver Cardápio Completo'}
                    </p>
                  </div>
                  <div 
                    className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 p-6 rounded-2xl text-center shadow-sm cursor-pointer hover:border-blue-500/30 transition-all group"
                    onClick={() => {
                      if (planType === 'PREMIUM') {
                        setShowMacroDetails(true);
                      } else {
                        setActiveTab('diet');
                        setTimeout(() => {
                          const el = document.getElementById('diet-macros');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 500);
                      }
                    }}
                  >
                    <Activity className="w-10 h-10 mx-auto mb-3 text-blue-600 dark:text-blue-500 group-hover:scale-110 transition-transform" />
                    <p className="text-lg font-bold text-black dark:text-white">Macros Diários</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                      {planType === 'PREMIUM' ? 'Resumo Estratégico' : 'Resumo Nutricional'}
                    </p>
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
      <footer className="mt-12 border-t border-gray-200 dark:border-white/10 py-12 px-4 flex flex-col items-center gap-3 text-gray-500 text-sm">
        <p className="font-bold tracking-tight">© 2026 FitAI. Desenvolvido por NVM Project Management</p>
        <p className="font-mono bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded border border-gray-200 dark:border-white/5 uppercase tracking-widest text-xs">Versão {APP_VERSION}</p>
      </footer>

      {/* Premium Nutri Modals */}
      <AnimatePresence>
        {showMacroDetails && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMacroDetails(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-[2rem] p-8 relative overflow-hidden"
            >
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Activity className="w-6 h-6 text-blue-500" /> Resumo Estratégico
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Proteína</p>
                    <p className="text-xl font-black text-purple-400">{plan.diet?.macros?.protein}g</p>
                    <p className="text-[9px] text-gray-600 mt-1">Escrutínio: {Math.round((parseInt(plan.diet?.macros?.protein) * 4 / parseInt(plan.diet?.calories)) * 100)}% das kcal</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Carbos</p>
                    <p className="text-xl font-black text-green-400">{plan.diet?.macros?.carbs}g</p>
                    <p className="text-[9px] text-gray-600 mt-1">Escrutínio: {Math.round((parseInt(plan.diet?.macros?.carbs) * 4 / parseInt(plan.diet?.calories)) * 100)}% das kcal</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl text-center border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Gordura</p>
                    <p className="text-xl font-black text-yellow-400">{plan.diet?.macros?.fat}g</p>
                    <p className="text-[9px] text-gray-600 mt-1">Escrutínio: {Math.round((parseInt(plan.diet?.macros?.fat) * 9 / parseInt(plan.diet?.calories)) * 100)}% das kcal</p>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/20 p-5 rounded-2xl">
                  <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Diretriz da IA</p>
                  <p className="text-sm text-gray-300 leading-relaxed italic">
                    "Baseado no seu perfil de {profile.fitnessLevel}, mantemos uma ingestão de proteína de {(parseInt(plan.diet?.macros?.protein) / profile.weight).toFixed(1)}g/kg para garantir a manutenção da massa magra enquanto otimizamos o metabolismo."
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowMacroDetails(false)}
                className="w-full mt-8 bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
              >
                Entendi
              </button>
            </motion.div>
          </div>
        )}

        {showSupplementGuide && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSupplementGuide(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-xl rounded-[2rem] p-8 relative overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-orange-500" /> Base Alimentar & Suplementos
              </h3>
              
              <div className="space-y-8">
                {/* Diet Base Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <Apple className="w-4 h-4" /> Plano Alimentar Base
                  </h4>
                  <div className="space-y-3">
                    {plan.diet?.meals?.map((meal: any, idx: number) => (
                      <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-bold text-green-500 text-sm">{meal.name}</p>
                          <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{meal.time}</span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed truncate">{meal.foods.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/10" />

                {/* Supplements Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Guia de Suplementos
                  </h4>
                  <div className="space-y-4">
                    {plan.diet?.recommendations?.map((rec: string, i: number) => {
                      const parts = rec.split(':');
                      const title = parts[0];
                      const desc = parts.slice(1).join(':');
                      
                      return (
                        <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-orange-500/30 transition-colors">
                          <h4 className="font-black text-orange-500 text-sm uppercase mb-2">{title}</h4>
                          <p className="text-sm text-gray-300 leading-relaxed font-medium">
                            {desc || rec}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Aviso Profissional</p>
                  <p className="text-[11px] text-gray-400 italic">As dosagens são sugestões baseadas em protocolos clínicos. Consulte sempre um médico ou nutricionista antes de iniciar qualquer suplementação.</p>
                </div>
              </div>

              <button 
                onClick={() => setShowSupplementGuide(false)}
                className="w-full mt-8 bg-orange-500 text-white font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
              >
                Voltar
              </button>
            </motion.div>
          </div>
        )}

        {showRoutineSummary && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRoutineSummary(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-[2rem] p-8 relative overflow-hidden"
            >
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-orange-500" /> Resumo da Rotina
              </h3>
              
              <div className="space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Métricas Consolidadas</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Sono Médio</p>
                      <p className="text-xl font-bold">7.2h</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase">Hidratação</p>
                      <p className="text-xl font-bold">2.4L</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs font-black text-orange-500 uppercase tracking-widest">Otimização por IA</p>
                  <button 
                    onClick={async () => {
                      setIsGeneratingRoutineTips(true);
                      // Simulate AI call
                      setTimeout(() => {
                        setRoutineTips("Com base no seu nível de estresse (4) e sono (7h), sua recuperação está em 85%. Sugiro aumentar a carga no treino de amanhã em 2kg nos exercícios multiarticulares e focar em 3L de água hoje para compensar o calor.");
                        setIsGeneratingRoutineTips(false);
                      }, 1500);
                    }}
                    className="w-full bg-orange-500/10 border border-orange-500/30 text-orange-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {isGeneratingRoutineTips ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Solicitar Dica de Otimização
                  </button>

                  {routineTips && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-orange-500/5 border border-orange-500/20 p-4 rounded-xl italic text-sm text-gray-400 leading-relaxed"
                    >
                      "{routineTips}"
                    </motion.div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setShowRoutineSummary(false)}
                className="w-full mt-8 bg-white text-black font-black py-4 rounded-xl uppercase tracking-widest text-xs hover:bg-gray-200 transition-all"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}

        {showEditProfileModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditProfileModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 relative overflow-hidden"
            >
              <h3 className="text-3xl font-black mb-6 flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-500" /> Editar Perfil
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text"
                    value={editProfileForm.displayName}
                    onChange={(e) => setEditProfileForm({...editProfileForm, displayName: e.target.value})}
                    placeholder="Seu nome"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">E-mail (Login Principal)</label>
                  <input 
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-gray-500 font-bold opacity-50 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input 
                    type="tel"
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm({...editProfileForm, phone: e.target.value})}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Sua Foto</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                      {editProfileForm.photoURL ? (
                        <img src={editProfileForm.photoURL} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <label className="flex-1">
                      <div className="bg-purple-600/10 border border-dashed border-purple-500/30 hover:bg-purple-600/20 transition-all rounded-2xl p-4 text-center cursor-pointer group">
                        <Upload className="w-5 h-5 text-purple-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest">Fazer Upload</p>
                        <input 
                          type="file" 
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditProfileForm({ ...editProfileForm, photoURL: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">URL da Foto (Opcional)</label>
                  <input 
                    type="url"
                    value={editProfileForm.photoURL}
                    onChange={(e) => setEditProfileForm({...editProfileForm, photoURL: e.target.value})}
                    placeholder="https://exemplo.com/suafoto.jpg"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-bold focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="flex gap-4 mt-8">
                  <button 
                    type="button"
                    onClick={() => setShowEditProfileModal(false)}
                    className="flex-1 bg-white/5 border border-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="flex-1 bg-purple-600 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                  >
                    {isUpdatingProfile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>Salvar Alterações</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
