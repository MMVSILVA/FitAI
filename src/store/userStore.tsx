import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, getDocFromServer } from 'firebase/firestore';
import { UserProfile, WorkoutPlan, UserRole, PlanType } from '../types';

interface UserState {
  user: User | null;
  authLoading: boolean;
  profile: UserProfile | null;
  plan: WorkoutPlan | null;
  planType: PlanType;
  role: UserRole;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  clients?: string[];
  linkedTrainerId?: string;
  linkedNutritionistId?: string;
  isAdmin: boolean;
  favorites: string[];
  theme: 'light' | 'dark' | 'system';
  setProfile: (profile: Partial<UserProfile>) => void;
  setPlan: (plan: WorkoutPlan) => void;
  upgradePlan: (plan: PlanType) => void;
  startTrial: () => void;
  updateExerciseWeight: (dayIndex: number, exerciseIndex: number, weight: string) => void;
  toggleFavorite: (exerciseId: string) => void;
  toggleTheme: () => void;
  updatePlanForUser: (targetUid: string, newPlan: WorkoutPlan) => Promise<void>;
  linkClient: (email: string) => Promise<{ success: boolean; message: string }>;
  linkNutritionist: (email: string) => Promise<{ success: boolean; message: string }>;
  setRole: (role: UserRole) => void;
  setRoleForUser: (targetUid: string, newRole: UserRole) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  calculateIMC: () => { value: string; category: string } | null;
  resetAccount: () => Promise<void>;
  addExerciseProgress: (exerciseName: string, weight: number, reps: number) => Promise<void>;
  getExerciseProgress: (exerciseName: string) => Promise<import('../types').ExerciseProgress[]>;
}

const UserContext = createContext<UserState | undefined>(undefined);

