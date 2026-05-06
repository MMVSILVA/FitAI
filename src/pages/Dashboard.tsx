import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../store/userStore';
import { Navigate, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserRole, PlanType, UserProfile, WorkoutPlan } from '../types';
import { 
  Dumbbell, Apple, Lock, Zap, ChevronRight, LogOut, Activity, Timer, 
  Play, Pause, X, TrendingUp, CheckCircle2, Calendar, Users, MessageCircle,
  Download, Loader2, Heart, Sparkles, Moon, Sun, Plus, Camera, Upload, Send, UserPlus, ArrowLeft,
  History, Weight, Trophy, MapPin, Smile, Ghost, Star, Image as ImageIcon, Paperclip, MoreVertical, Heart as HeartIcon, MessageSquare, Save, Copy, Flame, Award, Target
} from 'lucide-react';
import { logoutFirebase } from '../firebase';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area
} from 'recharts';
import { APP_VERSION } from '../constants';
import { Logo } from '../components/Logo';
import { HomeView } from '../components/HomeView';
import { ExerciseLibrary } from '../components/ExerciseLibrary';
import { ProgressComparison } from '../components/ProgressComparison';
import { Toast, ToastType } from '../components/Toast';
import { ProfessionalProfileView } from '../components/ProfessionalProfileView';
import { Ranking } from '../components/Ranking';
import { GymLocator } from '../components/GymLocator';
import { ChatView } from '../components/ChatView';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';


import { translate, translateExerciseName, ptToEnSearch } from '../lib/exerciseTranslations';

function ExerciseRow({ 
  exercise, 
  dayIdx, 
  exerciseIdx, 
  restSeconds, 
  onStartRest,
  checked,
  onToggleCheck
}: { 
  exercise: any; 
  dayIdx: number; 
  exerciseIdx: number; 
  restSeconds: number; 
  onStartRest: (s: number) => void;
  checked?: boolean;
  onToggleCheck?: (id: string) => void;
  key?: any;
}) {
  const { updateExerciseWeight, addExerciseProgress, planType } = useUser();
  const isPremiumUser = planType === 'PREMIUM' || planType === 'PROFISSIONAL';
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
        <div className="flex-1 min-w-0 w-full flex items-center gap-4">
          <button 
            onClick={() => onToggleCheck?.(`${dayIdx}-${exerciseIdx}`)}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
              checked 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/40 ring-4 ring-green-500/20' 
                : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            <CheckCircle2 className={`w-6 h-6 ${checked ? 'scale-110' : 'scale-90'}`} />
          </button>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className={`font-extrabold text-2xl sm:text-3xl tracking-tight break-words transition-all ${checked ? 'opacity-40 line-through text-gray-500' : 'text-black dark:text-white'}`}>
              {translateExerciseName(exercise.name)}
            </p>
            {exercise.englishName && (
              <p className="text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium italic break-words">{exercise.englishName}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 min-w-0">
              {exercise.group && (
                <span className="text-[9px] bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider border border-purple-500/20 whitespace-nowrap">
                  {exercise.group}
                </span>
              )}
            </div>
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
              
              {isPremiumUser && (
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
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-purple-500/20 transition-colors">
                <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1.5">Dica</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.tips}</p>
              </div>
            )}
            {exercise.breathing && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-blue-500/20 transition-colors">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">Respiração</p>
                <p className="text-xs text-gray-500 leading-snug">{exercise.breathing}</p>
              </div>
            )}
            {exercise.cadence && (
              <div className="bg-gray-100 dark:bg-zinc-900/40 p-4 rounded-xl border border-gray-200 dark:border-white/5 hover:border-green-500/20 transition-colors">
                <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest mb-1.5">Cadência</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">{exercise.cadence}</p>
                {(() => {
                  const parts = (exercise.cadence || '').split(':');
                  if (parts.length === 3) {
                    return <p className="text-[10px] text-gray-500 leading-tight mt-1">
                      <span className="text-purple-600 dark:text-purple-400 font-black">{parts[0]}s</span> desc | <span className="text-purple-600 dark:text-purple-400 font-black">{parts[1]}s</span> isom | <span className="text-purple-600 dark:text-purple-400 font-black">{parts[2]}s</span> sub
                    </p>;
                  }
                  if (parts.length === 4) {
                    return <p className="text-[10px] text-gray-500 leading-tight mt-1">
                      <span className="text-purple-600 dark:text-purple-400 font-black">{parts[0]}s</span> desc | <span className="text-purple-600 dark:text-purple-400 font-black">{parts[1]}s</span> isom | <span className="text-purple-600 dark:text-purple-400 font-black">{parts[2]}s</span> sub | <span className="text-purple-600 dark:text-purple-400 font-black">{parts[3]}s</span> isom
                    </p>;
                  }
                  return null;
                })()}
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
    user, profile: myProfile, plan: myPlan, planType, role, clients, linkedTrainerId, linkedNutritionistId, trialEndsAt, subscriptionEndsAt, isAdmin, authLoading,
    logout, calculateIMC, updateExerciseWeight, resetAccount, setPlan, setRole, linkClient, linkNutritionist, updatePlanForUser, setRoleForUser, setPlanTypeForUser,
    toggleTheme, theme, toggleMealCheck, updateRealMealNotes, toggleWorkoutDayCheck, updateRealWorkoutNotes,
    addWorkoutReport, updateWorkoutReport, deleteWorkoutReport, doCheckIn
  } = useUser();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const viewingAsUserId = searchParams.get('viewAs');
  const initialTab = (searchParams.get('tab') as any) || 'workout';
  const paymentSuccess = searchParams.get('success') === 'true';

  useEffect(() => {
    if (paymentSuccess) {
      setToast({ show: true, message: '🎉 PAGAMENTO CONFIRMADO! Bem-vindo à elite do FitAI.', type: 'success' });
      // Remove the success param from URL without refreshing
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
    }
  }, [paymentSuccess, searchParams, setSearchParams]);

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab);
      return newParams;
    });
  };
  const [viewedProfile, setViewedProfile] = useState<UserProfile | null>(null);
  const [viewedPlan, setViewedPlan] = useState<WorkoutPlan | null>(null);
  const [isViewingAs, setIsViewingAs] = useState(false);

  useEffect(() => {
    if (viewingAsUserId && user && myProfile) {
      let unsubscribe: () => void;
      
      const setupStudentListener = async () => {
        const { doc, onSnapshot } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        
        unsubscribe = onSnapshot(doc(db, 'users', viewingAsUserId), (studentDoc) => {
          if (studentDoc.exists()) {
            const data = studentDoc.data();
            const isAuthorized = isAdmin || 
                               data.linkedTrainerId === user.uid || 
                               data.linkedNutritionistId === user.uid ||
                               myProfile.uid === viewingAsUserId;

            if (isAuthorized) {
              const profileData = { ...data, ...(data.profile || {}) };
              setViewedProfile({ ...profileData, uid: studentDoc.id, email: data.email } as any); 
              setViewedPlan(data.plan || profileData.plan || null);
              setIsViewingAs(true);
            } else {
              setIsViewingAs(false);
            }
          }
        }, (error) => {
          console.error("Error watching student data:", error);
          setIsViewingAs(false);
        });
      };
      
      setupStudentListener();
      return () => unsubscribe?.();
    } else {
      setIsViewingAs(false);
      setViewedProfile(null);
      setViewedPlan(null);
    }
  }, [viewingAsUserId, user, isAdmin, myProfile?.uid]);

  const profile = isViewingAs ? viewedProfile : myProfile;
  const plan = isViewingAs ? (viewedPlan || (viewedProfile as any)?.plan) : myPlan;

  const isFree = planType === 'FREE';
  const isTrialExpired = isFree && trialEndsAt && new Date() >= new Date(trialEndsAt);
  const isSubscriptionExpired = (planType === 'PRO' || planType === 'PREMIUM' || planType === 'PROFISSIONAL') && subscriptionEndsAt && new Date() >= new Date(subscriptionEndsAt);
  const isBlocked = isTrialExpired || isSubscriptionExpired;
  const isPremiumUser = planType !== 'FREE';

  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'evolution' | 'routine' | 'personal' | 'nutrition' | 'library' | 'chat' | 'admin' | 'ranking' | 'gyms'>(initialTab);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Load completed exercises from profile
  useEffect(() => {
    if (profile?.completedExercises && Array.isArray(profile.completedExercises)) {
      setCompletedExercises(new Set(profile.completedExercises));
    } else {
      setCompletedExercises(new Set());
    }
  }, [profile?.uid, profile?.completedExercises]);

  const handleToggleExercise = async (id: string) => {
    if (isViewingAs) return; // Professionals shouldn't check student exercises
    
    const next = new Set(completedExercises);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    
    setCompletedExercises(next);
    
    if (user) {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        await updateDoc(doc(db, 'users', user.uid), {
          completedExercises: Array.from(next),
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error saving completed exercises:", err);
      }
    }
  };
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ message: string; days: number }>({ message: '', days: 0 });

  const handleCheckInNow = async () => {
    if (isViewingAs) return;
    const res = await doCheckIn();
    if (res && res.success) {
      const messages = [
        "Incrível! Você está no caminho certo! 💪",
        "Check-in concluído com sucesso! ⚡",
        "Ótimo treino! Mantenha essa energia! 🔥",
        "Você é imparável! Continue assim! 🚀",
        "Foco total! Mais um dia conquistado! 🎯"
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setCelebrationData({ 
        message: res.isThirdDay ? "🎉 EXTRAORDINÁRIO! 3 dias seguidos nesta semana! Você é uma lenda." : msg, 
        days: res.totalDays || profile.streak || 0
      });
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  const handleToggleWorkoutDay = async (idx: number) => {
    if (isViewingAs) return;
    const res = await toggleWorkoutDayCheck(idx);
    if (res && res.success) {
      const messages = [
        "Incrível! Treino do dia concluído com maestria! 💪",
        "Missão cumprida! Você está cada dia mais forte! ⚡",
        "Foco total! Esse bônus de pontos é seu! 🔥",
        "Evolução constante! Continue com essa disciplina! 🚀",
        "Sensacional! Corpo e mente em sintonia! 🎯"
      ];
      const msg = messages[Math.floor(Math.random() * messages.length)];
      setCelebrationData({ 
        message: res.isThirdDay ? "🎉 LENDÁRIO! 3 dias de treino nesta semana! Foco inabalável." : msg, 
        days: res.totalDays || profile.streak || 0
      });
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 5000);
    }
  };

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ isVisible: true, message, type });
  };

  const [enrichedClients, setEnrichedClients] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Load clients if current user is professional
  useEffect(() => {
    if (!user || (role !== 'trainer' && role !== 'nutritionist' && !isAdmin)) return;

    async function fetchClients() {
      setLoadingClients(true);
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      try {
        const q = query(
          collection(db, 'users'),
          where(role === 'trainer' ? 'linkedTrainerId' : 'linkedNutritionistId', '==', user!.uid)
        );
        
        const snap = await getDocs(q);
        let list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // FORCE INCLUDE ADMIN IF NOT PRESENT
        const adminEmail = 'vinidoctor@gmail.com'.toLowerCase();
        if (!list.some((c: any) => c.email?.toLowerCase() === adminEmail) && user?.email?.toLowerCase() !== adminEmail) {
          const qAdmin = query(collection(db, 'users'), where('email', '==', adminEmail));
          const adminSnap = await getDocs(qAdmin);
          if (!adminSnap.empty) {
            list.push({ id: adminSnap.docs[0].id, ...adminSnap.docs[0].data() });
          }
        }

        setEnrichedClients(list);
      } catch (err) {
        console.error("Error fetching enriched clients:", err);
      } finally {
        setLoadingClients(false);
      }
    }
    fetchClients();
  }, [user, role, isAdmin, clients]);

  const navigate = useNavigate();

  // Online Status Check Helper
  const isOnline = (lastSeen: string) => {
    if (!lastSeen) return false;
    const lastDate = new Date(lastSeen).getTime();
    const now = new Date().getTime();
    return (now - lastDate) < 180000; // 3 minutes buffer
  };

  // Role-based redirection is now handled in Login.tsx
  // We allow everyone to go to /dashboard, then show tabs based on permissions
  useEffect(() => {
    if (!user || authLoading) return;

    // Auto-link professionals if missing
    const autoLink = async () => {
      // Find all pros first to pick one if needed
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const qPros = query(collection(db, 'users'), where('role', 'in', ['trainer', 'nutritionist']));
      const prosSnap = await getDocs(qPros);
      const allPros = prosSnap.docs.map(d => ({ id: d.id, email: d.data().email, role: d.data().role }));
      
      if (!linkedTrainerId) {
        const firstTrainer = allPros.find(p => p.role === 'trainer');
        if (firstTrainer) {
          console.log("Auto-assigning trainer:", firstTrainer.email);
          await linkClient(firstTrainer.email);
        }
      }
      
      if (!linkedNutritionistId) {
        const firstNutri = allPros.find(p => p.role === 'nutritionist');
        if (firstNutri) {
          console.log("Auto-assigning nutritionist:", firstNutri.email);
          await linkNutritionist(firstNutri.email);
        }
      }
    };

    if (!isViewingAs && user && (!linkedTrainerId || !linkedNutritionistId)) {
      autoLink();
    }
  }, [user, authLoading, linkedTrainerId, linkedNutritionistId, isViewingAs]);

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
  const [routineData, setRoutineData] = useState({ sleep: '', water: '', stress: '', humor: '', energy: '', dietAdherence: 'total' });
  const [routineSuccess, setRoutineSuccess] = useState(false);
  const [showRoutineSummary, setShowRoutineSummary] = useState(false);
  const [routineTips, setRoutineTips] = useState<string | null>(null);
  const [isGeneratingRoutineTips, setIsGeneratingRoutineTips] = useState(false);

  // Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    displayName: user?.displayName || '',
    phone: profile?.phone || '',
    photoURL: user?.photoURL || '',
    showInRanking: profile?.showInRanking ?? false
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
        showInRanking: editProfileForm.showInRanking,
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
  const [showProfessionalProfile, setShowProfessionalProfile] = useState<UserProfile | null>(null);
  
  // Chat States
  const [selectedProfessional, setSelectedProfessional] = useState<{id: string, name: string, role: string, photoURL?: string} | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [professionals, setProfessionals] = useState<any[]>([]);

  // Fetch linked professionals for chat
  useEffect(() => {
    async function fetchProfessionals() {
      if (!user) return;
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const linkedIds = [];
      if (linkedTrainerId) linkedIds.push(linkedTrainerId);
      if (linkedNutritionistId) linkedIds.push(linkedNutritionistId);
      
      if (linkedIds.length === 0) return;

      try {
        const q = query(collection(db, 'users'), where('uid', 'in', linkedIds));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({
          id: d.data().uid,
          name: d.data().displayName || d.data().email,
          role: d.data().role,
          photoURL: d.data().photoURL,
          lastSeen: d.data().lastSeen
        }));
        setProfessionals(data);
        if (data.length > 0 && !selectedProfessional) {
          setSelectedProfessional(data[0]);
        }
      } catch (err) {
        console.error("Error fetching professionals:", err);
      }
    }
    fetchProfessionals();
  }, [user, linkedTrainerId, linkedNutritionistId]);

  // Real-time Chat
  useEffect(() => {
    if (!user || !selectedProfessional) return;
    
    let unsubscribeChat: any;
    async function setupChat() {
      const { collection, query, where, onSnapshot, orderBy } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      unsubscribeChat = onSnapshot(collection(db, 'messages'), (snapshot) => {
        const msgs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as any))
          .filter(m => 
            (m.fromId === user.uid && m.toId === selectedProfessional.id) ||
            (m.fromId === selectedProfessional.id && m.toId === user.uid)
          )
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        setChatMessages(msgs);
      });
    }
    setupChat();
    return () => unsubscribeChat?.();
  }, [user, selectedProfessional]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProfessional || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await addDoc(collection(db, 'messages'), {
        fromId: user.uid,
        toId: selectedProfessional.id,
        participants: [user.uid, selectedProfessional.id],
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
  const [adminActionLoading, setAdminActionLoading] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState({ type: '', msg: '' });
  const [updateMsgInput, setUpdateMsgInput] = useState('Nova versão disponível com melhorias e correções!');
  const [versionInput, setVersionInput] = useState(APP_VERSION);
  const [adminStats, setAdminStats] = useState({ users: 0, trainers: 0, nutritionists: 0, loading: false });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [viewingUserHistory, setViewingUserHistory] = useState<any>(null);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  const [userProgress, setUserProgress] = useState<any[]>([]);

  const fetchAdminStats = async () => {
    if (!isAdmin) return;
    setAdminStats(prev => ({ ...prev, loading: true }));
    setAdminUsersLoading(true);
    try {
      const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const usersRef = collection(db, 'users');
      const snap = await getDocs(usersRef);
      
      const usersList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Check admins for ALL users (simplified client-side check for common admins)
      const masterAdmins = ['vinidoctor@gmail.com'];
      const enrichedUsers = usersList
        .map((u: any) => ({
          ...u,
          isAdmin: masterAdmins.includes(u.email?.toLowerCase().trim())
        }))
        .filter((u: any) => !u.isAdmin || u.email?.toLowerCase().trim() !== user?.email?.toLowerCase().trim());

      setAllUsers(enrichedUsers);

      setAdminStats({
        users: enrichedUsers.filter((u: any) => u.role === 'user' && !u.isAdmin).length,
        trainers: enrichedUsers.filter((u: any) => u.role === 'trainer' && !u.isAdmin).length,
        nutritionists: enrichedUsers.filter((u: any) => u.role === 'nutritionist' && !u.isAdmin).length,
        loading: false
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      setAdminStats(prev => ({ ...prev, loading: false }));
    } finally {
      setAdminUsersLoading(false);
    }
  };

  const fetchUserHistory = async (targetUser: any) => {
    setViewingUserHistory(targetUser);
    setUserHistoryLoading(true);
    setUserProgress([]);
    
    try {
      const { collection, query, where, getDocs, orderBy } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      
      const q = query(
        collection(db, 'exercise_progress'), 
        where('userId', '==', targetUser.id),
        orderBy('date', 'desc')
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUserProgress(data);
    } catch (error) {
      console.error("Error fetching user history:", error);
      showToast("Não foi possível carregar o histórico completo deste usuário.", "error");
    } finally {
      setUserHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showAdminModal || activeTab === 'admin') {
      fetchAdminStats();
    }
  }, [showAdminModal, activeTab]);

  const handleAdminPlanChange = async (newPlan: PlanType) => {
    if (!isAdmin || !user) return;
    setAdminActionLoading(true);
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      await updateDoc(doc(db, 'users', user.uid), {
        planType: newPlan,
        isPremium: newPlan === 'PREMIUM' || newPlan === 'PROFISSIONAL' || newPlan === 'PRO',
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
      
      const res = await generatePlan(customProfile, user?.uid || '');
      
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

  // Update online status
  useEffect(() => {
    if (!user) return;
    
    const updateLastSeen = async () => {
      try {
        const { doc, updateDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        await updateDoc(doc(db, 'users', user.uid), {
          lastSeen: new Date().toISOString()
        });
      } catch (err) {
        console.error("Error updating last seen:", err);
      }
    };

    updateLastSeen();
    const interval = setInterval(updateLastSeen, 60000); // Every minute
    return () => clearInterval(interval);
  }, [user]);

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
    const isSimulationExpired = (planType === 'PRO' || planType === 'PREMIUM' || planType === 'PROFISSIONAL') && subscriptionEndsAt && new Date() >= new Date(subscriptionEndsAt);
    
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

  const handleViewProfessional = async (profId: string | undefined) => {
    if (!profId) return;
    try {
      const profDoc = await getDoc(doc(db, 'users', profId));
      if (profDoc.exists()) {
        setShowProfessionalProfile({ uid: profDoc.id, ...profDoc.data() } as UserProfile);
      }
    } catch (error) {
      console.error("Error fetching professional profile:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-6 text-center">
        <div className="space-y-6 max-w-sm">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
            <div className="relative bg-white dark:bg-zinc-900 w-24 h-24 rounded-full flex items-center justify-center border-2 border-purple-500 shadow-xl">
              <Logo />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black italic tracking-tighter">PREPARANDO SEU AMBIENTE</h2>
            <p className="text-gray-500 font-medium text-sm">Carregando seus planos, métricas e evolução em tempo real...</p>
          </div>
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto opacity-50" />
        </div>
      </div>
    );
  }

  if (user && (!profile || !plan) && !isViewingAs) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const imcData = calculateIMC?.() || null;

  // Evolution chart data - ordering as requested (Current on left, then weeks)
  const chartData = [
    { name: 'ATUAL', peso: profile?.weight || 0, massa: (profile?.weight || 0) * 0.4 },
    { name: 'SEMANA 2', peso: (profile?.weight || 0) - 0.8, massa: (profile?.weight || 0) * 0.4 + 0.2 },
    { name: 'SEMANA 3', peso: (profile?.weight || 0) - 1.5, massa: (profile?.weight || 0) * 0.4 + 0.5 },
    { name: 'SEMANA 4', peso: (profile?.weight || 0) - 2.2, massa: (profile?.weight || 0) * 0.4 + 0.8 },
  ];

  const Paywall = ({ feature, type = 'pro' }: { feature: string; type?: 'pro' | 'premium' | 'expired' }) => {
    const isExpired = type === 'expired';
    
    return (
      <div className="absolute inset-0 backdrop-blur-xl bg-black/90 z-50 flex flex-col items-center justify-start p-8 sm:p-12 text-center overflow-y-auto pb-24 rounded-3xl">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-6 mt-12 ${isExpired ? 'bg-red-600/20' : 'bg-purple-600/20'}`}>
          <Lock className={`w-8 h-8 sm:w-10 sm:h-10 ${isExpired ? 'text-red-500' : 'text-purple-500'}`} />
        </div>
        <h4 className="text-2xl sm:text-4xl font-black mb-3 tracking-tighter">
          {isExpired ? (isSubscriptionExpired ? 'Sua assinatura expirou' : 'Seu período de teste acabou') : 'Recurso Bloqueado'}
        </h4>
        <p className="text-gray-400 max-w-lg mb-10 text-sm sm:text-lg font-medium leading-relaxed">
          {isExpired ? (
            isSubscriptionExpired 
              ? "Seus 30 dias de acesso premium chegaram ao fim. Renove sua assinatura para continuar usando todos os recursos."
              : "Para continuar acessando seus treinos, dietas e evolução, escolha um de nossos planos."
          ) : (
            <>Ative a assinatura <strong className="uppercase text-purple-400">{type}</strong> para liberar o recurso de <br/><span className="text-white text-xl sm:text-2xl mt-2 inline-block font-black tracking-tight">{feature}</span>.</>
          )}
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl text-left mb-12">
          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] flex flex-col shadow-2xl">
            <h5 className="text-xl font-black mb-1 text-white uppercase tracking-tight">Pro</h5>
            <p className="text-4xl font-black text-purple-400 mb-6">R$ 39,90<span className="text-sm font-medium text-gray-500 lowercase ml-1">/mês</span></p>
            <ul className="text-sm text-gray-400 space-y-3 mb-8 flex-1 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Treinos ilimitados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Dieta completa
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Evolução detalhada
              </li>
            </ul>
            <Link to="/checkout?plan=PRO" className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black transition-all text-center uppercase tracking-widest text-xs">
              Assinar Pro
            </Link>
          </div>

          <div className="bg-purple-900/10 border-2 border-purple-500 p-8 rounded-[2rem] flex flex-col relative text-left shadow-2xl shadow-purple-500/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white text-[10px] font-black uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
              Recomendado
            </div>
            <h5 className="text-xl font-black mb-1 text-white uppercase tracking-tight">Premium</h5>
            <p className="text-4xl font-black text-purple-400 mb-6">R$ 59,90<span className="text-sm font-medium text-gray-500 lowercase ml-1">/mês</span></p>
            <ul className="text-sm text-gray-400 space-y-3 mb-8 flex-1 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Tudo do Pro
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Chat 24h com Coach IA
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" /> Ajustes diários
              </li>
            </ul>
            <Link to="/checkout?plan=PREMIUM" className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-2xl font-black transition-all text-center uppercase tracking-widest text-xs shadow-xl shadow-purple-600/30">
              Assinar Premium
            </Link>
          </div>

          <div className="bg-zinc-900 border border-white/10 p-8 rounded-[2rem] flex flex-col shadow-2xl">
            <h5 className="text-xl font-black mb-1 text-white uppercase tracking-tight">Profissional</h5>
            <p className="text-4xl font-black text-green-400 mb-6">R$ 149,90<span className="text-sm font-medium text-gray-500 lowercase ml-1">/mês</span></p>
            <ul className="text-sm text-gray-400 space-y-3 mb-8 flex-1 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Tudo do Premium
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Gestão de Alunos (Trainer)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Suporte VIP
              </li>
            </ul>
            <Link to="/checkout?plan=PROFISSIONAL" className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black transition-all text-center uppercase tracking-widest text-xs">
              Assinar Profissional
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
      {isViewingAs && (
        <div className="bg-purple-600 text-white p-3 text-center text-xs font-black flex items-center justify-center gap-4 fixed top-0 left-0 w-full z-[100] shadow-xl">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="uppercase tracking-widest">MODO VISUALIZAÇÃO: {profile?.displayName || viewingAsUserId}</span>
          </div>
          <Link to="/dashboard" className="bg-white text-purple-600 px-3 py-1 rounded-full hover:bg-gray-100 transition-all font-bold">Encerrar</Link>
        </div>
      )}
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

      {/* Viewing As Banner */}
      {isViewingAs && (
        <div className="bg-purple-600 text-white py-2 px-4 flex justify-between items-center sticky top-0 z-[100] shadow-xl">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Users className="w-4 h-4" />
            VISÃO DO ALUNO: <span className="uppercase">{profile?.displayName || profile?.email}</span>
          </div>
          <button 
            onClick={() => navigate(role === 'trainer' ? '/trainer-dashboard' : role === 'nutritionist' ? '/nutritionist-dashboard' : '/dashboard')}
            className="bg-white/20 hover:bg-white/30 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest transition-all"
          >
            VOLTAR AO PAINEL
          </button>
        </div>
      )}

      {/* Header */}
      <header className={`sticky ${isViewingAs ? 'top-[44px]' : 'top-0'} z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10`}>
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
                    className="bg-red-600 hover:bg-red-500 text-white text-[9px] sm:text-[11px] px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl font-black uppercase tracking-tighter flex items-center gap-2 shadow-xl shadow-red-600/30 transition-all border border-red-500 animate-pulse"
                  >
                    <Zap className="w-3 h-3" /> <span className="hidden xs:inline">Admin Config</span>
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
        {/* User Hero Section (Inspired by Wellhub images) */}
        <div className="mb-12 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.9] text-black dark:text-white max-w-xl">
                  {profile?.displayName || user?.displayName || 'Usuário FitAI'}
                </h1>
                <div className="bg-purple-600/10 text-purple-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-500/20 shadow-sm self-start">
                   NÍVEL {profile.level || 1}
                </div>
              </div>
              <div className="inline-block bg-purple-600/10 dark:bg-purple-600/20 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 border border-purple-500/20">
                PLANO {profile.planType === 'FREE' ? 'BASIC' : profile.planType}+
              </div>
            </div>
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-20 h-20 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white dark:border-zinc-900 shadow-2xl"
              />
            ) : (
              <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-purple-600 text-white flex items-center justify-center text-4xl font-black border-4 border-white dark:border-zinc-900 shadow-2xl">
                {(profile.displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 sm:p-10 shadow-2xl shadow-black/5 border border-gray-100 dark:border-white/5 flex items-center justify-between group overflow-hidden relative"
            >
              <div className="relative z-10">
                <p className="text-6xl sm:text-7xl font-black text-black dark:text-white mb-2 leading-none">{profile.checkInDates?.length || 0}</p>
                <p className="text-gray-500 dark:text-gray-400 font-bold tracking-tight text-lg mb-6">Check-ins totais</p>
                
                {!isViewingAs && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCheckInNow}
                    disabled={profile.checkInDates?.includes(new Date().toISOString().split('T')[0])}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl flex items-center gap-2 ${
                      profile.checkInDates?.includes(new Date().toISOString().split('T')[0])
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20 cursor-default'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20'
                    }`}
                  >
                    {profile.checkInDates?.includes(new Date().toISOString().split('T')[0]) ? (
                      <><CheckCircle2 className="w-4 h-4" /> Realizado hoje</>
                    ) : (
                      <><Activity className="w-4 h-4" /> Confirmar Check-in</>
                    )}
                  </motion.button>
                )}
              </div>
              <div className="flex -space-x-6 relative z-10">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-600 rounded-full flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-2xl group-hover:translate-x-2 transition-transform">
                    <MapPin className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white/20" />
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-br from-purple-800 to-purple-950 rounded-[3rem] p-8 sm:p-10 shadow-2xl shadow-purple-950/20 border border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 transition-transform group-hover:scale-110">
                <Flame className="w-32 h-32 text-orange-400" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 leading-tight">
                  Sequência de <span className="text-orange-400">{profile.streak || 0}</span> dias
                </h3>
                <p className="text-white/80 font-bold mb-6 italic">
                  {profile.streak && profile.streak > 0 
                    ? (profile.streak >= 7 ? `${Math.floor(profile.streak/7)} semanas e ${profile.streak%7} dias` : "Mantendo o ritmo! 🔥")
                    : "Comece sua jornada hoje! 🚀"}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map(i => {
                    const isActive = (profile.streak || 0) % 7 >= i || ((profile.streak || 0) > 0 && (profile.streak || 0) % 7 === 0 && i <= 7);
                    return (
                      <div key={i} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border transition-all ${
                        isActive 
                          ? 'bg-orange-500/40 border-orange-400 text-white' 
                          : 'bg-white/10 border-white/10 text-white/30'
                      }`}>
                        <CheckCircle2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'scale-110' : 'opacity-20'}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
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
        <div className="flex gap-2 sm:gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar -mx-3 px-3">
          {isAdmin && (
            <button 
              onClick={() => handleTabChange('admin')}
              className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
                activeTab === 'admin' 
                ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
              }`}
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
              Painel ADM
            </button>
          )}
          <button 
            onClick={() => handleTabChange('workout')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'workout' ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />
            Treino
          </button>
          <button 
            onClick={() => handleTabChange('library')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'library' ? 'bg-zinc-700 text-white border border-white/20 shadow-xl' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
            Biblioteca
          </button>
          <button 
            onClick={() => handleTabChange('diet')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'diet' ? 'bg-green-500 text-black shadow-xl shadow-green-600/20' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Apple className="w-5 h-5 sm:w-6 sm:h-6" />
            Dieta
          </button>
          <button 
            onClick={() => handleTabChange('evolution')}
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
            onClick={() => handleTabChange('routine')}
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
          
          {/* Personal Tab */}
          {(isAdmin || role === 'trainer' || linkedTrainerId) && (
            <button 
              onClick={() => handleTabChange('personal')}
              className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
                activeTab === 'personal' 
                  ? (isPremiumUser ? 'bg-purple-900 border border-purple-500 text-white shadow-xl' : 'bg-zinc-800 text-gray-500 border border-white/5') 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${isPremiumUser ? '' : 'text-gray-600'}`} />
              {isAdmin || role === 'trainer' ? 'Gestão Trainer' : 'Personal'}
              {!isPremiumUser && <Lock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-600" />}
            </button>
          )}

          {/* Nutritionist Tab */}
          {(isAdmin || role === 'nutritionist' || linkedNutritionistId) && (
            <button 
              onClick={() => handleTabChange('nutrition')}
              className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
                activeTab === 'nutrition' 
                ? (isPremiumUser ? 'bg-green-900 border border-green-500 text-white shadow-xl' : 'bg-zinc-800 text-gray-500 border border-white/5') 
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <Apple className={`w-5 h-5 sm:w-6 sm:h-6 ${isPremiumUser ? '' : 'text-gray-600'}`} />
              {isAdmin || role === 'nutritionist' ? 'Gestão Nutri' : 'Nutri'}
              {!isPremiumUser && <Lock className="w-3 h-3 sm:w-4 sm:h-4 ml-1 text-gray-600" />}
            </button>
          )}
          <button 
            onClick={() => handleTabChange('chat')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'chat' 
              ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/20' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            Chat
          </button>
          
          <button 
            onClick={() => handleTabChange('ranking')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'ranking' 
              ? 'bg-yellow-500 text-black shadow-xl shadow-yellow-600/20' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            Ranking
          </button>

          <button 
            onClick={() => handleTabChange('gyms')}
            className={`flex items-center justify-center gap-2 sm:gap-3 px-5 sm:px-10 py-3 sm:py-4 rounded-full font-black transition-all text-sm sm:text-lg whitespace-nowrap ${
              activeTab === 'gyms' 
              ? 'bg-red-500 text-white shadow-xl shadow-red-600/20' 
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            Academias
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
                <Paywall feature="Rotina Diária" type="pro" />
              ) : null}

              {/* Today's Training Choice */}
              <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-3xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Treino do Dia</h3>
                    <p className="text-sm text-gray-500">Escolha sua sessão de hoje ou siga a recomendação</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plan.days.map((day, idx) => {
                    const isNext = !day.isCompleted && (idx === 0 || plan.days[idx-1].isCompleted);
                    return (
                      <button
                        key={`choice-${idx}`}
                        onClick={() => setActiveTab('workout')}
                        className={`p-4 rounded-2xl border text-left transition-all group relative overflow-hidden ${
                          isNext 
                            ? 'bg-purple-600 border-purple-400 text-white shadow-xl shadow-purple-600/20 scale-[1.02] ring-4 ring-purple-500/10' 
                            : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/5 hover:border-purple-500'
                        }`}
                      >
                        {isNext && (
                          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest animate-pulse">
                            Recomendado
                          </div>
                        )}
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isNext ? 'text-purple-100' : 'text-gray-500'}`}>
                          {day.day}
                        </p>
                        <p className="font-bold truncate text-sm">{day.focus}</p>
                        <div className={`mt-3 flex items-center gap-1 text-[10px] font-bold ${isNext ? 'text-purple-100' : 'text-gray-400'}`}>
                          <Zap className="w-3 h-3" /> {day.exercises.length} exercícios
                        </div>
                        {day.isCompleted && (
                          <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-sm">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Registro de Rotina Diária Pro
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">
                  Monitore seu bem-estar diário para ajustes precisos nos protocolos.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Horas de sono</label>
                      <input 
                        type="text" 
                        value={routineData.sleep}
                        onChange={e => setRoutineData({...routineData, sleep: e.target.value})}
                        placeholder="Ex: 7 horas"
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Água consumida</label>
                      <input 
                        type="text" 
                        value={routineData.water}
                        onChange={e => setRoutineData({...routineData, water: e.target.value})}
                        placeholder="Ex: 2 litros"
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Nível de estresse (1-10)</label>
                      <input 
                        type="text" 
                        value={routineData.stress}
                        onChange={e => setRoutineData({...routineData, stress: e.target.value})}
                        placeholder="Ex: 4"
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Energia / Disposição (1-10)</label>
                      <input 
                        type="text" 
                        value={routineData.energy}
                        onChange={e => setRoutineData({...routineData, energy: e.target.value})}
                        placeholder="Ex: 8"
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Humor Predominante</label>
                      <select 
                        value={routineData.humor}
                        onChange={e => setRoutineData({...routineData, humor: e.target.value})}
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                      >
                        <option value="">Selecione...</option>
                        <option value="otimo">🚀 Ótimo</option>
                        <option value="bom">😊 Bom</option>
                        <option value="neutro">😐 Neutro</option>
                        <option value="cansado">😫 Cansado</option>
                        <option value="estressado">😡 Estressado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Adesão à Dieta</label>
                      <select 
                        value={routineData.dietAdherence}
                        onChange={e => setRoutineData({...routineData, dietAdherence: e.target.value as any})}
                        className="w-full bg-white dark:bg-black border border-gray-200 dark:border-white/20 rounded-xl p-4 text-black dark:text-white focus:border-orange-500 outline-none transition-all shadow-sm"
                      >
                        <option value="total">✅ 100% (Segui Totalmente)</option>
                        <option value="parcial">⚠️ Parcial (Fugi de 1 refeição)</option>
                        <option value="nao">❌ Não Segui</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => {
                      setRoutineSuccess(true);
                      setRoutineData({ sleep: '', water: '', stress: '', humor: '', energy: '', dietAdherence: 'total' });
                      setTimeout(() => setRoutineSuccess(false), 3000);
                    }}
                    className="flex-1 bg-orange-500 text-white p-4 rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20 uppercase tracking-widest text-xs"
                  >
                    Salvar Registro Diário
                  </button>
                  {isPremiumUser && (
                    <button 
                      onClick={() => setShowRoutineSummary(true)}
                      className="flex-1 bg-white dark:bg-zinc-900 border border-orange-500/30 text-orange-600 dark:text-orange-400 p-4 rounded-xl font-bold hover:bg-orange-50/50 dark:hover:bg-orange-500/10 transition-colors uppercase tracking-widest text-xs"
                    >
                      Análise IA da Semana
                    </button>
                  )}
                </div>
                {routineSuccess && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-400 text-sm text-center font-bold">
                    Registro salvo! Seu coach poderá analisar esses dados no painel profissional.
                  </div>
                )}
              </div>

              {/* Seção de Medalhas e Desafios (Estilo Wellhub requested) */}
              <div className="space-y-10 pt-10">
                <section>
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Medalhas e Conquistas</h2>
                    <button className="text-[10px] font-black text-gray-400 hover:text-purple-500 uppercase tracking-widest border-b border-gray-200 dark:border-white/10 pb-1 italic">Ver todas</button>
                  </div>
                  <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4 -mx-1 px-1">
                    {[
                      { name: 'Mestre do Bem-estar', icon: <Zap className="w-8 h-8" />, color: 'bg-zinc-900', val: '2026' },
                      { name: '200 Check-ins', icon: <MapPin className="w-8 h-8" />, color: 'bg-purple-600', val: '200' },
                      { name: 'Dia Mundial da Atividade', icon: <Award className="w-8 h-8" />, color: 'bg-blue-600', val: '2026' },
                      { name: 'Fera da Evolução', icon: <TrendingUp className="w-8 h-8" />, color: 'bg-purple-600', val: '2026' }
                    ].map((badge, bidx) => (
                      <div key={bidx} className="flex flex-col items-center gap-3 shrink-0 w-32 group">
                        <div className={`w-28 h-28 ${badge.color} rounded-[2rem] flex items-center justify-center relative overflow-hidden shadow-2xl group-hover:scale-105 transition-transform text-white`}>
                           <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                           {badge.icon}
                           <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[10px] font-black text-white">
                              {badge.val}
                           </div>
                        </div>
                        <p className="text-[11px] font-black text-center text-gray-500 leading-tight uppercase tracking-tight">
                          {badge.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex justify-between items-end mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Desafios Ativos</h2>
                  </div>
                  <div className="relative rounded-[3rem] overflow-hidden group shadow-2xl bg-gradient-to-br from-purple-900 to-black h-80 flex flex-col justify-end p-10">
                    <div className="absolute top-0 right-0 p-10 opacity-10 scale-150 rotate-12">
                      <Trophy className="w-64 h-64 text-white" />
                    </div>
                    <div className="relative z-10">
                      <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-2">DESAFIO DE MAIO</p>
                      <h3 className="text-4xl font-black text-white tracking-tighter mb-2">70k Pontos em 7 Dias</h3>
                      <p className="text-white/80 text-sm font-bold mb-8">Meta: 70.000 pontos • 1.2k participando</p>
                      <button className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-purple-600/30 active:scale-95">
                        Participar Agora
                      </button>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 flex flex-col justify-between aspect-square group">
                    <Target className="w-10 h-10 text-purple-600" />
                    <div>
                      <p className="text-2xl font-black tracking-tighter leading-none mb-1">Rank Global</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dispute o topo</p>
                    </div>
                  </motion.div>
                  <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-white/5 flex flex-col justify-between aspect-square">
                    <Award className="w-10 h-10 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-black tracking-tighter leading-none mb-1">Especialista</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Coletar insígnias</p>
                    </div>
                  </motion.div>
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
                  {/* Gamification Banner */}
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 p-6 rounded-3xl flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest mb-1">Seu Ranking</p>
                        <h4 className="text-3xl font-black text-black dark:text-white flex items-baseline gap-2">
                           Lvl <span className="text-yellow-500">{profile.level || 1}</span>
                        </h4>
                      </div>
                      <div className="w-16 h-16 bg-white dark:bg-black/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 p-6 rounded-3xl flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-1">Pontos Acumulados</p>
                        <h4 className="text-3xl font-black text-black dark:text-white">
                           {profile.points || 0} <span className="text-sm font-bold text-gray-500">pts</span>
                        </h4>
                      </div>
                      <div className="w-16 h-16 bg-white dark:bg-black/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <Star className="w-8 h-8 text-purple-500" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 p-6 rounded-3xl flex items-center justify-between shadow-xl">
                      <div>
                        <p className="text-[10px] font-black text-orange-600 dark:text-orange-500 uppercase tracking-widest mb-1">Consistência 🔥</p>
                        <h4 className="text-3xl font-black text-black dark:text-white">
                           {profile.streak || 0} <span className="text-sm font-bold text-gray-500">Semanas</span>
                        </h4>
                      </div>
                      <div className="w-16 h-16 bg-white dark:bg-black/40 rounded-2xl flex items-center justify-center shadow-lg">
                        <Activity className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  </motion.div>

                  <div className="bg-zinc-950 border border-white/10 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-64 h-64 text-purple-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                       <TrendingUp className="w-5 h-5 text-purple-400" />
                       Análise de Performance Visual
                    </h3>
                    
                    <div className="h-[450px] w-full relative z-10">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMassa" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#ddd'} vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#555" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            padding={{ left: 20, right: 20 }}
                          />
                          <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff', 
                              border: `1px solid ${theme === 'dark' ? '#333' : '#eee'}`, 
                              borderRadius: '16px',
                              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                            }}
                            itemStyle={{ fontWeight: '900', fontSize: '13px' }}
                            cursor={{ stroke: '#a855f7', strokeWidth: 2 }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={48} 
                            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }}
                          />
                          <Area 
                            name="Peso Corporal (kg)"
                            type="monotone" 
                            dataKey="peso" 
                            stroke="#a855f7" 
                            strokeWidth={4} 
                            fillOpacity={1}
                            fill="url(#colorPeso)"
                            dot={{ r: 5, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 8, strokeWidth: 0 }}
                          />
                          <Area 
                            name="Massa Magra (est.)"
                            type="monotone" 
                            dataKey="massa" 
                            stroke="#10b981" 
                            strokeWidth={4} 
                            fillOpacity={1}
                            fill="url(#colorMassa)"
                            dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                            activeDot={{ r: 8, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Peso Médio</p>
                          <p className="text-xl font-black">{profile.weight} kg</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Gasto Calórico Médio</p>
                          <p className="text-xl font-black">2.450 <span className="text-xs">kcal</span></p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Volume de Treino</p>
                          <p className="text-xl font-black text-purple-400">Alto</p>
                       </div>
                       <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Frequência Semanal</p>
                          <p className="text-xl font-black text-green-400">100%</p>
                       </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8">
                    <ProgressComparison targetUserId={profile?.uid} />
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

          {activeTab === 'chat' && (
            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row h-[80vh]">
              {/* Professionals List */}
              <div className="w-full md:w-80 bg-white dark:bg-black/20 border-r border-gray-200 dark:border-white/10 flex flex-col">
                <div className="p-6 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                  <h3 className="font-black text-xl flex items-center gap-2 italic tracking-tighter">
                    <MessageSquare className="w-6 h-6 text-emerald-500" /> CONVERSAS
                  </h3>
                </div>
                <div className="space-y-1 p-2 flex-1 overflow-y-auto">
                  {professionals.map(pro => (
                    <button 
                      key={pro.id}
                      onClick={() => setSelectedProfessional(pro)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                        selectedProfessional?.id === pro.id ? 'bg-emerald-500/10 border border-emerald-500/20' : 'hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="relative">
                        <div className="w-14 h-14 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden shrink-0 border-2 border-white dark:border-zinc-700 shadow-sm">
                          <img src={pro.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${pro.name}`} alt="avatar" className="w-full h-full object-cover" />
                        </div>
                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-zinc-900 rounded-full ${isOnline(pro.lastSeen) ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-sm truncate">{pro.name}</p>
                          <span className="text-[9px] text-gray-400 font-bold">12:30</span>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60">
                          {pro.role === 'trainer' ? 'Personal Coach' : 'Nutricionista'}
                        </p>
                      </div>
                    </button>
                  ))}
                  {professionals.length === 0 && (
                    <div className="py-12 px-6 text-center">
                      <Ghost className="w-12 h-12 text-gray-200 dark:text-zinc-800 mx-auto mb-4" />
                      <p className="text-gray-500 italic text-sm font-medium">Nenhum profissional vinculado para conversar.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Window */}
              <div className="flex-1 flex flex-col bg-white dark:bg-transparent">
                {selectedProfessional ? (
                  <ChatView selectedProfessional={selectedProfessional} />
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[#f0f2f5] dark:bg-black/20">
                    <div className="w-24 h-24 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mb-8 shadow-xl">
                       <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-3xl font-black mb-4 tracking-tighter italic">FitAI Messenger</h3>
                    <p className="text-gray-500 max-w-md font-medium leading-relaxed">
                      Selecione um profissional para iniciar seu acompanhamento em tempo real, enviar fotos de pratos ou dúvidas sobre execução.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ranking' && (
            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-12">
              <Ranking />
            </div>
          )}

          {activeTab === 'gyms' && (
            <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-8">
              <GymLocator />
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
                           const exerciseId = `${idx}-${i}`;
                           return (
                             <ExerciseRow 
                               key={uniqueKey} 
                               exercise={ex} 
                               dayIdx={idx} 
                               exerciseIdx={i} 
                               restSeconds={restSeconds} 
                               onStartRest={startRest}
                               checked={completedExercises.has(exerciseId)}
                               onToggleCheck={handleToggleExercise}
                             />
                           );
                        })}
                      </div>

                      {/* Day Feedback */}
                      <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <button
                              disabled={isViewingAs}
                              onClick={() => handleToggleWorkoutDay(idx)}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                                day.isCompleted 
                                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 group-hover:bg-white/10 border border-gray-200 dark:border-white/10'
                              }`}
                            >
                              <CheckCircle2 className="w-6 h-6" />
                            </button>
                            <div>
                              <p className="font-black text-xs uppercase tracking-widest text-black dark:text-white">Concluir Treino</p>
                              <p className="text-[10px] text-gray-500 font-bold">Marcar este dia como finalizado</p>
                            </div>
                          </label>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest flex items-center gap-2">
                            <Sparkles className="w-3 h-3" /> Novo Relato de Treino
                          </p>
                          <textarea 
                            readOnly={isViewingAs}
                            value={day.realWorkoutNotes || ''}
                            onChange={(e) => updateRealWorkoutNotes(idx, e.target.value)}
                            placeholder="Descreva se mudou algum exercício, como se sentiu, se a carga estava pesada..."
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-4 text-sm text-black dark:text-white focus:border-purple-500 outline-none h-28 transition-all shadow-inner"
                          />
                          {!isViewingAs && (
                            <button
                              onClick={() => addWorkoutReport(idx, day.realWorkoutNotes || '')}
                              disabled={!(day.realWorkoutNotes || '').trim()}
                              className="w-full bg-purple-600/10 hover:bg-purple-600 text-purple-600 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-purple-500/20 disabled:opacity-30"
                            >
                              <Save className="w-4 h-4" /> SALVAR RELATO NO HISTÓRICO
                            </button>
                          )}
                        </div>

                        {/* Relatos Incorporados */}
                        {day.workoutReports && day.workoutReports.length > 0 && (
                          <div className="space-y-3 mt-6">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Relatos Salvos</p>
                            {day.workoutReports.map((report) => (
                              <div key={report.id} className="bg-gray-50 dark:bg-zinc-900/40 border border-gray-200 dark:border-white/5 p-4 rounded-2xl group/report">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[9px] font-black text-purple-500 uppercase tracking-tighter">
                                    {new Date(report.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  {!isViewingAs && (
                                    <div className="flex gap-2 opacity-0 group-hover/report:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => {
                                          const newText = prompt('Editar relato:', report.text);
                                          if (newText !== null) updateWorkoutReport(idx, report.id, newText);
                                        }}
                                        className="text-[9px] font-bold text-gray-500 hover:text-purple-500 uppercase"
                                      >
                                        editar
                                      </button>
                                      <button 
                                        onClick={() => {
                                          if (confirm('Deletar este relato?')) deleteWorkoutReport(idx, report.id);
                                        }}
                                        className="text-[9px] font-bold text-gray-500 hover:text-red-500 uppercase"
                                      >
                                        deletar
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 italic">"{report.text}"</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {!day.isCompleted && (
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleToggleWorkoutDay(idx)}
                            className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white py-4 rounded-2xl font-black italic tracking-tighter uppercase text-sm shadow-xl shadow-purple-600/20 flex items-center justify-center gap-2"
                          >
                            <Trophy className="w-5 h-5" />
                            CONFIRMAR E ENVIAR CHECK-IN (+50 PTS)
                          </motion.button>
                        )}

                        {day.isCompleted && (
                          <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                               <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                               <p className="font-bold text-sm text-green-600 dark:text-green-500">Check-in Realizado!</p>
                               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Treino enviado com sucesso ao seu coach.</p>
                            </div>
                            <button 
                              onClick={() => handleToggleWorkoutDay(idx)}
                              className="ml-auto text-[10px] font-bold text-gray-400 hover:text-red-500 transition-colors underline"
                            >
                              remover
                            </button>
                          </div>
                        )}
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

                      {plan.recommendations && plan.recommendations.length > 0 && (
                        <div className="mt-8 space-y-4">
                           <h4 className="font-bold text-xs uppercase tracking-widest text-purple-500">Recados do Coach</h4>
                           <div className="space-y-3">
                             {plan.recommendations.map((note, i) => (
                               <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl text-sm italic text-gray-400">
                                 "{note}"
                               </div>
                             ))}
                           </div>
                        </div>
                      )}

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
                          <div key={`meal-${idx}-${meal.name}`} className="bg-white dark:bg-black border border-gray-200 dark:border-white/5 rounded-2xl p-6 shadow-sm group hover:border-green-500/30 transition-all">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <button
                                  disabled={isViewingAs}
                                  onClick={() => toggleMealCheck(idx)}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    meal.isAdhered 
                                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                                      : 'bg-gray-50 dark:bg-white/5 text-gray-400 border border-gray-200 dark:border-white/10'
                                  }`}
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <h4 className="text-xl font-black text-green-600 dark:text-green-400">{meal.name}</h4>
                              </div>
                              <span className="text-sm font-bold bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">{meal.time}</span>
                            </div>
                            <ul className="space-y-3 mb-6">
                              {meal.foods?.map((food, i) => (
                                <li key={i} className="flex items-start gap-2 text-base text-gray-700 dark:text-white font-medium">
                                  <span className="text-green-600 dark:text-green-500 mt-1.5">•</span>
                                  {food}
                                </li>
                              ))}
                            </ul>
                            
                            {/* meal real feedback */}
                            <div className="space-y-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                              <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-3 h-3" /> Relato da Refeição Real
                              </p>
                              <textarea 
                                readOnly={isViewingAs}
                                value={meal.realMealNotes || ''}
                                onChange={(e) => updateRealMealNotes(idx, e.target.value)}
                                placeholder="Descreva se mudou algo ou se fez uma refeição diferente..."
                                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-xs text-black dark:text-white focus:border-green-500 outline-none h-20 transition-all"
                              />
                            </div>
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

                        {plan.diet.orientations && plan.diet.orientations.length > 0 && (
                          <div className="mt-4 p-6 bg-green-600/5 dark:bg-green-900/10 border border-green-500/20 rounded-2xl">
                            <h4 className="font-bold text-green-600 dark:text-green-400 mb-4 flex items-center gap-2">
                              <Apple className="w-4 h-4" /> Orientações Nutricionais Finais
                            </h4>
                            <ul className="space-y-3">
                              {plan.diet.orientations.map((orient, i) => (
                                <li key={i} className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-l-2 border-green-500/30 pl-4 py-1 italic">
                                  {orient}
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

              {(isAdmin || role === 'trainer') ? (
                <div className="bg-zinc-950 border border-purple-500/20 rounded-3xl p-6 sm:p-12 text-center flex flex-col items-center">
                  <Users className="w-20 h-20 text-purple-500 mb-6 opacity-30" />
                  <h3 className="text-3xl font-black mb-2 tracking-tighter">Gestão de Treinos</h3>
                  <p className="text-gray-400 mb-10 max-w-lg font-medium leading-relaxed">
                    Você tem acesso às ferramentas de Personal Trainer. Clique no botão abaixo para gerenciar seus alunos e protocolos de treino.
                  </p>
                  <Link 
                    to="/trainer" 
                    className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-purple-600/30 flex items-center gap-3 group"
                  >
                    Acessar Painel Trainer
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ) : null}

              {/* Admin Section: Role Management */}
              {isAdmin && (
                <div className="mb-8 p-6 bg-red-500/5 border border-red-500/20 rounded-3xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2 uppercase tracking-widest text-xs">
                        <Lock className="w-4 h-4" /> Painel Admin: Gestão de Profissionais
                      </h4>
                      <p className="text-sm text-gray-500">Promova qualquer usuário inserindo o e-mail</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="email" 
                      value={targetUserEmail}
                      onChange={e => setTargetUserEmail(e.target.value)}
                      placeholder="E-mail do usuário..."
                      className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-black dark:text-white"
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
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all"
                    >
                      {linkLoading ? 'Salvando...' : 'Aplicar Role'}
                    </button>
                  </div>
                  {linkMessage.text && (
                    <p className={`mt-3 text-xs text-center ${linkMessage.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
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
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm uppercase tracking-wider text-gray-500">Seus Alunos</h4>
                          {loadingClients && <Loader2 className="w-4 h-4 animate-spin text-purple-600" />}
                        </div>
                        
                        {enrichedClients && enrichedClients.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {enrichedClients.map((client) => (
                              <button 
                                key={client.id}
                                onClick={() => setSelectedClient(client.id)}
                                className={`p-4 rounded-2xl border transition-all text-left shadow-sm group relative overflow-hidden ${
                                  selectedClient === client.id 
                                    ? 'bg-purple-600 border-purple-500 text-white ring-4 ring-purple-500/10' 
                                    : 'bg-white dark:bg-black/20 border-gray-200 dark:border-white/5 hover:border-purple-500'
                                }`}
                              >
                                {client.email === 'vinidoctor@gmail.com' && (
                                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest z-10">
                                    Admin
                                  </div>
                                )}
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20 shadow-sm bg-gray-200 dark:bg-zinc-800">
                                      <img 
                                        src={client.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${client.displayName || client.email}`} 
                                        alt="avatar" 
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900 ${isOnline(client.lastSeen) ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm truncate ${selectedClient === client.id ? 'text-white' : 'text-black dark:text-white'}`}>
                                      {client.displayName || client.email.split('@')[0]}
                                    </p>
                                    <p className={`text-[10px] truncate ${selectedClient === client.id ? 'text-purple-100' : 'text-gray-500'}`}>
                                      {client.email}
                                    </p>
                                  </div>
                                  <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${selectedClient === client.id ? 'text-white' : 'text-gray-400'}`} />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 bg-gray-50 dark:bg-black/40 rounded-3xl border border-dashed border-gray-300 dark:border-white/10">
                            <Users className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-gray-400 font-medium">Você ainda não possui alunos vinculados.</p>
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
                      <button 
                        onClick={() => handleViewProfessional(linkedTrainerId)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                      >
                        <Users className="w-5 h-5" />
                        Ver Perfil do seu Treinador
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
              
              {(isAdmin || role === 'nutritionist') ? (
                <div className="bg-zinc-950 border border-green-500/20 rounded-3xl p-6 sm:p-12 text-center flex flex-col items-center">
                  <Apple className="w-20 h-20 text-green-500 mb-6 opacity-30" />
                  <h3 className="text-3xl font-black mb-2 tracking-tighter">Gestão Nutricional</h3>
                  <p className="text-gray-400 mb-10 max-w-lg font-medium leading-relaxed">
                    Você tem acesso às ferramentas de Nutricionista. Clique no botão abaixo para gerenciar pacientes e protocolos.
                  </p>
                  <Link 
                    to="/nutritionist" 
                    className="bg-green-600 hover:bg-green-500 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-green-600/30 flex items-center gap-3 group"
                  >
                    Acessar Painel Nutri
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
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
                      <button 
                        onClick={() => handleViewProfessional(linkedNutritionistId)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                      >
                        <Users className="w-5 h-5" />
                        Ver Perfil do seu Nutricionista
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
                      if (isPremiumUser) {
                        setShowSupplementGuide(true);
                      }
                      handleTabChange('diet');
                      setTimeout(() => {
                        const el = document.getElementById('diet-meals');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 500);
                    }}
                  >
                    <Apple className="w-10 h-10 mx-auto mb-3 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform" />
                    <p className="text-lg font-bold text-black dark:text-white">Base Alimentar</p>
                    <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">
                      {isPremiumUser ? 'Plano & Suplementos' : 'Ver Cardápio Completo'}
                    </p>
                  </div>
                  <div 
                    className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 p-6 rounded-2xl text-center shadow-sm cursor-pointer hover:border-blue-500/30 transition-all group"
                    onClick={() => {
                      if (isPremiumUser) {
                        setShowMacroDetails(true);
                      } else {
                        handleTabChange('diet');
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
                      {isPremiumUser ? 'Resumo Estratégico' : 'Resumo Nutricional'}
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-10 pb-32">
              {/* Atatalhos Rápidos de Simulação */}
              <section className="bg-gradient-to-br from-red-600/20 to-purple-600/20 border border-red-500/20 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Zap className="w-24 h-24 text-red-500" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-black text-black dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
                     Simular Nível de Acesso (Instantâneo)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {['FREE', 'PRO', 'PREMIUM', 'PROFISSIONAL'].map((p) => (
                      <button
                        key={`admin-tab-p-${p}`}
                        onClick={() => handleAdminPlanChange(p as any)}
                        disabled={adminActionLoading}
                        className={`py-4 rounded-2xl font-black text-xs transition-all shadow-lg border-2 ${
                          planType === p 
                            ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white scale-105' 
                            : 'bg-white/10 text-gray-500 border-white/10 hover:bg-white/20'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">
                    * Isso altera apenas a sua visão atual para testes de funcionalidade.
                  </p>
                </div>
              </section>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <h2 className="text-3xl font-black text-black dark:text-white tracking-tighter flex items-center gap-3">
                  <Zap className="w-8 h-8 text-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]" /> Painel Master Admin
                </h2>
                <div className="flex items-center gap-2 bg-red-600/10 border border-red-500/20 px-4 py-2 rounded-xl">
                  <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE STATUS: ONLINE</span>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {[
                   { label: 'Usuários Ativos', val: adminStats.users, sub: 'Clientes Finais', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                   { label: 'Time Personal', val: adminStats.trainers, sub: 'Treinadores Cadastrados', icon: Dumbbell, color: 'text-green-500', bg: 'bg-green-500/10' },
                   { label: 'Time Nutri', val: adminStats.nutritionists, sub: 'Dietistas Cadastrados', icon: Apple, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                 ].map((stat, i) => (
                   <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={stat.label} 
                    className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group shadow-2xl"
                   >
                     <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} blur-[60px] opacity-20 -mr-10 -mt-10 group-hover:opacity-40 transition-opacity`} />
                     <div className="flex items-center justify-between mb-4">
                        <div className={`p-4 rounded-2xl ${stat.bg}`}>
                          <stat.icon className={`w-8 h-8 ${stat.color}`} />
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-black text-black dark:text-white tracking-tighter group-hover:scale-110 transition-transform">
                            {adminStats.loading ? <Loader2 className="w-8 h-8 animate-spin" /> : stat.val}
                          </p>
                        </div>
                     </div>
                     <div>
                       <p className="text-lg font-black text-black dark:text-white leading-none">{stat.label}</p>
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">{stat.sub}</p>
                     </div>
                   </motion.div>
                 ))}
              </div>

              {/* User Management List */}
              <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-white/10 rounded-[3rem] p-8 shadow-2xl">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                       <h3 className="text-2xl font-black text-black dark:text-white tracking-tighter">Gerenciamento Global</h3>
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 italic">Visualizando todos os registros da base</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={fetchAdminStats}
                         className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
                         title="Atualizar Base"
                       >
                         <Zap className="w-5 h-5 text-yellow-500" />
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-gray-100 dark:border-white/5">
                             <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuário / ID</th>
                             <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Role</th>
                             <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Plano</th>
                             <th className="pb-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Ações</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                          {adminUsersLoading ? (
                             <tr>
                                <td colSpan={4} className="py-20 text-center">
                                   <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto mb-4" />
                                   <p className="font-bold text-gray-500 italic">Sincronizando com a base de dados...</p>
                                </td>
                             </tr>
                          ) : allUsers.map((u) => (
                             <tr key={u.id} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-6">
                                   <div 
                                     className="flex items-center gap-3 cursor-pointer"
                                     onClick={() => fetchUserHistory(u)}
                                   >
                                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110 shadow-lg">
                                        {u.photoURL ? <img src={u.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="text-lg font-black text-white/20 italic">AI</div>}
                                      </div>
                                      <div>
                                         <p className="font-bold text-black dark:text-white text-sm">{u.displayName || u.email}</p>
                                         <p className="text-[10px] text-gray-500 font-mono tracking-tighter opacity-60">ID: {u.id?.suffix || u.id}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="py-6 text-center">
                                   <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border transition-all ${
                                     u.isAdmin ? 'bg-red-600 text-white border-red-500 shadow-xl shadow-red-600/30' :
                                     u.role === 'trainer' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                     u.role === 'nutritionist' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                                     'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                   }`}>
                                     {u.isAdmin ? 'Administrador' : (
                                       <select 
                                         value={u.role || 'user'}
                                         onChange={async (e) => {
                                           const res = await setRoleForUser(u.id, e.target.value as any);
                                           if (res.success) fetchAdminStats();
                                         }}
                                         className="bg-transparent text-gray-400 text-[10px] font-black uppercase outline-none cursor-pointer"
                                       >
                                         <option value="user" className="bg-zinc-900 border-none">Aluno</option>
                                         <option value="trainer" className="bg-zinc-900 border-none">Personal</option>
                                         <option value="nutritionist" className="bg-zinc-900 border-none">Nutri</option>
                                       </select>
                                     )}
                                   </span>
                                </td>
                                <td className="py-6 text-center">
                                   <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 ${
                                     u.planType === 'PREMIUM' || u.planType === 'PROFISSIONAL' ? 'bg-yellow-500/10 text-yellow-500' :
                                     u.planType === 'PRO' ? 'bg-purple-500/10 text-purple-500' :
                                     'bg-gray-500/10 text-gray-500'
                                   }`}>
                                     {u.isAdmin ? (
                                      <span className="text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-white/10 bg-yellow-500/10 text-yellow-500">MASTER ACCESS</span>
                                    ) : (
                                       <select 
                                         value={u.planType || 'FREE'}
                                         onChange={async (e) => {
                                           const res = await setPlanTypeForUser(u.id, e.target.value as any);
                                           if (res.success) fetchAdminStats();
                                         }}
                                         className="bg-transparent text-gray-400 text-[10px] font-black uppercase outline-none"
                                       >
                                         <option value="FREE" className="bg-zinc-900 text-white">FREE</option>
                                         <option value="PRO" className="bg-zinc-900 text-white">PRO</option>
                                         <option value="PREMIUM" className="bg-zinc-900 text-white">PREMIUM</option>
                                         <option value="PROFISSIONAL" className="bg-zinc-900 text-white">PROFISSIONAL</option>
                                       </select>
                                    )}
                                   </span>
                                </td>
                                <td className="py-6 text-right">
                                   <div className="flex items-center justify-end gap-2">
                                     <button 
                                      onClick={() => fetchUserHistory(u)}
                                      className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all"
                                      title="Ver Histórico"
                                     >
                                       <History className="w-4 h-4" />
                                     </button>
                                     <button 
                                      onClick={() => {
                                        setSearchParams({ viewAs: u.id, tab: 'workout' });
                                        handleTabChange('workout');
                                      }}
                                      className="p-2.5 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all shadow-sm"
                                      title="Visão do Aluno"
                                     >
                                       <UserPlus className="w-4 h-4" />
                                     </button>
                                     <button 
                                      onClick={() => {
                                        setSelectedProfessional({ id: u.id, name: u.displayName || u.email, role: u.role });
                                        handleTabChange('chat');
                                      }}
                                      className="p-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl transition-all"
                                      title="Chat Direto"
                                     >
                                       <MessageCircle className="w-4 h-4" />
                                     </button>
                                   </div>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 dark:border-white/10 py-12 px-4 flex flex-col items-center gap-3 text-gray-500 text-sm">
        <p className="font-bold tracking-tight">© 2026 FitAI. Desenvolvido por NVM Project Management</p>
        <p className="font-mono bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded border border-gray-200 dark:border-white/5 uppercase tracking-widest text-xs">Versão {APP_VERSION}</p>
      </footer>

      {/* Professional Profile Modal */}
      {showProfessionalProfile && (
        <ProfessionalProfileView 
          professional={showProfessionalProfile} 
          onClose={() => setShowProfessionalProfile(null)} 
        />
      )}

      {/* User History Modal */}
      <AnimatePresence>
        {viewingUserHistory && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingUserHistory(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 w-full max-w-2xl rounded-[3rem] p-8 relative overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-800 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
                  {viewingUserHistory.photoURL ? <img src={viewingUserHistory.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="text-2xl font-black text-white/10">AI</div>}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter text-white">{viewingUserHistory.displayName || viewingUserHistory.email}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase tracking-widest border border-blue-500/20">{viewingUserHistory.role || 'ALUNO'}</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 uppercase tracking-widest border border-yellow-500/20">{viewingUserHistory.planType || 'FREE'}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setViewingUserHistory(null)}
                  className="ml-auto p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-8 scrollbar-hide">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Peso', val: `${viewingUserHistory.profile?.weight || '--'}kg`, icon: Weight },
                    { label: 'Altura', val: `${viewingUserHistory.profile?.height || '--'}cm`, icon: Activity },
                    { label: 'Idade', val: `${viewingUserHistory.profile?.age || '--'}a`, icon: Users },
                    { label: 'Objetivo', val: viewingUserHistory.profile?.objective || '--', icon: Zap }
                  ].map((s, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-sm font-bold text-white truncate">{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* History List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <History className="w-4 h-4 text-red-500" /> Histórico de Progressão
                  </h4>
                  
                  {userHistoryLoading ? (
                    <div className="py-12 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                      <Loader2 className="w-8 h-8 animate-spin text-red-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Carregando registros...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {userProgress.length === 0 ? (
                        <div className="py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest italic">Nenhum registro de carga encontrado.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {userProgress.map((p, i) => (
                            <div key={p.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-all">
                              <div>
                                <p className="font-black text-sm text-white">{p.exerciseName}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{new Date(p.date).toLocaleDateString('pt-BR')}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-red-500">{p.weight}kg</p>
                                <p className="text-[10px] text-gray-500 font-bold">{p.reps} reps</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Diary/Notes from Plan */}
                      <div className="space-y-4 pt-6 border-t border-white/10">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-purple-500" /> Feedbacks do Aluno
                        </h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {/* Diet Notes */}
                          <div className="bg-green-600/5 border border-green-500/10 p-5 rounded-2xl">
                             <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3">Adesão Alimentar</p>
                             <div className="space-y-3">
                                {viewingUserHistory.plan?.diet?.meals?.map((m: any, mi: number) => m.realMealNotes && (
                                   <div key={mi} className="border-l-2 border-green-500/30 pl-3">
                                      <p className="text-[9px] font-black text-gray-500 uppercase">{m.name}</p>
                                      <p className="text-sm text-gray-400 italic">"{m.realMealNotes}"</p>
                                   </div>
                                ))}
                                {(!viewingUserHistory.plan?.diet?.meals || !viewingUserHistory.plan.diet.meals.some((m: any) => m.realMealNotes)) && (
                                   <p className="text-[10px] text-gray-600 italic">Nenhum relato de refeição.</p>
                                )}
                             </div>
                          </div>

                          {/* Training Notes */}
                          <div className="bg-purple-600/5 border border-purple-500/10 p-5 rounded-2xl">
                             <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-3">Relatos de Treino</p>
                             <div className="space-y-3">
                                {viewingUserHistory.plan?.days?.map((d: any, di: number) => d.realWorkoutNotes && (
                                   <div key={di} className="border-l-2 border-purple-500/30 pl-3">
                                      <p className="text-[9px] font-black text-gray-500 uppercase">{d.day} - {d.focus}</p>
                                      <p className="text-sm text-gray-400 italic">"{d.realWorkoutNotes}"</p>
                                   </div>
                                ))}
                                {(!viewingUserHistory.plan?.days || !viewingUserHistory.plan.days.some((d: any) => d.realWorkoutNotes)) && (
                                   <p className="text-[10px] text-gray-600 italic">Nenhum relato de treino.</p>
                                )}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Last Diet Adherence */}
                <div className="bg-green-600/5 border border-green-500/10 p-6 rounded-[2rem]">
                  <h4 className="text-xs font-black text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Apple className="w-4 h-4" /> Notas do Aluno
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed italic">
                    "O histórico de notas e adesão diária ajuda na calibração fina do próximo protocolo de treinamento."
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex gap-3">
                 <button 
                  onClick={() => {
                    setSearchParams({ viewAs: viewingUserHistory.id, tab: 'workout' });
                    handleTabChange('workout');
                    setViewingUserHistory(null);
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl uppercase tracking-tighter text-xs shadow-xl shadow-red-600/20 transition-all"
                 >
                   Assumir Visão do Usuário
                 </button>
                 <button 
                  onClick={() => setViewingUserHistory(null)}
                  className="px-8 bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs transition-all"
                 >
                   Fechar
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

                <div className="bg-purple-600/10 border border-purple-500/20 p-5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <p className="text-sm font-black text-black dark:text-white uppercase tracking-tight">Privacidade do Ranking</p>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight">Ao ativar, seu nome e foto aparecerão para outros guerreiros no Hall da Fama.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditProfileForm(prev => ({ ...prev, showInRanking: !prev.showInRanking }))}
                    className={`shrink-0 w-12 h-6 rounded-full transition-all relative ${editProfileForm.showInRanking ? 'bg-purple-600' : 'bg-gray-400 dark:bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${editProfileForm.showInRanking ? 'left-7' : 'left-1'}`} />
                  </button>
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
                {/* Estatísticas */}
                <section>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Visão Geral da Base</label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-blue-500/30 transition-all">
                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Alunos</p>
                       <p className="text-2xl font-black text-black dark:text-white group-hover:scale-110 transition-transform">
                         {adminStats.loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : adminStats.users}
                       </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-green-500/30 transition-all">
                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Personals</p>
                       <p className="text-2xl font-black text-black dark:text-white group-hover:scale-110 transition-transform">
                         {adminStats.loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : adminStats.trainers}
                       </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-purple-500/30 transition-all">
                       <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Nutris</p>
                       <p className="text-2xl font-black text-black dark:text-white group-hover:scale-110 transition-transform">
                         {adminStats.loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : adminStats.nutritionists}
                       </p>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-gray-100 dark:bg-white/5" />

                {/* Alterar Plano */}
                <section>
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">Simular Plano do Usuário</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['FREE', 'PRO', 'PREMIUM', 'PROFISSIONAL'].map((p) => (
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

      {/* Overlay de Celebração de Check-in */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm"
          >
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-purple-500/20 flex flex-col items-center text-center overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-600 to-rose-600" />
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-purple-600/40">
                <Zap className="w-8 h-8 text-white fill-white/20" />
              </div>
              <h4 className="text-2xl font-black tracking-tighter mb-4 text-black dark:text-white leading-tight">
                {celebrationData.message}
              </h4>
              <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 py-2 px-4 rounded-full border border-black/5 dark:border-white/5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-black text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                  {celebrationData.days} DIAS DE FOCO
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