const ADMIN_EMAILS = [
  'vinidoctor@gmail.com',
  'vinisilva02@hotmail.com',
  'nangelicaalcantara@gmail.com'
];

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [plan, setPlanState] = useState<WorkoutPlan | null>(null);
  const [planType, setPlanType] = useState<PlanType>('FREE');
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null);
  const [role, setRoleState] = useState<UserRole>('user');
  const [clients, setClients] = useState<string[]>([]);
  const [linkedTrainerId, setLinkedTrainerId] = useState<string | undefined>();
  const [linkedNutritionistId, setLinkedNutritionistId] = useState<string | undefined>();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('system');

  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const checkRedirect = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user) {
          setUser(redirectResult.user);
        }
      } catch (redirectError) {
        console.error("UserStore redirect error:", redirectError);
      }
    };

    checkRedirect();

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser || auth.currentUser) {
        const loggedUser = currentUser || auth.currentUser;

        // Optimistic Load from Cache
        const cachedProfile = localStorage.getItem(`fitai_profile_${loggedUser.uid}`);
        const cachedPlan = localStorage.getItem(`fitai_plan_${loggedUser.uid}`);
        let hasCache = false;
        if (cachedProfile) {
          setProfileState(JSON.parse(cachedProfile));
          hasCache = true;
        }
        if (cachedPlan) {
          setPlanState(JSON.parse(cachedPlan));
          hasCache = true;
        }

        const isAdmin = loggedUser?.email ? ADMIN_EMAILS.includes(loggedUser.email) : false;
        const docRef = doc(db, 'users', loggedUser!.uid);
        
        let snapshotReceived = false;

        // Setup snapshot listener immediately (non-blocking)
        import('firebase/firestore').then(({ onSnapshot }) => {
          unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            const isFirstLoad = !snapshotReceived;
            snapshotReceived = true;

            if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.profile) {
                setProfileState(data.profile);
                localStorage.setItem(`fitai_profile_${loggedUser.uid}`, JSON.stringify(data.profile));
              }
              if (data.plan) {
                setPlanState(data.plan);
                localStorage.setItem(`fitai_plan_${loggedUser.uid}`, JSON.stringify(data.plan));
              }
              if (data.role) setRoleState(data.role as UserRole);
              if (data.clients) setClients(data.clients);
              if (data.linkedTrainerId) setLinkedTrainerId(data.linkedTrainerId);
              if (data.linkedNutritionistId) setLinkedNutritionistId(data.linkedNutritionistId);
              if (data.favorites) setFavorites(data.favorites);
              if (data.theme) {
                setThemeState(data.theme);
                document.documentElement.classList.toggle('dark', data.theme === 'dark');
              }
              
              if (data.planType) {
                setPlanType(data.planType as PlanType);
              } else if (isAdmin) {
                setPlanType('PREMIUM');
              } else {
                setPlanType('FREE');
              }
              if (data.trialEndsAt) setTrialEndsAt(data.trialEndsAt);
              if (data.subscriptionEndsAt) setSubscriptionEndsAt(data.subscriptionEndsAt);
            }

            // If it's the first time we get data from server, ensure loader is gone
            if (isFirstLoad) {
              setAuthLoading(false);
            }
          }, (error) => {
            console.error("Firestore snapshot error:", error);
            setAuthLoading(false); // Safety fallback
          });
        });

        // If we have cache, we don't need to wait for snapshot to show the app
        if (hasCache) {
          setAuthLoading(false);
        } else {
          // Safety timeout: if no cache and no snapshot in 1.5s, just show onboarding
          setTimeout(() => {
            if (!snapshotReceived) {
              setAuthLoading(false);
            }
          }, 1500);
        }

        // Run heavy migration/init stuff in the background
        (async () => {
          try {
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) {
              const initialData = {
                uid: loggedUser.uid,
                email: loggedUser.email,
                role: 'user',
                planType: isAdmin ? 'PREMIUM' : 'FREE',
                createdAt: new Date().toISOString()
              };
              await setDoc(docRef, initialData);
            } else if (!docSnap.data()?.profile && !isAdmin) {
              // Migration check
              const localProfile = localStorage.getItem('fitai_profile');
              const localPlan = localStorage.getItem('fitai_plan');
              if (localProfile && localPlan) {
                const migrationData = {
                  profile: JSON.parse(localProfile),
                  plan: JSON.parse(localPlan),
                  planType: isAdmin ? 'PREMIUM' : (localStorage.getItem('fitai_plan_type') || 'FREE'),
                  trialEndsAt: localStorage.getItem('fitai_trial_ends') || null
                };
                await setDoc(docRef, migrationData, { merge: true });
                ['fitai_profile', 'fitai_plan', 'fitai_plan_type', 'fitai_trial_ends'].forEach(k => localStorage.removeItem(k));
              }
            }
          } catch (error) {
            console.error("Background initialization error:", error);
          }
        })();

      } else {
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setProfileState(null);
        setPlanState(null);
        setRoleState('user');
        setPlanType('FREE');
        setTrialEndsAt(null);
        setClients([]);
        setLinkedTrainerId(undefined);
        setLinkedNutritionistId(undefined);
        setAuthLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const saveToFirestore = async (data: any) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    }
  };

  const updateDocumentTheme = (themeValue: 'light' | 'dark' | 'system') => {
    if (themeValue === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', isDark);
    } else {
      document.documentElement.classList.toggle('dark', themeValue === 'dark');
    }
  };

  useEffect(() => {
    updateDocumentTheme(theme);
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setProfile = (newProfile: Partial<UserProfile>) => {
    setProfileState(prev => prev ? { ...prev, ...newProfile } : newProfile as UserProfile);
    saveToFirestore({ profile: newProfile });
    
    if (newProfile.theme) {
      setThemeState(newProfile.theme);
      updateDocumentTheme(newProfile.theme);
    }
  };

  const setPlan = (newPlan: WorkoutPlan) => {
    setPlanState(newPlan);
    saveToFirestore({ plan: newPlan });
  };

  const upgradePlan = (newPlan: PlanType) => {
    setPlanType(newPlan);
    saveToFirestore({ planType: newPlan });
  };

  const startTrial = () => {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    const dateString = endDate.toISOString();
    setTrialEndsAt(dateString);
    saveToFirestore({ trialEndsAt: dateString });
  };

  const toggleFavorite = (exerciseId: string) => {
    const newFavorites = favorites.includes(exerciseId)
      ? favorites.filter(id => id !== exerciseId)
      : [...favorites, exerciseId];
    
    setFavorites(newFavorites);
    setProfile({ favorites: newFavorites });
  };

  const toggleTheme = () => {
    const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    
    setThemeState(newTheme);
    updateDocumentTheme(newTheme);
    setProfile({ theme: newTheme });
  };

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const updateExerciseWeight = (dayIndex: number, exerciseIndex: number, weight: string) => {
    if (!plan) return;
    
    const newPlan = { ...plan };
    newPlan.days[dayIndex].exercises[exerciseIndex].weight = weight;
    
    setPlanState(newPlan);
    saveToFirestore({ plan: newPlan });
  };

  const updatePlanForUser = async (targetUid: string, newPlan: WorkoutPlan) => {
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, { plan: newPlan });
    } catch (error) {
      console.error("Error updating user plan:", error);
    }
  };

  const linkClient = async (email: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    if (trimmedEmail === user?.email) {
      return { success: false, message: "Você não pode se auto-vincular" };
    }

    try {
      const { collection, query, where, getDocs, updateDoc, arrayUnion } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', trimmedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Usuário não encontrado" };
      }

      const clientDoc = querySnapshot.docs[0];
      const clientUid = clientDoc.id;

      // Update trainer's client list
      const trainerRef = doc(db, 'users', user!.uid);
      await updateDoc(trainerRef, {
        clients: arrayUnion(clientUid)
      });

      // Update client's trainer link
      await updateDoc(clientDoc.ref, {
        trainerId: user!.uid
      });

      return { success: true, message: `Aluno ${trimmedEmail} vinculado com sucesso!` };
    } catch (error) {
      console.error("Link client error:", error);
      return { success: false, message: "Erro ao vincular aluno" };
    }
  };

  const linkNutritionist = async (email: string) => {
    const trimmedEmail = email.toLowerCase().trim();
    if (trimmedEmail === user?.email) {
      return { success: false, message: "Você não pode se auto-vincular" };
    }

    try {
      const { collection, query, where, getDocs, updateDoc, arrayUnion } = await import('firebase/firestore');
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', trimmedEmail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { success: false, message: "Usuário não encontrado" };
      }

      const clientDoc = querySnapshot.docs[0];
      const clientUid = clientDoc.id;

      // Update current user's (nutritionist) client list
      const nutritionistRef = doc(db, 'users', user!.uid);
      await updateDoc(nutritionistRef, {
        clients: arrayUnion(clientUid)
      });

      // Update client's nutritionist link
      await updateDoc(clientDoc.ref, {
        nutritionistId: user!.uid
      });

      return { success: true, message: `Paciente ${trimmedEmail} vinculado com sucesso!` };
    } catch (error) {
      console.error("Link nutritionist error:", error);
      return { success: false, message: "Erro ao vincular paciente" };
    }
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    saveToFirestore({ role: newRole });
  };

  const setRoleForUser = async (targetUid: string, newRole: UserRole) => {
    if (!isAdmin) return { success: false, message: "Apenas administradores podem fazer isso" };
    try {
      const targetRef = doc(db, 'users', targetUid);
      await updateDoc(targetRef, { role: newRole });
      return { success: true, message: `Role atualizado para ${newRole}` };
    } catch (error) {
      console.error("Set role error:", error);
      return { success: false, message: "Erro ao atualizar role" };
    }
  };

  const calculateIMC = () => {
    if (!profile) return null;
    const heightInMeters = profile.height > 3 ? profile.height / 100 : profile.height;
    const imc = profile.weight / (heightInMeters * heightInMeters);
    let category = '';
    if (imc < 18.5) category = 'Abaixo do peso';
    else if (imc < 24.9) category = 'Peso normal';
    else if (imc < 29.9) category = 'Sobrepeso';
    else category = 'Obesidade';
    
    return { value: imc.toFixed(2).replace('.', ','), category };
  };

  const resetAccount = async () => {
    if (!user) return;
    if (!window.confirm("LGPD - DIREITO AO ESQUECIMENTO: Tem certeza que deseja APAGAR permanentemente todos os seus dados? Esta ação não pode ser desfeita.")) return;
    
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      const docRef = doc(db, 'users', user.uid);
      await deleteDoc(docRef);
      
      // Clear cache
      localStorage.removeItem(`fitai_profile_${user.uid}`);
      localStorage.removeItem(`fitai_plan_${user.uid}`);
      ['fitai_profile', 'fitai_plan', 'fitai_plan_type', 'fitai_trial_ends', 'fitai_lgpd_consent'].forEach(k => localStorage.removeItem(k));
      
      await auth.signOut();
    } catch (error) {
      console.error("Error deleting account data:", error);
      alert("Erro ao apagar dados. Tente novamente.");
    }
  };

  const logout = () => {
    setProfileState(null);
    setPlanState(null);
    setPlanType('FREE');
    setTrialEndsAt(null);
    setRoleState('user');
    setClients([]);
    setLinkedTrainerId(undefined);
    setLinkedNutritionistId(undefined);
  };

  const addExerciseProgress = async (exerciseName: string, weight: number, reps: number) => {
    if (!user) return;
    try {
      const { collection, addDoc } = await import('firebase/firestore');
      const progressRef = collection(db, 'exercise_progress');
      await addDoc(progressRef, {
        userId: user.uid,
        exerciseName,
        weight,
        reps,
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error adding exercise progress:", error);
    }
  };

  const getExerciseProgress = async (exerciseName: string) => {
    if (!user) return [];
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const progressRef = collection(db, 'exercise_progress');
      
      // Optimized query: multiple WHERE clauses are easier for Firestore to handle without composite indexes
      // if sorting is handled in-memory on the client side.
      const q = query(
        progressRef, 
        where('userId', '==', user.uid),
        where('exerciseName', '==', exerciseName)
      );
      
      const snap = await getDocs(q);
      const progressData = snap.docs.map(d => ({ id: d.id, ...d.data() } as import('../types').ExerciseProgress));
      
      // Client-side sort by date ASC
      return progressData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      console.error("Error getting exercise progress:", error);
      return [];
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, authLoading, profile, plan, planType, trialEndsAt, subscriptionEndsAt, role, clients, linkedTrainerId, linkedNutritionistId, isAdmin,
      favorites, theme,
      setProfile, setPlan, upgradePlan, startTrial, updateExerciseWeight, updatePlanForUser, 
      toggleFavorite, toggleTheme,
      linkClient, linkNutritionist, setRole, setRoleForUser, logout, calculateIMC, resetAccount,
      addExerciseProgress, getExerciseProgress
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
